"use client"

import * as React from "react"
import Link from "next/link"
import { BadgeCheck, CalendarClock, Clock3, CreditCard, RefreshCcw, Wallet } from "lucide-react"

import Header from "@/components/layout/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { apiFetch } from "@/lib/auth"

type SubscriptionOption = {
  id: number
  name: string
  duration_months: number
  price: number
  description?: string | null
}

type SubscriptionTx = {
  uid: string
  status: string
  subscription_option_name?: string | null
  subscription_duration_months?: number | null
  transaction_time?: string | null
  transaction_id?: string | null
  amount: number
}

type SubscriptionOverviewResponse = {
  chef: string
  subscription_status: string
  subscription_ends?: string | null
  pending_request_count: number
  history_count: number
  total_subscription_spent: number
  latest_pending_request?: SubscriptionTx | null
  latest_history?: SubscriptionTx | null
  available_subscriptions: SubscriptionOption[]
}

const numberFormatter = new Intl.NumberFormat("en-MY")
const currencyFormatter = new Intl.NumberFormat("en-MY", {
  style: "currency",
  currency: "MYR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function formatCurrency(value: number) {
  return currencyFormatter.format(value || 0)
}

function formatNumber(value: number) {
  return numberFormatter.format(Math.round(value || 0))
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
  if (normalized === "active" || normalized === "approved") {
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200"
  }
  if (normalized === "pending" || normalized === "in_review") {
    return "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200"
  }
  if (normalized === "rejected" || normalized === "expired") {
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
          <span className="bg-muted/50 border-border text-muted-foreground rounded-lg border p-2">
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

export default function SubscriptionPage() {
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null)
  const [data, setData] = React.useState<SubscriptionOverviewResponse | null>(null)

  const loadOverview = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiFetch<SubscriptionOverviewResponse>("/subscription/")
      setData(response)
      setLastUpdated(new Date())
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Unable to load subscription overview."
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void loadOverview()
  }, [loadOverview])

  const plans = data?.available_subscriptions ?? []

  return (
    <>
      <Header />
      <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
        <section className="from-muted/50 via-background to-muted/20 border-border relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-cyan-200/45 blur-3xl dark:bg-cyan-700/25" />
          <div className="absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-blue-200/55 blur-3xl dark:bg-blue-700/25" />

          <div className="relative space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-foreground font-display text-3xl font-semibold tracking-tight">Subscription</h1>
                <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
                  Track your current subscription, pending requests, and available plans in one place.
                </p>
                <p className="text-muted-foreground/90 mt-3 text-xs">
                  Last updated: {lastUpdated ? formatDateTime(lastUpdated.toISOString()) : "Not loaded yet"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void loadOverview()}
                className="bg-background text-foreground border-border inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-muted/70"
              >
                <RefreshCcw className="size-4" />
                Refresh
              </button>
            </div>
          </div>
        </section>

        {error ? (
          <Card className="border-red-300/70 bg-red-50/80 dark:border-red-900 dark:bg-red-950/30">
            <CardHeader>
              <CardTitle className="text-red-700 dark:text-red-300">Failed to load subscription overview</CardTitle>
              <CardDescription className="text-red-700/80 dark:text-red-200/80">{error}</CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        {loading ? (
          <Card className="border-border/70 bg-card/95 shadow-sm">
            <CardContent className="py-8 text-sm text-muted-foreground">Loading subscription overview...</CardContent>
          </Card>
        ) : null}

        {!loading && !error ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                title="Subscription Status"
                value={data?.subscription_status || "N/A"}
                subtitle={`Chef: ${data?.chef || "N/A"}`}
                icon={BadgeCheck}
              />
              <MetricCard
                title="Subscription Ends"
                value={formatDateTime(data?.subscription_ends || null)}
                subtitle="Current expiry date"
                icon={CalendarClock}
              />
              <MetricCard
                title="Pending Requests"
                value={formatNumber(data?.pending_request_count || 0)}
                subtitle="Waiting for admin review"
                icon={Clock3}
              />
              <MetricCard
                title="Total Spent"
                value={formatCurrency(data?.total_subscription_spent || 0)}
                subtitle="Approved subscription payments"
                icon={Wallet}
              />
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
              <Card className="border-border/70 bg-card/95 shadow-sm xl:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-foreground text-base">Available Plans</CardTitle>
                  <CardDescription className="text-muted-foreground text-sm">
                    Choose a plan and submit a subscription request.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {!plans.length ? <p className="text-muted-foreground text-sm">No subscription plans available yet.</p> : null}
                  {plans.slice(0, 4).map((plan) => (
                    <div key={plan.id} className="bg-muted/35 border-border rounded-lg border px-3 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-foreground font-medium">{plan.name}</p>
                          <p className="text-muted-foreground text-xs">
                            {plan.duration_months} month{plan.duration_months > 1 ? "s" : ""}
                          </p>
                        </div>
                        <p className="text-foreground font-semibold">{formatCurrency(plan.price)}</p>
                      </div>
                      {plan.description ? (
                        <p className="text-muted-foreground mt-2 text-xs">{plan.description}</p>
                      ) : null}
                    </div>
                  ))}
                  <div className="pt-1">
                    <Link
                      href="/subscription/get"
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
                    >
                      <CreditCard className="size-3.5" />
                      Go to Get a Subscription
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-card/95 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-foreground text-base">Latest Activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="bg-muted/35 border-border rounded-lg border px-3 py-2">
                    <p className="text-muted-foreground text-xs">Latest Pending</p>
                    {data?.latest_pending_request ? (
                      <>
                        <p className="text-foreground mt-1 font-medium">
                          {data.latest_pending_request.subscription_option_name || "Subscription Request"}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {formatCurrency(data.latest_pending_request.amount)} •{" "}
                          {formatDateTime(data.latest_pending_request.transaction_time)}
                        </p>
                        <span
                          className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusClass(
                            data.latest_pending_request.status
                          )}`}
                        >
                          {data.latest_pending_request.status}
                        </span>
                      </>
                    ) : (
                      <p className="text-muted-foreground mt-1 text-xs">No pending request.</p>
                    )}
                  </div>

                  <div className="bg-muted/35 border-border rounded-lg border px-3 py-2">
                    <p className="text-muted-foreground text-xs">Latest Processed</p>
                    {data?.latest_history ? (
                      <>
                        <p className="text-foreground mt-1 font-medium">
                          {data.latest_history.subscription_option_name || "Subscription Record"}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {formatCurrency(data.latest_history.amount)} • {formatDateTime(data.latest_history.transaction_time)}
                        </p>
                        <span
                          className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusClass(
                            data.latest_history.status
                          )}`}
                        >
                          {data.latest_history.status}
                        </span>
                      </>
                    ) : (
                      <p className="text-muted-foreground mt-1 text-xs">No subscription history yet.</p>
                    )}
                  </div>

                  <p className="text-muted-foreground text-xs">
                    Total processed records: <span className="text-foreground font-medium">{formatNumber(data?.history_count || 0)}</span>
                  </p>
                </CardContent>
              </Card>
            </div>
          </>
        ) : null}
      </div>
    </>
  )
}
