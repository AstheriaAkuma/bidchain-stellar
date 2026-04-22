import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import Navbar from "@/components/Navbar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-cormorant",
});

export const metadata: Metadata = {
  title: "BidChain PH — ROPA Auction Portal",
  description:
    "Bid on bank foreclosed properties in the Philippines with on-chain escrow via Stellar blockchain.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${cormorant.variable} font-[var(--font-inter)] bg-[#F8FAFC] text-slate-800 min-h-screen`}
        suppressHydrationWarning
      >
        <Navbar />
        <main>{children}</main>

        <footer className="mt-20 border-t border-slate-200 bg-white">
          <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-lg bg-[#0A3D62] flex items-center justify-center shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L22 8H2L12 2Z" fill="white" fillOpacity="0.95"/>
                    <rect x="2" y="8" width="20" height="2.5" rx="0.4" fill="white" fillOpacity="0.85"/>
                    <rect x="3.5" y="10.5" width="2.5" height="5.5" rx="0.3" fill="white" fillOpacity="0.7"/>
                    <rect x="8.5" y="10.5" width="2.5" height="5.5" rx="0.3" fill="white" fillOpacity="0.7"/>
                    <rect x="13" y="10.5" width="2.5" height="5.5" rx="0.3" fill="white" fillOpacity="0.7"/>
                    <rect x="18" y="10.5" width="2.5" height="5.5" rx="0.3" fill="white" fillOpacity="0.7"/>
                    <rect x="1.5" y="16" width="21" height="2" rx="0.3" fill="white" fillOpacity="0.85"/>
                    <rect x="0.5" y="18" width="23" height="2" rx="0.3" fill="white"/>
                  </svg>
                </div>
                <div>
                  <div className="font-display text-[#0A3D62] font-bold leading-none text-base">BIDCHAIN PH</div>
                  <div className="text-[10px] text-[#C4A484] uppercase tracking-widest">ROPA Portal</div>
                </div>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed mb-4 max-w-xs">
                Transparent, on-chain property auctions for bank foreclosed assets in the Philippines. Powered by Stellar blockchain.
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-full font-semibold">Testnet</span>
                <span className="text-xs text-slate-400">· Stellar Soroban</span>
              </div>
            </div>

            {/* Platform links */}
            <div>
              <p className="font-semibold text-slate-700 mb-3 text-sm">Platform</p>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/" className="text-slate-500 hover:text-[#0A3D62] transition">
                    Active Auctions
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="text-slate-500 hover:text-[#0A3D62] transition">
                    My Bids
                  </Link>
                </li>
                <li>
                  <Link href="/auction/1/result" className="text-slate-500 hover:text-[#0A3D62] transition">
                    Auction Results
                  </Link>
                </li>
                <li>
                  <Link href="/admin" className="text-slate-500 hover:text-[#0A3D62] transition">
                    Admin Panel
                  </Link>
                </li>
              </ul>
            </div>

            {/* Registry links */}
            <div>
              <p className="font-semibold text-slate-700 mb-3 text-sm">Registry</p>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="https://www.pagibigfund.gov.ph/foreclosedproperties.html"
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-500 hover:text-[#0A3D62] transition"
                  >
                    PAG-IBIG Fund ROPA
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.bdo.com.ph/personal/loans/acquired-assets"
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-500 hover:text-[#0A3D62] transition"
                  >
                    BDO Foreclosed Properties
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.pnb.com.ph/index.php/banking/loans/acquired-assets"
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-500 hover:text-[#0A3D62] transition"
                  >
                    PNB ROPA Registry
                  </a>
                </li>
                <li>
                  <a
                    href="https://stellar.expert/explorer/testnet"
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-500 hover:text-[#0A3D62] transition"
                  >
                    Stellar Testnet Explorer
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-100 py-4 text-center text-xs text-slate-400">
            © 2025 BidChain PH · Built on Stellar Testnet · All auctions are for demonstration purposes only.
          </div>
        </footer>
      </body>
    </html>
  );
}
