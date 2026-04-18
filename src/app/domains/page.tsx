"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  LayoutGrid,
  List,
  PlusCircle,
  Globe,
  MoreVertical,
  Pencil,
  Trash2,
  RefreshCw,
  Download,
  Upload,
  Filter,
  X,
  ExternalLink,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

import { useDomainStore } from "@/store/domain-store";
import {
  getStatusColors,
  getStatusLabel,
  getExpiryLabel,
  getDaysUntilExpiry,
  formatCurrency,
  formatDate,
  domainsToCSV,
  domainsToJSON,
  downloadFile,
} from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Domain, DomainStatus } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { EditDomainDialog } from "@/components/domains/edit-domain-dialog";

type SortKey = "name" | "expiryDate" | "renewalCost" | "registrar" | "status";
type SortDir = "asc" | "desc";

function StatusBadge({ status }: { status: DomainStatus }) {
  const c = getStatusColors(status);
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border", c.bg, c.text, c.border)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", c.dot)} />
      {getStatusLabel(status)}
    </span>
  );
}

function DomainCard({ domain, onEdit, onDelete, onRenew }: {
  domain: Domain;
  onEdit: (d: Domain) => void;
  onDelete: (d: Domain) => void;
  onRenew: (d: Domain) => void;
}) {
  const days = getDaysUntilExpiry(domain.expiryDate);
  const colors = getStatusColors(domain.status);

  return (
    <Card className="domain-card group">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", colors.bg)}>
              <Globe className={cn("h-4 w-4", colors.text)} />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{domain.name}</p>
              <p className="text-xs text-muted-foreground">{domain.registrar}</p>
            </div>
          </div>
          <DomainActions domain={domain} onEdit={onEdit} onDelete={onDelete} onRenew={onRenew} />
        </div>

        <StatusBadge status={domain.status} />

        <div className="mt-3 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Expires</span>
            <span className={cn("font-medium", colors.text)}>{getExpiryLabel(domain.expiryDate)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Renewal</span>
            <span className="font-medium">{formatCurrency(domain.renewalCost)}/yr</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Auto-renew</span>
            <span className={cn("font-medium", domain.autoRenew ? "text-emerald-500" : "text-muted-foreground")}>
              {domain.autoRenew ? "On" : "Off"}
            </span>
          </div>
        </div>

        {domain.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {domain.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                {tag}
              </span>
            ))}
            {domain.tags.length > 3 && (
              <span className="text-xs text-muted-foreground">+{domain.tags.length - 3}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DomainActions({ domain, onEdit, onDelete, onRenew }: {
  domain: Domain;
  onEdit: (d: Domain) => void;
  onDelete: (d: Domain) => void;
  onRenew: (d: Domain) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={() => onEdit(domain)}>
          <Pencil className="h-4 w-4 mr-2" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onRenew(domain)}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Mark Renewed
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onDelete(domain)}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SortHeader({ label, sortKey, current, dir, onSort }: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  dir: SortDir;
  onSort: (k: SortKey) => void;
}) {
  const active = current === sortKey;
  return (
    <button
      onClick={() => onSort(sortKey)}
      className={cn(
        "flex items-center gap-1 text-xs font-semibold uppercase tracking-wider transition-colors",
        active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {label}
      {active ? (
        dir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
      ) : (
        <ChevronDown className="h-3 w-3 opacity-30" />
      )}
    </button>
  );
}

export default function DomainsPage() {
  const domains = useDomainStore((s) => s.domains);
  const viewMode = useDomainStore((s) => s.viewMode);
  const setViewMode = useDomainStore((s) => s.setViewMode);
  const deleteDomain = useDomainStore((s) => s.deleteDomain);
  const updateDomain = useDomainStore((s) => s.updateDomain);
  const addRenewalRecord = useDomainStore((s) => s.addRenewalRecord);
  const addActivity = useDomainStore((s) => s.addActivity);
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [registrarFilter, setRegistrarFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("expiryDate");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [deleteTarget, setDeleteTarget] = useState<Domain | null>(null);
  const [editTarget, setEditTarget] = useState<Domain | null>(null);

  const registrars = useMemo(
    () => Array.from(new Set(domains.map((d) => d.registrar))).sort(),
    [domains]
  );

  const filtered = useMemo(() => {
    let result = domains.filter((d) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        d.name.toLowerCase().includes(q) ||
        d.registrar.toLowerCase().includes(q) ||
        d.tags.some((t) => t.toLowerCase().includes(q));
      const matchStatus = statusFilter === "all" || d.status === statusFilter;
      const matchRegistrar = registrarFilter === "all" || d.registrar === registrarFilter;
      return matchSearch && matchStatus && matchRegistrar;
    });

    result = [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "expiryDate":
          cmp = getDaysUntilExpiry(a.expiryDate) - getDaysUntilExpiry(b.expiryDate);
          break;
        case "renewalCost":
          cmp = a.renewalCost - b.renewalCost;
          break;
        case "registrar":
          cmp = a.registrar.localeCompare(b.registrar);
          break;
        case "status": {
          const order = { expired: 0, "expiring-soon": 1, safe: 2, renewed: 3 };
          cmp = order[a.status] - order[b.status];
          break;
        }
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [domains, search, statusFilter, registrarFilter, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }

  function handleDelete() {
    if (!deleteTarget) return;
    deleteDomain(deleteTarget.id);
    toast({ title: "Domain deleted", description: `${deleteTarget.name} was removed.` });
    setDeleteTarget(null);
  }

  function handleRenew(domain: Domain) {
    const newExpiry = new Date(domain.expiryDate);
    newExpiry.setFullYear(newExpiry.getFullYear() + 1);
    const newExpiryStr = newExpiry.toISOString().split("T")[0];

    updateDomain(domain.id, { expiryDate: newExpiryStr, status: "renewed" });
    addRenewalRecord({
      domainId: domain.id,
      renewedAt: new Date().toISOString(),
      newExpiryDate: newExpiryStr,
      cost: domain.renewalCost,
    });
    addActivity({
      domainId: domain.id,
      domainName: domain.name,
      type: "renewed",
      message: `${domain.name} was renewed for 1 year.`,
    });
    toast({ title: "Domain renewed", description: `${domain.name} renewed until ${newExpiryStr}.`, variant: "default" });
  }

  const hasFilters = search || statusFilter !== "all" || registrarFilter !== "all";

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Domains</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {filtered.length} of {domains.length} domains
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => downloadFile(domainsToCSV(domains), "domains.csv", "text/csv")}>
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => downloadFile(domainsToJSON(domains), "domains.json", "application/json")}>
                Export as JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button asChild size="sm">
            <Link href="/add">
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Domain
            </Link>
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by name, registrar, or tag…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <Filter className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="safe">Safe</SelectItem>
              <SelectItem value="expiring-soon">Expiring Soon</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="renewed">Renewed</SelectItem>
            </SelectContent>
          </Select>

          {registrars.length > 1 && (
            <Select value={registrarFilter} onValueChange={setRegistrarFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Registrar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Registrars</SelectItem>
                {registrars.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setSearch(""); setStatusFilter("all"); setRegistrarFilter("all"); }}
              className="text-muted-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}

          {/* View toggle */}
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-2 transition-colors",
                viewMode === "list" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-accent text-muted-foreground"
              )}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-2 transition-colors",
                viewMode === "grid" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-accent text-muted-foreground"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Globe className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <h3 className="font-semibold text-lg mb-1">
            {hasFilters ? "No domains match your filters" : "No domains yet"}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {hasFilters ? "Try adjusting your search or filters." : "Add your first domain to get started."}
          </p>
          {!hasFilters && (
            <Button asChild>
              <Link href="/add">
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Domain
              </Link>
            </Button>
          )}
        </div>
      )}

      {/* Grid view */}
      {viewMode === "grid" && filtered.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((domain) => (
            <DomainCard
              key={domain.id}
              domain={domain}
              onEdit={setEditTarget}
              onDelete={setDeleteTarget}
              onRenew={handleRenew}
            />
          ))}
        </div>
      )}

      {/* List view */}
      {viewMode === "list" && filtered.length > 0 && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3">
                    <SortHeader label="Domain" sortKey="name" current={sortKey} dir={sortDir} onSort={handleSort} />
                  </th>
                  <th className="text-left px-4 py-3">
                    <SortHeader label="Registrar" sortKey="registrar" current={sortKey} dir={sortDir} onSort={handleSort} />
                  </th>
                  <th className="text-left px-4 py-3">
                    <SortHeader label="Status" sortKey="status" current={sortKey} dir={sortDir} onSort={handleSort} />
                  </th>
                  <th className="text-left px-4 py-3">
                    <SortHeader label="Expiry" sortKey="expiryDate" current={sortKey} dir={sortDir} onSort={handleSort} />
                  </th>
                  <th className="text-left px-4 py-3">
                    <SortHeader label="Cost/yr" sortKey="renewalCost" current={sortKey} dir={sortDir} onSort={handleSort} />
                  </th>
                  <th className="text-left px-4 py-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Auto</span>
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((domain) => {
                  const colors = getStatusColors(domain.status);
                  return (
                    <tr key={domain.id} className="border-b border-border last:border-0 hover:bg-accent/40 transition-colors group">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Globe className={cn("h-4 w-4 flex-shrink-0", colors.text)} />
                          <span className="font-medium text-sm">{domain.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{domain.registrar}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={domain.status} />
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("text-sm font-medium", colors.text)}>
                          {getExpiryLabel(domain.expiryDate)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{formatCurrency(domain.renewalCost)}</td>
                      <td className="px-4 py-3">
                        <span className={cn("text-xs font-medium", domain.autoRenew ? "text-emerald-500" : "text-muted-foreground")}>
                          {domain.autoRenew ? "On" : "Off"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <DomainActions
                            domain={domain}
                            onEdit={setEditTarget}
                            onDelete={setDeleteTarget}
                            onRenew={handleRenew}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete domain?</DialogTitle>
            <DialogDescription>
              This will permanently remove <strong>{deleteTarget?.name}</strong> from your tracker. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      {editTarget && (
        <EditDomainDialog
          domain={editTarget}
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
        />
      )}
    </div>
  );
}
