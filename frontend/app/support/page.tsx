"use client"

import * as React from "react"
import { AlertTriangle, CheckCircle2, Clock3, LifeBuoy, RefreshCcw, Search, Send } from "lucide-react"

import Header from "@/components/layout/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { apiFetch } from "@/lib/auth"

type SupportItem = {
  uid: string
  user: string
  email?: string | null
  category: "support" | "feedback"
  subject: string
  message: string
  rating?: number | null
  priority: "low" | "normal" | "high"
  status: "open" | "in_review" | "resolved"
  admin_notes?: string | null
  created_at: string
  updated_at: string
}

type SupportListResponse = {
  category: string
  summary: {
    total: number
    open: number
    in_review: number
    resolved: number
  }
  items: SupportItem[]
}

type SupportSubmitResponse = {
  message: string
  item: SupportItem
}

const dateTimeFormatter = new Intl.DateTimeFormat("en-MY", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
})

function formatDateTime(value: string | null | undefined) {
  if (!value) return "N/A"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "N/A"
  return dateTimeFormatter.format(parsed)
}

function statusStyle(status: string) {
  const key = status.trim().toLowerCase()
  if (key === "resolved") return "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200"
  if (key === "in_review") return "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-200"
  return "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200"
}

function priorityStyle(priority: string) {
  const key = priority.trim().toLowerCase()
  if (key === "high") return "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-200"
  if (key === "low") return "bg-slate-100 text-slate-800 dark:bg-slate-500/20 dark:text-slate-200"
  return "bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-200"
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

export default function SupportPage() {
  const [loading, setLoading] = React.useState(true)
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null)

  const [search, setSearch] = React.useState("")
  const [appliedSearch, setAppliedSearch] = React.useState("")
  const [summary, setSummary] = React.useState({
    total: 0,
    open: 0,
    in_review: 0,
    resolved: 0,
  })
  const [items, setItems] = React.useState<SupportItem[]>([])

  const [subject, setSubject] = React.useState("")
  const [priority, setPriority] = React.useState<"low" | "normal" | "high">("normal")
  const [message, setMessage] = React.useState("")

  const loadData = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (appliedSearch.trim()) params.set("search", appliedSearch.trim())
      const endpoint = params.toString() ? `/support/?${params.toString()}` : "/support/"
      const response = await apiFetch<SupportListResponse>(endpoint)
      setSummary(response.summary ?? { total: 0, open: 0, in_review: 0, resolved: 0 })
      setItems(response.items ?? [])
      setLastUpdated(new Date())
    } catch (loadError) {
      const messageText = loadError instanceof Error ? loadError.message : "Unable to load support requests."
      setError(messageText)
    } finally {
      setLoading(false)
    }
  }, [appliedSearch])

  React.useEffect(() => {
    void loadData()
  }, [loadData])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    if (!message.trim()) {
      setError("Please write your support message.")
      return
    }

    setSubmitting(true)
    try {
      const response = await apiFetch<SupportSubmitResponse>("/support/", {
        method: "POST",
        body: JSON.stringify({
          subject: subject.trim(),
          message: message.trim(),
          priority,
        }),
      })
      setSuccess(response.message || "Support request submitted successfully.")
      setSubject("")
      setPriority("normal")
      setMessage("")
      await loadData()
    } catch (submitError) {
      const messageText = submitError instanceof Error ? submitError.message : "Unable to submit support request."
      setError(messageText)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Header />
      <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
        <section className="from-muted/50 via-background to-muted/20 border-border relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-blue-200/45 blur-3xl dark:bg-blue-700/25" />
          <div className="absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-cyan-200/55 blur-3xl dark:bg-cyan-700/25" />

          <div className="relative space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-foreground font-display text-3xl font-semibold tracking-tight">Support</h1>
                <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
                  Submit technical or order-related issues and track your support request status.
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
              <CardTitle className="text-red-700 dark:text-red-300">Support action failed</CardTitle>
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
          <MetricCard title="Total Requests" value={String(summary.total)} subtitle="All your support requests" icon={LifeBuoy} />
          <MetricCard title="Open" value={String(summary.open)} subtitle="Waiting for review" icon={AlertTriangle} />
          <MetricCard title="In Review" value={String(summary.in_review)} subtitle="Support team is checking" icon={Clock3} />
          <MetricCard title="Resolved" value={String(summary.resolved)} subtitle="Completed support requests" icon={CheckCircle2} />
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <Card className="border-border/70 bg-card/95 shadow-sm xl:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-foreground text-base">New Support Request</CardTitle>
              <CardDescription className="text-muted-foreground text-sm">
                Describe your issue and priority level.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-foreground text-sm font-medium">Subject (optional)</label>
                  <input
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                    placeholder="Order confirmation issue"
                    className="bg-background text-foreground border-border w-full rounded-lg border px-3 py-2 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-foreground text-sm font-medium">Priority</label>
                  <select
                    value={priority}
                    onChange={(event) => setPriority(event.target.value as "low" | "normal" | "high")}
                    className="bg-background text-foreground border-border w-full rounded-lg border px-3 py-2 text-sm"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-foreground text-sm font-medium">Message</label>
                  <textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    rows={5}
                    placeholder="Please explain what happened and what you expected."
                    className="bg-background text-foreground border-border w-full rounded-lg border px-3 py-2 text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Send className="size-4" />
                  {submitting ? "Submitting..." : "Submit Request"}
                </button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/95 shadow-sm xl:col-span-2">
            <CardHeader className="pb-2">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="text-foreground text-base">Your Support Requests</CardTitle>
                  <CardDescription className="text-muted-foreground text-sm">
                    Review submitted requests and their status.
                  </CardDescription>
                </div>
                <div className="relative w-full md:w-72">
                  <Search className="text-muted-foreground pointer-events-none absolute left-2.5 top-2.5 size-4" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        setAppliedSearch(search)
                      }
                    }}
                    placeholder="Search subject/message"
                    className="bg-background text-foreground border-border w-full rounded-lg border py-2 pl-9 pr-3 text-sm"
                  />
                </div>
              </div>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setAppliedSearch(search)}
                  className="inline-flex items-center rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/60"
                >
                  Apply Search
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? <p className="text-muted-foreground text-sm">Loading support requests...</p> : null}
              {!loading && !items.length ? (
                <p className="text-muted-foreground text-sm">No support requests found.</p>
              ) : null}
              {items.map((item) => (
                <div key={item.uid} className="bg-muted/35 border-border rounded-lg border p-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-foreground font-semibold">{item.subject}</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusStyle(item.status)}`}>
                      {item.status.replace("_", " ")}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${priorityStyle(item.priority)}`}>
                      {item.priority}
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-2 whitespace-pre-wrap">{item.message}</p>
                  {item.admin_notes ? (
                    <p className="text-muted-foreground mt-2 text-xs">Admin notes: {item.admin_notes}</p>
                  ) : null}
                  <p className="text-muted-foreground mt-2 text-xs">
                    Created: {formatDateTime(item.created_at)} | Updated: {formatDateTime(item.updated_at)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
