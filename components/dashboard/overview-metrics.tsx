"use client"

import Image from "next/image"
import { MetricCard } from "./metric-card"

interface MetricData {
  title: string
  value: string
  change: string
  icon: string
  iconBg: string
}

interface OverviewMetricsProps {
  metrics?: {
    totalPayments: number;
    totalAmountSent: string;
    successRate: string;
    activeBatches: number;
  };
  loading?: boolean;
}

const defaultMetricsData: MetricData[] = [
  {
    title: "Total Payments",
    value: "24,567",
    change: "+12.5%",
    icon: "/1.svg",
    iconBg: "bg-teal-500/20",
  },
  {
    title: "Total Amount Sent",
    value: "$1.2M",
    change: "+8.2%",
    icon: "/2.svg",
    iconBg: "bg-blue-500/20",
  },
  {
    title: "Success Rate",
    value: "98.7%",
    change: "+2.1%",
    icon: "/3.svg",
    iconBg: "bg-green-500/20",
  },
  {
    title: "Active Batches",
    value: "12",
    change: "Live",
    icon: "/4.svg",
    iconBg: "bg-purple-500/20",
  },
]

export function OverviewMetrics({ metrics, loading }: OverviewMetricsProps) {
  const metricsData = metrics ? [
    {
      title: "Total Payments",
      value: metrics.totalPayments.toLocaleString(),
      change: loading ? "Loading..." : "+12.5%",
      icon: "/1.svg",
      iconBg: "bg-teal-500/20",
    },
    {
      title: "Total Amount Sent",
      value: `${metrics.totalAmountSent} XLM`,
      change: loading ? "Loading..." : "+8.2%",
      icon: "/2.svg",
      iconBg: "bg-blue-500/20",
    },
    {
      title: "Success Rate",
      value: metrics.successRate,
      change: loading ? "Loading..." : "+2.1%",
      icon: "/3.svg",
      iconBg: "bg-green-500/20",
    },
    {
      title: "Active Batches",
      value: metrics.activeBatches.toString(),
      change: loading ? "Loading..." : "Live",
      icon: "/4.svg",
      iconBg: "bg-purple-500/20",
    },
  ] : defaultMetricsData;

  return (
    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {metricsData.map((metric, index) => (
        <MetricCard key={metric.title} {...metric} index={index} />
      ))}
    </div>
  )
}
