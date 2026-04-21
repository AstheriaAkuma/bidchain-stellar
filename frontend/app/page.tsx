"use client";
import Link from "next/link";
import { useState } from "react";
import { properties, formatPHP } from "@/lib/mockData";

function IconLock({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function IconClock({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function IconSearch({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");

  const query = searchQuery.toLowerCase();
  const allOpen = properties.filter((p) => p.status === "open");
  const allClosed = properties.filter((p) => p.status === "closed");

  const open = allOpen.filter(
    (p) =>
      !query ||
      p.title.toLowerCase().includes(query) ||
      p.ref.toLowerCase().includes(query) ||
      p.bank.toLowerCase().includes(query) ||
      p.location.toLowerCase().includes(query)
  );
  const closed = allClosed.filter(
    (p) =>
      !query ||
      p.title.toLowerCase().includes(query) ||
      p.ref.toLowerCase().includes(query) ||
      p.bank.toLowerCase().includes(query) ||
      p.location.toLowerCase().includes(query)
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">

      {/* Hero */}
      <div className="mb-14 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-[#0A3D62]/5 border border-[#0A3D62]/20 text-[#0A3D62] text-xs font-semibold px-3 py-1 rounded-full mb-6 uppercase tracking-wide">
          🏦 Bank Foreclosed Properties · Stellar Blockchain Escrow
        </div>
        <h1 className="font-display text-5xl md:text-6xl text-[#0A3D62] font-bold leading-tight mb-5">
          Transparent Property<br />Auctions, On-Chain.
        </h1>
        <p className="text-slate-500 text-lg leading-relaxed mb-10">
          No manager&apos;s checks. No frozen funds. Place your deposit in a Soroban smart contract — refunded instantly if you lose. Verifiable by anyone on the Stellar ledger.
        </p>

        {/* Advantages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-3xl mx-auto">
          <div className="rounded-2xl bg-[#0A3D62] text-white p-6 text-left">
            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center mb-4">
              <IconLock className="text-[#C4A484] w-5 h-5" />
            </div>
            <h3 className="font-bold text-xs uppercase tracking-widest mb-2 opacity-60">Digital Escrow</h3>
            <p className="text-xs text-white/60 leading-relaxed">Immutable bid ledger records every submission. Sealed in a Soroban smart contract until opening day.</p>
          </div>
          <div className="rounded-2xl bg-white border border-slate-200 p-6 text-left shadow-sm">
            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center mb-4">
              <IconClock className="text-[#0A3D62] w-5 h-5" />
            </div>
            <h3 className="font-bold text-xs uppercase tracking-widest mb-2 text-slate-400">Public Ledger</h3>
            <p className="text-xs text-slate-500 leading-relaxed">No human override. Smart contracts enforce all auction rules automatically. Anyone can verify on Stellar.</p>
          </div>
          <div className="rounded-2xl bg-white border border-slate-200 p-6 text-left shadow-sm">
            <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
              <IconCheck className="text-emerald-600 w-5 h-5" />
            </div>
            <h3 className="font-bold text-xs uppercase tracking-widest mb-2 text-slate-400">Instant Release</h3>
            <p className="text-xs text-slate-500 leading-relaxed">Funds are auto-returned to losing bidders the moment a winner is officially declared on-chain.</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-10">
        <div className="relative group">
          <IconSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by property name, ROPA reference, or bank…"
            className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white border border-slate-200 focus:border-[#0A3D62] focus:ring-4 focus:ring-[#0A3D62]/10 transition-all outline-none text-slate-800 placeholder-slate-400 font-medium shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition text-lg leading-none"
            >
              ×
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="text-xs text-slate-400 mt-2 ml-1">
            {open.length + closed.length} result{open.length + closed.length !== 1 ? "s" : ""} for &ldquo;{searchQuery}&rdquo;
          </p>
        )}
      </div>

      {/* Active Auctions */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-300" />
          <h2 className="font-display text-3xl text-[#0A3D62] font-bold">Active Auctions</h2>
          <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200">
            {open.length} open
          </span>
        </div>

        {open.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400 text-sm">
            {searchQuery ? `No active auctions match "${searchQuery}".` : "No active auctions at this time."}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {open.map((property) => (
              <div key={property.id} className="flex flex-col gap-2">
                <PropertyCard property={property} />
                <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-600 border border-emerald-200 bg-emerald-50 rounded-lg py-2 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Bidding Open
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Closed Auctions */}
      {(closed.length > 0 || (searchQuery && allClosed.length > 0)) && (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
            <h2 className="font-display text-3xl text-slate-400 font-bold">Closed Auctions</h2>
          </div>
          {closed.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400 text-sm opacity-60">
              No closed auctions match &ldquo;{searchQuery}&rdquo;.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-75">
              {closed.map((property) => (
                <div key={property.id} className="flex flex-col gap-2">
                  <PropertyCard property={property} />
                  <Link
                    href={`/auction/${property.id}/result`}
                    className="text-center text-xs text-[#0A3D62] hover:text-[#0A3D62]/70 border border-[#0A3D62]/20 bg-[#0A3D62]/5 rounded-lg py-2 transition hover:bg-[#0A3D62]/10 font-medium"
                  >
                    View Auction Result →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PropertyCard({
  property,
  href,
}: {
  property: (typeof properties)[0];
  href?: string;
}) {
  return (
    <Link href={href ?? `/property/${property.id}`}>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group overflow-hidden">
        {/* Image */}
        <div className="relative">
          <img
            src={property.image}
            alt={property.title}
            className="w-full h-52 object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />
          {/* Bank label */}
          <div className="absolute top-3 left-3">
            <span className="bg-white/95 backdrop-blur-sm text-[#0A3D62] text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
              {property.bank}
            </span>
          </div>
          {/* Status badge */}
          <div className="absolute top-3 right-3">
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

        {/* Body */}
        <div className="p-5">
          <p className="text-[11px] text-slate-400 font-mono mb-1 tracking-wide">
            {property.ref}
          </p>
          <h3 className="font-display text-xl font-bold text-[#0A3D62] leading-snug mb-1">
            {property.title}
          </h3>
          <p className="text-slate-500 text-sm mb-4 flex items-center gap-1">
            <span>📍</span> {property.location}
          </p>

          {/* Type tag */}
          <span className="inline-block bg-slate-100 text-slate-500 text-xs font-medium px-2 py-0.5 rounded mb-4">
            {property.type}
          </span>

          {/* Price row */}
          <div className="flex justify-between items-end pt-3 border-t border-slate-100">
            <div>
              <p className="text-[11px] text-slate-400 uppercase tracking-wide mb-0.5">
                Minimum Bid
              </p>
              <p className="text-xl font-bold text-[#C4A484]">
                {formatPHP(property.minBid)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-slate-400 uppercase tracking-wide mb-0.5">
                Deposit
              </p>
              <p className="text-sm font-semibold text-slate-600">
                {formatPHP(property.deposit)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
