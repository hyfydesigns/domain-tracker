// ============================================================
// DomainTracker - Root Layout
// ============================================================

import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { Sidebar } from "@/components/shared/sidebar";
import { Toaster } from "@/components/ui/toaster";
import { StoreInitializer } from "@/components/shared/store-initializer";

export const metadata: Metadata = {
  title: "DomainTracker — Manage Your Domain Portfolio",
  description:
    "Professional domain portfolio management. Track expiry dates, renewals, registrars, and get alerts before domains lapse.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-background antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* Initialize store with sample data on first load */}
          <StoreInitializer />

          {/* Main app layout: sidebar + content */}
          <div className="app-layout">
            <Sidebar />
            <main className="flex-1 overflow-auto min-h-screen pt-14 md:pt-0">
              {children}
            </main>
          </div>

          {/* Toast notifications */}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
