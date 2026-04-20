"use client";
import Link from "next/link";
import { useFreighter } from "@/hooks/useFreighter";

export default function Navbar() {
  const { publicKey, shortKey, connect, isLoading } = useFreighter();

  return (
    <nav className="border-b border-gray-800 bg-gray-950 px-6 py-4 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2">
        <span className="text-xl font-bold text-white">
          🔗 <span className="text-blue-400">Bid</span>Chain
        </span>
        <span className="text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded-full">
          Testnet
        </span>
      </Link>

      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="text-sm text-gray-400 hover:text-white transition"
        >
          My Bids
        </Link>

        {publicKey ? (
          <div className="flex items-center gap-2 bg-gray-800 px-3 py-1.5 rounded-lg text-sm">
            <span className="w-2 h-2 bg-green-400 rounded-full" />
            <span className="text-gray-300 font-mono">{shortKey}</span>
          </div>
        ) : (
          <button
            onClick={connect}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm px-4 py-1.5 rounded-lg transition font-medium"
          >
            {isLoading ? "Connecting..." : "Connect Freighter"}
          </button>
        )}
      </div>
    </nav>
  );
}