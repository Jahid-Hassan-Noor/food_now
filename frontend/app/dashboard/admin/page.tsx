"use client"

import * as React from "react"
import type { LucideIcon } from "lucide-react"
import {
  ChefHat,
  Download,
  FileText,
  Megaphone,
  RefreshCcw,
  ShoppingCart,
  Users,
  Wallet,
} from "lucide-react"
import { TrendLineChart } from "@/components/charts/trend-line-chart"
import { ValueBarChart } from "@/components/charts/value-bar-chart"
import Header from "@/components/layout/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { apiFetch, ensureValidSession } from "@/lib/auth"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000"

type RangeKey = "today" | "7d" | "30d" | "month" | "custom"

type DashboardRange = {
  key: RangeKey
  label: string
  start_date: string
  end_date: string
}

type DashboardSummary = {
  total_users: number
  total_chefs: number
  campaigns_in_range?: number
  recharge_in_range?: number
  orders_in_range?: number
  campaigns_this_month?: number
  recharge_this_month?: number
  orders_today?: number
}

type Last30Days = {
  labels: string[]
  campaigns_per_day: number[]
  recharge_per_day: number[]
  orders_per_day: number[]
}

type YearlyRevenue = {
  year: number
  labels: string[]
  revenue_per_month: number[]
}

type TopChef = {
  chef: string
  revenue: number
}

type TopCampaign = {
  campaign_id: string
  title: string
  chef: string
  total_orders: number
}

type TopFood = {
  food_id: string
  name: string
  quantity_sold: number
}

type TopPerformers = {
  chefs_by_revenue: TopChef[]
  campaigns_by_orders: TopCampaign[]
  foods_by_quantity: TopFood[]
}

type DashboardReportSchedule = {
  id: number
  email: string
  frequency: "weekly" | "monthly"
  is_active: boolean
  next_run_at: string | null
  last_sent_at: string | null
  updated_at: string | null
}

type DashboardSchedulesResponse = {
  schedules: DashboardReportSchedule[]
}

type DashboardScheduleSaveResponse = {
  schedule: DashboardReportSchedule
  message: string
}

type AdminDashboardResponse = {
  range: DashboardRange
  summary: DashboardSummary
  last_30_days: Last30Days
  yearly_revenue: YearlyRevenue
  top_performers: TopPerformers
}

type RangeFilter = {
  range: RangeKey
  start_date: string
  end_date: string
}

const numberFormatter = new Intl.NumberFormat("en-MY")
const currencyFormatter = new Intl.NumberFormat("en-MY", {
  style: "currency",
  currency: "MYR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function useIsDarkMode() {
  const [isDarkMode, setIsDarkMode] = React.useState(false)

  React.useEffect(() => {
    const root = document.documentElement
    const update = () => setIsDarkMode(root.classList.contains("dark"))
    update()
    const observer = new MutationObserver(update)
    observer.observe(root, { attributes: true, attributeFilter: ["class"] })
    return () => observer.disconnect()
  }, [])

  return isDarkMode
}

function formatNumber(value: number) {
  return numberFormatter.format(Math.round(value || 0))
}

function formatCurrency(value: number) {
  return currencyFormatter.format(value || 0)
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "N/A"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "N/A"
  return parsed.toLocaleString("en-MY", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function normalizeSeries(values: number[], expectedLength: number) {
  return Array.from({ length: expectedLength }, (_, idx) => Number(values[idx] ?? 0))
}

function buildRangeQuery(filter: RangeFilter) {
  const params = new URLSearchParams({ range: filter.range })
  if (filter.range === "custom") {
    params.set("start_date", filter.start_date)
    params.set("end_date", filter.end_date)
  }
  return params
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, idx) => (
          <Card key={idx} className="border-border/70 bg-card/90 shadow-sm">
            <CardHeader className="pb-2">
              <div className="bg-muted h-4 w-32 animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="bg-muted h-8 w-24 animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        {Array.from({ length: 3 }, (_, idx) => (
          <Card key={idx} className="border-border/70 bg-card/90 shadow-sm">
            <CardHeader className="pb-2">
              <div className="bg-muted h-5 w-40 animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="bg-muted/70 h-40 animate-pulse rounded-xl" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        {Array.from({ length: 4 }, (_, idx) => (
          <Card key={idx} className="border-border/70 bg-card/90 shadow-sm">
            <CardHeader className="pb-2">
              <div className="bg-muted h-5 w-48 animate-pulse rounded" />
              <div className="bg-muted/70 h-4 w-64 animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="bg-muted/70 h-64 animate-pulse rounded-xl" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
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
  icon: LucideIcon
}) {
  return (
    <Card className="border-border/70 bg-card/90 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardDescription className="text-muted-foreground text-sm font-medium">{title}</CardDescription>
          <span className="text-muted-foreground bg-muted/50 border-border rounded-lg border p-2">
            <Icon className="size-4" />
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        <p className="text-foreground text-3xl font-semibold tracking-tight">{value}</p>
        <p className="text-muted-foreground text-xs">{subtitle}</p>
      </CardContent>
    </Card>
  )
}


function TopChefsCard({ items }: { items: TopChef[] }) {
  return (
    <Card className="border-border/70 bg-card/95 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-foreground text-base">Top Chefs By Revenue</CardTitle>
        <CardDescription className="text-muted-foreground text-sm">Best performing chefs in selected range.</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length ? (
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div key={`${item.chef}-${idx}`} className="bg-muted/35 border-border flex items-center justify-between rounded-lg border px-3 py-2">
                <p className="text-foreground text-sm font-medium">{item.chef}</p>
                <p className="text-foreground text-sm font-semibold">{formatCurrency(item.revenue)}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No chef revenue found for this range.</p>
        )}
      </CardContent>
    </Card>
  )
}

function TopCampaignsCard({ items }: { items: TopCampaign[] }) {
  return (
    <Card className="border-border/70 bg-card/95 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-foreground text-base">Top Campaigns By Orders</CardTitle>
        <CardDescription className="text-muted-foreground text-sm">
          Highest ordered campaigns in selected range.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {items.length ? (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.campaign_id} className="bg-muted/35 border-border rounded-lg border px-3 py-2">
                <p className="text-foreground text-sm font-medium">{item.title}</p>
                <p className="text-muted-foreground text-xs">Chef: {item.chef}</p>
                <p className="text-foreground mt-1 text-sm font-semibold">{formatNumber(item.total_orders)} orders</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No campaign performance found for this range.</p>
        )}
      </CardContent>
    </Card>
  )
}

function TopFoodsCard({ items }: { items: TopFood[] }) {
  return (
    <Card className="border-border/70 bg-card/95 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-foreground text-base">Top Foods By Quantity</CardTitle>
        <CardDescription className="text-muted-foreground text-sm">
          Most frequently ordered foods in selected range.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {items.length ? (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.food_id} className="bg-muted/35 border-border flex items-center justify-between rounded-lg border px-3 py-2">
                <p className="text-foreground text-sm font-medium">{item.name}</p>
                <p className="text-foreground text-sm font-semibold">{formatNumber(item.quantity_sold)}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No food sales data found for this range.</p>
        )}
      </CardContent>
    </Card>
  )
}

export default function AdminDashboardPage() {
  const isDarkMode = useIsDarkMode()
  const [dashboard, setDashboard] = React.useState<AdminDashboardResponse | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null)
  const [exportingFormat, setExportingFormat] = React.useState<"csv" | "pdf" | null>(null)
  const [isSavingSchedule, setIsSavingSchedule] = React.useState(false)
  const [scheduleMessage, setScheduleMessage] = React.useState<string | null>(null)
  const [scheduleError, setScheduleError] = React.useState<string | null>(null)
  const [schedule, setSchedule] = React.useState<DashboardReportSchedule | null>(null)

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

  const [scheduleEmail, setScheduleEmail] = React.useState("")
  const [scheduleFrequency, setScheduleFrequency] = React.useState<"weekly" | "monthly">("weekly")
  const [scheduleActive, setScheduleActive] = React.useState(true)

  const loadDashboard = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = buildRangeQuery(appliedFilter)
      const endpoint = `/admin/admin_dashboard/?${params.toString()}`
      const response = await apiFetch<AdminDashboardResponse>(endpoint)
      if (!response.summary || !response.last_30_days || !response.yearly_revenue) {
        throw new Error("Dashboard payload is incomplete.")
      }
      setDashboard(response)
      setLastUpdated(new Date())
    } catch (fetchError) {
      const message =
        fetchError instanceof Error ? fetchError.message : "Unable to load admin dashboard."
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [appliedFilter])

  const loadSchedules = React.useCallback(async () => {
    try {
      const response = await apiFetch<DashboardSchedulesResponse>("/admin/admin_dashboard/report_schedule/")
      const firstSchedule = response.schedules?.[0]
      if (!firstSchedule) return
      setSchedule(firstSchedule)
      setScheduleEmail(firstSchedule.email)
      setScheduleFrequency(firstSchedule.frequency)
      setScheduleActive(firstSchedule.is_active)
    } catch {
      // Keep UI usable even when no schedule exists yet.
    }
  }, [])

  React.useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  React.useEffect(() => {
    void loadSchedules()
  }, [loadSchedules])

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

  const handleExportReport = async (format: "csv" | "pdf") => {
    setExportingFormat(format)
    try {
      const session = await ensureValidSession()
      if (!session) throw new Error("Session expired. Please login again.")

      const params = buildRangeQuery(appliedFilter)
      params.set("export_format", format)
      const requestHeaders = {
        Authorization: `Bearer ${session.access}`,
      }
      let response = await fetch(`${API_BASE}/admin/admin_dashboard/?${params.toString()}`, {
        headers: requestHeaders,
      })

      // Fallbacks for environments still serving older route maps.
      if (response.status === 404) {
        response = await fetch(`${API_BASE}/admin/admin_dashboard/export/?${params.toString().replace("export_format=", "format=")}`, {
          headers: requestHeaders,
        })
      }
      if (response.status === 404) {
        response = await fetch(`${API_BASE}/admin/dashboard_export/?${params.toString().replace("export_format=", "format=")}`, {
          headers: requestHeaders,
        })
      }

      if (!response.ok) {
        const text = await response.text()
        let message = "Export failed."
        try {
          const parsed = JSON.parse(text) as { detail?: string; message?: string }
          message = parsed.detail || parsed.message || message
        } catch {
          // ignore invalid json from failed response
        }
        throw new Error(message)
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = `admin-dashboard-report-${dashboard?.range.start_date ?? "start"}-${dashboard?.range.end_date ?? "end"}.${format}`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
    } catch (exportError) {
      const message = exportError instanceof Error ? exportError.message : "Failed to export report."
      setError(message)
    } finally {
      setExportingFormat(null)
    }
  }

  const handleSaveSchedule = async () => {
    setScheduleMessage(null)
    setScheduleError(null)
    setIsSavingSchedule(true)
    try {
      if (!scheduleEmail.trim()) {
        throw new Error("Schedule email is required.")
      }

      const response = await apiFetch<DashboardScheduleSaveResponse>("/admin/admin_dashboard/report_schedule/", {
        method: "POST",
        body: JSON.stringify({
          email: scheduleEmail.trim(),
          frequency: scheduleFrequency,
          is_active: scheduleActive,
        }),
      })

      setSchedule(response.schedule)
      setScheduleMessage(response.message || "Report schedule saved.")
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Unable to save report schedule."
      setScheduleError(message)
    } finally {
      setIsSavingSchedule(false)
    }
  }

  const summary = dashboard?.summary
  const rangeInfo = dashboard?.range
  const topPerformers = dashboard?.top_performers
  const labels = dashboard?.last_30_days.labels ?? []
  const campaigns = normalizeSeries(dashboard?.last_30_days.campaigns_per_day ?? [], labels.length)
  const recharge = normalizeSeries(dashboard?.last_30_days.recharge_per_day ?? [], labels.length)
  const orders = normalizeSeries(dashboard?.last_30_days.orders_per_day ?? [], labels.length)
  const revenueLabels = dashboard?.yearly_revenue.labels ?? []
  const revenueByMonth = normalizeSeries(dashboard?.yearly_revenue.revenue_per_month ?? [], revenueLabels.length)

  const campaignsInRange = summary?.campaigns_in_range ?? summary?.campaigns_this_month ?? 0
  const rechargeInRange = summary?.recharge_in_range ?? summary?.recharge_this_month ?? 0
  const ordersInRange = summary?.orders_in_range ?? summary?.orders_today ?? 0

  return (
    <>
      <Header />
      <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
        <section className="from-muted/50 via-background to-muted/20 border-border relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-emerald-200/45 blur-3xl dark:bg-emerald-700/25" />
          <div className="absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-sky-200/55 blur-3xl dark:bg-sky-700/25" />
          <div className="relative space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-foreground font-display text-3xl font-semibold tracking-tight">
                  Admin Analytics Dashboard
                </h1>
                <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
                  Filter reports by date, review top performers, export CSV, and manage scheduled email reports.
                </p>
                <p className="text-muted-foreground/90 mt-3 text-xs">
                  Last updated: {lastUpdated ? formatDateTime(lastUpdated.toISOString()) : "Not loaded yet"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void loadDashboard()}
                  className="bg-background text-foreground border-border inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-muted/70"
                >
                  <RefreshCcw className="size-4" />
                  Refresh
                </button>
                <button
                  type="button"
                  onClick={() => void handleExportReport("csv")}
                  disabled={exportingFormat !== null}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Download className="size-4" />
                  {exportingFormat === "csv" ? "Exporting CSV..." : "Export CSV"}
                </button>
                <button
                  type="button"
                  onClick={() => void handleExportReport("pdf")}
                  disabled={exportingFormat !== null}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-600 dark:hover:bg-slate-500"
                >
                  <FileText className="size-4" />
                  {exportingFormat === "pdf" ? "Exporting PDF..." : "Export PDF"}
                </button>
              </div>
            </div>

            <div className="bg-background/80 border-border grid gap-3 rounded-xl border p-3 md:grid-cols-5">
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
                Apply Filters
              </button>
              <div className="text-muted-foreground flex items-center text-sm">
                Active range: {rangeInfo ? `${rangeInfo.start_date} to ${rangeInfo.end_date}` : "N/A"}
              </div>
            </div>
          </div>
        </section>

        {loading ? <DashboardSkeleton /> : null}

        {!loading && error ? (
          <Card className="border-red-300/70 bg-red-50/80 dark:border-red-900 dark:bg-red-950/30">
            <CardHeader>
              <CardTitle className="text-red-700 dark:text-red-300">Failed to load dashboard</CardTitle>
              <CardDescription className="text-red-700/80 dark:text-red-200/80">{error}</CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        {!loading && !error && summary && rangeInfo ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <MetricCard
                title="Total Users"
                value={formatNumber(summary.total_users)}
                subtitle="All registered user accounts"
                icon={Users}
              />
              <MetricCard
                title="Total Chefs"
                value={formatNumber(summary.total_chefs)}
                subtitle="Chef profiles in the platform"
                icon={ChefHat}
              />
              <MetricCard
                title={`Campaigns (${rangeInfo.label})`}
                value={formatNumber(campaignsInRange)}
                subtitle={`${rangeInfo.start_date} to ${rangeInfo.end_date}`}
                icon={Megaphone}
              />
              <MetricCard
                title={`Recharge/Revenue (${rangeInfo.label})`}
                value={formatCurrency(rechargeInRange)}
                subtitle={`${rangeInfo.start_date} to ${rangeInfo.end_date}`}
                icon={Wallet}
              />
              <MetricCard
                title={`Orders (${rangeInfo.label})`}
                value={formatNumber(ordersInRange)}
                subtitle={`${rangeInfo.start_date} to ${rangeInfo.end_date}`}
                icon={ShoppingCart}
              />
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
              <TopChefsCard items={topPerformers?.chefs_by_revenue ?? []} />
              <TopCampaignsCard items={topPerformers?.campaigns_by_orders ?? []} />
              <TopFoodsCard items={topPerformers?.foods_by_quantity ?? []} />
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <TrendLineChart
                title={`Daily Campaigns (${rangeInfo.label})`}
                subtitle="Number of campaigns created each day."
                labels={labels}
                values={campaigns}
                lineColor="#2563eb"
                startColor="#3b82f6"
                endColor="#3b82f6"
                gradientId="campaignsTrend"
                isDark={isDarkMode}
                formatter={formatNumber}
                leftPadding={40}
              />
              <TrendLineChart
                title={`Daily Chef Recharge (${rangeInfo.label})`}
                subtitle="Total recharge amount submitted each day."
                labels={labels}
                values={recharge}
                lineColor="#16a34a"
                startColor="#22c55e"
                endColor="#16a34a"
                gradientId="rechargeTrend"
                isDark={isDarkMode}
                formatter={formatCurrency}
                leftPadding={78}
              />
              <TrendLineChart
                title={`Daily User Orders (${rangeInfo.label})`}
                subtitle="Total orders created by users each day."
                labels={labels}
                values={orders}
                lineColor="#ea580c"
                startColor="#f97316"
                endColor="#ea580c"
                gradientId="ordersTrend"
                isDark={isDarkMode}
                formatter={formatNumber}
                leftPadding={40}
              />
              <ValueBarChart
                title={`Monthly Revenue Comparison (${dashboard?.yearly_revenue.year ?? new Date().getFullYear()})`}
                subtitle="Total recharge/revenue by month for the selected year."
                labels={revenueLabels}
                values={revenueByMonth}
                isDark={isDarkMode}
                formatter={formatCurrency}
                gradientId="revenueBars"
                startColor="#16a34a"
                endColor="#22c55e"
                totalLabel="Year-To-Date Total"
                peakLabel="Peak Month"
                leftPadding={78}
              />
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <Card className="border-border/70 bg-card/95 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-foreground text-base">Export Reports</CardTitle>
                  <CardDescription className="text-muted-foreground text-sm">
                    Download dashboard reports as CSV for sharing or archival.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <button
                    type="button"
                    onClick={() => void handleExportReport("csv")}
                    disabled={exportingFormat !== null}
                    className="inline-flex items-center gap-2 m-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Download className="size-4" />
                    {exportingFormat === "csv" ? "Exporting CSV..." : "Download CSV"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleExportReport("pdf")}
                    disabled={exportingFormat !== null}
                    className="inline-flex items-center gap-2 m-2 rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-600 dark:hover:bg-slate-500"
                  >
                    <FileText className="size-4" />
                    {exportingFormat === "pdf" ? "Exporting PDF..." : "Download PDF"}
                  </button>
                  <p className="text-muted-foreground text-xs">
                    Includes summary, daily trends, monthly revenue, and top performers for current filter range.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-card/95 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-foreground text-base">Scheduled Email Reports</CardTitle>
                  <CardDescription className="text-muted-foreground text-sm">
                    Configure weekly or monthly report delivery via email.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <input
                    type="email"
                    value={scheduleEmail}
                    onChange={(event) => setScheduleEmail(event.target.value)}
                    placeholder="admin@company.com"
                    className="bg-background text-foreground border-border w-full rounded-lg border px-3 py-2 text-sm"
                  />
                  <div className="flex flex-wrap items-center gap-3">
                    <select
                      value={scheduleFrequency}
                      onChange={(event) => setScheduleFrequency(event.target.value as "weekly" | "monthly")}
                      className="bg-background text-foreground border-border rounded-lg border px-3 py-2 text-sm"
                    >
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                    <label className="text-foreground inline-flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={scheduleActive}
                        onChange={(event) => setScheduleActive(event.target.checked)}
                      />
                      Active
                    </label>
                    <button
                      type="button"
                      onClick={() => void handleSaveSchedule()}
                      disabled={isSavingSchedule}
                      className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSavingSchedule ? "Saving..." : "Save Schedule"}
                    </button>
                  </div>
                  {schedule ? (
                    <div className="bg-muted/40 border-border rounded-lg border p-3 text-xs">
                      <p className="text-muted-foreground">Next run: {formatDateTime(schedule.next_run_at)}</p>
                      <p className="text-muted-foreground">Last sent: {formatDateTime(schedule.last_sent_at)}</p>
                      <p className="text-muted-foreground mt-2">
                        To execute scheduled sends, run command:
                        <code className="bg-muted ml-1 rounded px-1 py-0.5">python manage.py send_scheduled_dashboard_reports</code>
                      </p>
                    </div>
                  ) : null}
                  {scheduleMessage ? <p className="text-sm text-emerald-600 dark:text-emerald-400">{scheduleMessage}</p> : null}
                  {scheduleError ? <p className="text-sm text-red-600 dark:text-red-400">{scheduleError}</p> : null}
                </CardContent>
              </Card>
            </div>
          </>
        ) : null}
      </div>
    </>
  )
}
