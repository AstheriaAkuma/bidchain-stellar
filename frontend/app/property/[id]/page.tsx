"use client";
import { properties, formatPHP } from "@/lib/mockData";
import { useFreighter } from "@/hooks/useFreighter";
import { buildPlaceBidTx, submitSignedTx, stellarExpertUrl } from "@/lib/stellar";
import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function PropertyPage() {
  const params = useParams();
  const property = properties.find((p) => p.id === Number(params.id));
  const { publicKey, connect, sign } = useFreighter();

  const [bidAmount, setBidAmount] = useState("");
  const [status, setStatus] = useState<
    "idle" | "building" | "signing" | "submitting" | "success" | "error"
  >("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!property)
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 text-center text-slate-400">
        Property not found.{" "}
        <Link href="/" className="text-[#0A3D62] underline">
          Go back
        </Link>
      </div>
    );

  async function handleBid() {
    if (!publicKey) return connect();
    if (!bidAmount || Number(bidAmount) < property!.minBid) {
      setErrorMsg(`Bid must be at least ${formatPHP(property!.minBid)}`);
      return;
    }

    setErrorMsg(null);
    try {
      setStatus("building");
      const xdr = await buildPlaceBidTx(publicKey, property!.id, Number(bidAmount));
      setStatus("signing");
      const signedXDR = await sign(xdr);
      setStatus("submitting");
      const result = await submitSignedTx(signedXDR);
      if (result.status === "ERROR") throw new Error("Transaction failed on-chain");
      setTxHash(result.hash);
      setStatus("success");
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : "Something went wrong");
      setStatus("error");
    }
  }

  const steps: Record<typeof status, string | null> = {
    idle: null,
    building: "Building transaction…",
    signing: "Waiting for Freighter signature…",
    submitting: "Submitting to Stellar testnet…",
    success: null,
    error: null,
  };

  const deadline = new Date(property.deadline);
  const isExpired = deadline < new Date();

  // ── Full-page receipt ──────────────────────────────────────────────────────
  if (status === "success" && txHash) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-lg">
          {/* Success header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-emerald-50 border-2 border-emerald-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-emerald-500">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h2 className="font-display text-3xl font-bold text-[#0A3D62] mb-1">Bid Confirmed</h2>
            <p className="text-slate-400 text-sm">Your deposit is locked in the Soroban smart contract</p>
          </div>

          {/* Receipt card */}
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-lg overflow-hidden">
            {/* Card header */}
            <div className="bg-[#0A3D62] px-8 py-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase text-white/40 tracking-[0.3em] mb-0.5">BidChain PH</p>
                <p className="text-white font-display text-lg font-bold">Transaction Receipt</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-white/70">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
            </div>

            {/* Dashed divider with circles */}
            <div className="relative flex items-center px-0">
              <div className="w-5 h-5 rounded-full bg-[#F8FAFC] border border-slate-200 -ml-2.5 shrink-0" />
              <div className="flex-1 border-t border-dashed border-slate-200 mx-1" />
              <div className="w-5 h-5 rounded-full bg-[#F8FAFC] border border-slate-200 -mr-2.5 shrink-0" />
            </div>

            {/* Receipt rows */}
            <div className="px-8 py-6 space-y-3">
              <div className="flex justify-between items-center bg-slate-50 px-4 py-3.5 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Property</span>
                <span className="text-sm font-bold text-slate-900 truncate max-w-[220px] text-right">{property.title}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 px-4 py-3.5 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reference</span>
                <span className="text-xs font-mono text-slate-600">{property.ref}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 px-4 py-3.5 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Your Bid</span>
                <span className="text-base font-mono font-bold text-[#0A3D62]">{formatPHP(Number(bidAmount))}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 px-4 py-3.5 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Deposit Locked</span>
                <span className="text-base font-mono font-bold text-emerald-600">{formatPHP(property.deposit)}</span>
              </div>
              <div className="flex justify-between items-center px-4 py-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ledger Status</span>
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  Confirmed
                </span>
              </div>
            </div>

            {/* Dashed divider */}
            <div className="relative flex items-center px-0">
              <div className="w-5 h-5 rounded-full bg-[#F8FAFC] border border-slate-200 -ml-2.5 shrink-0" />
              <div className="flex-1 border-t border-dashed border-slate-200 mx-1" />
              <div className="w-5 h-5 rounded-full bg-[#F8FAFC] border border-slate-200 -mr-2.5 shrink-0" />
            </div>

            {/* TX hash */}
            <div className="px-8 py-5">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Transaction ID</p>
              <p className="text-xs font-mono text-slate-500 break-all leading-relaxed bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100">
                {txHash}
              </p>
            </div>

            {/* Actions */}
            <div className="px-8 pb-8 space-y-3">
              <a
                href={stellarExpertUrl(txHash)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-[#0A3D62] text-white py-3.5 rounded-xl text-sm font-semibold hover:opacity-90 transition"
              >
                View on Stellar Expert →
              </a>
              <p className="text-[10px] text-slate-400 text-center">
                Permanently recorded on Stellar testnet · verifiable by anyone
              </p>
            </div>
          </div>

          {/* Place another bid */}
          <button
            onClick={() => { setStatus("idle"); setTxHash(null); setBidAmount(""); }}
            className="w-full mt-4 border border-slate-200 text-slate-500 py-3 rounded-xl text-sm hover:border-slate-300 hover:text-slate-700 transition"
          >
            ← Place another bid
          </button>
        </div>
      </div>
    );
  }

  // ── Main property page ─────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <Link
        href="/"
        className="text-sm text-slate-500 hover:text-[#0A3D62] transition mb-6 inline-block"
      >
        ← Back to listings
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left col: property info (3/5) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Image */}
          <div className="relative rounded-2xl overflow-hidden">
            <img
              src={property.image}
              alt={property.title}
              className="w-full h-72 object-cover"
            />
            <div className="absolute top-4 left-4">
              <span className="bg-white/95 text-[#0A3D62] text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
                {property.bank}
              </span>
            </div>
            <div className="absolute top-4 right-4">
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm ${
                  property.status === "open"
                    ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                    : "bg-slate-100 text-slate-500 border border-slate-200"
                }`}
              >
                {property.status === "open" ? "● Active" : "● Closed"}
              </span>
            </div>
          </div>

          {/* Title block */}
          <div>
            <p className="text-xs font-mono text-slate-400 tracking-wide mb-1">
              {property.ref}
            </p>
            <h1 className="font-display text-4xl font-bold text-[#0A3D62] leading-tight mb-2">
              {property.title}
            </h1>
            <p className="text-slate-500 flex items-center gap-1">
              <span>📍</span> {property.location}
            </p>
          </div>

          {/* Auction countdown */}
          <div
            className={`rounded-xl p-4 border flex items-center gap-3 ${
              isExpired
                ? "bg-slate-50 border-slate-200"
                : "bg-[#0A3D62]/5 border-[#0A3D62]/20"
            }`}
          >
            <span className="text-2xl">{isExpired ? "🔒" : "⏳"}</span>
            <div>
              <p
                className={`text-xs font-semibold uppercase tracking-wide mb-0.5 ${
                  isExpired ? "text-slate-400" : "text-[#0A3D62]"
                }`}
              >
                {isExpired ? "Auction Closed" : "Auction Closes"}
              </p>
              <p className="text-slate-700 font-medium">
                {deadline.toLocaleString("en-PH", {
                  dateStyle: "long",
                  timeStyle: "short",
                })}
              </p>
            </div>
          </div>

          {/* Property details */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Property Details
              </p>
            </div>
            <div className="p-5 space-y-3 text-sm">
              {[
                ["Institution", property.bank],
                ["Property Type", property.type],
                ["Reference No.", property.ref],
                [
                  "Auction Deadline",
                  deadline.toLocaleString("en-PH", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }),
                ],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between items-center py-1.5 border-b border-slate-50 last:border-0">
                  <span className="text-slate-500">{label}</span>
                  <span className="text-slate-800 font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Escrow explanation */}
          <div className="bg-[#0A3D62]/5 border border-[#0A3D62]/15 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-0.5">🔐</span>
              <div>
                <p className="font-semibold text-[#0A3D62] mb-1">
                  How Escrow Works
                </p>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Your deposit of{" "}
                  <strong className="text-[#0A3D62]">
                    {formatPHP(property.deposit)}
                  </strong>{" "}
                  is locked in a Soroban smart contract on the Stellar blockchain.
                  If you lose the auction, your deposit is refunded automatically.
                  No bank transfers. No committees. Fully transparent.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right col: bid panel (2/5) */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 sticky top-24">
            {/* Price header */}
            <div className="mb-6 pb-5 border-b border-slate-100">
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">
                Minimum Bid
              </p>
              <p className="font-display text-4xl font-bold text-[#C4A484]">
                {formatPHP(property.minBid)}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Deposit required:{" "}
                <span className="font-semibold text-slate-700">
                  {formatPHP(property.deposit)}
                </span>
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Your Sealed Bid (PHP)
                </label>
                <input
                  type="number"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  placeholder={property.minBid.toString()}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0A3D62]/30 focus:border-[#0A3D62] text-base"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Minimum: {formatPHP(property.minBid)}
                </p>
              </div>

              {/* Bid summary */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-2.5 text-sm border border-slate-100">
                <div className="flex justify-between text-slate-500">
                  <span>Bid amount</span>
                  <span className="font-medium text-slate-700">
                    {bidAmount ? formatPHP(Number(bidAmount)) : "—"}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Deposit locked in escrow</span>
                  <span className="font-medium text-[#C4A484]">
                    {formatPHP(property.deposit)}
                  </span>
                </div>
                <div className="border-t border-slate-200 pt-2.5 flex justify-between font-semibold text-slate-800">
                  <span>You pay now</span>
                  <span>{formatPHP(property.deposit)}</span>
                </div>
              </div>

              {errorMsg && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-sm text-red-600">
                  {errorMsg}
                </div>
              )}

              {steps[status] && (
                <div className="flex items-center gap-2 justify-center text-sm text-[#0A3D62] bg-[#0A3D62]/5 rounded-lg py-2">
                  <span className="w-4 h-4 border-2 border-[#0A3D62] border-t-transparent rounded-full animate-spin" />
                  {steps[status]}
                </div>
              )}

              <button
                onClick={handleBid}
                disabled={status !== "idle" && status !== "error"}
                className="w-full bg-[#0A3D62] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-semibold text-base transition"
              >
                {!publicKey
                  ? "Connect Wallet to Bid"
                  : status === "idle" || status === "error"
                  ? "Place Bid & Lock Deposit"
                  : "Processing…"}
              </button>

              <p className="text-xs text-slate-400 text-center">
                Freighter will prompt you to sign. No funds leave your wallet until you confirm.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
