"use client"

import * as React from "react"
import { CheckCircle2, Clock3, RefreshCcw, Search, Wallet, XCircle } from "lucide-react"

import Header from "@/components/layout/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { apiFetch } from "@/lib/auth"

type SubscriptionHistoryItem = {
  uid: string
  status: string
  chef: string
  subscription_option_name?: string | null
  subscription_duration_months?: number | null
  transaction_description?: string | null
  transaction_time?: string | null
  transaction_id?: string | null
  amount: number
}

type SubscriptionHistoryResponse = {
  summary: {
    total: number
    approved: number
    rejected: number
    total_revenue: number
  }
  items: SubscriptionHistoryItem[]
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

function statusClass(status: string) {
  const normalized = String(status || "").trim().toLowerCase()
  if (normalized === "approved" || normalized === "completed" || normalized === "active") {
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200"
  }
  if (normalized === "rejected") {
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

export default function SubscriptionHistoryPage() {
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null)
  const [statusFilter, setStatusFilter] = React.useState("")
  const [search, setSearch] = React.useState("")

  const [summary, setSummary] = React.useState<SubscriptionHistoryResponse["summary"]>({
    total: 0,
    approved: 0,
    rejected: 0,
    total_revenue: 0,
  })
  const [items, setItems] = React.useState<SubscriptionHistoryItem[]>([])

  const loadData = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set("status", statusFilter)
      if (search.trim()) params.set("search", search.trim())
      params.set("limit", "1000")

      const response = await apiFetch<SubscriptionHistoryResponse>(`/admin/subscriptions/history/?${params.toString()}`)
      setSummary(response.summary ?? { total: 0, approved: 0, rejected: 0, total_revenue: 0 })
      setItems(response.items ?? [])
      setLastUpdated(new Date())
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Unable to load subscription history."
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter])

  React.useEffect(() => {
    void loadData()
  }, [loadData])

  return (
    <>
      <Header />
      <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
        <section className="from-muted/50 via-background to-muted/20 border-border relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-emerald-200/45 blur-3xl dark:bg-emerald-700/25" />
          <div className="absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-cyan-200/55 blur-3xl dark:bg-cyan-700/25" />

          <div className="relative space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-foreground font-display text-3xl font-semibold tracking-tight">Subscription History</h1>
                <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
                  Review approved and rejected subscription records across all chefs.
                </p>
                <p className="text-muted-foreground/90 mt-3 text-xs">
                  Last updated: {lastUpdated ? formatDateTime(lastUpdated.toISOString()) : "Not loaded yet"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void loadData()}
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
                  placeholder="Search by chef, plan, transaction ID, description"
                  className="bg-background text-foreground border-border w-full rounded-lg border py-2 pl-9 pr-3 text-sm"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="bg-background text-foreground border-border rounded-lg border px-3 py-2 text-sm"
              >
                <option value="">All Statuses</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <button
                type="button"
                onClick={() => void loadData()}
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </section>

        {error ? (
          <Card className="border-red-300/70 bg-red-50/80 dark:border-red-900 dark:bg-red-950/30">
            <CardHeader>
              <CardTitle className="text-red-700 dark:text-red-300">Failed to load subscription history</CardTitle>
              <CardDescription className="text-red-700/80 dark:text-red-200/80">{error}</CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="Total Records" value={formatNumber(summary.total)} subtitle="All processed subscription requests" icon={Clock3} />
          <MetricCard title="Approved" value={formatNumber(summary.approved)} subtitle="Accepted by admin" icon={CheckCircle2} />
          <MetricCard title="Rejected" value={formatNumber(summary.rejected)} subtitle="Declined by admin" icon={XCircle} />
          <MetricCard title="Total Revenue" value={formatCurrency(summary.total_revenue)} subtitle="Approved subscription income" icon={Wallet} />
        </div>

        <Card className="border-border/70 bg-card/95 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-foreground text-base">Subscription History Records</CardTitle>
            <CardDescription className="text-muted-foreground text-sm">
              {items.length} record(s) match current filters.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {loading ? <p className="text-muted-foreground py-4 text-sm">Loading history records...</p> : null}
            {!loading && !items.length ? <p className="text-muted-foreground py-4 text-sm">No subscription history found.</p> : null}
            {!loading && items.length ? (
              <table className="w-full min-w-[980px] text-sm">
                <thead>
                  <tr className="border-border border-b text-left">
                    <th className="text-muted-foreground px-2 py-3 font-medium">Transaction</th>
                    <th className="text-muted-foreground px-2 py-3 font-medium">Chef</th>
                    <th className="text-muted-foreground px-2 py-3 font-medium">Plan</th>
                    <th className="text-muted-foreground px-2 py-3 font-medium">Amount</th>
                    <th className="text-muted-foreground px-2 py-3 font-medium">Status</th>
                    <th className="text-muted-foreground px-2 py-3 font-medium">Date</th>
                    <th className="text-muted-foreground px-2 py-3 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.uid} className="border-border/70 border-b align-top">
                      <td className="text-foreground px-2 py-3 font-medium">{item.transaction_id || item.uid}</td>
                      <td className="text-foreground px-2 py-3">{item.chef}</td>
                      <td className="px-2 py-3">
                        <p className="text-foreground">{item.subscription_option_name || "Subscription Plan"}</p>
                        <p className="text-muted-foreground text-xs">
                          {item.subscription_duration_months || 0} month{(item.subscription_duration_months || 0) > 1 ? "s" : ""}
                        </p>
                      </td>
                      <td className="text-foreground px-2 py-3">{formatCurrency(item.amount)}</td>
                      <td className="px-2 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="text-foreground px-2 py-3">{formatDateTime(item.transaction_time)}</td>
                      <td className="text-muted-foreground px-2 py-3 whitespace-pre-wrap">
                        {item.transaction_description || "No description"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
