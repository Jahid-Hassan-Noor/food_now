"use client"

import * as React from "react"
import { CheckCircle2, Clock3, Filter, MessageSquare, RefreshCcw, Search, ShieldAlert, Tag } from "lucide-react"

import Header from "@/components/layout/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { apiFetch } from "@/lib/auth"

type AdminFeedbackItem = {
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

type AdminFeedbackResponse = {
  filters: {
    category: string
    status: string
    priority: string
    search: string
    limit: number
  }
  summary: {
    total: number
    open: number
    in_review: number
    resolved: number
    support: number
    feedback: number
  }
  feedbacks: AdminFeedbackItem[]
}

type UpdateFeedbackResponse = {
  message: string
  feedback: AdminFeedbackItem
}

type FilterState = {
  category: "" | "support" | "feedback"
  status: "" | "open" | "in_review" | "resolved"
  priority: "" | "low" | "normal" | "high"
  search: string
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

function statusClass(status: string) {
  const key = status.trim().toLowerCase()
  if (key === "resolved") return "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200"
  if (key === "in_review") return "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-200"
  return "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200"
}

function priorityClass(priority: string) {
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

export default function UserFeedbacksPage() {
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null)

  const [filterDraft, setFilterDraft] = React.useState<FilterState>({
    category: "",
    status: "",
    priority: "",
    search: "",
  })
  const [appliedFilter, setAppliedFilter] = React.useState<FilterState>({
    category: "",
    status: "",
    priority: "",
    search: "",
  })

  const [summary, setSummary] = React.useState({
    total: 0,
    open: 0,
    in_review: 0,
    resolved: 0,
    support: 0,
    feedback: 0,
  })
  const [items, setItems] = React.useState<AdminFeedbackItem[]>([])
  const [savingId, setSavingId] = React.useState<string | null>(null)
  const [statusDrafts, setStatusDrafts] = React.useState<Record<string, "open" | "in_review" | "resolved">>({})
  const [priorityDrafts, setPriorityDrafts] = React.useState<Record<string, "low" | "normal" | "high">>({})
  const [notesDrafts, setNotesDrafts] = React.useState<Record<string, string>>({})

  const loadData = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (appliedFilter.category) params.set("category", appliedFilter.category)
      if (appliedFilter.status) params.set("status", appliedFilter.status)
      if (appliedFilter.priority) params.set("priority", appliedFilter.priority)
      if (appliedFilter.search.trim()) params.set("search", appliedFilter.search.trim())
      params.set("limit", "400")

      const response = await apiFetch<AdminFeedbackResponse>(`/admin/user_feedbacks/?${params.toString()}`)
      const rows = response.feedbacks ?? []
      setSummary(response.summary ?? { total: 0, open: 0, in_review: 0, resolved: 0, support: 0, feedback: 0 })
      setItems(rows)

      const nextStatus: Record<string, "open" | "in_review" | "resolved"> = {}
      const nextPriority: Record<string, "low" | "normal" | "high"> = {}
      const nextNotes: Record<string, string> = {}
      rows.forEach((row) => {
        nextStatus[row.uid] = row.status
        nextPriority[row.uid] = row.priority
        nextNotes[row.uid] = row.admin_notes || ""
      })
      setStatusDrafts(nextStatus)
      setPriorityDrafts(nextPriority)
      setNotesDrafts(nextNotes)
      setLastUpdated(new Date())
    } catch (loadError) {
      const messageText = loadError instanceof Error ? loadError.message : "Unable to load user feedbacks."
      setError(messageText)
    } finally {
      setLoading(false)
    }
  }, [appliedFilter])

  React.useEffect(() => {
    void loadData()
  }, [loadData])

  const handleApplyFilters = () => {
    setAppliedFilter(filterDraft)
  }

  const handleSave = async (item: AdminFeedbackItem) => {
    setSavingId(item.uid)
    setError(null)
    setSuccess(null)
    try {
      const response = await apiFetch<UpdateFeedbackResponse>(`/admin/user_feedbacks/${item.uid}/`, {
        method: "PATCH",
        body: JSON.stringify({
          status: statusDrafts[item.uid] || item.status,
          priority: priorityDrafts[item.uid] || item.priority,
          admin_notes: notesDrafts[item.uid] || "",
        }),
      })
      setSuccess(response.message || "Feedback updated successfully.")
      await loadData()
    } catch (saveError) {
      const messageText = saveError instanceof Error ? saveError.message : "Unable to update feedback."
      setError(messageText)
    } finally {
      setSavingId(null)
    }
  }

  const handleDelete = async (item: AdminFeedbackItem) => {
    if (!window.confirm(`Delete feedback "${item.subject}" from ${item.user}?`)) return

    setSavingId(item.uid)
    setError(null)
    setSuccess(null)
    try {
      await apiFetch<{ message: string }>(`/admin/user_feedbacks/${item.uid}/`, {
        method: "DELETE",
      })
      setSuccess("Feedback entry deleted successfully.")
      await loadData()
    } catch (deleteError) {
      const messageText = deleteError instanceof Error ? deleteError.message : "Unable to delete feedback."
      setError(messageText)
    } finally {
      setSavingId(null)
    }
  }

  return (
    <>
      <Header />
      <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
        <section className="from-muted/50 via-background to-muted/20 border-border relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-fuchsia-200/45 blur-3xl dark:bg-fuchsia-700/25" />
          <div className="absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-indigo-200/55 blur-3xl dark:bg-indigo-700/25" />

          <div className="relative space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-foreground font-display text-3xl font-semibold tracking-tight">User Feedbacks</h1>
                <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
                  Review support tickets and feedback submissions from platform users.
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

            <div className="bg-background/80 border-border grid gap-3 rounded-xl border p-3 md:grid-cols-6">
              <div className="relative md:col-span-2">
                <Search className="text-muted-foreground pointer-events-none absolute left-2.5 top-2.5 size-4" />
                <input
                  value={filterDraft.search}
                  onChange={(event) => setFilterDraft((current) => ({ ...current, search: event.target.value }))}
                  placeholder="Search user/subject/message"
                  className="bg-background text-foreground border-border w-full rounded-lg border py-2 pl-9 pr-3 text-sm"
                />
              </div>
              <select
                value={filterDraft.category}
                onChange={(event) =>
                  setFilterDraft((current) => ({ ...current, category: event.target.value as FilterState["category"] }))
                }
                className="bg-background text-foreground border-border rounded-lg border px-3 py-2 text-sm"
              >
                <option value="">All Categories</option>
                <option value="support">Support</option>
                <option value="feedback">Feedback</option>
              </select>
              <select
                value={filterDraft.status}
                onChange={(event) =>
                  setFilterDraft((current) => ({ ...current, status: event.target.value as FilterState["status"] }))
                }
                className="bg-background text-foreground border-border rounded-lg border px-3 py-2 text-sm"
              >
                <option value="">All Statuses</option>
                <option value="open">Open</option>
                <option value="in_review">In Review</option>
                <option value="resolved">Resolved</option>
              </select>
              <select
                value={filterDraft.priority}
                onChange={(event) =>
                  setFilterDraft((current) => ({ ...current, priority: event.target.value as FilterState["priority"] }))
                }
                className="bg-background text-foreground border-border rounded-lg border px-3 py-2 text-sm"
              >
                <option value="">All Priorities</option>
                <option value="high">High</option>
                <option value="normal">Normal</option>
                <option value="low">Low</option>
              </select>
              <button
                type="button"
                onClick={handleApplyFilters}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                <Filter className="size-4" />
                Apply
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
              <CardTitle className="text-emerald-700 dark:text-emerald-300">Success</CardTitle>
              <CardDescription className="text-emerald-700/80 dark:text-emerald-200/80">{success}</CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <MetricCard title="Total" value={String(summary.total)} subtitle="All records" icon={MessageSquare} />
          <MetricCard title="Open" value={String(summary.open)} subtitle="Needs attention" icon={ShieldAlert} />
          <MetricCard title="In Review" value={String(summary.in_review)} subtitle="Currently handled" icon={Clock3} />
          <MetricCard title="Resolved" value={String(summary.resolved)} subtitle="Closed tickets" icon={CheckCircle2} />
          <MetricCard title="Support" value={String(summary.support)} subtitle="Support category" icon={Tag} />
          <MetricCard title="Feedback" value={String(summary.feedback)} subtitle="Feedback category" icon={Tag} />
        </div>

        <Card className="border-border/70 bg-card/95 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-foreground text-base">User Feedback Queue</CardTitle>
            <CardDescription className="text-muted-foreground text-sm">
              Update status, priority, and admin notes directly from this list.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? <p className="text-muted-foreground text-sm">Loading feedback queue...</p> : null}
            {!loading && !items.length ? (
              <p className="text-muted-foreground text-sm">No feedback entries match current filters.</p>
            ) : null}

            {items.map((item) => {
              const saving = savingId === item.uid
              return (
                <div key={item.uid} className="bg-muted/35 border-border rounded-lg border p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-foreground font-semibold">{item.subject}</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusClass(item.status)}`}>
                      {item.status.replace("_", " ")}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${priorityClass(item.priority)}`}>
                      {item.priority}
                    </span>
                    <span className="rounded-full bg-muted border border-border px-2 py-0.5 text-xs text-muted-foreground">
                      {item.category}
                    </span>
                  </div>

                  <p className="text-muted-foreground mt-2 text-sm whitespace-pre-wrap">{item.message}</p>
                  <p className="text-muted-foreground mt-2 text-xs">
                    User: {item.user} ({item.email || "no-email"}) | Created: {formatDateTime(item.created_at)}
                  </p>

                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    <select
                      value={statusDrafts[item.uid] || item.status}
                      onChange={(event) =>
                        setStatusDrafts((current) => ({
                          ...current,
                          [item.uid]: event.target.value as "open" | "in_review" | "resolved",
                        }))
                      }
                      className="bg-background text-foreground border-border rounded-lg border px-3 py-2 text-sm"
                    >
                      <option value="open">Open</option>
                      <option value="in_review">In Review</option>
                      <option value="resolved">Resolved</option>
                    </select>

                    <select
                      value={priorityDrafts[item.uid] || item.priority}
                      onChange={(event) =>
                        setPriorityDrafts((current) => ({
                          ...current,
                          [item.uid]: event.target.value as "low" | "normal" | "high",
                        }))
                      }
                      className="bg-background text-foreground border-border rounded-lg border px-3 py-2 text-sm"
                    >
                      <option value="high">High</option>
                      <option value="normal">Normal</option>
                      <option value="low">Low</option>
                    </select>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => void handleSave(item)}
                        className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {saving ? "Saving..." : "Save"}
                      </button>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => void handleDelete(item)}
                        className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="text-foreground text-xs font-medium">Admin Notes</label>
                    <textarea
                      value={notesDrafts[item.uid] || ""}
                      onChange={(event) =>
                        setNotesDrafts((current) => ({ ...current, [item.uid]: event.target.value }))
                      }
                      rows={2}
                      placeholder="Add internal notes for this item..."
                      className="bg-background text-foreground border-border mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                    />
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
