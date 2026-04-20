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
    status: "open",
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
    status: "open",
  },
  {
    id: 3,
    ref: "PNB-ROPA-MNL-2024-017",
    title: "Commercial Lot 220sqm",
    location: "Makati City, Metro Manila",
    type: "Commercial Lot",
    minBid: 4500000,
    deposit: 200000,
    deadline: "2025-04-28T09:00:00",
    bank: "PNB ROPA",
    image: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600",
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