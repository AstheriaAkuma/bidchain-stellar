import Link from "next/link";
import { properties, formatPHP } from "@/lib/mockData";

export default function Home() {
  const open = properties.filter((p) => p.status === "open");
  const closed = properties.filter((p) => p.status === "closed");

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Hero */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-white mb-4">
          Foreclosed Properties, <br />
          <span className="text-blue-400">On-Chain Bidding.</span>
        </h1>
        <p className="text-gray-400 max-w-xl mx-auto">
          No manager's checks. No liquidity trap. Your deposit is locked in a
          Soroban smart contract and refunded instantly if you lose.
        </p>

        {/* How it works strip */}
        <div className="mt-8 grid grid-cols-3 gap-4 max-w-2xl mx-auto">
          {[
            { icon: "🔐", label: "Lock deposit on-chain" },
            { icon: "📋", label: "Bid is recorded on Stellar ledger" },
            { icon: "⚡", label: "Instant refund if you lose" },
          ].map((step) => (
            <div
              key={step.label}
              className="bg-gray-900 rounded-xl p-4 text-sm text-gray-300"
            >
              <div className="text-2xl mb-1">{step.icon}</div>
              {step.label}
            </div>
          ))}
        </div>
      </div>

      {/* Active Auctions */}
      <h2 className="text-xl font-semibold text-white mb-4">
        🟢 Active Auctions
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
       {open.map((property) => (
          <div key={property.id} className="flex flex-col gap-2">
            <PropertyCard property={property} />
            <Link
              href={`/auction/${property.id}/result`}
              className="text-center text-xs text-gray-500 hover:text-blue-400 border border-gray-800 rounded-lg py-1.5 transition"
            >
              View Mock Result &rarr;
            </Link>
          </div>
        ))}
      </div>

      {/* Closed */}
      <h2 className="text-xl font-semibold text-gray-500 mb-4">
        ⚫ Closed Auctions
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-50">
        {closed.map((property) => (
          <PropertyCard
            key={property.id}
            property={property}
            href={`/auction/${property.id}/result`}
          />
        ))}
      </div>
    </div>
  );
}

function PropertyCard({ property, href }: { property: (typeof properties)[0]; href?: string }) {
  return (
    <Link href={href ?? `/property/${property.id}`}> 
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-blue-500 transition group">
        <img
          src={property.image}
          alt={property.title}
          className="w-full h-44 object-cover group-hover:brightness-110 transition"
        />
        <div className="p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500 font-mono">
              {property.ref}
            </span>
            <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">
              {property.bank}
            </span>
          </div>
          <h3 className="font-semibold text-white">{property.title}</h3>
          <p className="text-sm text-gray-400 mb-3">📍 {property.location}</p>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs text-gray-500">Minimum Bid</p>
              <p className="text-lg font-bold text-blue-400">
                {formatPHP(property.minBid)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Deposit</p>
              <p className="text-sm text-gray-300">
                {formatPHP(property.deposit)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}