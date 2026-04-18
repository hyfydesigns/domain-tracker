// ============================================================
// Domain Tracker - Core Type Definitions
// ============================================================

export type DomainStatus = "safe" | "expiring-soon" | "expired" | "renewed";
export type RegistrarName = string;

export interface Domain {
  id: string;
  name: string; // e.g. "example.com"
  registrar: string;
  purchaseDate: string; // ISO date string
  expiryDate: string; // ISO date string
  renewalCost: number; // in USD
  autoRenew: boolean;
  notes: string;
  tags: string[];
  status: DomainStatus;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface RenewalRecord {
  id: string;
  domainId: string;
  renewedAt: string; // ISO date string
  newExpiryDate: string; // ISO date string
  cost: number;
  notes?: string;
}

export interface DomainActivity {
  id: string;
  domainId: string;
  domainName: string;
  type: "added" | "renewed" | "edited" | "deleted" | "expiry-warning";
  message: string;
  timestamp: string; // ISO date string
}

export interface DashboardStats {
  totalDomains: number;
  expiringSoon: number; // within 30 days
  recentlyAdded: number; // last 30 days
  totalValue: number; // sum of renewal costs
  expired: number;
}

export interface NotificationSettings {
  emailEnabled: boolean;
  emailAddress: string;
  notify30Days: boolean;
  notify60Days: boolean;
  notify90Days: boolean;
  browserNotifications: boolean;
}

export interface AppSettings {
  notifications: NotificationSettings;
  defaultView: "list" | "grid";
  currency: string;
  theme: "light" | "dark" | "system";
}

// Form schemas (used with Zod + React Hook Form)
export interface DomainFormValues {
  name: string;
  registrar: string;
  purchaseDate: string;
  expiryDate: string;
  renewalCost: number;
  autoRenew: boolean;
  notes: string;
  tags: string;
}
