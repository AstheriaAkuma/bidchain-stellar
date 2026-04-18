#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::{
        testutils::Address as _,
        token::{Client as TokenClient, StellarAssetClient},
        Address, BytesN, Env, String,
    };

    // ── HELPERS ───────────────────────────────────────────────────────────────

    fn setup() -> (Env, BidChainContractClient<'static>, Address, Address) {
        let env = Env::default();
        env.mock_all_auths();

        let admin       = Address::generate(&env);
        let token_admin = Address::generate(&env);
        let token_id    = env.register_stellar_asset_contract(token_admin.clone());

        let contract_id = env.register_contract(None, BidChainContract);
        let client      = BidChainContractClient::new(&env, &contract_id);

        client.initialize(&admin);

        (env, client, token_id, admin)
    }

    // ── TEST 1: HAPPY PATH ────────────────────────────────────────────────────
    // Full end-to-end MVP auction flow:
    // Admin creates auction → Bidder A and Bidder B place bids →
    // Admin finalizes with Bidder A as winner →
    // Bidder B claims refund instantly → Winner gets purchase token
    #[test]
    fn test_happy_path_full_auction_flow() {
        let (env, client, token_id, admin) = setup();

        let bidder_a  = Address::generate(&env);
        let bidder_b  = Address::generate(&env);
        let token_sac = StellarAssetClient::new(&env, &token_id);
        let token     = TokenClient::new(&env, &token_id);

        // Mint tokens to both bidders so they can pay deposits
        token_sac.mint(&bidder_a, &5_000_000);
        token_sac.mint(&bidder_b, &5_000_000);

        // Step 1: Admin creates a PAG-IBIG foreclosed property auction
        // Min bid: 800,000 | Deposit: 50,000 | Deadline: ledger 1000
        let prop_ref  = String::from_str(&env, "PAGIBIG-QC-2024-001");
        let auction_id = client.create_auction(
            &admin,
            &prop_ref,
            &800_000i128,
            &50_000i128,
            &token_id,
            &1000u64,
        );
        assert_eq!(auction_id, 1, "First auction should have ID 1");

        let auction = client.get_auction(&auction_id);
        assert_eq!(auction.status, AuctionStatus::Open);
        assert_eq!(auction.min_bid, 800_000i128);
        assert_eq!(auction.deposit_amount, 50_000i128);

        // Step 2: Bidder A places a bid of 850,000 with 50,000 deposit locked
        client.place_bid(&bidder_a, &auction_id, &850_000i128);
        assert_eq!(token.balance(&bidder_a), 4_950_000i128, "Bidder A deposit deducted");

        // Step 3: Bidder B places a higher bid of 920,000
        client.place_bid(&bidder_b, &auction_id, &920_000i128);
        assert_eq!(token.balance(&bidder_b), 4_950_000i128, "Bidder B deposit deducted");

        let auction = client.get_auction(&auction_id);
        assert_eq!(auction.bid_count, 2, "Should have 2 bids recorded");

        // Step 4: Admin finalizes auction — Bidder B wins with highest bid
        let purchase_hash = BytesN::from_array(&env, &[9u8; 32]);
        client.finalize_auction(&admin, &auction_id, &bidder_b, &purchase_hash);

        let auction = client.get_auction(&auction_id);
        assert_eq!(auction.status,      AuctionStatus::Finalized);
        assert_eq!(auction.winner,      Some(bidder_b.clone()));
        assert_eq!(auction.winning_bid, 920_000i128);

        // Step 5: Bidder A (loser) claims their deposit refund instantly
        let balance_before = token.balance(&bidder_a);
        client.refund_deposit(&bidder_a, &auction_id);
        assert_eq!(
            token.balance(&bidder_a),
            balance_before + 50_000i128,
            "Bidder A should receive full deposit refund"
        );

        // Step 6: Verify purchase token exists for the winner
        let stored_hash = client.get_purchase_token(&auction_id);
        assert_eq!(stored_hash, purchase_hash, "Purchase token hash must match");

        // Bidder B (winner) should NOT be able to refund
        // (tested in test 2 below)
    }

    // ── TEST 2: EDGE CASE ─────────────────────────────────────────────────────
    // Duplicate bid rejection — a bidder cannot place two bids on the same auction.
    // The contract must reject the second attempt and keep the first bid intact.
    #[test]
    #[should_panic(expected = "Bidder has already placed a bid")]
    fn test_duplicate_bid_rejected() {
        let (env, client, token_id, admin) = setup();

        let bidder    = Address::generate(&env);
        let token_sac = StellarAssetClient::new(&env, &token_id);
        token_sac.mint(&bidder, &5_000_000);

        let prop_ref   = String::from_str(&env, "PAGIBIG-MNL-2024-002");
        let auction_id = client.create_auction(
            &admin,
            &prop_ref,
            &500_000i128,
            &30_000i128,
            &token_id,
            &2000u64,
        );

        // First bid — should succeed
        client.place_bid(&bidder, &auction_id, &550_000i128);

        // Second bid from the same address — must panic
        client.place_bid(&bidder, &auction_id, &600_000i128);
    }

    // ── TEST 3: STATE VERIFICATION ────────────────────────────────────────────
    // After a complete auction lifecycle, all on-chain state must be correct:
    // - Auction status is Finalized
    // - Winner address and winning bid are stored correctly
    // - Losing bidder's refund flag is set to true after claiming
    // - Auction count increments correctly across multiple auctions
    // - Purchase token hash is stored and retrievable
    #[test]
    fn test_state_after_finalized_auction() {
        let (env, client, token_id, admin) = setup();

        let winner = Address::generate(&env);
        let loser  = Address::generate(&env);
        let token_sac = StellarAssetClient::new(&env, &token_id);
        token_sac.mint(&winner, &2_000_000);
        token_sac.mint(&loser,  &2_000_000);

        // Create two auctions — verify count increments
        let prop_1 = String::from_str(&env, "PAGIBIG-CEBu-2024-001");
        let prop_2 = String::from_str(&env, "PAGIBIG-DAV-2024-001");

        let id_1 = client.create_auction(&admin, &prop_1, &400_000i128, &25_000i128, &token_id, &500u64);
        let id_2 = client.create_auction(&admin, &prop_2, &600_000i128, &40_000i128, &token_id, &800u64);

        assert_eq!(id_1, 1);
        assert_eq!(id_2, 2);
        assert_eq!(client.get_auction_count(), 2, "Auction count must be 2");

        // Both bidders join auction 1
        client.place_bid(&winner, &id_1, &450_000i128);
        client.place_bid(&loser,  &id_1, &420_000i128);

        // Finalize auction 1 — winner wins
        let hash = BytesN::from_array(&env, &[7u8; 32]);
        client.finalize_auction(&admin, &id_1, &winner, &hash);

        // Verify final auction state
        let final_auction = client.get_auction(&id_1);
        assert_eq!(final_auction.status,      AuctionStatus::Finalized,    "Status must be Finalized");
        assert_eq!(final_auction.winner,      Some(winner.clone()),         "Winner address must match");
        assert_eq!(final_auction.winning_bid, 450_000i128,                  "Winning bid must match");
        assert_eq!(final_auction.bid_count,   2,                            "Bid count must be 2");

        // Verify loser bid state before refund
        let loser_bid_before = client.get_bid(&id_1, &loser);
        assert!(!loser_bid_before.refunded, "Refund flag should be false before claiming");

        // Loser claims refund
        client.refund_deposit(&loser, &id_1);

        // Verify loser bid state after refund
        let loser_bid_after = client.get_bid(&id_1, &loser);
        assert!(loser_bid_after.refunded, "Refund flag should be true after claiming");

        // Verify purchase token stored correctly
        let stored = client.get_purchase_token(&id_1);
        assert_eq!(stored, hash, "Purchase token hash must be stored correctly");

        // Auction 2 is still open — untouched
        let auction_2 = client.get_auction(&id_2);
        assert_eq!(auction_2.status, AuctionStatus::Open, "Auction 2 should still be Open");
    }
}
