"use client"

import * as React from "react"
import { Clock3, Package, RefreshCcw, Search, ShoppingBag, Wallet } from "lucide-react"

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

function resolveFoodNames(order: OrderRow) {
  if (order.food_items_details?.length) {
    return order.food_items_details.map((item) => item.food_name).filter(Boolean)
  }
  if (!order.food_items) return []
  return String(order.food_items)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
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

export default function PendingOrdersPage() {
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null)
  const [search, setSearch] = React.useState("")
  const [orders, setOrders] = React.useState<OrderRow[]>([])
  const [summary, setSummary] = React.useState<OrdersSummary>({
    total_orders: 0,
    total_amount: 0,
    total_items: 0,
  })

  const loadOrders = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiFetch<PendingOrdersResponse>("/orders/")
      const orderList = response.orders ?? []
      const totalAmount = orderList.reduce((sum, order) => sum + (order.food_price || 0), 0)
      const totalItems = orderList.reduce((sum, order) => {
        const quantity = Number(order.quantity || 0)
        if (quantity > 0) return sum + quantity
        return sum + Math.max(resolveFoodNames(order).length, 1)
      }, 0)

      setOrders(orderList)
      setSummary({
        total_orders: response.summary?.total_orders ?? orderList.length,
        total_amount: response.summary?.total_amount ?? totalAmount,
        total_items: response.summary?.total_items ?? totalItems,
      })
      setLastUpdated(new Date())
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Unable to load pending orders."
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void loadOrders()
  }, [loadOrders])

  const filteredOrders = orders.filter((order) => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return true
    const id = String(order.order_id || order.uid || "").toLowerCase()
    const foods = resolveFoodNames(order).join(" ").toLowerCase()
    return id.includes(keyword) || foods.includes(keyword)
  })

  const avgOrderValue = summary.total_orders > 0 ? summary.total_amount / summary.total_orders : 0

  return (
    <>
      <Header />
      <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
        <section className="from-muted/50 via-background to-muted/20 border-border relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-sky-200/45 blur-3xl dark:bg-sky-700/25" />
          <div className="absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-blue-200/55 blur-3xl dark:bg-blue-700/25" />

          <div className="relative space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-foreground font-display text-3xl font-semibold tracking-tight">Pending Orders</h1>
                <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
                  Monitor orders that are still active and waiting to be completed.
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

            <div className="bg-background/80 border-border rounded-xl border p-3">
              <div className="relative">
                <Search className="text-muted-foreground pointer-events-none absolute left-2.5 top-2.5 size-4" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by order ID or food name"
                  className="bg-background text-foreground border-border w-full rounded-lg border py-2 pl-9 pr-3 text-sm"
                />
              </div>
            </div>
          </div>
        </section>

        {loading ? (
          <Card className="border-border/70 bg-card/95 shadow-sm">
            <CardContent className="py-8 text-sm text-muted-foreground">Loading pending orders...</CardContent>
          </Card>
        ) : null}

        {!loading && error ? (
          <Card className="border-red-300/70 bg-red-50/80 dark:border-red-900 dark:bg-red-950/30">
            <CardHeader>
              <CardTitle className="text-red-700 dark:text-red-300">Failed to load pending orders</CardTitle>
              <CardDescription className="text-red-700/80 dark:text-red-200/80">{error}</CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        {!loading && !error ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                title="Pending Orders"
                value={formatNumber(summary.total_orders)}
                subtitle="Orders currently in progress"
                icon={Clock3}
              />
              <MetricCard
                title="Pending Amount"
                value={formatCurrency(summary.total_amount)}
                subtitle="Total pending order value"
                icon={Wallet}
              />
              <MetricCard
                title="Total Items"
                value={formatNumber(summary.total_items)}
                subtitle="Items included in pending orders"
                icon={Package}
              />
              <MetricCard
                title="Average Order"
                value={formatCurrency(avgOrderValue)}
                subtitle="Average pending order value"
                icon={ShoppingBag}
              />
            </div>

            <Card className="border-border/70 bg-card/95 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-foreground text-base">Pending Order List</CardTitle>
                <CardDescription className="text-muted-foreground text-sm">
                  {filteredOrders.length} order(s) match your current search.
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                {!filteredOrders.length ? (
                  <p className="text-muted-foreground py-4 text-sm">No pending orders found for this search.</p>
                ) : (
                  <table className="w-full min-w-[760px] text-sm">
                    <thead>
                      <tr className="border-border border-b text-left">
                        <th className="text-muted-foreground px-2 py-3 font-medium">Order ID</th>
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
                              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-500/20 dark:text-amber-200">
                                Pending
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
