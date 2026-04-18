"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Globe,
  PlusCircle,
  Settings,
  Bell,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
  Monitor,
  Menu,
  X,
  Zap,
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { useDomainStore } from "@/store/domain-store";
import { getDaysUntilExpiry } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/domains", label: "Domains", icon: Globe },
  { href: "/add", label: "Add Domain", icon: PlusCircle },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const domains = useDomainStore((s) => s.domains);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Count alerts for badge
  const alertCount = domains.filter(
    (d) => getDaysUntilExpiry(d.expiryDate) >= 0 && getDaysUntilExpiry(d.expiryDate) <= 30
  ).length;

  const themeIcons = {
    light: <Sun className="h-4 w-4" />,
    dark: <Moon className="h-4 w-4" />,
    system: <Monitor className="h-4 w-4" />,
  };
  const nextTheme = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg bg-card border border-border shadow-sm"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed md:sticky top-0 left-0 h-screen z-50 md:z-auto",
          "flex flex-col bg-card border-r border-border",
          "transition-all duration-300 ease-in-out",
          collapsed ? "w-[72px]" : "w-[240px]",
          // Mobile: off-canvas slide
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className={cn(
          "flex items-center h-16 px-4 border-b border-border",
          collapsed ? "justify-center" : "justify-between"
        )}>
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <span
                className="font-bold text-base tracking-tight"
                style={{ fontFamily: "var(--font-display)" }}
              >
                DomainTracker
              </span>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" />
            </div>
          )}

          {/* Collapse toggle (desktop only) */}
          <button
            className={cn(
              "hidden md:flex items-center justify-center w-6 h-6 rounded-full",
              "border border-border bg-background hover:bg-accent",
              "transition-colors text-muted-foreground hover:text-foreground",
              collapsed && "mt-0"
            )}
            onClick={() => setCollapsed(!collapsed)}
            aria-label="Toggle sidebar"
          >
            {collapsed ? (
              <ChevronRight className="h-3 w-3" />
            ) : (
              <ChevronLeft className="h-3 w-3" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium",
                  "transition-all duration-150 group relative",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent",
                  collapsed && "justify-center px-2"
                )}
              >
                <Icon className={cn("h-4 w-4 flex-shrink-0", isActive && "text-primary-foreground")} />
                {!collapsed && <span>{label}</span>}

                {/* Alert badge on Domains link */}
                {href === "/domains" && alertCount > 0 && !collapsed && (
                  <span className={cn(
                    "ml-auto text-xs font-bold px-1.5 py-0.5 rounded-full",
                    isActive ? "bg-white/20 text-white" : "bg-amber-500/15 text-amber-500"
                  )}>
                    {alertCount}
                  </span>
                )}
                {href === "/domains" && alertCount > 0 && collapsed && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full" />
                )}

                {/* Tooltip on collapsed */}
                {collapsed && (
                  <span className="absolute left-full ml-2 px-2 py-1 rounded-md bg-popover border border-border text-popover-foreground text-xs whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-md">
                    {label}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Alerts section */}
          {!collapsed && alertCount > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs font-semibold text-muted-foreground px-3 mb-2 uppercase tracking-wider">
                Alerts
              </p>
              <div className="px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center gap-2">
                  <Bell className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                    {alertCount} domain{alertCount > 1 ? "s" : ""} expiring soon
                  </span>
                </div>
              </div>
            </div>
          )}
        </nav>

        {/* Footer: theme toggle + domain count */}
        <div className={cn(
          "px-3 py-4 border-t border-border space-y-2",
          collapsed && "flex flex-col items-center"
        )}>
          {!collapsed && (
            <div className="px-3 py-2 rounded-lg bg-muted/50 mb-2">
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{domains.length}</span>
                {" "}domains tracked
              </p>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(nextTheme)}
            className={cn(
              "w-full text-muted-foreground hover:text-foreground",
              collapsed ? "px-2 justify-center" : "justify-start gap-2"
            )}
          >
            {theme ? themeIcons[theme as keyof typeof themeIcons] ?? themeIcons.system : themeIcons.system}
            {!collapsed && (
              <span className="text-sm capitalize">{theme ?? "system"} mode</span>
            )}
          </Button>
        </div>
      </aside>
    </>
  );
}
