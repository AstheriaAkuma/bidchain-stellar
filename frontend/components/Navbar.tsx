"use client";
import Link from "next/link";
import { useFreighter } from "@/hooks/useFreighter";
import { getWalletBalance } from "@/lib/stellar";
import { useState, useEffect } from "react";

export default function Navbar() {
  const { publicKey, shortKey, connect, isLoading } = useFreighter();
  const [balance, setBalance] = useState<string | null>(null);

  useEffect(() => {
    if (!publicKey) return;
    getWalletBalance(publicKey).then(setBalance);
  }, [publicKey]);

  return (
    <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">

        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-[#0A3D62] flex items-center justify-center select-none shrink-0">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Pediment */}
              <path d="M12 2L22 8H2L12 2Z" fill="white" fillOpacity="0.95"/>
              {/* Entablature */}
              <rect x="2" y="8" width="20" height="2.5" rx="0.4" fill="white" fillOpacity="0.85"/>
              {/* Columns */}
              <rect x="3.5" y="10.5" width="2.5" height="5.5" rx="0.3" fill="white" fillOpacity="0.7"/>
              <rect x="8.5" y="10.5" width="2.5" height="5.5" rx="0.3" fill="white" fillOpacity="0.7"/>
              <rect x="13" y="10.5" width="2.5" height="5.5" rx="0.3" fill="white" fillOpacity="0.7"/>
              <rect x="18" y="10.5" width="2.5" height="5.5" rx="0.3" fill="white" fillOpacity="0.7"/>
              {/* Stylobate (base steps) */}
              <rect x="1.5" y="16" width="21" height="2" rx="0.3" fill="white" fillOpacity="0.85"/>
              <rect x="0.5" y="18" width="23" height="2" rx="0.3" fill="white"/>
            </svg>
          </div>
          <div className="leading-none">
            <div className="font-display font-bold text-[#0A3D62] text-lg tracking-wide">
              BIDCHAIN PH
            </div>
            <div className="text-[10px] font-semibold text-[#C4A484] uppercase tracking-[0.15em]">
              ROPA Portal
            </div>
          </div>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link
            href="/"
            className="text-slate-600 hover:text-[#0A3D62] transition"
          >
            Auctions
          </Link>
          <Link
            href="/dashboard"
            className="text-slate-600 hover:text-[#0A3D62] transition"
          >
            My Bids
          </Link>
          <span className="text-slate-300">|</span>
          <span className="text-slate-400 cursor-default text-xs bg-slate-100 px-2 py-0.5 rounded">
            Testnet
          </span>
        </div>

        {/* Right: balance + wallet */}
        <div className="flex items-center gap-4 shrink-0">
          {publicKey && balance && (
            <div className="hidden sm:block text-right">
              <p className="text-[11px] text-slate-400 uppercase tracking-wide font-medium">
                Escrow Balance
              </p>
              <p className="text-sm font-semibold text-[#0A3D62]">
                {balance} XLM
              </p>
            </div>
          )}

          {publicKey ? (
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
              <div className="w-7 h-7 rounded-full bg-[#0A3D62] flex items-center justify-center text-white text-xs font-bold select-none">
                {shortKey?.slice(0, 2).toUpperCase()}
              </div>
              <span className="font-mono text-sm text-slate-700">{shortKey}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </div>
          ) : (
            <button
              onClick={connect}
              disabled={isLoading}
              className="bg-[#0A3D62] hover:opacity-90 disabled:opacity-50 text-white text-sm px-5 py-2 rounded-lg font-semibold transition"
            >
              {isLoading ? "Connecting…" : "Connect Wallet"}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
