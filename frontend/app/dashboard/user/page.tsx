"use client"

import * as React from "react"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import {
  Activity,
  ArrowRight,
  CalendarClock,
  Package,
  Receipt,
  RefreshCcw,
  ShoppingCart,
  Utensils,
  Wallet,
} from "lucide-react"
import { TrendLineChart } from "@/components/charts/trend-line-chart"
import { ValueBarChart } from "@/components/charts/value-bar-chart"

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

type DashboardUser = {
  username: string
  email: string
  first_name: string
  last_name: string
  role: string
}

type UserSummary = {
  orders_in_range: number
  orders_today: number
  spend_in_range: number
  avg_order_value: number
  items_in_range: number
  active_days: number
  lifetime_orders: number
  lifetime_spend: number
  profile_total_orders: number
  last_order_at: string | null
}

type UserTrends = {
  labels: string[]
  orders_per_day: number[]
  spend_per_day: number[]
  items_per_day: number[]
}

type YearlySpend = {
  year: number
  labels: string[]
  spend_per_month: number[]
}

type TopFood = {
  food_id: string
  name: string
  quantity_ordered: number
  times_ordered: number
}

type RecentOrder = {
  order_id: string
  order_time: string | null
  total_amount: number
  quantity: number
  food_count: number
  foods: string[]
}

type UserDashboardResponse = {
  range: DashboardRange
  user: DashboardUser
  summary: UserSummary
  trends: UserTrends
  yearly_spend: YearlySpend
  top_foods: TopFood[]
  recent_orders: RecentOrder[]
}

type Point = {
  x: number
  y: number
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

function formatDateLabel(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number)
  if (!year || !month || !day) return isoDate
  return new Date(year, month - 1, day).toLocaleDateString("en-MY", { month: "short", day: "numeric" })
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

function tickIndexes(length: number, desiredTicks = 6) {
  if (length <= desiredTicks) return Array.from({ length }, (_, idx) => idx)
  const last = length - 1
  const steps = desiredTicks - 1
  const indexes = new Set<number>()
  for (let idx = 0; idx < desiredTicks; idx += 1) {
    indexes.add(Math.round((idx * last) / steps))
  }
  return Array.from(indexes).sort((a, b) => a - b)
}

function normalizeSeries(values: number[], expectedLength: number) {
  return Array.from({ length: expectedLength }, (_, idx) => Number(values[idx] ?? 0))
}

function createLinePath(points: Point[]) {
  if (!points.length) return ""
  return points.map((point, idx) => `${idx === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ")
}

function createAreaPath(points: Point[], baselineY: number) {
  if (!points.length) return ""
  const linePath = createLinePath(points)
  const first = points[0]
  const last = points[points.length - 1]
  return `${linePath} L ${last.x} ${baselineY} L ${first.x} ${baselineY} Z`
}

function valuesTotal(values: number[]) {
  return values.reduce((sum, value) => sum + (Number.isFinite(value) ? value : 0), 0)
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
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        {Array.from({ length: 6 }, (_, idx) => (
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


function TopFoodsCard({ items }: { items: TopFood[] }) {
  return (
    <Card className="border-border/70 bg-card/95 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-foreground text-base">Top Ordered Foods</CardTitle>
        <CardDescription className="text-muted-foreground text-sm">
          Foods you ordered most frequently in the selected range.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {items.length ? (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.food_id} className="bg-muted/35 border-border rounded-lg border px-3 py-2">
                <p className="text-foreground text-sm font-medium">{item.name}</p>
                <div className="mt-1 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Quantity: {formatNumber(item.quantity_ordered)}</span>
                  <span className="text-muted-foreground">Orders: {formatNumber(item.times_ordered)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No top foods found for this range.</p>
        )}
      </CardContent>
    </Card>
  )
}

function RecentOrdersCard({ items }: { items: RecentOrder[] }) {
  return (
    <Card className="border-border/70 bg-card/95 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-foreground text-base">Recent Orders</CardTitle>
        <CardDescription className="text-muted-foreground text-sm">
          Your latest order activity across pending and history records.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {items.length ? (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.order_id} className="bg-muted/35 border-border rounded-lg border px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-foreground text-sm font-semibold">#{item.order_id.slice(0, 8)}</p>
                  <p className="text-muted-foreground text-xs">{formatDateTime(item.order_time)}</p>
                </div>
                <div className="mt-1 flex flex-wrap gap-3 text-xs">
                  <span className="text-muted-foreground">Amount: {formatCurrency(item.total_amount)}</span>
                  <span className="text-muted-foreground">Qty: {formatNumber(item.quantity)}</span>
                  <span className="text-muted-foreground">Foods: {formatNumber(item.food_count)}</span>
                </div>
                {item.foods.length ? (
                  <p className="text-muted-foreground mt-1 line-clamp-1 text-xs">{item.foods.join(", ")}</p>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No recent orders found.</p>
        )}
      </CardContent>
    </Card>
  )
}

function QuickActionsCard() {
  const links = [
    { href: "/your-orders", label: "View Pending Orders" },
    { href: "/your-orders/history", label: "Order History" },
    { href: "/notifications", label: "Notifications" },
    { href: "/support", label: "Contact Support" },
  ]

  return (
    <Card className="border-border/70 bg-card/95 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-foreground text-base">Quick Actions</CardTitle>
        <CardDescription className="text-muted-foreground text-sm">Fast links for your regular tasks.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="bg-muted/35 border-border text-foreground hover:bg-muted inline-flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition"
          >
            {link.label}
            <ArrowRight className="size-4" />
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}

export default function UserDashboardPage() {
  const isDarkMode = useIsDarkMode()
  const [dashboard, setDashboard] = React.useState<UserDashboardResponse | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null)

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

  const loadDashboard = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = buildRangeQuery(appliedFilter)
      const response = await apiFetch<UserDashboardResponse>(`/user_dashboard/?${params.toString()}`)
      if (!response.summary || !response.trends || !response.yearly_spend) {
        throw new Error("Dashboard payload is incomplete.")
      }
      setDashboard(response)
      setLastUpdated(new Date())
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : "Unable to load user dashboard."
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [appliedFilter])

  React.useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

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

  const summary = dashboard?.summary
  const rangeInfo = dashboard?.range
  const user = dashboard?.user
  const labels = dashboard?.trends.labels ?? []
  const orders = normalizeSeries(dashboard?.trends.orders_per_day ?? [], labels.length)
  const spend = normalizeSeries(dashboard?.trends.spend_per_day ?? [], labels.length)
  const items = normalizeSeries(dashboard?.trends.items_per_day ?? [], labels.length)
  const monthlyLabels = dashboard?.yearly_spend.labels ?? []
  const monthlySpend = normalizeSeries(dashboard?.yearly_spend.spend_per_month ?? [], monthlyLabels.length)

  return (
    <>
      <Header />
      <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
        <section className="from-muted/50 via-background to-muted/20 border-border relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-sky-200/45 blur-3xl dark:bg-sky-700/25" />
          <div className="absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-emerald-200/55 blur-3xl dark:bg-emerald-700/25" />

          <div className="relative space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-foreground font-display text-3xl font-semibold tracking-tight">User Dashboard</h1>
                <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
                  Track your order activity, spending habits, and food preferences with interactive analytics.
                </p>
                <p className="text-muted-foreground/90 mt-3 text-xs">
                  Last updated: {lastUpdated ? formatDateTime(lastUpdated.toISOString()) : "Not loaded yet"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void loadDashboard()}
                className="bg-background text-foreground border-border inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-muted/70"
              >
                <RefreshCcw className="size-4" />
                Refresh
              </button>
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
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
              <MetricCard
                title={`Orders (${rangeInfo.label})`}
                value={formatNumber(summary.orders_in_range)}
                subtitle={`${rangeInfo.start_date} to ${rangeInfo.end_date}`}
                icon={ShoppingCart}
              />
              <MetricCard
                title={`Spend (${rangeInfo.label})`}
                value={formatCurrency(summary.spend_in_range)}
                subtitle="Total order spend in range"
                icon={Wallet}
              />
              <MetricCard
                title="Average Order Value"
                value={formatCurrency(summary.avg_order_value)}
                subtitle="Average spend per order"
                icon={Receipt}
              />
              <MetricCard
                title={`Items (${rangeInfo.label})`}
                value={formatNumber(summary.items_in_range)}
                subtitle="Total items ordered in range"
                icon={Package}
              />
              <MetricCard
                title="Active Days"
                value={formatNumber(summary.active_days)}
                subtitle="Days with at least one order"
                icon={Activity}
              />
              <MetricCard
                title="Orders Today"
                value={formatNumber(summary.orders_today)}
                subtitle="Orders placed today"
                icon={CalendarClock}
              />
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
              <Card className="border-border/70 bg-card/95 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-foreground text-base">Profile Snapshot</CardTitle>
                  <CardDescription className="text-muted-foreground text-sm">
                    Account level order overview.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="bg-muted/35 border-border flex items-center justify-between rounded-lg border px-3 py-2">
                    <p className="text-muted-foreground text-sm">User</p>
                    <p className="text-foreground text-sm font-semibold">{user?.username ?? "N/A"}</p>
                  </div>
                  <div className="bg-muted/35 border-border flex items-center justify-between rounded-lg border px-3 py-2">
                    <p className="text-muted-foreground text-sm">Lifetime Orders</p>
                    <p className="text-foreground text-sm font-semibold">{formatNumber(summary.lifetime_orders)}</p>
                  </div>
                  <div className="bg-muted/35 border-border flex items-center justify-between rounded-lg border px-3 py-2">
                    <p className="text-muted-foreground text-sm">Lifetime Spend</p>
                    <p className="text-foreground text-sm font-semibold">{formatCurrency(summary.lifetime_spend)}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-card/95 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-foreground text-base">Order Status Snapshot</CardTitle>
                  <CardDescription className="text-muted-foreground text-sm">
                    Quick status insight from your order activity.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="bg-muted/35 border-border flex items-center justify-between rounded-lg border px-3 py-2">
                    <p className="text-muted-foreground text-sm">Last Order</p>
                    <p className="text-foreground text-sm font-semibold">{formatDateTime(summary.last_order_at)}</p>
                  </div>
                  <div className="bg-muted/35 border-border flex items-center justify-between rounded-lg border px-3 py-2">
                    <p className="text-muted-foreground text-sm">Profile Total Orders</p>
                    <p className="text-foreground text-sm font-semibold">
                      {formatNumber(summary.profile_total_orders)}
                    </p>
                  </div>
                  <div className="bg-muted/35 border-border flex items-center justify-between rounded-lg border px-3 py-2">
                    <p className="text-muted-foreground text-sm">Role</p>
                    <p className="text-foreground text-sm font-semibold">{user?.role ?? "N/A"}</p>
                  </div>
                </CardContent>
              </Card>

              <QuickActionsCard />
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <TrendLineChart
                title={`Daily Orders (${rangeInfo.label})`}
                subtitle="Number of orders placed each day."
                labels={labels}
                values={orders}
                lineColor="#2563eb"
                startColor="#3b82f6"
                endColor="#3b82f6"
                gradientId="userOrdersTrend"
                isDark={isDarkMode}
                formatter={formatNumber}
                leftPadding={40}
              />
              <TrendLineChart
                title={`Daily Spend (${rangeInfo.label})`}
                subtitle="Total amount spent each day."
                labels={labels}
                values={spend}
                lineColor="#16a34a"
                startColor="#22c55e"
                endColor="#16a34a"
                gradientId="userSpendTrend"
                isDark={isDarkMode}
                formatter={formatCurrency}
                leftPadding={70}
              />
              <TrendLineChart
                title={`Daily Items (${rangeInfo.label})`}
                subtitle="Total items ordered each day."
                labels={labels}
                values={items}
                lineColor="#ea580c"
                startColor="#f97316"
                endColor="#ea580c"
                gradientId="userItemsTrend"
                isDark={isDarkMode}
                formatter={formatNumber}
                leftPadding={40}
              />
              <ValueBarChart
                title={`Monthly Spend (${dashboard?.yearly_spend.year ?? new Date().getFullYear()})`}
                subtitle="Your spending pattern for each month in the selected year."
                labels={monthlyLabels}
                values={monthlySpend}
                isDark={isDarkMode}
                formatter={formatCurrency}
                gradientId="monthlySpendBars"
                startColor="#0ea5e9"
                endColor="#38bdf8"
                totalLabel="Year Total"
                peakLabel="Highest Month"
                leftPadding={70}
              />
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <TopFoodsCard items={dashboard?.top_foods ?? []} />
              <RecentOrdersCard items={dashboard?.recent_orders ?? []} />
            </div>

            <Card className="border-border/70 bg-card/95 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-foreground text-base">Spending Insights</CardTitle>
                <CardDescription className="text-muted-foreground text-sm">
                  Personalized summary from your selected date range.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-3">
                <div className="bg-muted/40 border-border rounded-xl border p-3">
                  <p className="text-muted-foreground text-xs uppercase tracking-wide">Avg Daily Spend</p>
                  <p className="text-foreground mt-1 text-lg font-semibold">
                    {formatCurrency(spend.length ? valuesTotal(spend) / spend.length : 0)}
                  </p>
                </div>
                <div className="bg-muted/40 border-border rounded-xl border p-3">
                  <p className="text-muted-foreground text-xs uppercase tracking-wide">Avg Daily Orders</p>
                  <p className="text-foreground mt-1 text-lg font-semibold">
                    {formatNumber(orders.length ? valuesTotal(orders) / orders.length : 0)}
                  </p>
                </div>
                <div className="bg-muted/40 border-border rounded-xl border p-3">
                  <p className="text-muted-foreground text-xs uppercase tracking-wide">Most Ordered Foods</p>
                  <p className="text-foreground mt-1 text-sm font-medium inline-flex items-center gap-1">
                    <Utensils className="size-4" />
                    {dashboard?.top_foods?.[0]?.name ?? "No food data"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </>
  )
}
