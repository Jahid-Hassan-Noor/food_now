"use client"

import * as React from "react"
import { CheckCircle2, Clock3, RefreshCcw, Search, Users, Wallet, XCircle } from "lucide-react"

import Header from "@/components/layout/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { apiFetch } from "@/lib/auth"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000"

type SubscriptionPendingItem = {
  uid: string
  status: string
  chef: string
  subscription_option_id?: number | null
  subscription_option_name?: string | null
  subscription_duration_months?: number | null
  transaction_description?: string | null
  transaction_proof?: string | null
  transaction_time?: string | null
  amount: number
}

type PendingResponse = {
  summary: {
    total_pending: number
    total_amount: number
    unique_chefs: number
  }
  items: SubscriptionPendingItem[]
}

type PendingActionResponse = {
  message: string
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

function resolveImageUrl(image?: string | null) {
  if (!image) return ""
  if (image.startsWith("http://") || image.startsWith("https://")) return image
  if (image.startsWith("/")) return `${API_BASE}${image}`
  return `${API_BASE}/media/${image}`
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

export default function PendingSubscriptionPage() {
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null)

  const [search, setSearch] = React.useState("")
  const [items, setItems] = React.useState<SubscriptionPendingItem[]>([])
  const [summary, setSummary] = React.useState<PendingResponse["summary"]>({
    total_pending: 0,
    total_amount: 0,
    unique_chefs: 0,
  })
  const [actionLoadingId, setActionLoadingId] = React.useState<string | null>(null)
  const [notes, setNotes] = React.useState<Record<string, string>>({})

  const loadData = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (search.trim()) params.set("search", search.trim())
      params.set("status", "pending")
      params.set("limit", "500")

      const response = await apiFetch<PendingResponse>(`/admin/subscriptions/pending/?${params.toString()}`)
      const rows = response.items ?? []
      setItems(rows)
      setSummary(response.summary ?? { total_pending: 0, total_amount: 0, unique_chefs: 0 })

      const noteMap: Record<string, string> = {}
      rows.forEach((item) => {
        noteMap[item.uid] = ""
      })
      setNotes(noteMap)
      setLastUpdated(new Date())
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Unable to load pending subscriptions."
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [search])

  React.useEffect(() => {
    void loadData()
  }, [loadData])

  const handleAction = async (item: SubscriptionPendingItem, action: "approve" | "reject") => {
    setActionLoadingId(item.uid)
    setError(null)
    setSuccess(null)
    try {
      const response = await apiFetch<PendingActionResponse>(`/admin/subscriptions/pending/${item.uid}/`, {
        method: "PATCH",
        body: JSON.stringify({
          action,
          admin_note: notes[item.uid] || "",
        }),
      })
      setSuccess(response.message || `Subscription request ${action}d successfully.`)
      await loadData()
    } catch (actionError) {
      const message = actionError instanceof Error ? actionError.message : "Unable to process subscription request."
      setError(message)
    } finally {
      setActionLoadingId(null)
    }
  }

  return (
    <>
      <Header />
      <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
        <section className="from-muted/50 via-background to-muted/20 border-border relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-indigo-200/45 blur-3xl dark:bg-indigo-700/25" />
          <div className="absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-blue-200/55 blur-3xl dark:bg-blue-700/25" />

          <div className="relative space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-foreground font-display text-3xl font-semibold tracking-tight">Pending Subscription</h1>
                <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
                  Review chef subscription requests and approve or reject with notes.
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

            <div className="bg-background/80 border-border rounded-xl border p-3">
              <div className="relative">
                <Search className="text-muted-foreground pointer-events-none absolute left-2.5 top-2.5 size-4" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by chef, plan, or description"
                  className="bg-background text-foreground border-border w-full rounded-lg border py-2 pl-9 pr-3 text-sm"
                />
              </div>
            </div>
          </div>
        </section>

        {error ? (
          <Card className="border-red-300/70 bg-red-50/80 dark:border-red-900 dark:bg-red-950/30">
            <CardHeader>
              <CardTitle className="text-red-700 dark:text-red-300">Subscription action failed</CardTitle>
              <CardDescription className="text-red-700/80 dark:text-red-200/80">{error}</CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        {success ? (
          <Card className="border-emerald-300/70 bg-emerald-50/80 dark:border-emerald-900 dark:bg-emerald-950/30">
            <CardHeader>
              <CardTitle className="text-emerald-700 dark:text-emerald-300">Success</CardTitle>
              <CardDescription className="text-emerald-700/80 dark:text-emerald-200/80">{success}</CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Pending Requests"
            value={formatNumber(summary.total_pending)}
            subtitle="Awaiting admin decision"
            icon={Clock3}
          />
          <MetricCard
            title="Pending Amount"
            value={formatCurrency(summary.total_amount)}
            subtitle="Total requested subscription value"
            icon={Wallet}
          />
          <MetricCard
            title="Unique Chefs"
            value={formatNumber(summary.unique_chefs)}
            subtitle="Chefs with pending requests"
            icon={Users}
          />
          <MetricCard
            title="Filtered Results"
            value={formatNumber(items.length)}
            subtitle="Rows currently loaded"
            icon={Search}
          />
        </div>

        <Card className="border-border/70 bg-card/95 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-foreground text-base">Pending Subscription Requests</CardTitle>
            <CardDescription className="text-muted-foreground text-sm">
              Process requests and move them into subscription history records.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? <p className="text-muted-foreground text-sm">Loading pending subscriptions...</p> : null}
            {!loading && !items.length ? (
              <p className="text-muted-foreground text-sm">No pending subscription requests found.</p>
            ) : null}

            {items.map((item) => {
              const busy = actionLoadingId === item.uid
              const proofUrl = resolveImageUrl(item.transaction_proof || "")
              return (
                <div key={item.uid} className="bg-muted/35 border-border rounded-lg border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-foreground font-semibold">{item.subscription_option_name || "Subscription Request"}</p>
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-500/20 dark:text-amber-200">
                      pending
                    </span>
                  </div>

                  <div className="mt-2 grid gap-2 text-sm md:grid-cols-2">
                    <p className="text-muted-foreground">
                      Chef: <span className="text-foreground font-medium">{item.chef}</span>
                    </p>
                    <p className="text-muted-foreground">
                      Amount: <span className="text-foreground font-medium">{formatCurrency(item.amount)}</span>
                    </p>
                    <p className="text-muted-foreground">
                      Duration:{" "}
                      <span className="text-foreground font-medium">
                        {item.subscription_duration_months || 0} month{(item.subscription_duration_months || 0) > 1 ? "s" : ""}
                      </span>
                    </p>
                    <p className="text-muted-foreground">
                      Submitted: <span className="text-foreground font-medium">{formatDateTime(item.transaction_time)}</span>
                    </p>
                  </div>

                  {item.transaction_description ? (
                    <p className="text-muted-foreground mt-2 text-xs whitespace-pre-wrap">{item.transaction_description}</p>
                  ) : null}

                  {proofUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={proofUrl}
                      alt="Payment proof"
                      className="border-border mt-3 h-40 w-full rounded-lg border object-cover md:max-w-sm"
                    />
                  ) : null}

                  <div className="mt-3 space-y-2">
                    <textarea
                      value={notes[item.uid] || ""}
                      onChange={(event) =>
                        setNotes((current) => ({
                          ...current,
                          [item.uid]: event.target.value,
                        }))
                      }
                      rows={2}
                      placeholder="Admin note (optional)"
                      className="bg-background text-foreground border-border w-full rounded-lg border px-3 py-2 text-sm"
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void handleAction(item, "approve")}
                        disabled={busy}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <CheckCircle2 className="size-3.5" />
                        {busy ? "Processing..." : "Approve"}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleAction(item, "reject")}
                        disabled={busy}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <XCircle className="size-3.5" />
                        {busy ? "Processing..." : "Reject"}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
