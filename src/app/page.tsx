"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import {
  Globe,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  PlusCircle,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { useDomainStore } from "@/store/domain-store";
import {
  computeDashboardStats,
  buildExpiryChartData,
  getStatusColors,
  getStatusLabel,
  getExpiryLabel,
  formatCurrency,
  getDaysUntilExpiry,
} from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DomainActivity } from "@/types";

function ActivityIcon({ type }: { type: DomainActivity["type"] }) {
  switch (type) {
    case "added":
      return <PlusCircle className="h-4 w-4 text-emerald-500" />;
    case "renewed":
      return <RefreshCw className="h-4 w-4 text-indigo-400" />;
    case "edited":
      return <CheckCircle2 className="h-4 w-4 text-blue-400" />;
    case "deleted":
      return <XCircle className="h-4 w-4 text-red-400" />;
    case "expiry-warning":
      return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
}

export default function DashboardPage() {
  const domains = useDomainStore((s) => s.domains);
  const activity = useDomainStore((s) => s.activity);
  const isLoading = useDomainStore((s) => s.isLoading);

  const stats = useMemo(() => computeDashboardStats(domains), [domains]);
  const chartData = useMemo(() => buildExpiryChartData(domains), [domains]);

  const urgentDomains = useMemo(
    () =>
      domains
        .filter((d) => {
          const days = getDaysUntilExpiry(d.expiryDate);
          return days >= 0 && days <= 30;
        })
        .sort((a, b) => getDaysUntilExpiry(a.expiryDate) - getDaysUntilExpiry(b.expiryDate))
        .slice(0, 5),
    [domains]
  );

  const statCards = [
    {
      title: "Total Domains",
      value: stats.totalDomains,
      icon: Globe,
      color: "text-primary",
      bg: "bg-primary/10",
      stagger: "stagger-1",
    },
    {
      title: "Expiring Soon",
      value: stats.expiringSoon,
      icon: AlertTriangle,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      stagger: "stagger-2",
    },
    {
      title: "Expired",
      value: stats.expired,
      icon: XCircle,
      color: "text-red-500",
      bg: "bg-red-500/10",
      stagger: "stagger-3",
    },
    {
      title: "Annual Cost",
      value: formatCurrency(stats.totalValue),
      icon: DollarSign,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      stagger: "stagger-4",
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Overview of your domain portfolio
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/add">
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Domain
          </Link>
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ title, value, icon: Icon, color, bg, stagger }) => (
          <Card key={title} className={cn("animate-in", stagger)}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-muted-foreground font-medium">{title}</p>
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", bg)}>
                  <Icon className={cn("h-4 w-4", color)} />
                </div>
              </div>
              <p className={cn("text-2xl font-bold tracking-tight", color)}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Expiry chart */}
        <Card className="lg:col-span-3 animate-in stagger-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Upcoming Expirations</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">Domains expiring over the next 12 months</p>
          </CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "hsl(var(--foreground))",
                  }}
                  cursor={{ fill: "hsl(var(--muted))" }}
                  formatter={(v: number) => [v, "domains"]}
                />
                <Bar
                  dataKey="expiring"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={36}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Urgent attention */}
        <Card className="lg:col-span-2 animate-in stagger-3">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Needs Attention</CardTitle>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-xs text-muted-foreground">Expiring within 30 days</p>
          </CardHeader>
          <CardContent className="pt-0">
            {urgentDomains.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2" />
                <p className="text-sm font-medium">All clear!</p>
                <p className="text-xs text-muted-foreground mt-1">No domains expiring soon</p>
              </div>
            ) : (
              <div className="space-y-2">
                {urgentDomains.map((domain) => {
                  const colors = getStatusColors(domain.status);
                  const days = getDaysUntilExpiry(domain.expiryDate);
                  return (
                    <Link
                      key={domain.id}
                      href="/domains"
                      className="flex items-center justify-between p-2.5 rounded-lg hover:bg-accent transition-colors group"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{domain.name}</p>
                        <p className={cn("text-xs", colors.text)}>
                          {days === 0 ? "Expires today" : `${days}d left`}
                        </p>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </Link>
                  );
                })}
                {stats.expiringSoon > 5 && (
                  <Link
                    href="/domains"
                    className="flex items-center gap-1 text-xs text-primary hover:underline px-2.5 pt-1"
                  >
                    +{stats.expiringSoon - 5} more
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent activity */}
      <Card className="animate-in stagger-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Recent Activity</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {activity.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No activity yet</p>
          ) : (
            <div className="space-y-1">
              {activity.slice(0, 8).map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 py-2.5 px-2 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="mt-0.5 flex-shrink-0">
                    <ActivityIcon type={item.type} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">{item.message}</p>
                  </div>
                  <p className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                    {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
