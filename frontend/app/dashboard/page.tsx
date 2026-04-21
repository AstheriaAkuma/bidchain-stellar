"use client";
import { useFreighter } from "@/hooks/useFreighter";
import {
  CONTRACT_ID,
  stellarExpertUrl,
  getClaimableBalances,
  getBidTransactions,
  getAuction,
  getUserBid,
  buildRefundTx,
  submitSorobanTx,
  AuctionData,
  BidData,
} from "@/lib/stellar";
import { useEffect, useState } from "react";

type ClaimableBalance = {
  id: string;
  amount: string;
  asset: string;
  sponsor: string;
};

type BidTx = {
  hash: string;
  memo: string | undefined;
  createdAt: string;
  auctionId: string | undefined;
  auction?: AuctionData | null;
  userBid?: BidData | null;
};

type RefundState = {
  loading: boolean;
  error: string | null;
  done: boolean;
  txHash: string | null;
};

function AuctionStatusBadge({
  auction,
  publicKey,
}: {
  auction: AuctionData | null | undefined;
  publicKey: string | null;
}) {
  if (!auction) {
    return (
      <span className="text-xs bg-yellow-900 text-yellow-400 px-2 py-0.5 rounded-full">
        active
      </span>
    );
  }
  if (auction.status === "Finalized") {
    const isWinner =
      publicKey && auction.winner
        ? auction.winner.toLowerCase() === publicKey.toLowerCase()
        : false;
    return isWinner ? (
      <span className="text-xs bg-yellow-900 text-yellow-400 px-2 py-0.5 rounded-full">
        🏆 won
      </span>
    ) : (
      <span className="text-xs bg-red-900 text-red-400 px-2 py-0.5 rounded-full">
        lost
      </span>
    );
  }
  if (auction.status === "Cancelled") {
    return (
      <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
        cancelled
      </span>
    );
  }
  if (auction.status === "Closed") {
    return (
      <span className="text-xs bg-orange-900 text-orange-400 px-2 py-0.5 rounded-full">
        closed
      </span>
    );
  }
  return (
    <span className="text-xs bg-yellow-900 text-yellow-400 px-2 py-0.5 rounded-full">
      active
    </span>
  );
}

export default function Dashboard() {
  const { publicKey, shortKey, connect, sign } = useFreighter();
  const [balances, setBalances] = useState<ClaimableBalance[]>([]);
  const [bidTxs, setBidTxs] = useState<BidTx[]>([]);
  const [loading, setLoading] = useState(false);
  const [refundState, setRefundState] = useState<Record<string, RefundState>>({});

  useEffect(() => {
    if (!publicKey) return;
    setLoading(true);

    Promise.all([
      getClaimableBalances(publicKey),
      getBidTransactions(publicKey),
    ]).then(async ([b, txs]) => {
      setBalances(b);

      // Fetch auction status + user's contract bid for each tx in parallel
      const enriched = await Promise.all(
        txs.map(async (tx) => {
          const auctionId = tx.auctionId ? Number(tx.auctionId) : null;
          if (auctionId == null) return { ...tx, auction: null, userBid: null };
          const [auction, userBid] = await Promise.all([
            getAuction(auctionId),
            getUserBid(auctionId, publicKey),
          ]);
          return { ...tx, auction, userBid };
        })
      );
      setBidTxs(enriched);
      setLoading(false);
    });
  }, [publicKey]);

  async function handleClaimRefund(tx: BidTx) {
    if (!publicKey || !tx.auctionId) return;
    const key = tx.hash;

    setRefundState((prev) => ({
      ...prev,
      [key]: { loading: true, error: null, done: false, txHash: null },
    }));

    try {
      const xdr = await buildRefundTx(publicKey, Number(tx.auctionId));
      const signed = await sign(xdr);
      const hash = await submitSorobanTx(signed);

      // Refresh userBid for this tx
      const updated = await getUserBid(Number(tx.auctionId), publicKey);
      setBidTxs((prev) =>
        prev.map((t) => (t.hash === tx.hash ? { ...t, userBid: updated } : t))
      );

      setRefundState((prev) => ({
        ...prev,
        [key]: { loading: false, error: null, done: true, txHash: hash },
      }));
    } catch (e: unknown) {
      setRefundState((prev) => ({
        ...prev,
        [key]: {
          loading: false,
          done: false,
          txHash: null,
          error: e instanceof Error ? e.message : "Transaction failed.",
        },
      }));
    }
  }

  if (!publicKey) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 text-center">
        <p className="text-gray-400 mb-4">
          Connect your wallet to see your bids
        </p>
        <button
          onClick={connect}
          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg"
        >
          Connect Freighter
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">My Bids</h1>
        <div className="text-xs font-mono bg-gray-900 border border-gray-700 px-3 py-1.5 rounded-lg text-gray-400">
          {shortKey}
        </div>
      </div>

      {/* Contract reference */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6 text-sm text-gray-400">
        <p className="font-medium text-gray-300 mb-1">📡 BidChain Contract</p>
        <p className="font-mono text-xs text-blue-400 break-all">{CONTRACT_ID}</p>
        <a
          href={`https://stellar.expert/explorer/testnet/contract/${CONTRACT_ID}`}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-gray-500 hover:text-white transition mt-1 block"
        >
          View on Stellar Expert
        </a>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500 animate-pulse">
          Loading on-chain data...
        </div>
      ) : (
        <div className="space-y-8">

          {/* Bid transactions */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-3">
              📋 My Bid Transactions
              <span className="text-sm text-gray-500 font-normal ml-2">
                (live from Stellar testnet)
              </span>
            </h2>

            {bidTxs.length === 0 ? (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center text-gray-500 text-sm">
                No bids yet. Place a bid on any property to see it here.
              </div>
            ) : (
              <div className="space-y-3">
                {bidTxs.map((tx) => {
                  const rs = refundState[tx.hash];
                  const auction = tx.auction;
                  const userBid = tx.userBid;
                  const isFinalized =
                    auction?.status === "Finalized" || auction?.status === "Cancelled";
                  const isWinner =
                    publicKey && auction?.winner
                      ? auction.winner.toLowerCase() === publicKey.toLowerCase()
                      : false;
                  const canRefund =
                    isFinalized &&
                    !isWinner &&
                    userBid != null &&
                    !userBid.refunded &&
                    !rs?.done;

                  return (
                    <div
                      key={tx.hash}
                      className="bg-gray-900 border border-gray-800 rounded-xl p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-white font-medium text-sm">
                            Auction #{tx.auctionId}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {new Date(tx.createdAt).toLocaleString("en-PH")}
                          </p>
                          <p className="text-xs font-mono text-gray-600 mt-1">
                            {tx.hash.slice(0, 16)}...
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <AuctionStatusBadge auction={auction} publicKey={publicKey} />
                          <a
                            href={stellarExpertUrl(tx.hash)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-blue-400 hover:text-blue-300 transition"
                          >
                            View on-chain
                          </a>
                        </div>
                      </div>

                      {/* Refund section */}
                      {isFinalized && !isWinner && userBid != null && (
                        <div className="mt-3 pt-3 border-t border-gray-800">
                          {userBid.refunded || rs?.done ? (
                            <div className="flex items-center justify-between">
                              <span className="text-green-400 text-xs font-semibold">
                                ✅ Deposit refunded
                              </span>
                              {rs?.txHash && (
                                <a
                                  href={stellarExpertUrl(rs.txHash)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs text-blue-400 hover:text-blue-300 transition"
                                >
                                  Refund tx &rarr;
                                </a>
                              )}
                            </div>
                          ) : canRefund ? (
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-xs text-orange-400">
                                Deposit locked — you can claim it back now.
                              </p>
                              <button
                                onClick={() => handleClaimRefund(tx)}
                                disabled={rs?.loading}
                                className="bg-orange-700 hover:bg-orange-600 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded-lg transition whitespace-nowrap"
                              >
                                {rs?.loading ? "Submitting..." : "Claim Refund"}
                              </button>
                            </div>
                          ) : null}
                          {rs?.error && (
                            <p className="text-red-400 text-xs mt-2">{rs.error}</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Locked deposits (claimable balances) */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-3">
              🔐 Locked Deposits
              <span className="text-sm text-gray-500 font-normal ml-2">
                (claimable balances on Stellar)
              </span>
            </h2>

            {balances.length === 0 ? (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center text-gray-500 text-sm">
                No locked deposits. Your deposit appears here when you bid.
              </div>
            ) : (
              <div className="space-y-3">
                {balances.map((b) => (
                  <div
                    key={b.id}
                    className="bg-gray-900 border border-gray-800 rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium text-sm">
                        {parseFloat(b.amount).toFixed(7)} XLM locked
                      </span>
                      <span className="text-xs bg-blue-900 text-blue-400 px-2 py-0.5 rounded-full">
                        in escrow
                      </span>
                    </div>
                    <p className="text-xs font-mono text-gray-600 break-all">{b.id}</p>
                    <a
                      href={`https://stellar.expert/explorer/testnet/claimable-balance/${b.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300 transition mt-1 block"
                    >
                      View escrow on Stellar Expert
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
