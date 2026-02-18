"use client"

import * as React from "react"
import {
  Calendar,
  Clock3,
  History,
  Megaphone,
  Package,
  RefreshCcw,
  ShoppingCart,
  XCircle,
} from "lucide-react"

import Header from "@/components/layout/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { apiFetch } from "@/lib/auth"

type RangeKey = "today" | "7d" | "30d" | "month" | "custom"

type DashboardRange = {
  key: RangeKey
  label: string
  start_date: string
  end_date: string
}

type HistoryCampaign = {
  id: string
  uid: string
  chef: string
  title: string
  campaign_description: string
  status: string
  start_time: string | null
  end_time: string | null
  delivery_time: string | null
  quantity_available: number
  total_orders: number
  source: "campaign" | "campaign_history"
  food_items: Array<{
    uid: string
    food_name: string
    campaign_quantity: number
  }>
}

type HistorySummary = {
  total_campaigns: number
  completed_campaigns: number
  cancelled_campaigns: number
  total_orders: number
}

type CampaignHistoryResponse = {
  chef: string
  range: DashboardRange
  summary: HistorySummary
  campaigns: HistoryCampaign[]
}

type RangeFilter = {
  range: RangeKey
  start_date: string
  end_date: string
}

const numberFormatter = new Intl.NumberFormat("en-US")

function formatNumber(value: number) {
  return numberFormatter.format(Math.round(value || 0))
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "N/A"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "N/A"
  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function statusClass(status: string) {
  const normalized = status.trim().toLowerCase()
  if (["completed", "ended", "expired"].includes(normalized)) {
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200"
  }
  if (normalized === "cancelled") {
    return "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-200"
  }
  return "bg-slate-100 text-slate-800 dark:bg-slate-500/20 dark:text-slate-200"
}

function buildRangeQuery(filter: RangeFilter) {
  const params = new URLSearchParams({ range: filter.range })
  if (filter.range === "custom") {
    params.set("start_date", filter.start_date)
    params.set("end_date", filter.end_date)
  }
  return params
}

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string
  value: string
  subtitle: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <Card className="border-border/70 bg-card/95 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardDescription className="text-muted-foreground text-sm font-medium">{title}</CardDescription>
          <span className="text-muted-foreground bg-muted/50 border-border rounded-lg border p-2">
            <Icon className="size-4" />
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        <p className="text-foreground text-2xl font-semibold tracking-tight">{value}</p>
        <p className="text-muted-foreground text-xs">{subtitle}</p>
      </CardContent>
    </Card>
  )
}

export default function CampaignHistoryPage() {
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null)
  const [data, setData] = React.useState<CampaignHistoryResponse | null>(null)
  const [search, setSearch] = React.useState("")

  const [filterDraft, setFilterDraft] = React.useState<RangeFilter>({
    range: "30d",
    start_date: "",
    end_date: "",
  })
  const [appliedFilter, setAppliedFilter] = React.useState<RangeFilter>({
    range: "30d",
    start_date: "",
    end_date: "",
  })

  const loadHistory = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = buildRangeQuery(appliedFilter)
      const response = await apiFetch<CampaignHistoryResponse>(`/campaign/history/?${params.toString()}`)
      setData(response)
      setLastUpdated(new Date())
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Unable to load campaign history."
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [appliedFilter])

  React.useEffect(() => {
    void loadHistory()
  }, [loadHistory])

  const handleApplyFilters = () => {
    if (filterDraft.range === "custom") {
      if (!filterDraft.start_date || !filterDraft.end_date) {
        setError("Custom range requires both start and end dates.")
        return
      }
      if (filterDraft.start_date > filterDraft.end_date) {
        setError("Custom range start date cannot be after end date.")
        return
      }
    }
    setAppliedFilter(filterDraft)
  }

  const campaigns = data?.campaigns ?? []
  const filteredCampaigns = campaigns.filter((campaign) => {
    return (
      campaign.title.toLowerCase().includes(search.toLowerCase()) ||
      (campaign.campaign_description || "").toLowerCase().includes(search.toLowerCase())
    )
  })

  return (
    <>
      <Header />
      <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
        <section className="from-muted/50 via-background to-muted/20 border-border relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-orange-200/45 blur-3xl dark:bg-orange-700/25" />
          <div className="absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-sky-200/55 blur-3xl dark:bg-sky-700/25" />

          <div className="relative space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-foreground font-display text-3xl font-semibold tracking-tight">Campaign History</h1>
                <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
                  Review completed/cancelled campaigns and evaluate order outcomes over time.
                </p>
                <p className="text-muted-foreground/90 mt-3 text-xs">
                  Last updated: {lastUpdated ? formatDateTime(lastUpdated.toISOString()) : "Not loaded yet"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void loadHistory()}
                className="bg-background text-foreground border-border inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-muted/70"
              >
                <RefreshCcw className="size-4" />
                Refresh
              </button>
            </div>

            <div className="bg-background/80 border-border grid gap-3 rounded-xl border p-3 md:grid-cols-6">
              <select
                value={filterDraft.range}
                onChange={(event) => {
                  const nextRange = event.target.value as RangeKey
                  setFilterDraft((current) => ({
                    ...current,
                    range: nextRange,
                    start_date: nextRange === "custom" ? current.start_date : "",
                    end_date: nextRange === "custom" ? current.end_date : "",
                  }))
                }}
                className="bg-background text-foreground border-border rounded-lg border px-3 py-2 text-sm"
              >
                <option value="today">Today</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="month">This Month</option>
                <option value="custom">Custom Range</option>
              </select>
              <input
                type="date"
                value={filterDraft.start_date}
                onChange={(event) =>
                  setFilterDraft((current) => ({ ...current, start_date: event.target.value }))
                }
                disabled={filterDraft.range !== "custom"}
                className="bg-background text-foreground border-border rounded-lg border px-3 py-2 text-sm disabled:opacity-60"
              />
              <input
                type="date"
                value={filterDraft.end_date}
                onChange={(event) =>
                  setFilterDraft((current) => ({ ...current, end_date: event.target.value }))
                }
                disabled={filterDraft.range !== "custom"}
                className="bg-background text-foreground border-border rounded-lg border px-3 py-2 text-sm disabled:opacity-60"
              />
              <button
                type="button"
                onClick={handleApplyFilters}
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                Apply
              </button>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search campaigns"
                className="bg-background text-foreground border-border rounded-lg border px-3 py-2 text-sm md:col-span-2"
              />
            </div>
          </div>
        </section>

        {loading ? (
          <Card className="border-border/70 bg-card/95 shadow-sm">
            <CardContent className="py-8 text-sm text-muted-foreground">Loading campaign history...</CardContent>
          </Card>
        ) : null}

        {!loading && error ? (
          <Card className="border-red-300/70 bg-red-50/80 dark:border-red-900 dark:bg-red-950/30">
            <CardHeader>
              <CardTitle className="text-red-700 dark:text-red-300">Failed to load campaign history</CardTitle>
              <CardDescription className="text-red-700/80 dark:text-red-200/80">{error}</CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        {!loading && !error ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                title="Total Campaigns"
                value={formatNumber(data?.summary.total_campaigns ?? 0)}
                subtitle={data?.range?.label ?? "Selected range"}
                icon={History}
              />
              <MetricCard
                title="Completed"
                value={formatNumber(data?.summary.completed_campaigns ?? 0)}
                subtitle="Finished campaigns"
                icon={Megaphone}
              />
              <MetricCard
                title="Cancelled"
                value={formatNumber(data?.summary.cancelled_campaigns ?? 0)}
                subtitle="Stopped campaigns"
                icon={XCircle}
              />
              <MetricCard
                title="Orders Collected"
                value={formatNumber(data?.summary.total_orders ?? 0)}
                subtitle="Total orders from history"
                icon={ShoppingCart}
              />
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              {filteredCampaigns.map((campaign) => (
                <Card key={`${campaign.source}-${campaign.id}`} className="border-border/70 bg-card/95 shadow-sm">
                  <CardHeader className="space-y-2 pb-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-foreground text-base">{campaign.title}</CardTitle>
                        <CardDescription className="text-muted-foreground mt-1 text-sm">
                          {campaign.campaign_description || "No description"}
                        </CardDescription>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(campaign.status)}`}>
                        {campaign.status || "unknown"}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="bg-muted/35 border-border rounded-lg border px-3 py-2 text-xs">
                        <p className="text-muted-foreground inline-flex items-center gap-1">
                          <Calendar className="size-3.5" /> Start
                        </p>
                        <p className="text-foreground mt-1 font-medium">{formatDateTime(campaign.start_time)}</p>
                      </div>
                      <div className="bg-muted/35 border-border rounded-lg border px-3 py-2 text-xs">
                        <p className="text-muted-foreground inline-flex items-center gap-1">
                          <Clock3 className="size-3.5" /> End
                        </p>
                        <p className="text-foreground mt-1 font-medium">{formatDateTime(campaign.end_time)}</p>
                      </div>
                      <div className="bg-muted/35 border-border rounded-lg border px-3 py-2 text-xs">
                        <p className="text-muted-foreground inline-flex items-center gap-1">
                          <Package className="size-3.5" /> Quantity
                        </p>
                        <p className="text-foreground mt-1 font-medium">{formatNumber(campaign.quantity_available)}</p>
                      </div>
                      <div className="bg-muted/35 border-border rounded-lg border px-3 py-2 text-xs">
                        <p className="text-muted-foreground inline-flex items-center gap-1">
                          <ShoppingCart className="size-3.5" /> Orders
                        </p>
                        <p className="text-foreground mt-1 font-medium">{formatNumber(campaign.total_orders)}</p>
                      </div>
                    </div>

                    {campaign.food_items?.length ? (
                      <div className="space-y-1">
                        <p className="text-muted-foreground text-xs">Foods</p>
                        <div className="flex flex-wrap gap-2">
                          {campaign.food_items.map((food) => (
                            <span
                              key={`${campaign.id}-${food.uid}`}
                              className="bg-muted/35 border-border rounded-full border px-2.5 py-1 text-xs text-foreground"
                            >
                              {food.food_name} x {formatNumber(food.campaign_quantity)}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              ))}
            </div>

            {!filteredCampaigns.length ? (
              <Card className="border-border/70 bg-card/95 shadow-sm">
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  No campaign history found for the current filters.
                </CardContent>
              </Card>
            ) : null}
          </>
        ) : null}
      </div>
    </>
  )
}
