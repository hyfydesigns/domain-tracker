import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Domain, DomainActivity, AppSettings, RenewalRecord } from "@/types";
import {
  fetchDomains,
  insertDomain,
  updateDomainRow,
  deleteDomainRow,
  fetchRenewalRecords,
  insertRenewalRecord,
  fetchActivity,
  insertActivity,
} from "@/lib/db";
import { generateId, computeDomainStatus } from "@/lib/utils";

interface DomainStore {
  // ── State ──────────────────────────────────────────────────
  domains: Domain[];
  activity: DomainActivity[];
  renewalHistory: RenewalRecord[];
  settings: AppSettings;
  viewMode: "list" | "grid";
  isLoading: boolean;
  error: string | null;

  // ── Bootstrap ──────────────────────────────────────────────
  loadAll: () => Promise<void>;

  // ── Domain Actions ─────────────────────────────────────────
  addDomain: (domain: Omit<Domain, "id" | "createdAt" | "updatedAt" | "status">) => Domain;
  updateDomain: (id: string, updates: Partial<Domain>) => void;
  deleteDomain: (id: string) => void;
  getDomainById: (id: string) => Domain | undefined;
  importDomains: (domains: Omit<Domain, "id" | "createdAt" | "updatedAt" | "status">[]) => void;

  // ── UI Actions ─────────────────────────────────────────────
  setViewMode: (mode: "list" | "grid") => void;
  updateSettings: (settings: Partial<AppSettings>) => void;

  // ── Renewal History ────────────────────────────────────────
  addRenewalRecord: (record: Omit<RenewalRecord, "id">) => void;
  getRenewalHistoryForDomain: (domainId: string) => RenewalRecord[];

  // ── Activity ───────────────────────────────────────────────
  addActivity: (activity: Omit<DomainActivity, "id" | "timestamp">) => void;
}

const DEFAULT_SETTINGS: AppSettings = {
  notifications: {
    emailEnabled: false,
    emailAddress: "",
    notify30Days: true,
    notify60Days: true,
    notify90Days: false,
    browserNotifications: false,
  },
  defaultView: "list",
  currency: "USD",
  theme: "system",
};

// Settings and viewMode stay in localStorage — they're UI preferences, not data.
const useSettingsStore = create<{ settings: AppSettings; viewMode: "list" | "grid" }>()(
  persist(() => ({ settings: DEFAULT_SETTINGS, viewMode: "list" as const }), {
    name: "domain-tracker-prefs",
    storage: createJSONStorage(() => localStorage),
  })
);

export const useDomainStore = create<DomainStore>()((set, get) => ({
  domains: [],
  activity: [],
  renewalHistory: [],
  settings: useSettingsStore.getState().settings,
  viewMode: useSettingsStore.getState().viewMode,
  isLoading: false,
  error: null,

  // ── Load everything from Supabase ────────────────────────────
  loadAll: async () => {
    set({ isLoading: true, error: null });
    try {
      const [domains, renewalHistory, activity] = await Promise.all([
        fetchDomains(),
        fetchRenewalRecords(),
        fetchActivity(),
      ]);
      set({ domains, renewalHistory, activity, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: "Failed to load data" });
    }
  },

  // ── Add Domain ───────────────────────────────────────────
  addDomain: (domainData) => {
    const now = new Date().toISOString();
    const newDomain: Domain = {
      ...domainData,
      id: generateId("dom"),
      status: computeDomainStatus(domainData.expiryDate),
      createdAt: now,
      updatedAt: now,
    };

    // Optimistic update
    set((state) => ({ domains: [...state.domains, newDomain] }));

    // Persist to Supabase (fire-and-forget, errors are non-blocking)
    insertDomain(newDomain).catch(console.error);

    get().addActivity({
      domainId: newDomain.id,
      domainName: newDomain.name,
      type: "added",
      message: `${newDomain.name} was added to the tracker.`,
    });

    return newDomain;
  },

  // ── Update Domain ────────────────────────────────────────
  updateDomain: (id, updates) => {
    set((state) => ({
      domains: state.domains.map((d) => {
        if (d.id !== id) return d;
        const updated = { ...d, ...updates, updatedAt: new Date().toISOString() };
        if (updates.expiryDate) updated.status = computeDomainStatus(updates.expiryDate);
        return updated;
      }),
    }));

    updateDomainRow(id, updates).catch(console.error);

    const domain = get().getDomainById(id);
    if (domain) {
      get().addActivity({
        domainId: id,
        domainName: domain.name,
        type: "edited",
        message: `${domain.name} details were updated.`,
      });
    }
  },

  // ── Delete Domain ────────────────────────────────────────
  deleteDomain: (id) => {
    const domain = get().getDomainById(id);
    set((state) => ({ domains: state.domains.filter((d) => d.id !== id) }));
    deleteDomainRow(id).catch(console.error);
    if (domain) {
      get().addActivity({
        domainId: id,
        domainName: domain.name,
        type: "deleted",
        message: `${domain.name} was removed from the tracker.`,
      });
    }
  },

  // ── Get Domain By ID ─────────────────────────────────────
  getDomainById: (id) => get().domains.find((d) => d.id === id),

  // ── Import Domains ───────────────────────────────────────
  importDomains: (domainsData) => {
    const now = new Date().toISOString();
    const newDomains: Domain[] = domainsData.map((d) => ({
      ...d,
      id: generateId("dom"),
      status: computeDomainStatus(d.expiryDate),
      createdAt: now,
      updatedAt: now,
    }));

    set((state) => ({ domains: [...state.domains, ...newDomains] }));
    newDomains.forEach((d) => insertDomain(d).catch(console.error));
  },

  // ── View Mode ────────────────────────────────────────────
  setViewMode: (mode) => {
    set({ viewMode: mode });
    useSettingsStore.setState({ viewMode: mode });
  },

  // ── Settings ─────────────────────────────────────────────
  updateSettings: (newSettings) => {
    set((state) => {
      const merged = { ...state.settings, ...newSettings };
      useSettingsStore.setState({ settings: merged });
      return { settings: merged };
    });
  },

  // ── Renewal History ──────────────────────────────────────
  addRenewalRecord: (record) => {
    const newRecord: RenewalRecord = { ...record, id: generateId("ren") };
    set((state) => ({ renewalHistory: [...state.renewalHistory, newRecord] }));
    insertRenewalRecord(newRecord).catch(console.error);
  },

  getRenewalHistoryForDomain: (domainId) =>
    get().renewalHistory.filter((r) => r.domainId === domainId),

  // ── Activity ─────────────────────────────────────────────
  addActivity: (activityData) => {
    const newActivity: DomainActivity = {
      ...activityData,
      id: generateId("act"),
      timestamp: new Date().toISOString(),
    };
    set((state) => ({ activity: [newActivity, ...state.activity].slice(0, 50) }));
    insertActivity(newActivity).catch(console.error);
  },
}));
