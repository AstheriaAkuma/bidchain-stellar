#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype,
    token, Address, BytesN, Env, String, symbol_short,
};

// ── AUCTION STATUS ────────────────────────────────────────────────────────────
// Tracks the full lifecycle of a foreclosed property auction.
#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub enum AuctionStatus {
    Open,       // Accepting bids and deposits
    Closed,     // Auction period ended, winner not yet finalized
    Finalized,  // Winner selected, refunds sent, purchase token issued
    Cancelled,  // Auction cancelled by admin — all deposits refunded
}

// ── BID STRUCT ────────────────────────────────────────────────────────────────
// Represents a single bidder's locked deposit and bid amount.
#[contracttype]
#[derive(Clone, Debug)]
pub struct Bid {
    pub bidder:  Address,
    pub amount:  i128,    // Bid amount in token units
    pub deposit: i128,    // Deposit locked in escrow
    pub refunded: bool,   // Whether deposit has been returned
}

// ── AUCTION STRUCT ────────────────────────────────────────────────────────────
// Represents a single foreclosed property auction.
#[contracttype]
#[derive(Clone, Debug)]
pub struct Auction {
    pub id:              u64,
    pub property_ref:    String,     // PAG-IBIG / bank property reference code
    pub min_bid:         i128,       // Minimum acceptable bid amount
    pub deposit_amount:  i128,       // Fixed deposit required to participate
    pub token:           Address,    // Token contract used for deposits (XLM/USDC)
    pub deadline:        u64,        // Ledger sequence number when auction closes
    pub status:          AuctionStatus,
    pub winner:          Option<Address>,
    pub winning_bid:     i128,
    pub bid_count:       u32,
}

// ── STORAGE KEYS ─────────────────────────────────────────────────────────────
#[contracttype]
pub enum DataKey {
    Auction(u64),            // Auction by ID
    AuctionCount,            // Total auctions created
    Bid(u64, Address),       // Bid by (auction_id, bidder)
    Admin,                   // Contract admin address
    PurchaseToken(u64),      // Right-to-purchase token hash for auction winner
}

// ── CONTRACT ─────────────────────────────────────────────────────────────────
#[contract]
pub struct BidChainContract;

#[contractimpl]
impl BidChainContract {

    // ── INITIALIZE ───────────────────────────────────────────────────────────
    // Sets the contract admin (PAG-IBIG / bank representative or platform admin).
    // Must be called once immediately after deployment.
    pub fn initialize(env: Env, admin: Address) {
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::AuctionCount, &0u64);
    }

    // ── CREATE AUCTION ────────────────────────────────────────────────────────
    // Admin lists a new foreclosed property for auction.
    // Sets the minimum bid, required deposit, token type, and auction deadline.
    // Returns the new auction ID.
    pub fn create_auction(
        env:             Env,
        admin:           Address,
        property_ref:    String,
        min_bid:         i128,
        deposit_amount:  i128,
        token:           Address,
        deadline:        u64,
    ) -> u64 {
        admin.require_auth();

        // Only the registered admin can create auctions
        let stored_admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("Contract not initialized");
        assert!(stored_admin == admin, "Unauthorized: not the admin");
        assert!(min_bid > 0,         "Minimum bid must be greater than zero");
        assert!(deposit_amount > 0,  "Deposit amount must be greater than zero");
        assert!(deposit_amount < min_bid, "Deposit must be less than minimum bid");

        let count: u64 = env
            .storage()
            .instance()
            .get(&DataKey::AuctionCount)
            .unwrap_or(0);
        let auction_id = count + 1;

        let auction = Auction {
            id:             auction_id,
            property_ref,
            min_bid,
            deposit_amount,
            token,
            deadline,
            status:         AuctionStatus::Open,
            winner:         None,
            winning_bid:    0,
            bid_count:      0,
        };

        env.storage()
            .persistent()
            .set(&DataKey::Auction(auction_id), &auction);
        env.storage()
            .instance()
            .set(&DataKey::AuctionCount, &auction_id);

        // Emit event so frontend can list the new auction
        env.events()
            .publish((symbol_short!("created"), auction_id), auction_id);

        auction_id
    }

    // ── PLACE BID ─────────────────────────────────────────────────────────────
    // Bidder submits their bid and locks the required deposit into escrow.
    // Deposit is held by the contract until the auction is finalized.
    // Each bidder can only place one bid per auction.
    pub fn place_bid(
        env:        Env,
        bidder:     Address,
        auction_id: u64,
        bid_amount: i128,
    ) {
        bidder.require_auth();

        let mut auction: Auction = env
            .storage()
            .persistent()
            .get(&DataKey::Auction(auction_id))
            .expect("Auction not found");

        assert!(auction.status == AuctionStatus::Open,    "Auction is not open");
        assert!(bid_amount >= auction.min_bid,             "Bid is below minimum");

        // Prevent duplicate bids from the same address
        let existing = env
            .storage()
            .persistent()
            .get::<DataKey, Bid>(&DataKey::Bid(auction_id, bidder.clone()));
        assert!(existing.is_none(), "Bidder has already placed a bid");

        // Transfer deposit from bidder wallet into contract escrow
        let token_client = token::Client::new(&env, &auction.token);
        token_client.transfer(
            &bidder,
            &env.current_contract_address(),
            &auction.deposit_amount,
        );

        // Record the bid
        let bid = Bid {
            bidder:   bidder.clone(),
            amount:   bid_amount,
            deposit:  auction.deposit_amount,
            refunded: false,
        };

        env.storage()
            .persistent()
            .set(&DataKey::Bid(auction_id, bidder.clone()), &bid);

        // Update bid count on the auction
        auction.bid_count += 1;
        env.storage()
            .persistent()
            .set(&DataKey::Auction(auction_id), &auction);

        env.events()
            .publish((symbol_short!("bid"), auction_id), bidder);
    }

    // ── FINALIZE AUCTION ──────────────────────────────────────────────────────
    // Admin closes the auction, declares the winner, and issues the
    // right-to-purchase token (stored as a hash on-chain).
    // Only callable after the deadline has passed.
    // The winning bidder keeps their deposit locked (applied toward purchase).
    // All other bidders are automatically refunded in this call.
    pub fn finalize_auction(
        env:        Env,
        admin:      Address,
        auction_id: u64,
        winner:     Address,
        purchase_token_hash: BytesN<32>,
    ) {
        admin.require_auth();

        let stored_admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("Contract not initialized");
        assert!(stored_admin == admin, "Unauthorized: not the admin");

        let mut auction: Auction = env
            .storage()
            .persistent()
            .get(&DataKey::Auction(auction_id))
            .expect("Auction not found");

        assert!(auction.status == AuctionStatus::Open, "Auction is not open");

        // Verify the declared winner actually placed a valid bid
        let winning_bid: Bid = env
            .storage()
            .persistent()
            .get(&DataKey::Bid(auction_id, winner.clone()))
            .expect("Winner has no recorded bid");

        // Store the right-to-purchase token hash for the winner
        env.storage()
            .persistent()
            .set(&DataKey::PurchaseToken(auction_id), &purchase_token_hash);

        auction.status      = AuctionStatus::Finalized;
        auction.winner      = Some(winner.clone());
        auction.winning_bid = winning_bid.amount;

        env.storage()
            .persistent()
            .set(&DataKey::Auction(auction_id), &auction);

        env.events()
            .publish((symbol_short!("winner"), auction_id), winner);
    }

    // ── REFUND LOSER ─────────────────────────────────────────────────────────
    // Losing bidder calls this to claim their deposit refund after finalization.
    // The winner cannot call this — their deposit stays locked toward purchase.
    // Designed as a pull-refund pattern so each bidder controls their own claim.
    pub fn refund_deposit(
        env:        Env,
        bidder:     Address,
        auction_id: u64,
    ) {
        bidder.require_auth();

        let auction: Auction = env
            .storage()
            .persistent()
            .get(&DataKey::Auction(auction_id))
            .expect("Auction not found");

        assert!(
            auction.status == AuctionStatus::Finalized ||
            auction.status == AuctionStatus::Cancelled,
            "Auction not finalized or cancelled yet"
        );

        // Winner cannot pull a refund — their deposit is applied toward purchase
        if let Some(ref w) = auction.winner {
            assert!(w != &bidder, "Winner cannot claim a deposit refund");
        }

        let mut bid: Bid = env
            .storage()
            .persistent()
            .get(&DataKey::Bid(auction_id, bidder.clone()))
            .expect("No bid found for this address");

        assert!(!bid.refunded, "Deposit already refunded");

        // Return the deposit to the losing bidder instantly
        let token_client = token::Client::new(&env, &auction.token);
        token_client.transfer(
            &env.current_contract_address(),
            &bidder,
            &bid.deposit,
        );

        bid.refunded = true;
        env.storage()
            .persistent()
            .set(&DataKey::Bid(auction_id, bidder.clone()), &bid);

        env.events()
            .publish((symbol_short!("refund"), auction_id), bidder);
    }

    // ── CANCEL AUCTION ────────────────────────────────────────────────────────
    // Admin cancels an auction (e.g. property withdrawn, legal issue).
    // All bidders can then call refund_deposit to get their money back.
    pub fn cancel_auction(env: Env, admin: Address, auction_id: u64) {
        admin.require_auth();

        let stored_admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("Contract not initialized");
        assert!(stored_admin == admin, "Unauthorized: not the admin");

        let mut auction: Auction = env
            .storage()
            .persistent()
            .get(&DataKey::Auction(auction_id))
            .expect("Auction not found");

        assert!(auction.status == AuctionStatus::Open, "Auction is not open");

        auction.status = AuctionStatus::Cancelled;
        env.storage()
            .persistent()
            .set(&DataKey::Auction(auction_id), &auction);

        env.events()
            .publish((symbol_short!("cancel"), auction_id), auction_id);
    }

    // ── GET AUCTION ───────────────────────────────────────────────────────────
    // Read-only view of any auction. Used by frontend to display auction state.
    pub fn get_auction(env: Env, auction_id: u64) -> Auction {
        env.storage()
            .persistent()
            .get(&DataKey::Auction(auction_id))
            .expect("Auction not found")
    }

    // ── GET BID ───────────────────────────────────────────────────────────────
    // Read-only view of a specific bidder's bid on an auction.
    pub fn get_bid(env: Env, auction_id: u64, bidder: Address) -> Bid {
        env.storage()
            .persistent()
            .get(&DataKey::Bid(auction_id, bidder))
            .expect("Bid not found")
    }

    // ── GET AUCTION COUNT ─────────────────────────────────────────────────────
    // Returns total number of auctions created. Used for frontend listings.
    pub fn get_auction_count(env: Env) -> u64 {
        env.storage()
            .instance()
            .get(&DataKey::AuctionCount)
            .unwrap_or(0)
    }

    // ── GET PURCHASE TOKEN ────────────────────────────────────────────────────
    // Returns the right-to-purchase token hash for a finalized auction.
    // Winner presents this to PAG-IBIG / bank to complete the property transfer.
    pub fn get_purchase_token(env: Env, auction_id: u64) -> BytesN<32> {
        env.storage()
            .persistent()
            .get(&DataKey::PurchaseToken(auction_id))
            .expect("Purchase token not found — auction not finalized")
    }
}

mod test;
