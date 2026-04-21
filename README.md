# BidWell PH — ROPA Auction Portal

> **Transparent, on-chain property auctions for bank-foreclosed assets in the Philippines.**
> Bid deposits are held in a Soroban smart contract on Stellar. Winners are selected by code. Losers are refunded in seconds — not weeks.

**Live Demo:** _[Add Vercel / Netlify link here]_
**Contract on Stellar Expert:** [CAPFAF6VMQK6X4HAVHLYRIOZMJLM56A3247N4K6EIKWYIDQMF4Y6SC3U](https://stellar.expert/explorer/testnet/contract/CAPFAF6VMQK6X4HAVHLYRIOZMJLM56A3247N4K6EIKWYIDQMF4Y6SC3U)

---

## The Problem

Every year, thousands of Filipinos miss out on affordable foreclosed properties — not because they can't afford them, but because the auction system is broken.

**The three barriers today:**

| Barrier | Reality |
|---|---|
| **The Check Barrier** | You must submit a physical manager's check just to register. Bank trips, fees, and delays that most working Filipinos can't manage. |
| **The Liquidity Trap** | If you lose, your deposit is frozen for 2–4 weeks. That's money you can't use for rent, other bids, or emergencies. |
| **The Trust Gap** | Auctions happen behind closed doors. No public record. No way to verify the winner was chosen fairly. |

---

## The Solution

BidWell PH moves the entire auction process on-chain using the Stellar blockchain.

- **No manager's check** — connect a Freighter wallet, lock your deposit directly into a Soroban smart contract
- **Instant refunds** — losing bidders get their deposit back automatically once a winner is declared
- **Public ledger** — every bid and result is permanently recorded on Stellar; anyone can verify
- **Right-to-Purchase Token** — the winner receives a digital certificate on-chain, bridging the result with the real-world PAG-IBIG transfer process

---

## What's Working Right Now

This is a fully functional MVP. Everything listed below is live and demonstrable:

| Feature | Status |
|---|---|
| Browse active & closed property listings | ✅ Working |
| Search and filter properties | ✅ Working |
| Connect Freighter wallet | ✅ Working |
| Place a bid (locks deposit on Stellar testnet) | ✅ Working |
| Transaction receipt after bid confirmation | ✅ Working |
| View auction result (pulled from Soroban contract) | ✅ Working |
| My Bids dashboard (bid history from blockchain) | ✅ Working |
| Claim deposit refund | ✅ Working |
| Admin panel — finalize auction & declare winner | ✅ Working |

---

## Architecture

```
┌─────────────────────────────────────────┐
│           Browser (BidWell PH)          │
│   Next.js 15  ·  Tailwind CSS  ·  TypeScript  │
└───────────────────┬─────────────────────┘
                    │
         Freighter Wallet Extension
         (signs transactions locally)
                    │
┌───────────────────▼─────────────────────┐
│          Stellar Testnet                │
│   Horizon API  ·  Soroban RPC           │
└───────────────────┬─────────────────────┘
                    │
┌───────────────────▼─────────────────────┐
│       Soroban Smart Contract            │
│  Bid escrow · Winner selection          │
│  Refund logic · Purchase token          │
└─────────────────────────────────────────┘
```

**Frontend** — Next.js 15 app with Tailwind CSS. All blockchain reads use Soroban's `simulateTransaction` for view calls. Writes go through Freighter wallet signing.

**Smart Contract** — Written in Rust, deployed to Stellar Testnet. Handles the full auction lifecycle: creating auctions, locking deposits, declaring winners, issuing purchase tokens, and releasing refunds.

**Wallet** — Freighter browser extension. The user signs every transaction locally; private keys never leave the browser.

---

## How to Use the App

### 1. Install Freighter
Download the [Freighter browser extension](https://www.freighter.app/) and switch it to **Testnet** mode. Fund your account using [Stellar Friendbot](https://friendbot.stellar.org).

### 2. Browse Listings
Visit the homepage to see all active and closed property auctions. Search by property name, reference number, or bank. Click any card to see full details.

### 3. Place a Bid
1. Open a property listing
2. Enter your bid amount (must meet the minimum)
3. Click **"Place Bid & Lock Deposit"**
4. Freighter will prompt you to sign — no funds leave your wallet until you confirm
5. A transaction receipt appears on-screen with your bid details and a link to verify on Stellar Expert

### 4. View Results
Click **"View Auction Result"** on any closed auction to see the on-chain result — winner address, winning bid, and total bidder count. All data is pulled directly from the Soroban contract.

### 5. Claim a Refund
If you didn't win, go to **My Bids**. If the auction is finalized and your deposit is eligible, a **"Claim Refund"** button will appear. Freighter signs the refund transaction and your deposit is returned.

---

## UI Walkthrough

### Homepage — Active Auctions
The main listings page shows all open property auctions with live search/filter. Each card displays the bank, property type, location, minimum bid, and required deposit.
![Homepage - Active Auctions](.\frontend\public\homepage.png)

### Property Detail — Bid Panel
Clicking a property opens the full detail view: property specs, auction deadline countdown, escrow explanation, and a sticky bid panel on the right.
![Property Detail — Bid Panel](.\frontend\public\propertydetail.png)

### Freighter Signature Prompt
When a user clicks "Place Bid", Freighter opens a native signing modal. The user reviews the transaction and approves. Nothing is submitted without explicit confirmation.
![Freighter Signature Prompt](.\frontend\public\homepage.png)

### Transaction Receipt
After a successful bid, the page shows a full transaction receipt styled as a certificate — property name, bid amount, deposit locked, ledger status (Confirmed), and the on-chain transaction ID.
![Transaction Receipt](.\frontend\public\receipt.png)
![Stellar Expert](.\frontend\public\stellarexpert.png)

### Closed Auctions — Auction Result Page
Closed auction pages show the on-chain result after finalization: winner address (linked to Stellar Expert), winning bid amount, and total participants. The reveal is gated by a button for a clean UX.
![Closed Auctions — Auction Result Page](.\frontend\public\result.png)

### My Bids Dashboard
Shows the user's complete bid history pulled from the Stellar testnet. Displays auction status (active / won / lost), on-chain verification links, and a refund button where applicable.
![My Bids Dashboard](.\frontend\public\bid.png)

---

## Contract Functions

| Function | Who Calls It | What It Does |
|---|---|---|
| `initialize(admin)` | Deployer | Sets the admin address |
| `create_auction(...)` | Admin | Lists a foreclosed property for auction |
| `place_bid(bidder, auction_id, bid_amount)` | Bidder | Locks deposit and records bid |
| `finalize_auction(admin, auction_id, winner, ...)` | Admin | Declares winner, issues purchase token |
| `refund_deposit(bidder, auction_id)` | Losing bidder | Claims deposit refund |
| `cancel_auction(admin, auction_id)` | Admin | Cancels auction, enables all refunds |
| `get_auction(auction_id)` | Anyone | Read-only auction state |
| `get_bid(auction_id, bidder)` | Anyone | Read-only bid details |

---

## Auction Lifecycle

```
Open
 └─→ Finalized   (admin declares winner, purchase token issued)
 └─→ Cancelled   (admin cancels, all deposits become refundable)

After Finalized or Cancelled:
 └─→ Each losing bidder calls refund_deposit → instant return
```

---

## Repo Structure

```
bidchain-stellar/
├── contract/
│   └── src/
│       ├── lib.rs          ← Soroban smart contract (Rust)
│       └── test.rs         ← 3 passing contract tests
├── frontend/
│   ├── app/
│   │   ├── page.tsx        ← Homepage — property listings
│   │   ├── property/[id]/  ← Property detail + bid form
│   │   ├── auction/[id]/   ← Auction result page
│   │   ├── dashboard/      ← My Bids + refund flow
│   │   └── admin/          ← Admin panel — finalize auctions
│   ├── components/
│   │   └── Navbar.tsx
│   ├── hooks/
│   │   └── useFreighter.ts ← Wallet connection hook
│   └── lib/
│       ├── stellar.ts      ← Blockchain interaction layer
│       └── mockData.ts     ← Property listings data
└── README.md
```

---

## Running Locally

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — Freighter must be installed and set to **Testnet**.

---

## Future Improvements

- Real property data integration with PAG-IBIG public registry API
- AI-assisted listing creation (auto-extract property details from uploaded documents)
- Mobile-responsive Freighter deep-link for in-app signing
- USDC deposit support alongside XLM
- Notification system for outbid and auction close events
