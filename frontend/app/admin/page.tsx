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
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

type FinalizeState = {
  winner: string;
  loading: boolean;
  error: string | null;
  done: boolean;
  txHash: string | null;
};

export default function AdminPage() {
  const { publicKey, connect, sign } = useFreighter();
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

      // Refresh this auction's data
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
        <p className="text-gray-400 mb-4">Connect your admin wallet to manage auctions.</p>
        <button
          onClick={connect}
          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg"
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
      <div className="mb-8">
        <Link href="/" className="text-sm text-gray-500 hover:text-white transition">
          &larr; Back to listings
        </Link>
        <h1 className="text-2xl font-bold text-white mt-3">Admin Panel</h1>
        <p className="text-xs font-mono text-gray-500 mt-1">{publicKey}</p>
      </div>

      <div className="bg-gray-900 border border-yellow-800 rounded-xl p-4 mb-8 text-sm text-yellow-400">
        <p className="font-semibold mb-1">⚠️ Admin only</p>
        <p className="text-yellow-600 text-xs">
          The contract will reject any wallet that is not the registered admin.
          Finalization is irreversible.
        </p>
      </div>

      {loadingAuctions ? (
        <div className="text-center py-12 text-gray-500 animate-pulse">
          Loading auctions from contract...
        </div>
      ) : auctions.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <p className="text-gray-300 font-semibold mb-2">No auctions found on-chain</p>
          <p className="text-gray-500 text-sm">
            Create auctions via the Stellar CLI before managing them here.
          </p>
          <pre className="mt-4 text-left bg-gray-800 rounded-lg p-4 text-xs text-green-400 overflow-x-auto">
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
        <div className="space-y-8">

          {/* Auctions pending finalization */}
          {open.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-white mb-3">
                Pending Finalization
                <span className="ml-2 text-sm text-gray-500 font-normal">
                  ({open.length})
                </span>
              </h2>
              <div className="space-y-4">
                {open.map((auction) => {
                  const fs = finalizeState[auction.id];
                  return (
                    <div
                      key={auction.id}
                      className="bg-gray-900 border border-gray-700 rounded-xl p-5"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-white font-semibold">
                            Auction #{auction.id}
                          </p>
                          <p className="text-xs font-mono text-gray-500 mt-0.5">
                            {auction.propertyRef}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 text-xs">
                          <span className="bg-yellow-900 text-yellow-400 px-2 py-0.5 rounded-full">
                            {auction.status}
                          </span>
                          <span className="text-gray-500">
                            {auction.bidCount} bid{auction.bidCount !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-4">
                        <span>Min bid: <span className="text-gray-300">{formatPHP(auction.minBid)}</span></span>
                        <span>Deposit: <span className="text-gray-300">{formatPHP(auction.depositAmount)}</span></span>
                      </div>

                      <a
                        href={`https://stellar.expert/explorer/testnet/contract/${process.env.NEXT_PUBLIC_CONTRACT_ID}?filter=transactions`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-400 hover:text-blue-300 transition mb-4 block"
                      >
                        View all bids on Stellar Expert &rarr;
                      </a>

                      {!fs ? (
                        <button
                          onClick={() => initFinalize(auction.id)}
                          className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-lg transition"
                        >
                          Finalize Auction
                        </button>
                      ) : fs.done ? (
                        <div className="bg-green-950 border border-green-700 rounded-lg p-3 text-sm">
                          <p className="text-green-400 font-semibold">✅ Finalized</p>
                          <a
                            href={`https://stellar.expert/explorer/testnet/tx/${fs.txHash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-blue-400 hover:text-blue-300 transition"
                          >
                            {fs.txHash?.slice(0, 16)}... &rarr;
                          </a>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <label className="text-xs text-gray-400 block">
                            Winner&apos;s Stellar address
                          </label>
                          <input
                            type="text"
                            placeholder="G..."
                            value={fs.winner}
                            onChange={(e) =>
                              setFinalizeState((prev) => ({
                                ...prev,
                                [auction.id]: { ...prev[auction.id], winner: e.target.value, error: null },
                              }))
                            }
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-blue-500"
                          />
                          {fs.error && (
                            <p className="text-red-400 text-xs">{fs.error}</p>
                          )}
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleFinalize(auction)}
                              disabled={fs.loading}
                              className="bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg transition"
                            >
                              {fs.loading ? "Submitting..." : "Confirm & Sign"}
                            </button>
                            <button
                              onClick={() =>
                                setFinalizeState((prev) => {
                                  const next = { ...prev };
                                  delete next[auction.id];
                                  return next;
                                })
                              }
                              className="text-gray-500 hover:text-white text-sm px-4 py-2 rounded-lg transition"
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
              <h2 className="text-lg font-semibold text-white mb-3">
                Finalized
                <span className="ml-2 text-sm text-gray-500 font-normal">
                  ({finalized.length})
                </span>
              </h2>
              <div className="space-y-3">
                {finalized.map((auction) => (
                  <div
                    key={auction.id}
                    className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-white text-sm font-semibold">
                        Auction #{auction.id}
                      </p>
                      <p className="text-xs font-mono text-gray-500">{auction.propertyRef}</p>
                      {auction.winner && (
                        <p className="text-xs text-gray-400 mt-1">
                          Winner: <span className="font-mono text-yellow-400">{shortAddr(auction.winner)}</span>
                          {" — "}{formatPHP(auction.winningBid)}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        auction.status === "Finalized"
                          ? "bg-green-900 text-green-400"
                          : "bg-gray-800 text-gray-400"
                      }`}>
                        {auction.status}
                      </span>
                      <Link
                        href={`/auction/${auction.id}/result`}
                        className="text-xs text-blue-400 hover:text-blue-300 transition"
                      >
                        View result &rarr;
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
