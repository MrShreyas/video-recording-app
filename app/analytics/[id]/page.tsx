"use client"

import AnalyticsDashboard from "@/components/analytics-dashboard"
import { useParams } from "next/navigation"

export default function AnalyticsPage() {
  const { id } = useParams<{ id: string }>()
  return (
    <div className="min-h-screen bg-background">
      <AnalyticsDashboard id={id} />
    </div>
  )
}
