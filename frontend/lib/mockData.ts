export type Property = {
  id: number;
  ref: string;
  title: string;
  location: string;
  type: string;
  minBid: number;
  deposit: number;
  deadline: string;
  bank: string;
  image: string;
  status: "open" | "closed";
};

export const properties: Property[] = [
  // ── Active Auctions ────────────────────────────────────────────────────────
  {
    id: 3,
    ref: "PNB-ROPA-MNL-2024-017",
    title: "Commercial Lot 220sqm",
    location: "Makati City, Metro Manila",
    type: "Commercial Lot",
    minBid: 4500000,
    deposit: 200000,
    deadline: "2025-07-15T09:00:00",
    bank: "PNB ROPA",
    image: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600",
    status: "open",
  },
  {
    id: 4,
    ref: "LANDBANK-DAV-2025-003",
    title: "4BR Single Detached House",
    location: "Davao City, Davao del Sur",
    type: "Single Detached",
    minBid: 2100000,
    deposit: 120000,
    deadline: "2025-07-20T10:00:00",
    bank: "Land Bank ROPA",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600",
    status: "open",
  },
  {
    id: 5,
    ref: "SECBANK-BGC-2025-011",
    title: "Studio Unit — BGC Tower",
    location: "Bonifacio Global City, Taguig",
    type: "Condominium",
    minBid: 3200000,
    deposit: 160000,
    deadline: "2025-07-25T14:00:00",
    bank: "Security Bank ROPA",
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600",
    status: "open",
  },
  {
    id: 6,
    ref: "RCBC-ILO-2025-007",
    title: "Agricultural Lot 1.2ha",
    location: "Iloilo City, Iloilo",
    type: "Agricultural Lot",
    minBid: 980000,
    deposit: 55000,
    deadline: "2025-08-02T09:00:00",
    bank: "RCBC ROPA",
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600",
    status: "open",
  },
  {
    id: 7,
    ref: "METROBANK-CAV-2025-019",
    title: "3BR House & Lot — Cavite Estate",
    location: "Imus, Cavite",
    type: "House & Lot",
    minBid: 1650000,
    deposit: 90000,
    deadline: "2025-08-08T10:00:00",
    bank: "Metrobank ROPA",
    image: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600",
    status: "open",
  },
  {
    id: 8,
    ref: "BPI-CDO-2025-024",
    title: "Commercial Shophouse 180sqm",
    location: "Cagayan de Oro, Misamis Oriental",
    type: "Commercial",
    minBid: 2850000,
    deposit: 145000,
    deadline: "2025-08-14T13:00:00",
    bank: "BPI Family ROPA",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600",
    status: "open",
  },
  {
    id: 9,
    ref: "UCPB-BAC-2025-006",
    title: "1BR Beach-View Condo",
    location: "Lapu-Lapu City, Cebu",
    type: "Condominium",
    minBid: 1450000,
    deposit: 80000,
    deadline: "2025-08-20T11:00:00",
    bank: "UCPB ROPA",
    image: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=600",
    status: "open",
  },
  {
    id: 10,
    ref: "EASTWEST-PAM-2025-031",
    title: "Warehouse with Office 500sqm",
    location: "Pampanga, Central Luzon",
    type: "Industrial",
    minBid: 6800000,
    deposit: 350000,
    deadline: "2025-08-28T09:00:00",
    bank: "EastWest Bank ROPA",
    image: "https://images.unsplash.com/photo-1553413077-190dd305871c?w=600",
    status: "open",
  },

  // ── Closed Auctions ────────────────────────────────────────────────────────
  {
    id: 1,
    ref: "PAGIBIG-QC-2024-001",
    title: "2BR Condo Unit",
    location: "Quezon City, Metro Manila",
    type: "Condominium",
    minBid: 800000,
    deposit: 50000,
    deadline: "2025-05-01T10:00:00",
    bank: "PAG-IBIG Fund",
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600",
    status: "closed",
  },
  {
    id: 2,
    ref: "BDO-ROPA-CEU-2024-042",
    title: "3BR Townhouse",
    location: "Cebu City, Cebu",
    type: "Townhouse",
    minBid: 1250000,
    deposit: 75000,
    deadline: "2025-05-03T14:00:00",
    bank: "BDO ROPA",
    image: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600",
    status: "closed",
  },
];

export function formatPHP(amount: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(amount);
}
