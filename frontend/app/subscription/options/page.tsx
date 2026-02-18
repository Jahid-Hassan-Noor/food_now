"use client"

import * as React from "react"
import { PlusCircle, RefreshCcw, Save, Tag, Trash2, Wallet } from "lucide-react"

import Header from "@/components/layout/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { apiFetch } from "@/lib/auth"

type SubscriptionOption = {
  id: number
  name: string
  duration_months: number
  price: number
  description?: string | null
  created_at?: string
  updated_at?: string
}

type SubscriptionOptionListResponse = {
  subscriptions: SubscriptionOption[]
}

type SubscriptionCreateResponse = {
  message: string
  subscription: SubscriptionOption
}

type SubscriptionUpdateResponse = {
  message: string
  subscription: SubscriptionOption
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

type OptionDraft = {
  name: string
  duration_months: string
  price: string
  description: string
}

function draftFromOption(option: SubscriptionOption): OptionDraft {
  return {
    name: option.name || "",
    duration_months: String(option.duration_months ?? 1),
    price: String(option.price ?? 0),
    description: option.description || "",
  }
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

export default function SubscriptionOptionsPage() {
  const [loading, setLoading] = React.useState(true)
  const [creating, setCreating] = React.useState(false)
  const [savingId, setSavingId] = React.useState<number | null>(null)
  const [deletingId, setDeletingId] = React.useState<number | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null)

  const [items, setItems] = React.useState<SubscriptionOption[]>([])
  const [drafts, setDrafts] = React.useState<Record<number, OptionDraft>>({})
  const [newDraft, setNewDraft] = React.useState<OptionDraft>({
    name: "",
    duration_months: "1",
    price: "0",
    description: "",
  })

  const loadOptions = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiFetch<SubscriptionOptionListResponse>("/admin/subscriptions/")
      const options = response.subscriptions ?? []
      setItems(options)

      const nextDrafts: Record<number, OptionDraft> = {}
      options.forEach((option) => {
        nextDrafts[option.id] = draftFromOption(option)
      })
      setDrafts(nextDrafts)
      setLastUpdated(new Date())
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Unable to load subscription options."
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void loadOptions()
  }, [loadOptions])

  const validateDraft = (draft: OptionDraft): { ok: boolean; message?: string } => {
    if (!draft.name.trim()) return { ok: false, message: "Plan name is required." }

    const duration = Number(draft.duration_months)
    if (!Number.isInteger(duration) || duration <= 0) {
      return { ok: false, message: "Duration must be a positive whole number." }
    }

    const price = Number(draft.price)
    if (!Number.isFinite(price) || price < 0) {
      return { ok: false, message: "Price must be a valid non-negative number." }
    }

    return { ok: true }
  }

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    const validation = validateDraft(newDraft)
    if (!validation.ok) {
      setError(validation.message || "Invalid plan fields.")
      return
    }

    setCreating(true)
    try {
      const response = await apiFetch<SubscriptionCreateResponse>("/admin/subscriptions/", {
        method: "POST",
        body: JSON.stringify({
          name: newDraft.name.trim(),
          duration_months: Number(newDraft.duration_months),
          price: Number(newDraft.price),
          description: newDraft.description.trim(),
        }),
      })
      setSuccess(response.message || "Subscription option created.")
      setNewDraft({ name: "", duration_months: "1", price: "0", description: "" })
      await loadOptions()
    } catch (createError) {
      const message = createError instanceof Error ? createError.message : "Unable to create subscription option."
      setError(message)
    } finally {
      setCreating(false)
    }
  }

  const handleSave = async (item: SubscriptionOption) => {
    const draft = drafts[item.id]
    if (!draft) return

    setError(null)
    setSuccess(null)

    const validation = validateDraft(draft)
    if (!validation.ok) {
      setError(validation.message || "Invalid plan fields.")
      return
    }

    setSavingId(item.id)
    try {
      const response = await apiFetch<SubscriptionUpdateResponse>(`/admin/subscriptions/${item.id}/`, {
        method: "PATCH",
        body: JSON.stringify({
          name: draft.name.trim(),
          duration_months: Number(draft.duration_months),
          price: Number(draft.price),
          description: draft.description.trim(),
        }),
      })
      setSuccess(response.message || "Subscription option updated.")
      await loadOptions()
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Unable to update subscription option."
      setError(message)
    } finally {
      setSavingId(null)
    }
  }

  const handleDelete = async (item: SubscriptionOption) => {
    if (!window.confirm(`Delete subscription option "${item.name}"?`)) return

    setError(null)
    setSuccess(null)
    setDeletingId(item.id)
    try {
      const response = await apiFetch<{ message: string }>(`/admin/subscriptions/${item.id}/`, {
        method: "DELETE",
      })
      setSuccess(response.message || "Subscription option deleted.")
      await loadOptions()
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : "Unable to delete subscription option."
      setError(message)
    } finally {
      setDeletingId(null)
    }
  }

  const averagePrice = items.length ? items.reduce((sum, item) => sum + (item.price || 0), 0) / items.length : 0
  const longestPlan = items.reduce((max, item) => Math.max(max, item.duration_months || 0), 0)

  return (
    <>
      <Header />
      <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
        <section className="from-muted/50 via-background to-muted/20 border-border relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-violet-200/45 blur-3xl dark:bg-violet-700/25" />
          <div className="absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-fuchsia-200/55 blur-3xl dark:bg-fuchsia-700/25" />

          <div className="relative space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-foreground font-display text-3xl font-semibold tracking-tight">Subscription Options</h1>
                <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
                  Create and maintain subscription plans available to chefs.
                </p>
                <p className="text-muted-foreground/90 mt-3 text-xs">
                  Last updated: {lastUpdated ? formatDateTime(lastUpdated.toISOString()) : "Not loaded yet"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void loadOptions()}
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
              <CardTitle className="text-red-700 dark:text-red-300">Subscription option action failed</CardTitle>
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
          <MetricCard title="Total Plans" value={formatNumber(items.length)} subtitle="Active plan options" icon={Tag} />
          <MetricCard title="Average Price" value={formatCurrency(averagePrice)} subtitle="Across all plans" icon={Wallet} />
          <MetricCard title="Longest Plan" value={`${formatNumber(longestPlan)} month${longestPlan > 1 ? "s" : ""}`} subtitle="Maximum duration" icon={Tag} />
          <MetricCard title="Loaded Records" value={formatNumber(items.length)} subtitle="Visible in this view" icon={RefreshCcw} />
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <Card className="border-border/70 bg-card/95 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-foreground text-base">Create New Option</CardTitle>
              <CardDescription className="text-muted-foreground text-sm">
                Add a new subscription plan for chefs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-3">
                <input
                  value={newDraft.name}
                  onChange={(event) => setNewDraft((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Plan name"
                  className="bg-background text-foreground border-border w-full rounded-lg border px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={newDraft.duration_months}
                  onChange={(event) => setNewDraft((current) => ({ ...current, duration_months: event.target.value }))}
                  placeholder="Duration (months)"
                  className="bg-background text-foreground border-border w-full rounded-lg border px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={newDraft.price}
                  onChange={(event) => setNewDraft((current) => ({ ...current, price: event.target.value }))}
                  placeholder="Price in RM"
                  className="bg-background text-foreground border-border w-full rounded-lg border px-3 py-2 text-sm"
                />
                <textarea
                  rows={3}
                  value={newDraft.description}
                  onChange={(event) => setNewDraft((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Plan description"
                  className="bg-background text-foreground border-border w-full rounded-lg border px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <PlusCircle className="size-4" />
                  {creating ? "Creating..." : "Create Option"}
                </button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/95 shadow-sm xl:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-foreground text-base">Existing Options</CardTitle>
              <CardDescription className="text-muted-foreground text-sm">
                Update plan details or remove old plans.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? <p className="text-muted-foreground text-sm">Loading options...</p> : null}
              {!loading && !items.length ? <p className="text-muted-foreground text-sm">No subscription options found.</p> : null}
              {items.map((item) => {
                const draft = drafts[item.id] || draftFromOption(item)
                const busy = savingId === item.id || deletingId === item.id
                return (
                  <div key={item.id} className="bg-muted/35 border-border rounded-lg border p-3">
                    <div className="grid gap-2 md:grid-cols-3">
                      <input
                        value={draft.name}
                        onChange={(event) =>
                          setDrafts((current) => ({
                            ...current,
                            [item.id]: { ...draft, name: event.target.value },
                          }))
                        }
                        className="bg-background text-foreground border-border rounded-lg border px-3 py-2 text-sm md:col-span-2"
                      />
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={draft.duration_months}
                        onChange={(event) =>
                          setDrafts((current) => ({
                            ...current,
                            [item.id]: { ...draft, duration_months: event.target.value },
                          }))
                        }
                        className="bg-background text-foreground border-border rounded-lg border px-3 py-2 text-sm"
                      />
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={draft.price}
                        onChange={(event) =>
                          setDrafts((current) => ({
                            ...current,
                            [item.id]: { ...draft, price: event.target.value },
                          }))
                        }
                        className="bg-background text-foreground border-border rounded-lg border px-3 py-2 text-sm"
                      />
                      <textarea
                        rows={2}
                        value={draft.description}
                        onChange={(event) =>
                          setDrafts((current) => ({
                            ...current,
                            [item.id]: { ...draft, description: event.target.value },
                          }))
                        }
                        className="bg-background text-foreground border-border rounded-lg border px-3 py-2 text-sm md:col-span-2"
                      />
                    </div>

                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-muted-foreground text-xs">
                        Updated: {formatDateTime(item.updated_at)} • Current price: {formatCurrency(item.price)}
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void handleSave(item)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Save className="size-3.5" />
                          {savingId === item.id ? "Saving..." : "Save"}
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void handleDelete(item)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Trash2 className="size-3.5" />
                          {deletingId === item.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
