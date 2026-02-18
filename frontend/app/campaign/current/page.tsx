"use client"

import * as React from "react"
import {
  AlertTriangle,
  Calendar,
  Clock3,
  Megaphone,
  Package,
  PauseCircle,
  PlayCircle,
  RefreshCcw,
  ShoppingCart,
  StopCircle,
} from "lucide-react"

import Header from "@/components/layout/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { apiFetch } from "@/lib/auth"

type CampaignFood = {
  uid: string
  food_name: string
  campaign_quantity: number
}

type CampaignItem = {
  id: string
  uid: string
  title: string
  campaign_description: string
  status: string
  food_status: string
  start_time: string | null
  end_time: string | null
  delivery_time: string | null
  quantity_available: number
  total_orders: number
  food_items: CampaignFood[]
}

type CurrentCampaignSummary = {
  total_current: number
  running_now: number
  scheduled: number
  ending_today: number
}

type CampaignCurrentResponse = {
  chef: string
  summary: CurrentCampaignSummary
  campaigns: CampaignItem[]
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

function normalizeStatus(status: string) {
  const normalized = status.trim().toLowerCase()
  if (normalized === "running") return "running"
  if (normalized === "scheduled") return "scheduled"
  if (normalized === "completed") return "completed"
  if (normalized === "cancelled") return "cancelled"
  return normalized || "unknown"
}

function statusClass(status: string) {
  const normalized = normalizeStatus(status)
  if (normalized === "running") {
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200"
  }
  if (normalized === "scheduled") {
    return "bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-200"
  }
  if (normalized === "completed") {
    return "bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-200"
  }
  if (normalized === "cancelled") {
    return "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-200"
  }
  return "bg-slate-100 text-slate-800 dark:bg-slate-500/20 dark:text-slate-200"
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

export default function CurrentCampaignPage() {
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null)
  const [data, setData] = React.useState<CampaignCurrentResponse | null>(null)
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<"all" | "running" | "scheduled" | "completed" | "cancelled">("all")
  const [actionTarget, setActionTarget] = React.useState<string | null>(null)

  const loadCampaigns = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiFetch<CampaignCurrentResponse>("/campaign/current/")
      setData(response)
      setLastUpdated(new Date())
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Unable to load current campaigns."
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void loadCampaigns()
  }, [loadCampaigns])

  const handleAction = async (campaignId: string, action: "end" | "cancel" | "resume") => {
    setActionTarget(campaignId)
    setError(null)
    try {
      await apiFetch<{ message: string }>(`/campaign/current/${campaignId}/`, {
        method: "PATCH",
        body: JSON.stringify({ action }),
      })
      await loadCampaigns()
    } catch (actionError) {
      const message = actionError instanceof Error ? actionError.message : "Unable to update campaign."
      setError(message)
    } finally {
      setActionTarget(null)
    }
  }

  const campaigns = data?.campaigns ?? []
  const filtered = campaigns.filter((campaign) => {
    const matchesSearch =
      campaign.title.toLowerCase().includes(search.toLowerCase()) ||
      (campaign.campaign_description || "").toLowerCase().includes(search.toLowerCase())
    const normalized = normalizeStatus(campaign.status)
    const matchesStatus = statusFilter === "all" || normalized === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <>
      <Header />
      <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
        <section className="from-muted/50 via-background to-muted/20 border-border relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-blue-200/45 blur-3xl dark:bg-blue-700/25" />
          <div className="absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-emerald-200/55 blur-3xl dark:bg-emerald-700/25" />

          <div className="relative space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-foreground font-display text-3xl font-semibold tracking-tight">Current Campaign</h1>
                <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
                  Review active and scheduled campaigns, monitor stock and orders, and close campaigns when needed.
                </p>
                <p className="text-muted-foreground/90 mt-3 text-xs">
                  Last updated: {lastUpdated ? formatDateTime(lastUpdated.toISOString()) : "Not loaded yet"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void loadCampaigns()}
                className="bg-background text-foreground border-border inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-muted/70"
              >
                <RefreshCcw className="size-4" />
                Refresh
              </button>
            </div>

            <div className="bg-background/80 border-border grid gap-3 rounded-xl border p-3 md:grid-cols-3">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search campaigns..."
                className="bg-background text-foreground border-border rounded-lg border px-3 py-2 text-sm"
              />
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as "all" | "running" | "scheduled" | "completed" | "cancelled")
                }
                className="bg-background text-foreground border-border rounded-lg border px-3 py-2 text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="running">Running</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <div className="text-muted-foreground flex items-center text-sm">Chef: {data?.chef || "N/A"}</div>
            </div>
          </div>
        </section>

        {loading ? (
          <Card className="border-border/70 bg-card/95 shadow-sm">
            <CardContent className="py-8 text-sm text-muted-foreground">Loading campaigns...</CardContent>
          </Card>
        ) : null}

        {!loading && error ? (
          <Card className="border-red-300/70 bg-red-50/80 dark:border-red-900 dark:bg-red-950/30">
            <CardHeader>
              <CardTitle className="text-red-700 dark:text-red-300">Failed to load current campaigns</CardTitle>
              <CardDescription className="text-red-700/80 dark:text-red-200/80">{error}</CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        {!loading && !error ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                title="Total Current"
                value={formatNumber(data?.summary.total_current ?? 0)}
                subtitle="Running + scheduled campaigns"
                icon={Megaphone}
              />
              <MetricCard
                title="Running Now"
                value={formatNumber(data?.summary.running_now ?? 0)}
                subtitle="Live campaigns in progress"
                icon={PlayCircle}
              />
              <MetricCard
                title="Scheduled"
                value={formatNumber(data?.summary.scheduled ?? 0)}
                subtitle="Upcoming campaigns"
                icon={Clock3}
              />
              <MetricCard
                title="Ending Today"
                value={formatNumber(data?.summary.ending_today ?? 0)}
                subtitle="Requires attention"
                icon={AlertTriangle}
              />
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              {filtered.map((campaign) => {
                const status = normalizeStatus(campaign.status)
                const canEnd = status === "running" || status === "scheduled"
                const canResume = status === "cancelled" || status === "completed"
                const busy = actionTarget === campaign.id

                return (
                  <Card key={campaign.id} className="border-border/70 bg-card/95 shadow-sm">
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
                          <p className="text-muted-foreground">Start</p>
                          <p className="text-foreground mt-1 font-medium">{formatDateTime(campaign.start_time)}</p>
                        </div>
                        <div className="bg-muted/35 border-border rounded-lg border px-3 py-2 text-xs">
                          <p className="text-muted-foreground">End</p>
                          <p className="text-foreground mt-1 font-medium">{formatDateTime(campaign.end_time)}</p>
                        </div>
                        <div className="bg-muted/35 border-border rounded-lg border px-3 py-2 text-xs">
                          <p className="text-muted-foreground">Delivery</p>
                          <p className="text-foreground mt-1 font-medium">{formatDateTime(campaign.delivery_time)}</p>
                        </div>
                        <div className="bg-muted/35 border-border rounded-lg border px-3 py-2 text-xs">
                          <p className="text-muted-foreground">Total Orders</p>
                          <p className="text-foreground mt-1 font-medium">{formatNumber(campaign.total_orders)}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="bg-muted/35 border-border text-muted-foreground inline-flex items-center gap-1 rounded-full border px-2.5 py-1">
                          <Package className="size-3.5" /> Qty {formatNumber(campaign.quantity_available)}
                        </span>
                        <span className="bg-muted/35 border-border text-muted-foreground inline-flex items-center gap-1 rounded-full border px-2.5 py-1">
                          <ShoppingCart className="size-3.5" /> Orders {formatNumber(campaign.total_orders)}
                        </span>
                        <span className="bg-muted/35 border-border text-muted-foreground inline-flex items-center gap-1 rounded-full border px-2.5 py-1">
                          <Calendar className="size-3.5" /> {campaign.food_items.length} foods
                        </span>
                      </div>

                      {campaign.food_items.length ? (
                        <div className="space-y-1">
                          <p className="text-muted-foreground text-xs font-medium">Foods</p>
                          <div className="flex flex-wrap gap-2">
                            {campaign.food_items.map((food) => (
                              <span
                                key={`${campaign.id}-${food.uid}`}
                                className="bg-muted/35 border-border text-foreground rounded-full border px-2.5 py-1 text-xs"
                              >
                                {food.food_name} x {formatNumber(food.campaign_quantity)}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {canEnd ? (
                          <button
                            type="button"
                            onClick={() => void handleAction(campaign.id, "end")}
                            disabled={busy}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-orange-700 disabled:opacity-60"
                          >
                            <StopCircle className="size-3.5" />
                            {busy ? "Updating..." : "End Campaign"}
                          </button>
                        ) : null}
                        {canEnd ? (
                          <button
                            type="button"
                            onClick={() => void handleAction(campaign.id, "cancel")}
                            disabled={busy}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                          >
                            <PauseCircle className="size-3.5" />
                            {busy ? "Updating..." : "Cancel"}
                          </button>
                        ) : null}
                        {canResume ? (
                          <button
                            type="button"
                            onClick={() => void handleAction(campaign.id, "resume")}
                            disabled={busy}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                          >
                            <PlayCircle className="size-3.5" />
                            {busy ? "Updating..." : "Resume"}
                          </button>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {!filtered.length ? (
              <Card className="border-border/70 bg-card/95 shadow-sm">
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  No campaigns match the current search/filter.
                </CardContent>
              </Card>
            ) : null}
          </>
        ) : null}
      </div>
    </>
  )
}
