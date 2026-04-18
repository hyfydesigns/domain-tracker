// ============================================================
// DomainTracker - Utility Functions
// ============================================================

import { differenceInDays, format, parseISO, isAfter, isBefore } from "date-fns";
import { Domain, DomainStatus, DashboardStats } from "@/types";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// shadcn/ui utility
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Domain Status Helpers ───────────────────────────────────

/**
 * Compute the live status of a domain based on its expiry date.
 * Thresholds: expired = past, expiring-soon = ≤30 days, safe = >30 days
 */
export function computeDomainStatus(expiryDate: string): DomainStatus {
  const expiry = parseISO(expiryDate);
  const today = new Date();
  const daysLeft = differenceInDays(expiry, today);

  if (daysLeft < 0) return "expired";
  if (daysLeft <= 30) return "expiring-soon";
  return "safe";
}

/**
 * Returns days until expiry. Negative = already expired.
 */
export function getDaysUntilExpiry(expiryDate: string): number {
  return differenceInDays(parseISO(expiryDate), new Date());
}

/**
 * Human-readable expiry label
 */
export function getExpiryLabel(expiryDate: string): string {
  const days = getDaysUntilExpiry(expiryDate);
  if (days < 0) return `Expired ${Math.abs(days)} days ago`;
  if (days === 0) return "Expires today!";
  if (days === 1) return "Expires tomorrow";
  if (days <= 30) return `Expires in ${days} days`;
  if (days <= 60) return `Expires in ${days} days`;
  return format(parseISO(expiryDate), "MMM d, yyyy");
}

/**
 * Status badge color classes
 */
export function getStatusColors(status: DomainStatus): {
  bg: string;
  text: string;
  border: string;
  dot: string;
} {
  switch (status) {
    case "safe":
      return {
        bg: "bg-emerald-500/10",
        text: "text-emerald-500",
        border: "border-emerald-500/20",
        dot: "bg-emerald-500",
      };
    case "expiring-soon":
      return {
        bg: "bg-amber-500/10",
        text: "text-amber-500",
        border: "border-amber-500/20",
        dot: "bg-amber-500",
      };
    case "expired":
      return {
        bg: "bg-red-500/10",
        text: "text-red-500",
        border: "border-red-500/20",
        dot: "bg-red-500",
      };
    case "renewed":
      return {
        bg: "bg-indigo-500/10",
        text: "text-indigo-400",
        border: "border-indigo-500/20",
        dot: "bg-indigo-400",
      };
    default:
      return {
        bg: "bg-muted",
        text: "text-muted-foreground",
        border: "border-border",
        dot: "bg-muted-foreground",
      };
  }
}

export function getStatusLabel(status: DomainStatus): string {
  switch (status) {
    case "safe": return "Safe";
    case "expiring-soon": return "Expiring Soon";
    case "expired": return "Expired";
    case "renewed": return "Renewed";
  }
}

// ─── Dashboard Stats ─────────────────────────────────────────

export function computeDashboardStats(domains: Domain[]): DashboardStats {
  const today = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);

  return {
    totalDomains: domains.length,
    expiringSoon: domains.filter((d) => {
      const expiry = parseISO(d.expiryDate);
      const days = getDaysUntilExpiry(d.expiryDate);
      return days >= 0 && days <= 30;
    }).length,
    expired: domains.filter((d) => getDaysUntilExpiry(d.expiryDate) < 0).length,
    recentlyAdded: domains.filter((d) =>
      isAfter(parseISO(d.createdAt), thirtyDaysAgo)
    ).length,
    totalValue: domains.reduce((sum, d) => sum + (d.renewalCost || 0), 0),
  };
}

// ─── Chart Data ───────────────────────────────────────────────

/**
 * Build monthly expiry data for the next 12 months (for line/bar chart)
 */
export function buildExpiryChartData(domains: Domain[]) {
  const today = new Date();
  const data = [];

  for (let i = 0; i < 12; i++) {
    const monthStart = new Date(today.getFullYear(), today.getMonth() + i, 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + i + 1, 0);
    const label = format(monthStart, "MMM yy");

    const count = domains.filter((d) => {
      const expiry = parseISO(d.expiryDate);
      return isAfter(expiry, monthStart) && isBefore(expiry, monthEnd);
    }).length;

    data.push({ month: label, expiring: count });
  }

  return data;
}

// ─── ID Generation ────────────────────────────────────────────

export function generateId(prefix = "dom"): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ─── CSV Helpers ──────────────────────────────────────────────

export function domainsToCSV(domains: Domain[]): string {
  const headers = [
    "name", "registrar", "purchaseDate", "expiryDate",
    "renewalCost", "autoRenew", "tags", "notes", "status",
  ];
  const rows = domains.map((d) => [
    d.name,
    d.registrar,
    d.purchaseDate,
    d.expiryDate,
    d.renewalCost,
    d.autoRenew,
    d.tags.join("|"),
    `"${d.notes.replace(/"/g, '""')}"`,
    d.status,
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

export function domainsToJSON(domains: Domain[]): string {
  return JSON.stringify(domains, null, 2);
}

export function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Registrar List ──────────────────────────────────────────

export const REGISTRARS = [
  "Namecheap",
  "GoDaddy",
  "Cloudflare",
  "Google Domains",
  "Name.com",
  "Porkbun",
  "Dynadot",
  "Hover",
  "Network Solutions",
  "Enom",
  "Other",
];

// ─── Format helpers ──────────────────────────────────────────

export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  return format(parseISO(dateString), "MMM d, yyyy");
}
