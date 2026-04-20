"use client";
import { useFreighter } from "@/hooks/useFreighter";
import { CONTRACT_ID } from "@/lib/stellar";
import { formatPHP } from "@/lib/mockData";

// Mock bid history — in production this reads from on-chain events
const mockBids = [
  {
    auctionId: 1,
    property: "2BR Condo Unit — Quezon City",
    amount: 850000,
    deposit: 50000,
    status: "active",
    txHash: "abc123...xyz",
  },
  {
    auctionId: 2,
    property: "3BR Townhouse — Cebu City",
    amount: 1300000,
    deposit: 75000,
    status: "refunded",
    txHash: "def456...uvw",
  },
];

const statusStyle: Record<string, string> = {
  active: "bg-yellow-900 text-yellow-400",
  refunded: "bg-gray-800 text-gray-400",
  won: "bg-green-900 text-green-400",
};

export default function Dashboard() {
  const { publicKey, shortKey, connect } = useFreighter();

  if (!publicKey) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 text-center">
        <p className="text-gray-400 mb-4">Connect your wallet to see your bids</p>
        <button
          onClick={connect}
          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg"
        >
          Connect Freighter
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">My Bids</h1>
        <div className="text-xs font-mono bg-gray-900 border border-gray-700 px-3 py-1.5 rounded-lg text-gray-400">
          {shortKey}
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6 text-sm text-gray-400">
        <p className="font-medium text-gray-300 mb-1">📡 Contract</p>
        <p className="font-mono text-xs text-blue-400 break-all">{CONTRACT_ID}</p>
        <a
          href={`https://stellar.expert/explorer/testnet/contract/${CONTRACT_ID}`}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-gray-500 hover:text-white transition mt-1 block"
        >
          View on Stellar Expert →
        </a>
      </div>

      <div className="space-y-4">
        {mockBids.map((bid) => (
          <div
            key={bid.auctionId}
            className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center justify-between"
          >
            <div>
              <p className="font-medium text-white">{bid.property}</p>
              <p className="text-sm text-gray-400 mt-0.5">
                Bid: {formatPHP(bid.amount)} · Deposit locked:{" "}
                {formatPHP(bid.deposit)}
              </p>
              <p className="text-xs font-mono text-gray-600 mt-1">
                {bid.txHash}
              </p>
            </div>
            <span
              className={`text-xs px-3 py-1 rounded-full font-medium ${statusStyle[bid.status]}`}
            >
              {bid.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}