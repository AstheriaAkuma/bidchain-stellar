"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useFreighter } from "@/hooks/useFreighter";
import {
  getAuctionCount,
  getAuction,
  buildFinalizeAuctionTx,
  submitSorobanTx,
  AuctionData,
} from "@/lib/stellar";
import { formatPHP } from "@/lib/mockData";

function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

type FinalizeState = {
  winner: string;
  loading: boolean;
  error: string | null;
  done: boolean;
  txHash: string | null;
};

export default function AdminPage() {
  const { publicKey, connect, sign, shortKey } = useFreighter();
  const [auctions, setAuctions] = useState<AuctionData[]>([]);
  const [loadingAuctions, setLoadingAuctions] = useState(false);
  const [finalizeState, setFinalizeState] = useState<Record<number, FinalizeState>>({});

  useEffect(() => {
    if (!publicKey) return;
    setLoadingAuctions(true);
    getAuctionCount().then(async (count) => {
      if (count === 0) { setLoadingAuctions(false); return; }
      const results = await Promise.all(
        Array.from({ length: count }, (_, i) => getAuction(i + 1))
      );
      setAuctions(results.filter(Boolean) as AuctionData[]);
      setLoadingAuctions(false);
    });
  }, [publicKey]);

  function initFinalize(id: number) {
    setFinalizeState((prev) => ({
      ...prev,
      [id]: { winner: "", loading: false, error: null, done: false, txHash: null },
    }));
  }

  async function handleFinalize(auction: AuctionData) {
    const state = finalizeState[auction.id];
    if (!state || !publicKey) return;
    const winner = state.winner.trim();
    if (!winner) {
      setFinalizeState((prev) => ({
        ...prev,
        [auction.id]: { ...prev[auction.id], error: "Enter a winner address." },
      }));
      return;
    }

    setFinalizeState((prev) => ({
      ...prev,
      [auction.id]: { ...prev[auction.id], loading: true, error: null },
    }));

    try {
      const xdr = await buildFinalizeAuctionTx(publicKey, auction.id, winner);
      const signed = await sign(xdr);
      const hash = await submitSorobanTx(signed);

      const updated = await getAuction(auction.id);
      if (updated) {
        setAuctions((prev) => prev.map((a) => (a.id === auction.id ? updated : a)));
      }
      setFinalizeState((prev) => ({
        ...prev,
        [auction.id]: { ...prev[auction.id], loading: false, done: true, txHash: hash },
      }));
    } catch (e: unknown) {
      setFinalizeState((prev) => ({
        ...prev,
        [auction.id]: {
          ...prev[auction.id],
          loading: false,
          error: e instanceof Error ? e.message : "Transaction failed.",
        },
      }));
    }
  }

  if (!publicKey) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 text-center">
        <div className="text-5xl mb-6">🔑</div>
        <h2 className="font-display text-3xl font-bold text-[#0A3D62] mb-3">Admin Panel</h2>
        <p className="text-slate-500 mb-8">
          Connect your admin wallet to manage and finalize auctions.
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

  const open = auctions.filter((a) => a.status === "Open" || a.status === "Closed");
  const finalized = auctions.filter((a) => a.status === "Finalized" || a.status === "Cancelled");

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      {/* Header */}
      <Link
        href="/"
        className="text-sm text-slate-500 hover:text-[#0A3D62] transition mb-6 inline-block"
      >
        ← Back to listings
      </Link>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-4xl font-bold text-[#0A3D62] mb-1">Admin Panel</h1>
          <p className="text-xs font-mono text-slate-400 mt-1">{shortKey}</p>
        </div>
        <span className="text-xs bg-slate-100 text-slate-500 border border-slate-200 px-2.5 py-1 rounded-full font-semibold mt-1">
          Testnet
        </span>
      </div>

      {/* Warning banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8">
        <p className="font-semibold text-amber-700 text-sm mb-1">⚠️ Admin access only</p>
        <p className="text-amber-600 text-xs">
          The contract will reject any wallet that is not the registered admin.
          Finalization is irreversible.
        </p>
      </div>

      {loadingAuctions ? (
        <div className="text-center py-16 text-slate-400 animate-pulse text-sm">
          Loading auctions from contract…
        </div>
      ) : auctions.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center shadow-sm">
          <div className="text-4xl mb-4">📭</div>
          <p className="text-slate-700 font-semibold mb-2">No auctions found on-chain</p>
          <p className="text-slate-500 text-sm mb-5">
            Create auctions via the Stellar CLI before managing them here.
          </p>
          <pre className="text-left bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs text-[#0A3D62] overflow-x-auto">
{`stellar contract invoke --id $CONTRACT_ID -- \\
  create_auction \\
  --admin $ADMIN_KEY \\
  --property_ref "PAGIBIG-001" \\
  --min_bid 800000 \\
  --deposit 50000 \\
  --token $XLM_SAC \\
  --deadline 99999`}
          </pre>
        </div>
      ) : (
        <div className="space-y-10">

          {/* Pending finalization */}
          {open.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-5">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-400" />
                <h2 className="font-display text-2xl font-bold text-[#0A3D62]">
                  Pending Finalization
                </h2>
                <span className="text-xs bg-orange-50 text-orange-600 border border-orange-200 px-2 py-0.5 rounded-full">
                  {open.length}
                </span>
              </div>
              <div className="space-y-4">
                {open.map((auction) => {
                  const fs = finalizeState[auction.id];
                  return (
                    <div
                      key={auction.id}
                      className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="text-slate-800 font-semibold">
                            Auction #{auction.id}
                          </p>
                          <p className="text-xs font-mono text-slate-400 mt-0.5">
                            {auction.propertyRef}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 text-xs">
                          <span className={`px-2 py-0.5 rounded-full font-semibold ${
                            auction.status === "Open"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-orange-50 text-orange-600 border border-orange-200"
                          }`}>
                            {auction.status}
                          </span>
                          <span className="text-slate-400">
                            {auction.bidCount} bid{auction.bidCount !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs mb-4 bg-slate-50 rounded-lg p-3 border border-slate-100">
                        <div>
                          <p className="text-slate-400 mb-0.5">Min Bid</p>
                          <p className="text-slate-700 font-semibold">{formatPHP(auction.minBid)}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 mb-0.5">Deposit</p>
                          <p className="text-slate-700 font-semibold">{formatPHP(auction.depositAmount)}</p>
                        </div>
                      </div>

                      <a
                        href={`https://stellar.expert/explorer/testnet/contract/${process.env.NEXT_PUBLIC_CONTRACT_ID}?filter=transactions`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-[#0A3D62] hover:opacity-70 transition mb-4 block"
                      >
                        View all bids on Stellar Expert →
                      </a>

                      {!fs ? (
                        <button
                          onClick={() => initFinalize(auction.id)}
                          className="bg-[#0A3D62] hover:opacity-90 text-white text-sm px-5 py-2.5 rounded-lg transition font-semibold"
                        >
                          Finalize Auction
                        </button>
                      ) : fs.done ? (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                          <p className="text-emerald-700 font-semibold text-sm">✅ Finalized</p>
                          <a
                            href={`https://stellar.expert/explorer/testnet/tx/${fs.txHash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-[#0A3D62] hover:opacity-70 transition"
                          >
                            {fs.txHash?.slice(0, 16)}… →
                          </a>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs text-slate-500 font-medium block mb-1.5">
                              Winner&apos;s Stellar address
                            </label>
                            <input
                              type="text"
                              placeholder="G…"
                              value={fs.winner}
                              onChange={(e) =>
                                setFinalizeState((prev) => ({
                                  ...prev,
                                  [auction.id]: { ...prev[auction.id], winner: e.target.value, error: null },
                                }))
                              }
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0A3D62]/30 focus:border-[#0A3D62]"
                            />
                          </div>
                          {fs.error && (
                            <p className="text-red-500 text-xs">{fs.error}</p>
                          )}
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleFinalize(auction)}
                              disabled={fs.loading}
                              className="bg-[#0A3D62] hover:opacity-90 disabled:opacity-50 text-white text-sm px-5 py-2.5 rounded-lg transition font-semibold"
                            >
                              {fs.loading ? "Submitting…" : "Confirm & Sign"}
                            </button>
                            <button
                              onClick={() =>
                                setFinalizeState((prev) => {
                                  const next = { ...prev };
                                  delete next[auction.id];
                                  return next;
                                })
                              }
                              className="text-slate-500 hover:text-slate-700 border border-slate-200 hover:border-slate-300 text-sm px-4 py-2 rounded-lg transition"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Already finalized */}
          {finalized.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                <h2 className="font-display text-2xl font-bold text-slate-400">
                  Finalized
                </h2>
                <span className="text-xs bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-full">
                  {finalized.length}
                </span>
              </div>
              <div className="space-y-3 opacity-70">
                {finalized.map((auction) => (
                  <div
                    key={auction.id}
                    className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between"
                  >
                    <div>
                      <p className="text-slate-700 text-sm font-semibold">
                        Auction #{auction.id}
                      </p>
                      <p className="text-xs font-mono text-slate-400">{auction.propertyRef}</p>
                      {auction.winner && (
                        <p className="text-xs text-slate-500 mt-1">
                          Winner:{" "}
                          <span className="font-mono text-[#C4A484]">
                            {shortAddr(auction.winner)}
                          </span>
                          {" — "}{formatPHP(auction.winningBid)}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        auction.status === "Finalized"
                          ? "bg-[#0A3D62]/8 text-[#0A3D62] border border-[#0A3D62]/20"
                          : "bg-slate-100 text-slate-500 border border-slate-200"
                      }`}>
                        {auction.status}
                      </span>
                      <Link
                        href={`/auction/${auction.id}/result`}
                        className="text-xs text-[#0A3D62] hover:opacity-70 transition"
                      >
                        View result →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>
      )}
    </div>
  );
}
