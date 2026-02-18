"use client"

import * as React from "react"
import { CheckCircle2, Lightbulb, MessageSquare, RefreshCcw, Search, Send, Star } from "lucide-react"

import Header from "@/components/layout/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { apiFetch } from "@/lib/auth"

type FeedbackItem = {
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

type FeedbackListResponse = {
  category: string
  summary: {
    total: number
    open: number
    in_review: number
    resolved: number
  }
  items: FeedbackItem[]
}

type FeedbackSubmitResponse = {
  message: string
  item: FeedbackItem
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

export default function FeedbackPage() {
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
  const [items, setItems] = React.useState<FeedbackItem[]>([])

  const [subject, setSubject] = React.useState("")
  const [message, setMessage] = React.useState("")
  const [rating, setRating] = React.useState(5)

  const loadData = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (appliedSearch.trim()) params.set("search", appliedSearch.trim())
      const endpoint = params.toString() ? `/feedback/?${params.toString()}` : "/feedback/"
      const response = await apiFetch<FeedbackListResponse>(endpoint)
      setSummary(response.summary ?? { total: 0, open: 0, in_review: 0, resolved: 0 })
      setItems(response.items ?? [])
      setLastUpdated(new Date())
    } catch (loadError) {
      const messageText = loadError instanceof Error ? loadError.message : "Unable to load feedback entries."
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
      setError("Please write your feedback before submitting.")
      return
    }

    setSubmitting(true)
    try {
      const response = await apiFetch<FeedbackSubmitResponse>("/feedback/", {
        method: "POST",
        body: JSON.stringify({
          subject: subject.trim(),
          message: message.trim(),
          rating,
          priority: "low",
        }),
      })
      setSuccess(response.message || "Feedback submitted successfully.")
      setSubject("")
      setMessage("")
      setRating(5)
      await loadData()
    } catch (submitError) {
      const messageText = submitError instanceof Error ? submitError.message : "Unable to submit feedback."
      setError(messageText)
    } finally {
      setSubmitting(false)
    }
  }

  const averageRating =
    items.length > 0
      ? items.reduce((sum, item) => sum + (typeof item.rating === "number" ? item.rating : 0), 0) / items.length
      : 0

  return (
    <>
      <Header />
      <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
        <section className="from-muted/50 via-background to-muted/20 border-border relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-emerald-200/45 blur-3xl dark:bg-emerald-700/25" />
          <div className="absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-lime-200/55 blur-3xl dark:bg-lime-700/25" />

          <div className="relative space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-foreground font-display text-3xl font-semibold tracking-tight">Feedback</h1>
                <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
                  Share ideas, report UX pain points, and help improve Food Now for campus users.
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
              <CardTitle className="text-red-700 dark:text-red-300">Feedback action failed</CardTitle>
              <CardDescription className="text-red-700/80 dark:text-red-200/80">{error}</CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        {success ? (
          <Card className="border-emerald-300/70 bg-emerald-50/80 dark:border-emerald-900 dark:bg-emerald-950/30">
            <CardHeader>
              <CardTitle className="text-emerald-700 dark:text-emerald-300">Thank you</CardTitle>
              <CardDescription className="text-emerald-700/80 dark:text-emerald-200/80">{success}</CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="Total Feedback" value={String(summary.total)} subtitle="Your submitted feedback items" icon={MessageSquare} />
          <MetricCard title="Open" value={String(summary.open)} subtitle="Awaiting admin review" icon={Lightbulb} />
          <MetricCard title="In Review" value={String(summary.in_review)} subtitle="Team is currently reviewing" icon={RefreshCcw} />
          <MetricCard title="Avg Rating" value={averageRating ? averageRating.toFixed(1) : "N/A"} subtitle="Average from submitted ratings" icon={Star} />
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <Card className="border-border/70 bg-card/95 shadow-sm xl:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-foreground text-base">Submit Feedback</CardTitle>
              <CardDescription className="text-muted-foreground text-sm">
                Tell us what is working well and what should be improved.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-foreground text-sm font-medium">Subject (optional)</label>
                  <input
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                    placeholder="Dashboard usability"
                    className="bg-background text-foreground border-border w-full rounded-lg border px-3 py-2 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-foreground text-sm font-medium">Rating</label>
                  <select
                    value={rating}
                    onChange={(event) => setRating(Number(event.target.value))}
                    className="bg-background text-foreground border-border w-full rounded-lg border px-3 py-2 text-sm"
                  >
                    <option value={5}>5 - Excellent</option>
                    <option value={4}>4 - Good</option>
                    <option value={3}>3 - Average</option>
                    <option value={2}>2 - Needs Improvement</option>
                    <option value={1}>1 - Poor</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-foreground text-sm font-medium">Message</label>
                  <textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    rows={5}
                    placeholder="Share your suggestions or experience..."
                    className="bg-background text-foreground border-border w-full rounded-lg border px-3 py-2 text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Send className="size-4" />
                  {submitting ? "Submitting..." : "Submit Feedback"}
                </button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/95 shadow-sm xl:col-span-2">
            <CardHeader className="pb-2">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="text-foreground text-base">Your Feedback History</CardTitle>
                  <CardDescription className="text-muted-foreground text-sm">
                    See all submitted feedback and admin response status.
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
              {loading ? <p className="text-muted-foreground text-sm">Loading feedback history...</p> : null}
              {!loading && !items.length ? (
                <p className="text-muted-foreground text-sm">No feedback entries found.</p>
              ) : null}
              {items.map((item) => (
                <div key={item.uid} className="bg-muted/35 border-border rounded-lg border p-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-foreground font-semibold">{item.subject}</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusStyle(item.status)}`}>
                      {item.status.replace("_", " ")}
                    </span>
                    {typeof item.rating === "number" ? (
                      <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-200">
                        {item.rating}/5
                      </span>
                    ) : null}
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

        {summary.resolved > 0 ? (
          <Card className="border-border/70 bg-card/95 shadow-sm">
            <CardContent className="py-4 text-sm text-muted-foreground">
              <p className="inline-flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-600" />
                {summary.resolved} feedback item(s) have already been reviewed and resolved by admin.
              </p>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </>
  )
}
