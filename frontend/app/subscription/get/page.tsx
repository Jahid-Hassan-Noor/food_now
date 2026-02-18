"use client"

import * as React from "react"
import { CalendarClock, CheckCircle2, Clock3, RefreshCcw, Send, Upload, Wallet } from "lucide-react"

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
  transaction_description?: string | null
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
}

type SubscriptionOptionsResponse = {
  available_subscriptions: SubscriptionOption[]
}

type SubscriptionPendingResponse = {
  summary: {
    total_pending: number
    total_amount: number
  }
  items: SubscriptionTx[]
}

type SubscriptionHistoryResponse = {
  summary: {
    total: number
    approved: number
    rejected: number
    total_spent: number
  }
  items: SubscriptionTx[]
}

type SubscriptionRequestResponse = {
  message: string
  request: SubscriptionTx
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
  if (normalized === "approved" || normalized === "active" || normalized === "completed") {
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200"
  }
  if (normalized === "pending") {
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

export default function GetSubscriptionPage() {
  const [loading, setLoading] = React.useState(true)
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null)

  const [overview, setOverview] = React.useState<SubscriptionOverviewResponse | null>(null)
  const [options, setOptions] = React.useState<SubscriptionOption[]>([])
  const [pending, setPending] = React.useState<SubscriptionPendingResponse["items"]>([])
  const [pendingSummary, setPendingSummary] = React.useState<SubscriptionPendingResponse["summary"]>({
    total_pending: 0,
    total_amount: 0,
  })
  const [history, setHistory] = React.useState<SubscriptionHistoryResponse["items"]>([])
  const [historySummary, setHistorySummary] = React.useState<SubscriptionHistoryResponse["summary"]>({
    total: 0,
    approved: 0,
    rejected: 0,
    total_spent: 0,
  })

  const [selectedOptionId, setSelectedOptionId] = React.useState<number | null>(null)
  const [note, setNote] = React.useState("")
  const [proofFile, setProofFile] = React.useState<File | null>(null)
  const [proofFileName, setProofFileName] = React.useState("")

  const loadData = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [overviewRes, optionsRes, pendingRes, historyRes] = await Promise.all([
        apiFetch<SubscriptionOverviewResponse>("/subscription/"),
        apiFetch<SubscriptionOptionsResponse>("/subscription/options/"),
        apiFetch<SubscriptionPendingResponse>("/subscription/pending/"),
        apiFetch<SubscriptionHistoryResponse>("/subscription/history/"),
      ])

      setOverview(overviewRes)
      const planOptions = optionsRes.available_subscriptions ?? []
      setOptions(planOptions)
      setPending(pendingRes.items ?? [])
      setPendingSummary(pendingRes.summary ?? { total_pending: 0, total_amount: 0 })
      setHistory(historyRes.items ?? [])
      setHistorySummary(historyRes.summary ?? { total: 0, approved: 0, rejected: 0, total_spent: 0 })
      setSelectedOptionId((current) => current ?? (planOptions[0]?.id ?? null))
      setLastUpdated(new Date())
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Unable to load subscription data."
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void loadData()
  }, [loadData])

  const selectedPlan = options.find((option) => option.id === selectedOptionId) || null

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null
    setProofFile(nextFile)
    setProofFileName(nextFile?.name ?? "")
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    if (!selectedOptionId) {
      setError("Please select a subscription plan.")
      return
    }

    if (!proofFile) {
      setError("Payment proof is mandatory. Please upload an image.")
      return
    }

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append("subscription_option_id", String(selectedOptionId))
      if (note.trim()) formData.append("transaction_description", note.trim())
      formData.append("transaction_proof", proofFile)

      const response = await apiFetch<SubscriptionRequestResponse>("/subscription/request/", {
        method: "POST",
        body: formData,
      })

      setSuccess(response.message || "Subscription request submitted successfully.")
      setNote("")
      setProofFile(null)
      setProofFileName("")
      await loadData()
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Unable to submit subscription request."
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Header />
      <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
        <section className="from-muted/50 via-background to-muted/20 border-border relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-teal-200/45 blur-3xl dark:bg-teal-700/25" />
          <div className="absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-cyan-200/55 blur-3xl dark:bg-cyan-700/25" />

          <div className="relative space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-foreground font-display text-3xl font-semibold tracking-tight">Get a Subscription</h1>
                <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
                  Select a plan, submit your payment proof, and track approval progress.
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
          </div>
        </section>

        {error ? (
          <Card className="border-red-300/70 bg-red-50/80 dark:border-red-900 dark:bg-red-950/30">
            <CardHeader>
              <CardTitle className="text-red-700 dark:text-red-300">Subscription request failed</CardTitle>
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

        {loading ? (
          <Card className="border-border/70 bg-card/95 shadow-sm">
            <CardContent className="py-8 text-sm text-muted-foreground">Loading subscription plans...</CardContent>
          </Card>
        ) : null}

        {!loading ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                title="Current Status"
                value={overview?.subscription_status || "N/A"}
                subtitle={`Chef: ${overview?.chef || "N/A"}`}
                icon={CheckCircle2}
              />
              <MetricCard
                title="Subscription Ends"
                value={formatDateTime(overview?.subscription_ends || null)}
                subtitle="Current expiry date"
                icon={CalendarClock}
              />
              <MetricCard
                title="Pending Requests"
                value={formatNumber(pendingSummary.total_pending)}
                subtitle="Awaiting admin response"
                icon={Clock3}
              />
              <MetricCard
                title="Total Paid"
                value={formatCurrency(historySummary.total_spent)}
                subtitle="Approved subscriptions only"
                icon={Wallet}
              />
            </div>

            <div className="grid gap-6 xl:grid-cols-3">
              <Card className="border-border/70 bg-card/95 shadow-sm xl:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-foreground text-base">Available Plans</CardTitle>
                  <CardDescription className="text-muted-foreground text-sm">
                    Pick the plan that fits your campaign cycle and submit your request.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-2">
                  {!options.length ? <p className="text-muted-foreground text-sm">No plans available right now.</p> : null}
                  {options.map((plan) => {
                    const selected = plan.id === selectedOptionId
                    return (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => setSelectedOptionId(plan.id)}
                        className={`rounded-lg border p-3 text-left transition ${
                          selected
                            ? "border-blue-500 bg-blue-50 dark:border-blue-700 dark:bg-blue-950/30"
                            : "border-border bg-muted/20 hover:bg-muted/40"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-foreground font-semibold">{plan.name}</p>
                          <span className="text-foreground text-sm font-semibold">{formatCurrency(plan.price)}</span>
                        </div>
                        <p className="text-muted-foreground mt-1 text-xs">
                          {plan.duration_months} month{plan.duration_months > 1 ? "s" : ""}
                        </p>
                        {plan.description ? (
                          <p className="text-muted-foreground mt-2 text-xs">{plan.description}</p>
                        ) : null}
                      </button>
                    )
                  })}
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-card/95 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-foreground text-base">Submit Request</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="bg-muted/35 border-border rounded-lg border px-3 py-2 text-sm">
                      <p className="text-muted-foreground text-xs">Selected Plan</p>
                      <p className="text-foreground mt-1 font-semibold">{selectedPlan?.name || "None selected"}</p>
                      <p className="text-muted-foreground text-xs">
                        {selectedPlan
                          ? `${selectedPlan.duration_months} month${selectedPlan.duration_months > 1 ? "s" : ""} • ${formatCurrency(selectedPlan.price)}`
                          : "Choose a plan first"}
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-foreground text-sm font-medium">Note (Optional)</label>
                      <textarea
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        rows={3}
                        placeholder="Any note for admin review..."
                        className="bg-background text-foreground border-border w-full rounded-lg border px-3 py-2 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-foreground text-sm font-medium">Payment Proof (Mandatory)</label>
                      <input
                        type="file"
                        accept="image/*"
                        required
                        onChange={handleFileChange}
                        className="bg-background text-foreground border-border w-full rounded-lg border px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-blue-600 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-blue-700"
                      />
                      <p className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                        <Upload className="size-3.5" />
                        {proofFileName || "No file selected"}
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting || !selectedOptionId || !proofFile}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Send className="size-4" />
                      {submitting ? "Submitting..." : "Submit Subscription Request"}
                    </button>
                  </form>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <Card className="border-border/70 bg-card/95 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-foreground text-base">Pending Requests</CardTitle>
                  <CardDescription className="text-muted-foreground text-sm">
                    {pending.length} request(s) waiting for approval.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {!pending.length ? <p className="text-muted-foreground text-sm">No pending subscription requests.</p> : null}
                  {pending.map((item) => (
                    <div key={item.uid} className="bg-muted/35 border-border rounded-lg border px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-foreground text-sm font-medium">{item.subscription_option_name || "Subscription Request"}</p>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusClass(item.status)}`}>
                          {item.status}
                        </span>
                      </div>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {formatCurrency(item.amount)} • {formatDateTime(item.transaction_time)}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-card/95 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-foreground text-base">Recent Subscription History</CardTitle>
                  <CardDescription className="text-muted-foreground text-sm">
                    Latest processed subscription records.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {!history.length ? <p className="text-muted-foreground text-sm">No subscription history yet.</p> : null}
                  {history.slice(0, 6).map((item) => (
                    <div key={item.uid} className="bg-muted/35 border-border rounded-lg border px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-foreground text-sm font-medium">{item.subscription_option_name || "Subscription Record"}</p>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusClass(item.status)}`}>
                          {item.status}
                        </span>
                      </div>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {formatCurrency(item.amount)} • {formatDateTime(item.transaction_time)}
                      </p>
                      <p className="text-muted-foreground text-xs">Ref: {item.transaction_id || item.uid}</p>
                    </div>
                  ))}
                  <p className="text-muted-foreground pt-1 text-xs">
                    Approved: <span className="text-foreground font-medium">{formatNumber(historySummary.approved)}</span> • Rejected:{" "}
                    <span className="text-foreground font-medium">{formatNumber(historySummary.rejected)}</span>
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
