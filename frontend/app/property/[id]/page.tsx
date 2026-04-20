"use client";
import { properties, formatPHP } from "@/lib/mockData";
import { useFreighter } from "@/hooks/useFreighter";
import { buildPlaceBidTx, submitSignedTx, stellarExpertUrl } from "@/lib/stellar";
import { useState } from "react";
import { useParams } from "next/navigation";

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

  if (!property) return <div className="p-12 text-gray-400">Property not found.</div>;

  async function handleBid() {
    if (!publicKey) return connect();
    if (!bidAmount || Number(bidAmount) < property!.minBid) {
      setErrorMsg(`Bid must be at least ${formatPHP(property!.minBid)}`);
      return;
    }

    setErrorMsg(null);

    try {
      // 1. Build
      setStatus("building");
      const xdr = await buildPlaceBidTx(
        publicKey,
        property!.id,
        Number(bidAmount)
      );

      // 2. Sign via Freighter
      setStatus("signing");
      const signedXDR = await sign(xdr);

      // 3. Submit
      setStatus("submitting");
      const result = await submitSignedTx(signedXDR);

      if (result.status === "ERROR") {
        throw new Error("Transaction failed on-chain");
      }

      setTxHash(result.hash);
      setStatus("success");
    } catch (e: any) {
      setErrorMsg(e.message || "Something went wrong");
      setStatus("error");
    }
  }

  const statusLabels = {
    idle: null,
    building: "⚙️ Building transaction...",
    signing: "✍️ Waiting for Freighter signature...",
    submitting: "📡 Submitting to Stellar testnet...",
    success: null,
    error: null,
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left: Property Info */}
        <div>
          <img
            src={property.image}
            alt={property.title}
            className="w-full h-56 object-cover rounded-xl mb-4"
          />
          <span className="text-xs font-mono text-gray-500">{property.ref}</span>
          <h1 className="text-2xl font-bold text-white mt-1 mb-1">
            {property.title}
          </h1>
          <p className="text-gray-400 mb-4">📍 {property.location}</p>

          <div className="bg-gray-900 rounded-xl p-4 space-y-3 text-sm">
            {[
              ["Bank", property.bank],
              ["Type", property.type],
              ["Minimum Bid", formatPHP(property.minBid)],
              ["Required Deposit", formatPHP(property.deposit)],
              ["Deadline", new Date(property.deadline).toLocaleString("en-PH")],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <span className="text-gray-500">{label}</span>
                <span className="text-white font-medium">{value}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 bg-blue-950 border border-blue-800 rounded-xl p-4 text-sm text-blue-300">
            <p className="font-medium mb-1">🔐 How escrow works</p>
            <p className="text-blue-400 text-xs">
              Your deposit of {formatPHP(property.deposit)} is locked in a
              Soroban smart contract. If you lose, it's refunded automatically.
              No bank. No committee.
            </p>
          </div>
        </div>

        {/* Right: Bid Form */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-6">
            Place Your Bid
          </h2>

          {status === "success" && txHash ? (
            <div className="space-y-4">
              <div className="bg-green-950 border border-green-700 rounded-xl p-4">
                <p className="text-green-400 font-semibold text-sm mb-1">
                  ✅ Bid locked on Stellar!
                </p>
                <p className="text-xs text-green-600 font-mono break-all">
                  {txHash}
                </p>
              </div>
              <a
                href={stellarExpertUrl(txHash)}
                target="_blank"
                rel="noreferrer"
                className="block text-center bg-blue-700 hover:bg-blue-600 text-white py-2 rounded-lg text-sm transition"
              >
                🔍 View on Stellar Expert →
              </a>
              <p className="text-xs text-gray-500 text-center">
                This transaction is now permanent on the Stellar testnet ledger.
                Anyone can verify it.
              </p>
              <button
                onClick={() => { setStatus("idle"); setTxHash(null); setBidAmount(""); }}
                className="w-full border border-gray-700 text-gray-400 py-2 rounded-lg text-sm hover:text-white transition"
              >
                Place another bid
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">
                  Your Bid Amount (PHP)
                </label>
                <input
                  type="number"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  placeholder={property.minBid.toString()}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 text-sm"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Min: {formatPHP(property.minBid)}
                </p>
              </div>

              <div className="bg-gray-800 rounded-lg p-3 text-sm space-y-1">
                <div className="flex justify-between text-gray-400">
                  <span>Bid amount</span>
                  <span>{bidAmount ? formatPHP(Number(bidAmount)) : "—"}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Deposit locked</span>
                  <span className="text-yellow-400">
                    {formatPHP(property.deposit)}
                  </span>
                </div>
                <div className="border-t border-gray-700 pt-1 flex justify-between text-white font-medium">
                  <span>You pay now</span>
                  <span>{formatPHP(property.deposit)}</span>
                </div>
              </div>

              {errorMsg && (
                <p className="text-red-400 text-xs bg-red-950 border border-red-800 rounded-lg px-3 py-2">
                  {errorMsg}
                </p>
              )}

              {statusLabels[status] && (
                <p className="text-blue-400 text-xs text-center animate-pulse">
                  {statusLabels[status]}
                </p>
              )}

              <button
                onClick={handleBid}
                disabled={status !== "idle" && status !== "error"}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition"
              >
                {!publicKey
                  ? "Connect Wallet to Bid"
                  : status === "idle" || status === "error"
                  ? "Place Bid & Lock Deposit"
                  : "Processing..."}
              </button>

              <p className="text-xs text-gray-600 text-center">
                Freighter will prompt you to sign. No funds leave your wallet
                until you confirm.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}