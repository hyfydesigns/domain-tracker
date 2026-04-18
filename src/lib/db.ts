import { supabase } from "./supabase";
import type { Domain, RenewalRecord, DomainActivity } from "@/types";

// ── Row types (snake_case from Supabase) ─────────────────────

interface DomainRow {
  id: string;
  name: string;
  registrar: string;
  purchase_date: string;
  expiry_date: string;
  renewal_cost: number;
  auto_renew: boolean;
  notes: string;
  tags: string[];
  status: string;
  created_at: string;
  updated_at: string;
}

interface RenewalRow {
  id: string;
  domain_id: string;
  renewed_at: string;
  new_expiry_date: string;
  cost: number;
  notes: string | null;
}

interface ActivityRow {
  id: string;
  domain_id: string;
  domain_name: string;
  type: string;
  message: string;
  timestamp: string;
}

// ── Mappers ──────────────────────────────────────────────────

function toDomain(row: DomainRow): Domain {
  return {
    id: row.id,
    name: row.name,
    registrar: row.registrar,
    purchaseDate: row.purchase_date,
    expiryDate: row.expiry_date,
    renewalCost: Number(row.renewal_cost),
    autoRenew: row.auto_renew,
    notes: row.notes,
    tags: row.tags ?? [],
    status: row.status as Domain["status"],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toRenewal(row: RenewalRow): RenewalRecord {
  return {
    id: row.id,
    domainId: row.domain_id,
    renewedAt: row.renewed_at,
    newExpiryDate: row.new_expiry_date,
    cost: Number(row.cost),
    notes: row.notes ?? undefined,
  };
}

function toActivity(row: ActivityRow): DomainActivity {
  return {
    id: row.id,
    domainId: row.domain_id,
    domainName: row.domain_name,
    type: row.type as DomainActivity["type"],
    message: row.message,
    timestamp: row.timestamp,
  };
}

// ── Domains ──────────────────────────────────────────────────

export async function fetchDomains(): Promise<Domain[]> {
  const { data, error } = await supabase
    .from("domains")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as DomainRow[]).map(toDomain);
}

export async function insertDomain(domain: Domain): Promise<void> {
  const { error } = await supabase.from("domains").insert({
    id: domain.id,
    name: domain.name,
    registrar: domain.registrar,
    purchase_date: domain.purchaseDate,
    expiry_date: domain.expiryDate,
    renewal_cost: domain.renewalCost,
    auto_renew: domain.autoRenew,
    notes: domain.notes,
    tags: domain.tags,
    status: domain.status,
    created_at: domain.createdAt,
    updated_at: domain.updatedAt,
  });
  if (error) throw error;
}

export async function updateDomainRow(id: string, updates: Partial<Domain>): Promise<void> {
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.name !== undefined) row.name = updates.name;
  if (updates.registrar !== undefined) row.registrar = updates.registrar;
  if (updates.purchaseDate !== undefined) row.purchase_date = updates.purchaseDate;
  if (updates.expiryDate !== undefined) row.expiry_date = updates.expiryDate;
  if (updates.renewalCost !== undefined) row.renewal_cost = updates.renewalCost;
  if (updates.autoRenew !== undefined) row.auto_renew = updates.autoRenew;
  if (updates.notes !== undefined) row.notes = updates.notes;
  if (updates.tags !== undefined) row.tags = updates.tags;
  if (updates.status !== undefined) row.status = updates.status;

  const { error } = await supabase.from("domains").update(row).eq("id", id);
  if (error) throw error;
}

export async function deleteDomainRow(id: string): Promise<void> {
  const { error } = await supabase.from("domains").delete().eq("id", id);
  if (error) throw error;
}

// ── Renewal Records ──────────────────────────────────────────

export async function fetchRenewalRecords(): Promise<RenewalRecord[]> {
  const { data, error } = await supabase
    .from("renewal_records")
    .select("*")
    .order("renewed_at", { ascending: true });
  if (error) throw error;
  return (data as RenewalRow[]).map(toRenewal);
}

export async function insertRenewalRecord(record: RenewalRecord): Promise<void> {
  const { error } = await supabase.from("renewal_records").insert({
    id: record.id,
    domain_id: record.domainId,
    renewed_at: record.renewedAt,
    new_expiry_date: record.newExpiryDate,
    cost: record.cost,
    notes: record.notes ?? null,
  });
  if (error) throw error;
}

// ── Activity ─────────────────────────────────────────────────

export async function fetchActivity(): Promise<DomainActivity[]> {
  const { data, error } = await supabase
    .from("domain_activity")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data as ActivityRow[]).map(toActivity);
}

export async function insertActivity(activity: DomainActivity): Promise<void> {
  const { error } = await supabase.from("domain_activity").insert({
    id: activity.id,
    domain_id: activity.domainId,
    domain_name: activity.domainName,
    type: activity.type,
    message: activity.message,
    timestamp: activity.timestamp,
  });
  if (error) throw error;
}
