import * as StellarSdk from "@stellar/stellar-sdk";

const CONTRACT_ID = process.env.NEXT_PUBLIC_CONTRACT_ID!;
const NETWORK_PASSPHRASE = StellarSdk.Networks.TESTNET;
const ESCROW_KEY = process.env.NEXT_PUBLIC_ESCROW_KEY!;

const horizonServer = new StellarSdk.Horizon.Server(
  "https://horizon-testnet.stellar.org"
);

const rpcServer = new StellarSdk.rpc.Server(
  "https://soroban-testnet.stellar.org"
);

// ── SOROBAN CONTRACT TYPES ────────────────────────────────────────────────────

export type AuctionData = {
  id: number;
  propertyRef: string;
  minBid: number;
  depositAmount: number;
  deadline: number;
  status: "Open" | "Closed" | "Finalized" | "Cancelled";
  winner: string | null;
  winningBid: number;
  bidCount: number;
};

export type BidData = {
  bidder: string;
  amount: number;
  deposit: number;
  refunded: boolean;
};

// ── SOROBAN VIEW HELPERS ──────────────────────────────────────────────────────

async function simulateView(
  method: string,
  args: StellarSdk.xdr.ScVal[]
): Promise<StellarSdk.xdr.ScVal | null> {
  // Use the escrow key (a known funded testnet account) as simulation source.
  // We load its real sequence number so the RPC accepts the transaction XDR.
  const sourceAccount = await horizonServer.loadAccount(ESCROW_KEY);
  const contract = new StellarSdk.Contract(CONTRACT_ID);
  const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const sim = await rpcServer.simulateTransaction(tx);
  if (!StellarSdk.rpc.Api.isSimulationSuccess(sim)) return null;
  return sim.result?.retval ?? null;
}

function parseAuctionStatus(
  raw: unknown
): "Open" | "Closed" | "Finalized" | "Cancelled" {
  const valid = ["Open", "Closed", "Finalized", "Cancelled"] as const;
  // Soroban encodes unit enum variants as Vec([Symbol("Variant")])
  // scValToNative converts them to arrays like ["Open"]
  const candidate = Array.isArray(raw) ? raw[0] : raw;
  if (typeof candidate === "string" && valid.includes(candidate as (typeof valid)[number])) {
    return candidate as (typeof valid)[number];
  }
  return "Open";
}

// Query the on-chain Auction struct by ID.
export async function getAuction(
  auctionId: number
): Promise<AuctionData | null> {
  try {
    const retval = await simulateView("get_auction", [
      StellarSdk.nativeToScVal(BigInt(auctionId), { type: "u64" }),
    ]);
    if (!retval) return null;
    const raw = StellarSdk.scValToNative(retval) as Record<string, unknown>;
    return {
      id: Number(raw.id),
      propertyRef: String(raw.property_ref ?? ""),
      minBid: Number(raw.min_bid),
      depositAmount: Number(raw.deposit_amount),
      deadline: Number(raw.deadline),
      status: parseAuctionStatus(raw.status),
      winner: raw.winner != null ? String(raw.winner) : null,
      winningBid: Number(raw.winning_bid),
      bidCount: Number(raw.bid_count),
    };
  } catch (e) {
    console.error(`[BidChain] getAuction(${auctionId}) error:`, e);
    return null;
  }
}

// Query a specific bidder's Bid struct for an auction.
export async function getUserBid(
  auctionId: number,
  bidderAddress: string
): Promise<BidData | null> {
  try {
    const retval = await simulateView("get_bid", [
      StellarSdk.nativeToScVal(BigInt(auctionId), { type: "u64" }),
      new StellarSdk.Address(bidderAddress).toScVal(),
    ]);
    if (!retval) return null;
    const raw = StellarSdk.scValToNative(retval) as Record<string, unknown>;
    return {
      bidder: String(raw.bidder ?? ""),
      amount: Number(raw.amount),
      deposit: Number(raw.deposit),
      refunded: Boolean(raw.refunded),
    };
  } catch {
    return null;
  }
}

export { CONTRACT_ID, NETWORK_PASSPHRASE };

export async function buildPlaceBidTx(
  bidderAddress: string,
  auctionId: number,
  _bidAmount: number
): Promise<string> {
  const account = await horizonServer.loadAccount(bidderAddress);

  const transaction = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      StellarSdk.Operation.createClaimableBalance({
        asset: StellarSdk.Asset.native(),
        amount: "1", // 1 XLM = demo deposit stand-in
        claimants: [
          // Platform can always claim (winner path)
          new StellarSdk.Claimant(ESCROW_KEY),
          // Bidder can reclaim after 1 day (loser refund path)
          new StellarSdk.Claimant(
            bidderAddress,
            StellarSdk.Claimant.predicateNot(
              StellarSdk.Claimant.predicateBeforeRelativeTime("86400")
            )
          ),
        ],
      })
    )
    .addMemo(StellarSdk.Memo.text(`BidChain:auction:${auctionId}`))
    .setTimeout(30)
    .build();

  return transaction.toXDR();
}

export async function submitSignedTx(signedXDR: string) {
  const tx = StellarSdk.TransactionBuilder.fromXDR(
    signedXDR,
    NETWORK_PASSPHRASE
  );
  const result = await horizonServer.submitTransaction(tx);
  return { hash: result.hash, status: "SUCCESS" };
}

export function stellarExpertUrl(txHash: string) {
  return `https://stellar.expert/explorer/testnet/tx/${txHash}`;
}

// ── SOROBAN WRITE HELPERS ─────────────────────────────────────────────────────

// Build and simulate a Soroban write tx, returning prepared XDR ready to sign.
async function buildSorobanTx(
  signerAddress: string,
  method: string,
  args: StellarSdk.xdr.ScVal[]
): Promise<string> {
  const account = await horizonServer.loadAccount(signerAddress);
  const contract = new StellarSdk.Contract(CONTRACT_ID);
  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const sim = await rpcServer.simulateTransaction(tx);
  if (!StellarSdk.rpc.Api.isSimulationSuccess(sim)) {
    const errSim = sim as StellarSdk.rpc.Api.SimulateTransactionErrorResponse;
    throw new Error(errSim.error ?? "Simulation failed");
  }
  return StellarSdk.rpc.assembleTransaction(tx, sim).build().toXDR();
}

// Submit a signed Soroban XDR, poll until confirmed, return the tx hash.
export async function submitSorobanTx(signedXDR: string): Promise<string> {
  const tx = StellarSdk.TransactionBuilder.fromXDR(signedXDR, NETWORK_PASSPHRASE);
  const send = await rpcServer.sendTransaction(tx);
  if (send.status === "ERROR") throw new Error("Transaction rejected by network");
  const confirmed = await rpcServer.pollTransaction(send.hash, { attempts: 20 });
  if (confirmed.status !== StellarSdk.rpc.Api.GetTransactionStatus.SUCCESS) {
    throw new Error("Transaction failed on-chain");
  }
  return send.hash;
}

// Get total number of auctions created in the contract.
export async function getAuctionCount(): Promise<number> {
  try {
    const retval = await simulateView("get_auction_count", []);
    if (!retval) return 0;
    return Number(StellarSdk.scValToNative(retval));
  } catch {
    return 0;
  }
}

// Build XDR for finalize_auction — admin signs this with Freighter.
// Generates a random purchase-token hash for the MVP.
export async function buildFinalizeAuctionTx(
  adminAddress: string,
  auctionId: number,
  winnerAddress: string
): Promise<string> {
  const randomHash = new Uint8Array(32);
  crypto.getRandomValues(randomHash);
  return buildSorobanTx(adminAddress, "finalize_auction", [
    new StellarSdk.Address(adminAddress).toScVal(),
    StellarSdk.nativeToScVal(BigInt(auctionId), { type: "u64" }),
    new StellarSdk.Address(winnerAddress).toScVal(),
    StellarSdk.nativeToScVal(Buffer.from(randomHash), { type: "bytes" }),
  ]);
}

// Build XDR for refund_deposit — losing bidder signs this with Freighter.
export async function buildRefundTx(
  bidderAddress: string,
  auctionId: number
): Promise<string> {
  return buildSorobanTx(bidderAddress, "refund_deposit", [
    new StellarSdk.Address(bidderAddress).toScVal(),
    StellarSdk.nativeToScVal(BigInt(auctionId), { type: "u64" }),
  ]);
}

// Get real XLM balance for a wallet
export async function getWalletBalance(address: string): Promise<string> {
  try {
    const account = await horizonServer.loadAccount(address);
    const xlm = account.balances.find((b) => b.asset_type === "native");
    return xlm ? parseFloat(xlm.balance).toFixed(2) : "0";
  } catch {
    return "0";
  }
}

// Get real claimable balances (locked deposits) for a wallet
export async function getClaimableBalances(address: string) {
  try {
    const balances = await horizonServer
      .claimableBalances()
      .claimant(address)
      .call();

    return balances.records.map((b) => ({
      id: b.id,
      amount: b.amount,
      asset: b.asset,
      sponsor: b.sponsor ?? "",
    }));
  } catch {
    return [];
  }
}

// Get real transactions made by a wallet that have BidChain memo
export async function getBidTransactions(address: string) {
  try {
    const txs = await horizonServer
      .transactions()
      .forAccount(address)
      .order("desc")
      .limit(20)
      .call();

    return txs.records
      .filter((tx) => tx.memo?.startsWith("BidChain:auction:"))
      .map((tx) => ({
        hash: tx.hash,
        memo: tx.memo,
        createdAt: tx.created_at,
        auctionId: tx.memo?.replace("BidChain:auction:", ""),
      }));
  } catch {
    return [];
  }
}