"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Upload, FileText, Search, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import Papa from "papaparse";

import { useDomainStore } from "@/store/domain-store";
import { DomainForm, type DomainFormValues } from "@/components/domains/domain-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type LookupState = "idle" | "loading" | "found" | "error";

interface LookupResult {
  name: string;
  registrar: string;
  purchaseDate: string;
  expiryDate: string;
}

export default function AddDomainPage() {
  const router = useRouter();
  const addDomain = useDomainStore((s) => s.addDomain);
  const importDomains = useDomainStore((s) => s.importDomains);
  const { toast } = useToast();

  // Lookup state
  const [lookupInput, setLookupInput] = useState("");
  const [lookupState, setLookupState] = useState<LookupState>("idle");
  const [lookupError, setLookupError] = useState("");
  const [prefilled, setPrefilled] = useState<Partial<DomainFormValues> | null>(null);

  // CSV state
  const [csvPreview, setCsvPreview] = useState<string[][]>([]);
  const [csvData, setCsvData] = useState<Record<string, string>[]>([]);

  async function handleLookup() {
    const domain = lookupInput.trim();
    if (!domain) return;

    setLookupState("loading");
    setLookupError("");
    setPrefilled(null);

    try {
      const res = await fetch(`/api/lookup?domain=${encodeURIComponent(domain)}`);
      const data = await res.json();

      if (!res.ok) {
        setLookupState("error");
        setLookupError(data.error ?? "Lookup failed");
        // Still pre-fill the domain name so the user can fill in the rest
        setPrefilled({ name: domain.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0] });
        return;
      }

      const result = data as LookupResult;
      setLookupState("found");
      setPrefilled({
        name: result.name,
        registrar: result.registrar || undefined,
        purchaseDate: result.purchaseDate || undefined,
        expiryDate: result.expiryDate || undefined,
      });
    } catch {
      setLookupState("error");
      setLookupError("Network error — enter details manually");
      setPrefilled({ name: domain });
    }
  }

  function handleSubmit(values: DomainFormValues) {
    const domain = addDomain({
      name: values.name,
      registrar: values.registrar,
      purchaseDate: values.purchaseDate,
      expiryDate: values.expiryDate,
      renewalCost: values.renewalCost,
      autoRenew: values.autoRenew,
      notes: values.notes,
      tags: values.tags.split(",").map((t) => t.trim()).filter(Boolean),
    });
    toast({ title: "Domain added", description: `${domain.name} was added to your tracker.` });
    router.push("/domains");
  }

  function handleCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const rows = result.data as Record<string, string>[];
        setCsvData(rows);
        const preview = [Object.keys(rows[0] || {}), ...rows.slice(0, 5).map(Object.values)];
        setCsvPreview(preview);
      },
    });
    e.target.value = "";
  }

  function handleImport() {
    if (!csvData.length) return;
    const today = new Date().toISOString().split("T")[0];
    const domains = csvData.map((row) => ({
      name: (row.name || row.domain || "").toLowerCase().trim(),
      registrar: row.registrar || "Other",
      purchaseDate: row.purchaseDate || row.purchase_date || today,
      expiryDate: row.expiryDate || row.expiry_date || row.expiration_date || today,
      renewalCost: parseFloat(row.renewalCost || row.renewal_cost || "12.99") || 12.99,
      autoRenew: row.autoRenew === "true" || row.auto_renew === "true",
      notes: row.notes || "",
      tags: (row.tags || "").split("|").map((t: string) => t.trim()).filter(Boolean),
    })).filter((d) => d.name);
    importDomains(domains);
    toast({ title: `${domains.length} domains imported`, description: "Your domains have been added to the tracker." });
    router.push("/domains");
  }

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto animate-in">
      {/* Header */}
      <div className="mb-8">
        <Link href="/domains" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Domains
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Add Domain</h1>
        <p className="text-muted-foreground text-sm mt-1">Track a new domain in your portfolio</p>
      </div>

      <Tabs defaultValue="lookup">
        <TabsList className="mb-6">
          <TabsTrigger value="lookup">
            <Search className="h-4 w-4 mr-2" />
            Auto-Lookup
          </TabsTrigger>
          <TabsTrigger value="manual">
            <FileText className="h-4 w-4 mr-2" />
            Manual Entry
          </TabsTrigger>
          <TabsTrigger value="import">
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </TabsTrigger>
        </TabsList>

        {/* ── Auto-Lookup tab ── */}
        <TabsContent value="lookup" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Look up a domain</CardTitle>
              <p className="text-sm text-muted-foreground">
                Enter a domain name and we'll fetch the registrar and dates automatically via RDAP.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="example.com"
                  value={lookupInput}
                  onChange={(e) => {
                    setLookupInput(e.target.value);
                    if (lookupState !== "idle") { setLookupState("idle"); setPrefilled(null); }
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                  disabled={lookupState === "loading"}
                />
                <Button onClick={handleLookup} disabled={!lookupInput.trim() || lookupState === "loading"}>
                  {lookupState === "loading" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {lookupState === "found" && (
                <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                  Domain info found — review and save below.
                </div>
              )}

              {lookupState === "error" && (
                <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {lookupError} — fill in the remaining fields below.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Show form once lookup has run (success or partial) */}
          {prefilled !== null && (
            <Card className="animate-in">
              <CardContent className="pt-6">
                <DomainForm
                  key={prefilled.name}
                  defaultValues={prefilled}
                  onSubmit={handleSubmit}
                  onCancel={() => router.push("/domains")}
                  submitLabel="Add Domain"
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Manual entry tab ── */}
        <TabsContent value="manual">
          <Card>
            <CardContent className="pt-6">
              <DomainForm onSubmit={handleSubmit} submitLabel="Add Domain" />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── CSV import tab ── */}
        <TabsContent value="import">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Import from CSV</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Upload a CSV with columns:{" "}
                {["name", "registrar", "expiryDate", "renewalCost", "autoRenew"].map((c) => (
                  <code key={c} className="text-xs bg-muted px-1.5 py-0.5 rounded mx-0.5">{c}</code>
                ))}
              </p>

              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-xl cursor-pointer hover:bg-accent/50 transition-colors">
                <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">
                  {csvData.length > 0 ? `${csvData.length} rows loaded` : "Click to upload CSV"}
                </span>
                <input type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} />
              </label>

              {csvPreview.length > 0 && (
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-xs">
                    <tbody>
                      {csvPreview.map((row, i) => (
                        <tr key={i} className={cn(i === 0 ? "bg-muted font-semibold" : "border-t border-border")}>
                          {row.slice(0, 6).map((cell, j) => (
                            <td key={j} className="px-3 py-2 truncate max-w-[120px]">{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {csvData.length > 5 && (
                    <p className="text-xs text-muted-foreground px-3 py-2 border-t border-border">
                      +{csvData.length - 5} more rows…
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" asChild>
                  <Link href="/domains">Cancel</Link>
                </Button>
                <Button onClick={handleImport} disabled={!csvData.length}>
                  Import {csvData.length > 0 ? `${csvData.length} Domains` : ""}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
