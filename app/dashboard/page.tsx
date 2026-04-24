"use client";

import { RecentBatchesTable } from "@/components/dashboard/RecentBatchesTable";
import { OverviewMetrics } from "@/components/dashboard/overview-metrics";
import { PaymentVolumeChart } from "@/components/dashboard/PaymentVolumeChart";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { DeveloperResources } from "@/components/dashboard/developer-resources";
import { useFreighter } from "@/hooks/use-freighter";
import { useDashboardMetrics } from "@/hooks/use-dashboard-metrics";

export default function DashboardPage() {
  const { publicKey } = useFreighter();
  const { metrics, loading } = useDashboardMetrics(publicKey, "testnet"); // Assuming testnet for now

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Dashboard Overview
        </h1>
        <p className="text-gray-400">
          Monitor your batch payment operations and performance
        </p>
      </div>

      {/* Overview Metrics */}
      <OverviewMetrics metrics={metrics} loading={loading} />

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Quick Actions Column */}
        <div className="lg:col-span-1">
          <QuickActions />
        </div>

        {/* Payment Volume Chart */}
        <div className="lg:col-span-2">
          <PaymentVolumeChart />
        </div>
      </div>

      {/* Recent Batches Table Section */}
      <RecentBatchesTable />

      {/* Developer Resources Section */}
      <DeveloperResources />
    </div>
  );
}
