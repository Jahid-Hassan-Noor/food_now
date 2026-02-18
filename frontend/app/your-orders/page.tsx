"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRight, Clock3, History, RefreshCcw, ShoppingBag, Wallet } from "lucide-react"

import Header from "@/components/layout/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { apiFetch } from "@/lib/auth"

type FoodDetail = {
  uid: string
  food_name: string
}

type OrderRow = {
  uid: string
  order_id?: string | null
  food_items?: string | null
  food_price: number
  quantity: number
  order_time: string | null
  food_items_details?: FoodDetail[]
}

type OrdersSummary = {
  total_orders: number
  total_amount: number
  total_items: number
}

type PendingOrdersResponse = {
  orders: OrderRow[]
  summary?: OrdersSummary
}

type OrderHistoryResponse = {
  order_history: OrderRow[]
  summary?: OrdersSummary
}

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

export default function YourOrdersPage() {
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null)
  const [historyOrders, setHistoryOrders] = React.useState<OrderRow[]>([])
  const [pendingSummary, setPendingSummary] = React.useState<OrdersSummary>({
    total_orders: 0,
    total_amount: 0,
    total_items: 0,
  })
  const [historySummary, setHistorySummary] = React.useState<OrdersSummary>({
    total_orders: 0,
    total_amount: 0,
    total_items: 0,
  })

  const loadOrders = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [pendingResponse, historyResponse] = await Promise.all([
        apiFetch<PendingOrdersResponse>("/orders/"),
        apiFetch<OrderHistoryResponse>("/your_orders/"),
      ])

      const pendingList = pendingResponse.orders ?? []
      const historyList = historyResponse.order_history ?? []

      const pendingComputedTotal = pendingList.reduce((sum, order) => sum + (order.food_price || 0), 0)
      const historyComputedTotal = historyList.reduce((sum, order) => sum + (order.food_price || 0), 0)

      setHistoryOrders(historyList)
      setPendingSummary({
        total_orders: pendingResponse.summary?.total_orders ?? pendingList.length,
        total_amount: pendingResponse.summary?.total_amount ?? pendingComputedTotal,
        total_items: pendingResponse.summary?.total_items ?? 0,
      })
      setHistorySummary({
        total_orders: historyResponse.summary?.total_orders ?? historyList.length,
        total_amount: historyResponse.summary?.total_amount ?? historyComputedTotal,
        total_items: historyResponse.summary?.total_items ?? 0,
      })
      setLastUpdated(new Date())
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Unable to load your orders."
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void loadOrders()
  }, [loadOrders])

  const recentHistory = historyOrders.slice(0, 5)

  return (
    <>
      <Header />
      <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
        <section className="from-muted/50 via-background to-muted/20 border-border relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-indigo-200/45 blur-3xl dark:bg-indigo-700/25" />
          <div className="absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-cyan-200/55 blur-3xl dark:bg-cyan-700/25" />

          <div className="relative space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-foreground font-display text-3xl font-semibold tracking-tight">Your Orders</h1>
                <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
                  Track active orders and review your complete order history in one place.
                </p>
                <p className="text-muted-foreground/90 mt-3 text-xs">
                  Last updated: {lastUpdated ? formatDateTime(lastUpdated.toISOString()) : "Not loaded yet"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void loadOrders()}
                className="bg-background text-foreground border-border inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-muted/70"
              >
                <RefreshCcw className="size-4" />
                Refresh
              </button>
            </div>
          </div>
        </section>

        {loading ? (
          <Card className="border-border/70 bg-card/95 shadow-sm">
            <CardContent className="py-8 text-sm text-muted-foreground">Loading your order overview...</CardContent>
          </Card>
        ) : null}

        {!loading && error ? (
          <Card className="border-red-300/70 bg-red-50/80 dark:border-red-900 dark:bg-red-950/30">
            <CardHeader>
              <CardTitle className="text-red-700 dark:text-red-300">Failed to load your orders</CardTitle>
              <CardDescription className="text-red-700/80 dark:text-red-200/80">{error}</CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        {!loading && !error ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                title="Pending Orders"
                value={formatNumber(pendingSummary.total_orders)}
                subtitle="Current active orders"
                icon={Clock3}
              />
              <MetricCard
                title="Pending Amount"
                value={formatCurrency(pendingSummary.total_amount)}
                subtitle="Value of pending orders"
                icon={Wallet}
              />
              <MetricCard
                title="History Orders"
                value={formatNumber(historySummary.total_orders)}
                subtitle="Completed order records"
                icon={History}
              />
              <MetricCard
                title="Total Spend"
                value={formatCurrency(historySummary.total_amount)}
                subtitle="Accumulated history spend"
                icon={ShoppingBag}
              />
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <Card className="border-border/70 bg-card/95 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-foreground text-base">Pending Orders</CardTitle>
                  <CardDescription className="text-muted-foreground text-sm">
                    Orders waiting to be completed.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="bg-muted/35 border-border rounded-lg border px-3 py-2 text-xs">
                      <p className="text-muted-foreground">Orders</p>
                      <p className="text-foreground mt-1 font-semibold">{formatNumber(pendingSummary.total_orders)}</p>
                    </div>
                    <div className="bg-muted/35 border-border rounded-lg border px-3 py-2 text-xs">
                      <p className="text-muted-foreground">Amount</p>
                      <p className="text-foreground mt-1 font-semibold">{formatCurrency(pendingSummary.total_amount)}</p>
                    </div>
                  </div>
                  <Link
                    href="/your-orders/pending"
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    Open Pending Orders
                    <ArrowRight className="size-4" />
                  </Link>
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-card/95 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-foreground text-base">Order History</CardTitle>
                  <CardDescription className="text-muted-foreground text-sm">
                    Your completed and archived order timeline.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="bg-muted/35 border-border rounded-lg border px-3 py-2 text-xs">
                      <p className="text-muted-foreground">Orders</p>
                      <p className="text-foreground mt-1 font-semibold">{formatNumber(historySummary.total_orders)}</p>
                    </div>
                    <div className="bg-muted/35 border-border rounded-lg border px-3 py-2 text-xs">
                      <p className="text-muted-foreground">Spend</p>
                      <p className="text-foreground mt-1 font-semibold">{formatCurrency(historySummary.total_amount)}</p>
                    </div>
                  </div>
                  <Link
                    href="/your-orders/history"
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    Open Order History
                    <ArrowRight className="size-4" />
                  </Link>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border/70 bg-card/95 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-foreground text-base">Recent History Orders</CardTitle>
                <CardDescription className="text-muted-foreground text-sm">
                  Latest {recentHistory.length} records from your history.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {!recentHistory.length ? (
                  <p className="text-muted-foreground text-sm">No history orders found yet.</p>
                ) : (
                  recentHistory.map((order) => (
                    <div key={order.uid} className="bg-muted/35 border-border rounded-lg border px-3 py-2 text-sm">
                      <p className="text-foreground font-medium">#{order.order_id || order.uid}</p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {formatDateTime(order.order_time)} | {formatCurrency(order.food_price || 0)}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </>
  )
}
