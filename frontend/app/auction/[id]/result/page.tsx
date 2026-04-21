"use client";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { properties, formatPHP } from "@/lib/mockData";
import { stellarExpertUrl, getAuction, getUserBid, AuctionData, BidData } from "@/lib/stellar";
import { useFreighter } from "@/hooks/useFreighter";

function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function StatusBadge({ status }: { status: AuctionData["status"] }) {
  const styles: Record<AuctionData["status"], string> = {
    Open: "bg-yellow-900 text-yellow-400",
    Closed: "bg-orange-900 text-orange-400",
    Finalized: "bg-green-900 text-green-400",
    Cancelled: "bg-gray-800 text-gray-400",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${styles[status]}`}>
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
      <div className="max-w-2xl mx-auto px-6 py-24 text-center text-gray-400">
        No property found.{" "}
        <Link href="/" className="text-blue-400 underline">Go back</Link>
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
      <div className="mb-8">
        <Link href="/" className="text-sm text-gray-500 hover:text-white transition">
          &larr; Back to listings
        </Link>
        <div className="flex items-center gap-3 mt-3">
          <h1 className="text-2xl font-bold text-white">Auction Result</h1>
          {auction && <StatusBadge status={auction.status} />}
        </div>
        <p className="text-gray-400 text-sm mt-1">
          {property.title} &mdash; {property.location}
        </p>
        <p className="text-xs text-gray-600 font-mono mt-1">{property.ref}</p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-500 animate-pulse">
          Querying Soroban contract...
        </div>
      ) : auction === null ? (
        /* No contract data yet */
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <p className="text-gray-300 font-semibold mb-2">No on-chain auction found</p>
          <p className="text-gray-500 text-sm mb-4">
            This auction hasn&apos;t been created in the smart contract yet, or the contract
            returned an error. An admin needs to call{" "}
            <code className="text-blue-400">create_auction</code> and{" "}
            <code className="text-blue-400">finalize_auction</code> for results to appear here.
          </p>
          <a
            href={`https://stellar.expert/explorer/testnet/contract/${process.env.NEXT_PUBLIC_CONTRACT_ID}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-blue-400 hover:text-blue-300 transition"
          >
            View contract on Stellar Expert &rarr;
          </a>
        </div>
      ) : !revealed ? (
        /* Pre-reveal */
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
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

          <div className="text-center py-12 bg-gray-900 border border-gray-800 rounded-xl">
            <p className="text-gray-400 mb-1 text-sm">Auction status</p>
            <div className="mb-4">
              <StatusBadge status={auction.status} />
            </div>
            {auction.status === "Finalized" ? (
              <>
                <p className="text-gray-400 text-xs mb-6">
                  {auction.bidCount} bid{auction.bidCount !== 1 ? "s" : ""} recorded on-chain
                </p>
                <button
                  onClick={() => setRevealed(true)}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-semibold text-lg transition"
                >
                  🔓 Reveal Result
                </button>
                <p className="text-xs text-gray-600 mt-3">
                  Result recorded on-chain &mdash; no committee, no manipulation
                </p>
              </>
            ) : (
              <p className="text-gray-500 text-sm mt-2">
                Results will appear here once the admin finalizes the auction.
              </p>
            )}
          </div>
        </div>
      ) : (
        /* Post-reveal */
        <div className="space-y-6">

          {/* Winner */}
          <div className="bg-yellow-950 border-2 border-yellow-500 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">🏆</span>
              <div>
                <p className="text-yellow-400 font-bold text-lg">
                  Winner {isUserWinner && <span className="text-yellow-300">&mdash; That&apos;s you!</span>}
                </p>
                <p className="text-xs text-yellow-600">
                  Declared on Stellar ledger &mdash; verifiable by anyone
                </p>
              </div>
            </div>

            <div className="bg-yellow-900/40 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-yellow-600">Address</span>
                <a
                  href={`https://stellar.expert/explorer/testnet/account/${auction.winner}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-yellow-300 font-mono hover:text-yellow-200 transition"
                >
                  {shortAddr(auction.winner!)}
                </a>
              </div>
              <div className="flex justify-between">
                <span className="text-yellow-600">Winning bid</span>
                <span className="text-yellow-300 font-bold">
                  {formatPHP(auction.winningBid)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-yellow-600">Total bidders</span>
                <span className="text-yellow-300">{auction.bidCount}</span>
              </div>
            </div>

            <div className="mt-4 bg-yellow-900/20 border border-yellow-700 rounded-lg p-3 text-xs">
              <p className="text-yellow-400 font-medium mb-1">
                🪙 Right-to-Purchase Token Issued
              </p>
              <p className="text-yellow-600">
                Winner receives a Stellar asset as their digital certificate.
                This bridges the on-chain result with the real-world PAG-IBIG transfer process.
              </p>
            </div>
          </div>

          {/* Connected user's bid status */}
          {publicKey && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <p className="text-white font-semibold mb-4">Your Bid Status</p>
              {userBid ? (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Your bid amount</span>
                    <span className="text-white font-medium">{formatPHP(userBid.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Deposit</span>
                    <span className="text-white">{formatPHP(userBid.deposit)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Outcome</span>
                    {isUserWinner ? (
                      <span className="text-yellow-400 font-semibold">🏆 You won!</span>
                    ) : userBid.refunded ? (
                      <span className="text-green-400 font-semibold">✅ Deposit refunded</span>
                    ) : (
                      <span className="text-orange-400 font-semibold">⏳ Refund pending</span>
                    )}
                  </div>
                  {!isUserWinner && !userBid.refunded && (
                    <p className="text-xs text-gray-600 pt-1">
                      Your deposit will be released once the admin processes refunds via the contract.
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">
                  You did not place a bid on this auction through the smart contract.
                </p>
              )}
            </div>
          )}

          {/* On-chain proof */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-sm">
            <p className="text-gray-400 font-medium mb-3">📡 On-Chain Proof</p>
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
                <span className="text-gray-500">Winner address</span>
                <a
                  href={`https://stellar.expert/explorer/testnet/account/${auction.winner}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-400 font-mono hover:text-blue-300 transition"
                >
                  {shortAddr(auction.winner!)} &rarr;
                </a>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Bids recorded</span>
                <span className="text-gray-300">{auction.bidCount}</span>
              </div>
            </div>
          </div>

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
