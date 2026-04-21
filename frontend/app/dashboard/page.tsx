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
      <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
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
      <span className="text-xs bg-[#C4A484]/15 text-[#8B6914] border border-[#C4A484]/40 px-2 py-0.5 rounded-full">
        🏆 won
      </span>
    ) : (
      <span className="text-xs bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full">
        lost
      </span>
    );
  }
  if (auction.status === "Cancelled") {
    return (
      <span className="text-xs bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-full">
        cancelled
      </span>
    );
  }
  if (auction.status === "Closed") {
    return (
      <span className="text-xs bg-orange-50 text-orange-600 border border-orange-200 px-2 py-0.5 rounded-full">
        closed
      </span>
    );
  }
  return (
    <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
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
        <div className="text-5xl mb-6">📋</div>
        <h2 className="font-display text-3xl font-bold text-[#0A3D62] mb-3">My Bids</h2>
        <p className="text-slate-500 mb-8">
          Connect your Freighter wallet to view your bid history and deposit status.
        </p>
        <button
          onClick={connect}
          className="bg-[#0A3D62] hover:opacity-90 text-white px-8 py-3 rounded-xl font-semibold transition"
        >
          Connect Freighter
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Page header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-4xl font-bold text-[#0A3D62] mb-1">My Bids</h1>
          <p className="text-slate-500 text-sm">Live from Stellar testnet</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-slate-400 uppercase tracking-wide mb-1">Connected wallet</p>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
            <div className="w-6 h-6 rounded-full bg-[#0A3D62] flex items-center justify-center text-white text-xs font-bold select-none">
              {shortKey?.slice(0, 2).toUpperCase()}
            </div>
            <span className="font-mono text-sm text-slate-700">{shortKey}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          </div>
        </div>
      </div>

      {/* Contract reference */}
      <div className="bg-[#0A3D62]/5 border border-[#0A3D62]/15 rounded-xl p-4 mb-8 text-sm">
        <p className="font-semibold text-[#0A3D62] mb-1">📡 BidWell PH Contract</p>
        <p className="font-mono text-xs text-[#0A3D62]/70 break-all">{CONTRACT_ID}</p>
        <a
          href={`https://stellar.expert/explorer/testnet/contract/${CONTRACT_ID}`}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-slate-500 hover:text-[#0A3D62] transition mt-1 block"
        >
          View on Stellar Expert →
        </a>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400 animate-pulse text-sm">
          Loading on-chain data…
        </div>
      ) : (
        <div className="space-y-10">

          {/* Bid transactions */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <h2 className="font-display text-2xl font-bold text-[#0A3D62]">Bid Transactions</h2>
              {bidTxs.length > 0 && (
                <span className="text-xs bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-full">
                  {bidTxs.length}
                </span>
              )}
            </div>

            {bidTxs.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400 text-sm">
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
                      className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-slate-800 font-semibold text-sm">
                            Auction #{tx.auctionId ?? "—"}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {new Date(tx.createdAt).toLocaleString("en-PH")}
                          </p>
                          <p className="text-xs font-mono text-slate-300 mt-1">
                            {tx.hash.slice(0, 16)}…
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <AuctionStatusBadge auction={auction} publicKey={publicKey} />
                          <a
                            href={stellarExpertUrl(tx.hash)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-[#0A3D62] hover:opacity-70 transition"
                          >
                            View on-chain →
                          </a>
                        </div>
                      </div>

                      {/* Refund section */}
                      {isFinalized && !isWinner && userBid != null && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                          {userBid.refunded || rs?.done ? (
                            <div className="flex items-center justify-between">
                              <span className="text-emerald-600 text-xs font-semibold">
                                ✅ Deposit refunded
                              </span>
                              {rs?.txHash && (
                                <a
                                  href={stellarExpertUrl(rs.txHash)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs text-[#0A3D62] hover:opacity-70 transition"
                                >
                                  Refund tx →
                                </a>
                              )}
                            </div>
                          ) : canRefund ? (
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-xs text-orange-600">
                                Deposit locked — you can claim it back now.
                              </p>
                              <button
                                onClick={() => handleClaimRefund(tx)}
                                disabled={rs?.loading}
                                className="bg-[#0A3D62] hover:opacity-90 disabled:opacity-50 text-white text-xs px-4 py-2 rounded-lg transition whitespace-nowrap font-semibold"
                              >
                                {rs?.loading ? "Submitting…" : "Claim Refund"}
                              </button>
                            </div>
                          ) : null}
                          {rs?.error && (
                            <p className="text-red-500 text-xs mt-2">{rs.error}</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Locked deposits */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <h2 className="font-display text-2xl font-bold text-[#0A3D62]">Locked Deposits</h2>
              <span className="text-xs text-slate-400 font-normal">claimable balances on Stellar</span>
            </div>

            {balances.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400 text-sm">
                No locked deposits. Your deposit appears here when you bid.
              </div>
            ) : (
              <div className="space-y-3">
                {balances.map((b) => (
                  <div
                    key={b.id}
                    className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-800 font-semibold text-sm">
                        {parseFloat(b.amount).toFixed(7)} XLM locked
                      </span>
                      <span className="text-xs bg-[#0A3D62]/5 text-[#0A3D62] border border-[#0A3D62]/20 px-2 py-0.5 rounded-full">
                        in escrow
                      </span>
                    </div>
                    <p className="text-xs font-mono text-slate-300 break-all">{b.id}</p>
                    <a
                      href={`https://stellar.expert/explorer/testnet/claimable-balance/${b.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-[#0A3D62] hover:opacity-70 transition mt-1 block"
                    >
                      View escrow on Stellar Expert →
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
