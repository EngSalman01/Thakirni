"use client";

import { VaultSidebar } from "@/components/thakirni/vault-sidebar";
import { DashboardRouter } from "@/components/thakirni/dashboard-router";

export default function VaultPage() {
  return (
    <div className="min-h-screen bg-background">
      <VaultSidebar />

      <main className="lg:me-64 transition-all duration-300">
        <DashboardRouter />
      </main>
    </div>
  );
}
