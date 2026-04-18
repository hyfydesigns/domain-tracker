"use client";

import { useState } from "react";
import { Bell, Palette, Globe, Trash2, Download, RefreshCw } from "lucide-react";
import { useTheme } from "next-themes";

import { useDomainStore } from "@/store/domain-store";
import { domainsToCSV, domainsToJSON, downloadFile, formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const settings = useDomainStore((s) => s.settings);
  const updateSettings = useDomainStore((s) => s.updateSettings);
  const domains = useDomainStore((s) => s.domains);
  const { toast } = useToast();
  const [confirmClear, setConfirmClear] = useState(false);
  const [emailInput, setEmailInput] = useState(settings.notifications.emailAddress);

  function patchNotifications(patch: Partial<typeof settings.notifications>) {
    updateSettings({ notifications: { ...settings.notifications, ...patch } });
  }

  function handleSaveEmail() {
    patchNotifications({ emailAddress: emailInput });
    toast({ title: "Settings saved", description: "Email address updated." });
  }

  function handleClearData() {
    // Clear localStorage directly and reload
    localStorage.removeItem("domain-tracker-store");
    window.location.reload();
  }

  const totalValue = domains.reduce((s, d) => s + d.renewalCost, 0);

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-8 animate-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your preferences and data</p>
      </div>

      {/* Notifications */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Notifications</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Email Notifications</p>
              <p className="text-xs text-muted-foreground">Receive expiry alerts via email</p>
            </div>
            <Switch
              checked={settings.notifications.emailEnabled}
              onCheckedChange={(v) => patchNotifications({ emailEnabled: v })}
            />
          </div>

          {settings.notifications.emailEnabled && (
            <div className="space-y-2 pl-0">
              <Label htmlFor="email">Email Address</Label>
              <div className="flex gap-2">
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                />
                <Button variant="outline" size="sm" onClick={handleSaveEmail}>
                  Save
                </Button>
              </div>
            </div>
          )}

          <Separator />

          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Alert Windows
          </p>

          {[
            { key: "notify30Days", label: "30 days before expiry", desc: "Most common alert threshold" },
            { key: "notify60Days", label: "60 days before expiry", desc: "Early warning for manual renewals" },
            { key: "notify90Days", label: "90 days before expiry", desc: "Maximum lead time" },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <Switch
                checked={settings.notifications[key as keyof typeof settings.notifications] as boolean}
                onCheckedChange={(v) => patchNotifications({ [key]: v })}
              />
            </div>
          ))}

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Browser Notifications</p>
              <p className="text-xs text-muted-foreground">In-app push alerts (when open)</p>
            </div>
            <Switch
              checked={settings.notifications.browserNotifications}
              onCheckedChange={(v) => patchNotifications({ browserNotifications: v })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Appearance</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Theme</p>
              <p className="text-xs text-muted-foreground">Choose your color scheme</p>
            </div>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Default View</p>
              <p className="text-xs text-muted-foreground">How domains are listed by default</p>
            </div>
            <Select
              value={settings.defaultView}
              onValueChange={(v) => updateSettings({ defaultView: v as "list" | "grid" })}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="list">List</SelectItem>
                <SelectItem value="grid">Grid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Data */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Portfolio Summary</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-muted-foreground text-xs mb-1">Total Domains</p>
              <p className="font-bold text-lg">{domains.length}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-muted-foreground text-xs mb-1">Annual Cost</p>
              <p className="font-bold text-lg">{formatCurrency(totalValue)}</p>
            </div>
          </div>

          <Separator />

          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Export Data
          </p>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadFile(domainsToCSV(domains), "domains.csv", "text/csv")}
              disabled={!domains.length}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadFile(domainsToJSON(domains), "domains.json", "application/json")}
              disabled={!domains.length}
            >
              <Download className="h-4 w-4 mr-2" />
              Export JSON
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive/30">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Trash2 className="h-4 w-4 text-destructive" />
            <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Clear All Data</p>
              <p className="text-xs text-muted-foreground">Delete all domains and reset to sample data</p>
            </div>
            <Button variant="destructive" size="sm" onClick={() => setConfirmClear(true)}>
              Clear Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirm clear dialog */}
      <Dialog open={confirmClear} onOpenChange={setConfirmClear}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Clear all data?</DialogTitle>
            <DialogDescription>
              This will delete all {domains.length} domains and reset the app. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmClear(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleClearData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Clear & Reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
