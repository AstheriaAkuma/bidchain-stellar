"use client";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { properties, formatPHP } from "@/lib/mockData";
import { stellarExpertUrl } from "@/lib/stellar";

// Mock auction result data
const auctionResults: Record<number, {
  winner: { address: string; bidAmount: number; txHash: string };
  losers: { address: string; bidAmount: number; txHash: string; refundTxHash: string }[];
  finalizedAt: string;
  finalizeTxHash: string;
}> = {
  1: {
    winner: {
      address: "GCQE6VIAV2IDBUMFG77SHROBD2TBO5GOB4RP7H3TPWONQCKAJJKTZERP",
      bidAmount: 950000,
      txHash: "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
    },
    losers: [
      {
        address: "GBXGQJWRYGHM4EQMKZOON67RFYKZEQTQZQZQZQZQZQZQZQZQZQZQZQZ",
        bidAmount: 820000,
        txHash: "b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3",
        refundTxHash: "c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4",
      },
      {
        address: "GDQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZ",
        bidAmount: 810000,
        txHash: "d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5",
        refundTxHash: "e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6",
      },
    ],
    finalizedAt: "2025-05-01T11:32:00",
    finalizeTxHash: "f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1",
  },
  2: {
    winner: {
      address: "GBZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZA",
      bidAmount: 1400000,
      txHash: "1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b",
    },
    losers: [
      {
        address: "GCQE6VIAV2IDBUMFG77SHROBD2TBO5GOB4RP7H3TPWONQCKAJJKTZERP",
        bidAmount: 1300000,
        txHash: "2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c",
        refundTxHash: "3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d",
      },
    ],
    finalizedAt: "2025-05-03T15:14:00",
    finalizeTxHash: "4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e",
  },
};

function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function RefundTimer() {
  const [seconds, setSeconds] = useState(3);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (seconds <= 0) { setDone(true); return; }
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  if (done) {
    return (
      <span className="text-green-400 font-semibold text-xs">
        ✅ Refunded instantly
      </span>
    );
  }
  return (
    <span className="text-yellow-400 text-xs animate-pulse">
      ⏳ Refunding in {seconds}s...
    </span>
  );
}

export default function AuctionResultPage() {
  const params = useParams();
  const id = Number(params.id);
  const property = properties.find((p) => p.id === id);
  const result = auctionResults[id];
  const [revealed, setRevealed] = useState(false);
  const [showRefunds, setShowRefunds] = useState(false);

  if (!property || !result) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 text-center text-gray-400">
        No result found for this auction.{" "}
        <Link href="/" className="text-blue-400 underline">Go back</Link>
      </div>
    );
  }

  function handleReveal() {
    setRevealed(true);
    setTimeout(() => setShowRefunds(true), 1500);
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">

      {/* Header */}
      <div className="mb-8">
        <Link href="/" className="text-sm text-gray-500 hover:text-white transition">
          &larr; Back to listings
        </Link>
        <h1 className="text-2xl font-bold text-white mt-3">Auction Result</h1>
        <p className="text-gray-400 text-sm mt-1">
          {property.title} &mdash; {property.location}
        </p>
        <p className="text-xs text-gray-600 font-mono mt-1">{property.ref}</p>
      </div>

      {/* The old way vs BidChain way */}
      {!revealed && (
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-red-950 border border-red-800 rounded-xl p-4 text-sm">
            <p className="font-semibold text-red-400 mb-2">❌ Old Way (Banks)</p>
            <ul className="text-red-300 space-y-1 text-xs">
              <li>Closed-door committee</li>
              <li>No public record</li>
              <li>Refund takes 2&ndash;4 weeks</li>
              <li>Money frozen = liquidity trap</li>
            </ul>
          </div>
          <div className="bg-green-950 border border-green-800 rounded-xl p-4 text-sm">
            <p className="font-semibold text-green-400 mb-2">✅ BidChain Way</p>
            <ul className="text-green-300 space-y-1 text-xs">
              <li>Results on public ledger</li>
              <li>Anyone can verify</li>
              <li>Losers refunded in seconds</li>
              <li>Zero liquidity trap</li>
            </ul>
          </div>
        </div>
      )}

      {/* Reveal button */}
      {!revealed ? (
        <div className="text-center py-12 bg-gray-900 border border-gray-800 rounded-xl">
          <p className="text-gray-400 mb-2 text-sm">Auction closed at</p>
          <p className="text-white font-medium mb-6">
            {new Date(result.finalizedAt).toLocaleString("en-PH")}
          </p>
          <button
            onClick={handleReveal}
            className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-semibold text-lg transition"
          >
            🔓 Reveal Result
          </button>
          <p className="text-xs text-gray-600 mt-3">
            Result recorded on-chain &mdash; no committee, no manipulation
          </p>
        </div>
      ) : (
        <div className="space-y-6">

          {/* Winner */}
          <div className="bg-yellow-950 border-2 border-yellow-500 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">🏆</span>
              <div>
                <p className="text-yellow-400 font-bold text-lg">Winner</p>
                <p className="text-xs text-yellow-600">
                  Declared on Stellar ledger &mdash;{" "}
                  {new Date(result.finalizedAt).toLocaleString("en-PH")}
                </p>
              </div>
            </div>

            <div className="bg-yellow-900/40 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-yellow-600">Address</span>
                <span className="text-yellow-300 font-mono">
                  {shortAddr(result.winner.address)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-yellow-600">Winning bid</span>
                <span className="text-yellow-300 font-bold">
                  {formatPHP(result.winner.bidAmount)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-yellow-600">Bid transaction</span>
                <a
                  href={stellarExpertUrl(result.winner.txHash)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-xs font-mono transition"
                >
                  {shortAddr(result.winner.txHash)} &rarr;
                </a>
              </div>
            </div>

            {/* Purchase token */}
            <div className="mt-4 bg-yellow-900/20 border border-yellow-700 rounded-lg p-3 text-xs">
              <p className="text-yellow-400 font-medium mb-1">
                🪙 Right-to-Purchase Token Issued
              </p>
              <p className="text-yellow-600">
                Winner receives a Stellar asset as their digital certificate.
                This bridges the on-chain result with the real-world PAG-IBIG
                transfer process.
              </p>
            </div>
          </div>

          {/* Losing bidders + refunds */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-white font-semibold">
                Losing Bidders &mdash; Instant Refunds
              </p>
              <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded-full">
                {result.losers.length} bidder{result.losers.length > 1 ? "s" : ""}
              </span>
            </div>

            <div className="space-y-3">
              {result.losers.map((loser, i) => (
                <div
                  key={i}
                  className="bg-gray-800 rounded-lg p-4 text-sm"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-gray-300 font-mono text-xs">
                        {shortAddr(loser.address)}
                      </p>
                      <p className="text-gray-500 text-xs mt-0.5">
                        Bid: {formatPHP(loser.bidAmount)}
                      </p>
                    </div>
                    {showRefunds ? (
                      <RefundTimer />
                    ) : (
                      <span className="text-gray-600 text-xs">Pending...</span>
                    )}
                  </div>
                  <div className="flex gap-4 mt-2">
                    <a
                      href={stellarExpertUrl(loser.txHash)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-gray-500 hover:text-blue-400 transition"
                    >
                      Bid tx &rarr;
                    </a>
                    <a
                      href={stellarExpertUrl(loser.refundTxHash)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-gray-500 hover:text-green-400 transition"
                    >
                      Refund tx &rarr;
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 border-t border-gray-800 pt-4 text-xs text-gray-500">
              No bank. No committee. No 4-week wait.
              Deposits released by smart contract the moment the auction closed.
            </div>
          </div>

          {/* Finalize transaction proof */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-sm">
            <p className="text-gray-400 font-medium mb-2">📡 On-Chain Proof</p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Contract</span>
                <a
                  href={`https://stellar.expert/explorer/testnet/contract/${process.env.NEXT_PUBLIC_CONTRACT_ID}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-400 font-mono hover:text-blue-300 transition"
                >
                  {shortAddr(process.env.NEXT_PUBLIC_CONTRACT_ID ?? "")} &rarr;
                </a>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Finalize transaction</span>
                <a
                  href={stellarExpertUrl(result.finalizeTxHash)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-400 font-mono hover:text-blue-300 transition"
                >
                  {shortAddr(result.finalizeTxHash)} &rarr;
                </a>
              </div>
            </div>
          </div>

          {/* CTA */}
          <Link
            href="/"
            className="block text-center bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-semibold transition"
          >
            Browse More Properties
          </Link>
        </div>
      )}
    </div>
  );
}