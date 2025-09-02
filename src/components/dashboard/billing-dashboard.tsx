"use client";

import { NewItemDialog } from "@/components/dashboard/new-item-dialog";
import { NewPartyDialog } from "@/components/dashboard/new-party-dialog";
import SearchFilters from "@/components/dashboard/search-filters";
import MainBillingTable from "@/components/dashboard/main-billing-table";
import TotalsSummary from "@/components/dashboard/totals-summary";

export default function BillingDashboard() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-4 border-b bg-background/80 backdrop-blur-sm md:px-6">
        <h1 className="text-xl font-bold md:text-2xl font-headline text-primary">BillTrack Pro</h1>
        <div className="flex items-center gap-2">
          <NewItemDialog />
          <NewPartyDialog />
        </div>
      </header>
      <main className="flex-1 p-4 md:p-6 space-y-4">
        <SearchFilters />
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div className="lg:col-span-2 xl:col-span-3">
            <MainBillingTable />
          </div>
          <div className="lg:col-span-1 xl:col-span-1">
            <TotalsSummary />
          </div>
        </div>
      </main>
    </div>
  );
}
