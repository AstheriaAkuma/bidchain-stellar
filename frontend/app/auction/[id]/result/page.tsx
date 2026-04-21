"use client";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { properties, formatPHP } from "@/lib/mockData";
import { stellarExpertUrl, getAuction, getUserBid, AuctionData, BidData } from "@/lib/stellar";
import { useFreighter } from "@/hooks/useFreighter";

function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function StatusBadge({ status }: { status: AuctionData["status"] }) {
  const styles: Record<AuctionData["status"], string> = {
    Open: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    Closed: "bg-orange-50 text-orange-600 border border-orange-200",
    Finalized: "bg-[#0A3D62]/8 text-[#0A3D62] border border-[#0A3D62]/20",
    Cancelled: "bg-slate-100 text-slate-500 border border-slate-200",
  };
  return (
    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${styles[status]}`}>
      {status}
    </span>
  );
}

export default function AuctionResultPage() {
  const params = useParams();
  const id = Number(params.id);
  const property = properties.find((p) => p.id === id);
  const { publicKey } = useFreighter();

  const [auction, setAuction] = useState<AuctionData | null>(null);
  const [userBid, setUserBid] = useState<BidData | null>(null);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    getAuction(id).then((a) => {
      setAuction(a);
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    if (publicKey && auction) {
      getUserBid(id, publicKey).then(setUserBid);
    }
  }, [id, publicKey, auction]);

  if (!property) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 text-center text-slate-400">
        No property found.{" "}
        <Link href="/" className="text-[#0A3D62] underline">Go back</Link>
      </div>
    );
  }

  const isUserWinner =
    publicKey && auction?.winner
      ? auction.winner.toLowerCase() === publicKey.toLowerCase()
      : false;

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">

      {/* Header */}
      <Link
        href="/"
        className="text-sm text-slate-500 hover:text-[#0A3D62] transition mb-6 inline-block"
      >
        ← Back to listings
      </Link>

      <div className="flex items-start gap-3 mb-2">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-display text-4xl font-bold text-[#0A3D62]">Auction Result</h1>
            {auction && <StatusBadge status={auction.status} />}
          </div>
          <p className="text-slate-500 text-sm">
            {property.title} — {property.location}
          </p>
          <p className="text-xs text-slate-300 font-mono mt-0.5">{property.ref}</p>
        </div>
      </div>

      <div className="mt-8">
        {loading ? (
          <div className="text-center py-16 text-slate-400 animate-pulse text-sm">
            Querying Soroban contract…
          </div>
        ) : auction === null ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center shadow-sm">
            <div className="text-4xl mb-4">📭</div>
            <p className="text-slate-700 font-semibold mb-2">No on-chain auction found</p>
            <p className="text-slate-500 text-sm mb-4">
              This auction hasn&apos;t been created in the smart contract yet. An admin needs to call{" "}
              <code className="text-[#0A3D62] bg-[#0A3D62]/5 px-1 rounded">create_auction</code> and{" "}
              <code className="text-[#0A3D62] bg-[#0A3D62]/5 px-1 rounded">finalize_auction</code> for results to appear here.
            </p>
            <a
              href={`https://stellar.expert/explorer/testnet/contract/${process.env.NEXT_PUBLIC_CONTRACT_ID}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-[#0A3D62] hover:opacity-70 transition"
            >
              View contract on Stellar Expert →
            </a>
          </div>
        ) : !revealed ? (
          <div className="space-y-6">
            {/* Advantages Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-2xl bg-[#0A3D62] text-white p-5">
                <div className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-[#C4A484]">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <h3 className="font-bold text-xs uppercase tracking-widest mb-2 opacity-60">Digital Escrow</h3>
                <p className="text-xs text-white/60 leading-relaxed">Immutable bid ledger records every submission. Sealed in a Soroban smart contract until opening day.</p>
              </div>
              <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
                <div className="w-9 h-9 bg-blue-50 rounded-full flex items-center justify-center mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-[#0A3D62]">
                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <h3 className="font-bold text-xs uppercase tracking-widest mb-2 text-slate-400">Public Ledger</h3>
                <p className="text-xs text-slate-500 leading-relaxed">No human override. Smart contracts enforce all auction rules automatically. Anyone can verify on Stellar.</p>
              </div>
              <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
                <div className="w-9 h-9 bg-emerald-50 rounded-full flex items-center justify-center mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-emerald-600">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <h3 className="font-bold text-xs uppercase tracking-widest mb-2 text-slate-400">Instant Release</h3>
                <p className="text-xs text-slate-500 leading-relaxed">Funds are auto-returned to losing bidders the moment a winner is officially declared on-chain.</p>
              </div>
            </div>

            {/* Reveal / status card */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-10 text-center">
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-3">Auction status</p>
              <div className="mb-5">
                <StatusBadge status={auction.status} />
              </div>
              {auction.status === "Open" ? (
                <>
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-emerald-600 text-sm font-semibold">Bidding is still in progress</span>
                  </div>
                  <p className="text-slate-500 text-sm mb-2">
                    {auction.bidCount} bid{auction.bidCount !== 1 ? "s" : ""} recorded so far
                  </p>
                  <p className="text-xs text-slate-400">
                    Results will be revealed here once the auction is closed and finalized by the admin.
                  </p>
                </>
              ) : auction.status === "Finalized" ? (
                <>
                  <p className="text-slate-500 text-sm mb-8">
                    {auction.bidCount} bid{auction.bidCount !== 1 ? "s" : ""} recorded on-chain
                  </p>
                  <button
                    onClick={() => setRevealed(true)}
                    className="bg-[#0A3D62] hover:opacity-90 text-white px-10 py-3.5 rounded-xl font-semibold text-base transition"
                  >
                    🔓 Reveal Result
                  </button>
                  <p className="text-xs text-slate-400 mt-3">
                    Result recorded on-chain — no committee, no manipulation
                  </p>
                </>
              ) : (
                <p className="text-slate-500 text-sm mt-2">
                  Results will appear here once the admin finalizes the auction.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">

            {/* Winner card */}
            <div className="bg-white border-2 border-[#C4A484] rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <span className="text-3xl">🏆</span>
                <div>
                  <p className="text-[#0A3D62] font-bold text-lg font-display">
                    Winner{" "}
                    {isUserWinner && (
                      <span className="text-[#C4A484]">— That&apos;s you!</span>
                    )}
                  </p>
                  <p className="text-xs text-slate-400">
                    Declared on Stellar ledger — verifiable by anyone
                  </p>
                </div>
              </div>

              <div className="bg-[#C4A484]/8 border border-[#C4A484]/25 rounded-lg p-4 space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Address</span>
                  <a
                    href={`https://stellar.expert/explorer/testnet/account/${auction.winner}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#0A3D62] font-mono hover:opacity-70 transition"
                  >
                    {shortAddr(auction.winner!)}
                  </a>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Winning bid</span>
                  <span className="text-[#C4A484] font-bold text-base">
                    {formatPHP(auction.winningBid)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Total bidders</span>
                  <span className="text-slate-700 font-medium">{auction.bidCount}</span>
                </div>
              </div>

              <div className="mt-4 bg-[#0A3D62]/5 border border-[#0A3D62]/15 rounded-lg p-3 text-xs">
                <p className="text-[#0A3D62] font-semibold mb-1">
                  🪙 Right-to-Purchase Token Issued
                </p>
                <p className="text-slate-500">
                  Winner receives a Stellar asset as their digital certificate.
                  This bridges the on-chain result with the real-world PAG-IBIG transfer process.
                </p>
              </div>
            </div>

            {/* User bid status */}
            {publicKey && (
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <p className="font-semibold text-slate-700 mb-4">Your Bid Status</p>
                {userBid ? (
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-slate-500">Your bid amount</span>
                      <span className="text-slate-800 font-medium">{formatPHP(userBid.amount)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-slate-500">Deposit</span>
                      <span className="text-slate-700">{formatPHP(userBid.deposit)}</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5">
                      <span className="text-slate-500">Outcome</span>
                      {isUserWinner ? (
                        <span className="text-[#C4A484] font-semibold">🏆 You won!</span>
                      ) : userBid.refunded ? (
                        <span className="text-emerald-600 font-semibold">✅ Deposit refunded</span>
                      ) : (
                        <span className="text-orange-500 font-semibold">⏳ Refund pending</span>
                      )}
                    </div>
                    {!isUserWinner && !userBid.refunded && (
                      <p className="text-xs text-slate-400 pt-1">
                        Go to My Bids to claim your deposit refund.
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm">
                    You did not place a bid on this auction through the smart contract.
                  </p>
                )}
              </div>
            )}

            {/* On-chain proof */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <p className="text-slate-600 font-semibold text-sm mb-4">📡 On-Chain Proof</p>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                  <span className="text-slate-400">Contract</span>
                  <a
                    href={`https://stellar.expert/explorer/testnet/contract/${process.env.NEXT_PUBLIC_CONTRACT_ID}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#0A3D62] font-mono hover:opacity-70 transition"
                  >
                    {shortAddr(process.env.NEXT_PUBLIC_CONTRACT_ID ?? "")} →
                  </a>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                  <span className="text-slate-400">Winner address</span>
                  <a
                    href={`https://stellar.expert/explorer/testnet/account/${auction.winner}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#0A3D62] font-mono hover:opacity-70 transition"
                  >
                    {shortAddr(auction.winner!)} →
                  </a>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-slate-400">Bids recorded</span>
                  <span className="text-slate-700 font-medium">{auction.bidCount}</span>
                </div>
              </div>
            </div>

            <Link
              href="/"
              className="block text-center bg-[#0A3D62] hover:opacity-90 text-white py-3.5 rounded-xl font-semibold transition"
            >
              Browse More Properties
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
