"use client"

import * as React from "react"
import { Calendar, History, Package, RefreshCcw, Search, Wallet } from "lucide-react"

import Header from "@/components/layout/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { apiFetch } from "@/lib/auth"

type FoodDetail = {
  uid: string
  food_name: string
}

type HistoryOrderRow = {
  uid: string
  order_id?: string | null
  user: string
  food_items?: string | null
  food_price: number
  quantity: number
  order_time: string | null
  matched_food_items_details?: FoodDetail[]
}

type OrdersSummary = {
  total_orders: number
  total_amount: number
  total_items: number
}

type CampaignOrderHistoryResponse = {
  chef: string
  order_history: HistoryOrderRow[]
  summary?: OrdersSummary
}

type HistoryRangeKey = "all" | "30d" | "90d" | "365d"

const numberFormatter = new Intl.NumberFormat("en-MY")
const currencyFormatter = new Intl.NumberFormat("en-MY", {
  style: "currency",
  currency: "MYR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

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

function resolveFoodNames(order: HistoryOrderRow) {
  if (order.matched_food_items_details?.length) {
    return order.matched_food_items_details.map((item) => item.food_name).filter(Boolean)
  }
  if (!order.food_items) return []
  return String(order.food_items)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

function withinRange(isoTime: string | null, range: HistoryRangeKey) {
  if (range === "all") return true
  if (!isoTime) return false
  const parsed = new Date(isoTime)
  if (Number.isNaN(parsed.getTime())) return false

  const now = new Date()
  const days = range === "30d" ? 30 : range === "90d" ? 90 : 365
  const threshold = new Date(now)
  threshold.setDate(now.getDate() - (days - 1))
  return parsed >= threshold
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

export default function CampaignOrderHistoryPage() {
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null)
  const [chef, setChef] = React.useState("")
  const [search, setSearch] = React.useState("")
  const [range, setRange] = React.useState<HistoryRangeKey>("all")
  const [orders, setOrders] = React.useState<HistoryOrderRow[]>([])
  const [summary, setSummary] = React.useState<OrdersSummary>({
    total_orders: 0,
    total_amount: 0,
    total_items: 0,
  })

  const loadHistory = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiFetch<CampaignOrderHistoryResponse>("/campaign_orders/history/")
      const historyList = response.order_history ?? []
      const totalAmount = historyList.reduce((sum, order) => sum + (order.food_price || 0), 0)
      const totalItems = historyList.reduce((sum, order) => {
        const quantity = Number(order.quantity || 0)
        if (quantity > 0) return sum + quantity
        return sum + Math.max(resolveFoodNames(order).length, 1)
      }, 0)

      setChef(response.chef || "")
      setOrders(historyList)
      setSummary({
        total_orders: response.summary?.total_orders ?? historyList.length,
        total_amount: response.summary?.total_amount ?? totalAmount,
        total_items: response.summary?.total_items ?? totalItems,
      })
      setLastUpdated(new Date())
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Unable to load campaign order history."
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void loadHistory()
  }, [loadHistory])

  const filteredOrders = orders.filter((order) => {
    if (!withinRange(order.order_time, range)) return false
    const keyword = search.trim().toLowerCase()
    if (!keyword) return true
    const id = String(order.order_id || order.uid || "").toLowerCase()
    const user = String(order.user || "").toLowerCase()
    const foods = resolveFoodNames(order).join(" ").toLowerCase()
    return id.includes(keyword) || foods.includes(keyword) || user.includes(keyword)
  })

  const filteredAmount = filteredOrders.reduce((sum, order) => sum + (order.food_price || 0), 0)
  const filteredItems = filteredOrders.reduce((sum, order) => {
    const quantity = Number(order.quantity || 0)
    if (quantity > 0) return sum + quantity
    return sum + Math.max(resolveFoodNames(order).length, 1)
  }, 0)
  const avgOrderValue = filteredOrders.length ? filteredAmount / filteredOrders.length : 0

  return (
    <>
      <Header />
      <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
        <section className="from-muted/50 via-background to-muted/20 border-border relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-emerald-200/45 blur-3xl dark:bg-emerald-700/25" />
          <div className="absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-teal-200/55 blur-3xl dark:bg-teal-700/25" />

          <div className="relative space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-foreground font-display text-3xl font-semibold tracking-tight">Order History</h1>
                <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
                  Analyze completed campaign orders and track revenue trends.
                </p>
                <p className="text-muted-foreground/90 mt-3 text-xs">
                  Chef: {chef || "N/A"} | Last updated: {lastUpdated ? formatDateTime(lastUpdated.toISOString()) : "Not loaded yet"}
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

            <div className="bg-background/80 border-border grid gap-3 rounded-xl border p-3 md:grid-cols-5">
              <div className="relative md:col-span-3">
                <Search className="text-muted-foreground pointer-events-none absolute left-2.5 top-2.5 size-4" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by order ID, user, or food name"
                  className="bg-background text-foreground border-border w-full rounded-lg border py-2 pl-9 pr-3 text-sm"
                />
              </div>
              <select
                value={range}
                onChange={(event) => setRange(event.target.value as HistoryRangeKey)}
                className="bg-background text-foreground border-border rounded-lg border px-3 py-2 text-sm"
              >
                <option value="all">All Time</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="365d">Last 365 Days</option>
              </select>
              <div className="text-muted-foreground flex items-center rounded-lg border border-transparent px-1 text-sm">
                {filteredOrders.length} match(es)
              </div>
            </div>
          </div>
        </section>

        {loading ? (
          <Card className="border-border/70 bg-card/95 shadow-sm">
            <CardContent className="py-8 text-sm text-muted-foreground">Loading campaign order history...</CardContent>
          </Card>
        ) : null}

        {!loading && error ? (
          <Card className="border-red-300/70 bg-red-50/80 dark:border-red-900 dark:bg-red-950/30">
            <CardHeader>
              <CardTitle className="text-red-700 dark:text-red-300">Failed to load campaign order history</CardTitle>
              <CardDescription className="text-red-700/80 dark:text-red-200/80">{error}</CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        {!loading && !error ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                title="History Orders"
                value={formatNumber(summary.total_orders)}
                subtitle="All completed campaign orders"
                icon={History}
              />
              <MetricCard
                title="Filtered Orders"
                value={formatNumber(filteredOrders.length)}
                subtitle="Within selected search/range"
                icon={Calendar}
              />
              <MetricCard
                title="Filtered Revenue"
                value={formatCurrency(filteredAmount)}
                subtitle="Revenue in filtered view"
                icon={Wallet}
              />
              <MetricCard
                title="Items in View"
                value={formatNumber(filteredItems)}
                subtitle={`Avg order ${formatCurrency(avgOrderValue)}`}
                icon={Package}
              />
            </div>

            <Card className="border-border/70 bg-card/95 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-foreground text-base">Campaign Order History List</CardTitle>
                <CardDescription className="text-muted-foreground text-sm">
                  Completed orders containing your food items.
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                {!filteredOrders.length ? (
                  <p className="text-muted-foreground py-4 text-sm">No campaign history orders found for these filters.</p>
                ) : (
                  <table className="w-full min-w-[900px] text-sm">
                    <thead>
                      <tr className="border-border border-b text-left">
                        <th className="text-muted-foreground px-2 py-3 font-medium">Order ID</th>
                        <th className="text-muted-foreground px-2 py-3 font-medium">User</th>
                        <th className="text-muted-foreground px-2 py-3 font-medium">Foods</th>
                        <th className="text-muted-foreground px-2 py-3 font-medium">Quantity</th>
                        <th className="text-muted-foreground px-2 py-3 font-medium">Amount</th>
                        <th className="text-muted-foreground px-2 py-3 font-medium">Order Time</th>
                        <th className="text-muted-foreground px-2 py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map((order) => {
                        const foods = resolveFoodNames(order)
                        return (
                          <tr key={order.uid} className="border-border/70 border-b align-top">
                            <td className="text-foreground px-2 py-3 font-medium">#{order.order_id || order.uid}</td>
                            <td className="text-foreground px-2 py-3">{order.user}</td>
                            <td className="px-2 py-3">
                              <div className="flex flex-wrap gap-1.5">
                                {foods.length ? (
                                  foods.map((food, idx) => (
                                    <span
                                      key={`${order.uid}-${idx}`}
                                      className="bg-muted/35 border-border rounded-full border px-2 py-0.5 text-xs text-foreground"
                                    >
                                      {food}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-muted-foreground text-xs">No food item details</span>
                                )}
                              </div>
                            </td>
                            <td className="text-foreground px-2 py-3">{formatNumber(order.quantity || 0)}</td>
                            <td className="text-foreground px-2 py-3">{formatCurrency(order.food_price || 0)}</td>
                            <td className="text-foreground px-2 py-3">{formatDateTime(order.order_time)}</td>
                            <td className="px-2 py-3">
                              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200">
                                Completed
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </>
  )
}
