"use client"

import * as React from "react"
import {
  CalendarClock,
  CirclePlus,
  Megaphone,
  RefreshCcw,
  Save,
  Trash2,
} from "lucide-react"

import Header from "@/components/layout/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { apiFetch } from "@/lib/auth"

type FoodOption = {
  uid: string
  food_name: string
  food_price: number
}

type CampaignCreateGetResponse = {
  chef: string
  foods: FoodOption[]
  warning?: string
}

type CampaignCreatePostResponse = {
  message: string
  campaign: {
    id: string
    title: string
    status: string
    quantity_available: number
    start_time: string | null
    end_time: string | null
    delivery_time: string | null
  }
}

type FoodLine = {
  id: string
  food_id: string
  quantity: number
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

function createLine(): FoodLine {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    food_id: "",
    quantity: 1,
  }
}

export default function CreateCampaignPage() {
  const [loading, setLoading] = React.useState(true)
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)
  const [chef, setChef] = React.useState("")
  const [warning, setWarning] = React.useState<string | null>(null)
  const [foods, setFoods] = React.useState<FoodOption[]>([])
  const [createdCampaign, setCreatedCampaign] = React.useState<CampaignCreatePostResponse["campaign"] | null>(null)

  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [statusValue, setStatusValue] = React.useState<"running" | "scheduled">("running")
  const [foodStatus, setFoodStatus] = React.useState<"cooking" | "ready">("cooking")
  const [startTime, setStartTime] = React.useState("")
  const [endTime, setEndTime] = React.useState("")
  const [deliveryTime, setDeliveryTime] = React.useState("")
  const [lines, setLines] = React.useState<FoodLine[]>([createLine()])

  const foodMap = React.useMemo(() => {
    const map = new Map<string, FoodOption>()
    foods.forEach((food) => map.set(String(food.uid), food))
    return map
  }, [foods])

  const subtotal = React.useMemo(() => {
    return lines.reduce((sum, line) => {
      const food = foodMap.get(line.food_id)
      if (!food) return sum
      return sum + (food.food_price || 0) * (line.quantity || 0)
    }, 0)
  }, [foodMap, lines])

  const totalQuantity = React.useMemo(() => {
    return lines.reduce((sum, line) => sum + (Number.isFinite(line.quantity) ? line.quantity : 0), 0)
  }, [lines])

  const loadFormOptions = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiFetch<CampaignCreateGetResponse>("/campaign/create/")
      setChef(response.chef || "")
      setWarning(response.warning || null)
      setFoods(response.foods ?? [])
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Unable to load campaign form options."
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void loadFormOptions()
  }, [loadFormOptions])

  const addLine = () => setLines((current) => [...current, createLine()])

  const removeLine = (id: string) => {
    setLines((current) => {
      if (current.length === 1) return current
      return current.filter((line) => line.id !== id)
    })
  }

  const updateLine = (id: string, updater: (line: FoodLine) => FoodLine) => {
    setLines((current) => current.map((line) => (line.id === id ? updater(line) : line)))
  }

  const resetForm = () => {
    setTitle("")
    setDescription("")
    setStatusValue("running")
    setFoodStatus("cooking")
    setStartTime("")
    setEndTime("")
    setDeliveryTime("")
    setLines([createLine()])
  }

  const validateForm = () => {
    if (!title.trim()) return "Campaign title is required."
    if (statusValue === "scheduled" && !startTime) return "Start time is required for scheduled campaigns."

    if (!lines.length) return "At least one food item is required."

    const selected = new Set<string>()
    for (const line of lines) {
      if (!line.food_id) return "Please select food for every row."
      if (line.quantity <= 0) return "Food quantity must be greater than 0."
      if (selected.has(line.food_id)) return "Duplicate food rows are not allowed."
      selected.add(line.food_id)
    }

    if (startTime && endTime && startTime > endTime) {
      return "End time cannot be earlier than start time."
    }

    return null
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        title: title.trim(),
        campaign_description: description.trim(),
        status: statusValue,
        food_status: foodStatus,
        start_time: startTime || undefined,
        end_time: endTime || undefined,
        delivery_time: deliveryTime || undefined,
        food_items: lines.map((line) => ({
          food_id: line.food_id,
          quantity: Number(line.quantity || 0),
        })),
      }

      const response = await apiFetch<CampaignCreatePostResponse>("/campaign/create/", {
        method: "POST",
        body: JSON.stringify(payload),
      })

      setSuccess(response.message || "Campaign created successfully.")
      setCreatedCampaign(response.campaign ?? null)
      resetForm()
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Unable to create campaign."
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
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-emerald-200/45 blur-3xl dark:bg-emerald-700/25" />
          <div className="absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-blue-200/55 blur-3xl dark:bg-blue-700/25" />

          <div className="relative space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-foreground font-display text-3xl font-semibold tracking-tight">Create New Campaign</h1>
                <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
                  Launch a new campaign by selecting foods, stock quantities, and schedule settings.
                </p>
                <p className="text-muted-foreground/90 mt-3 text-xs">Chef: {chef || "N/A"}</p>
              </div>
              <button
                type="button"
                onClick={() => void loadFormOptions()}
                className="bg-background text-foreground border-border inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-muted/70"
              >
                <RefreshCcw className="size-4" />
                Refresh Foods
              </button>
            </div>
          </div>
        </section>

        {loading ? (
          <Card className="border-border/70 bg-card/95 shadow-sm">
            <CardContent className="py-8 text-sm text-muted-foreground">Loading form data...</CardContent>
          </Card>
        ) : null}

        {warning ? (
          <Card className="border-amber-300/70 bg-amber-50/80 dark:border-amber-900 dark:bg-amber-950/30">
            <CardHeader>
              <CardTitle className="text-amber-700 dark:text-amber-300">Notice</CardTitle>
              <CardDescription className="text-amber-700/80 dark:text-amber-200/80">{warning}</CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        {error ? (
          <Card className="border-red-300/70 bg-red-50/80 dark:border-red-900 dark:bg-red-950/30">
            <CardHeader>
              <CardTitle className="text-red-700 dark:text-red-300">Unable to create campaign</CardTitle>
              <CardDescription className="text-red-700/80 dark:text-red-200/80">{error}</CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        {success ? (
          <Card className="border-emerald-300/70 bg-emerald-50/80 dark:border-emerald-900 dark:bg-emerald-950/30">
            <CardHeader>
              <CardTitle className="text-emerald-700 dark:text-emerald-300">Campaign Created</CardTitle>
              <CardDescription className="text-emerald-700/80 dark:text-emerald-200/80">{success}</CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-3">
          <Card className="border-border/70 bg-card/95 shadow-sm xl:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-foreground text-base">Campaign Setup</CardTitle>
              <CardDescription className="text-muted-foreground text-sm">
                Define campaign details and food quantities.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-foreground text-sm font-medium">Campaign Title</label>
                    <input
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder="Weekend Lunch Fiesta"
                      className="bg-background text-foreground border-border w-full rounded-lg border px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-foreground text-sm font-medium">Description</label>
                    <textarea
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      placeholder="Special menu with limited quantities."
                      rows={3}
                      className="bg-background text-foreground border-border w-full rounded-lg border px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-foreground text-sm font-medium">Campaign Status</label>
                    <select
                      value={statusValue}
                      onChange={(event) => setStatusValue(event.target.value as "running" | "scheduled")}
                      className="bg-background text-foreground border-border w-full rounded-lg border px-3 py-2 text-sm"
                    >
                      <option value="running">Running</option>
                      <option value="scheduled">Scheduled</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-foreground text-sm font-medium">Food Status</label>
                    <select
                      value={foodStatus}
                      onChange={(event) => setFoodStatus(event.target.value as "cooking" | "ready")}
                      className="bg-background text-foreground border-border w-full rounded-lg border px-3 py-2 text-sm"
                    >
                      <option value="cooking">Cooking</option>
                      <option value="ready">Ready</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-foreground text-sm font-medium">Start Time</label>
                    <input
                      type="datetime-local"
                      value={startTime}
                      onChange={(event) => setStartTime(event.target.value)}
                      className="bg-background text-foreground border-border w-full rounded-lg border px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-foreground text-sm font-medium">End Time</label>
                    <input
                      type="datetime-local"
                      value={endTime}
                      onChange={(event) => setEndTime(event.target.value)}
                      className="bg-background text-foreground border-border w-full rounded-lg border px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-foreground text-sm font-medium">Delivery Time</label>
                    <input
                      type="datetime-local"
                      value={deliveryTime}
                      onChange={(event) => setDeliveryTime(event.target.value)}
                      className="bg-background text-foreground border-border w-full rounded-lg border px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-foreground text-sm font-medium">Food Items</p>
                    <button
                      type="button"
                      onClick={addLine}
                      className="inline-flex items-center gap-1 rounded-lg bg-sky-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-sky-700"
                    >
                      <CirclePlus className="size-3.5" /> Add Food
                    </button>
                  </div>

                  <div className="space-y-2">
                    {lines.map((line) => (
                      <div key={line.id} className="bg-muted/35 border-border grid gap-2 rounded-lg border p-2 md:grid-cols-[2fr_1fr_auto]">
                        <select
                          value={line.food_id}
                          onChange={(event) =>
                            updateLine(line.id, (current) => ({ ...current, food_id: event.target.value }))
                          }
                          className="bg-background text-foreground border-border rounded-lg border px-3 py-2 text-sm"
                        >
                          <option value="">Select food</option>
                          {foods.map((food) => (
                            <option key={food.uid} value={food.uid}>
                              {food.food_name} ({formatCurrency(food.food_price)})
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min={1}
                          value={line.quantity}
                          onChange={(event) =>
                            updateLine(line.id, (current) => ({
                              ...current,
                              quantity: Number(event.target.value || 0),
                            }))
                          }
                          className="bg-background text-foreground border-border rounded-lg border px-3 py-2 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => removeLine(line.id)}
                          className="inline-flex h-9 items-center justify-center rounded-lg border border-red-300 px-2 text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40"
                          title="Remove row"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || loading || foods.length === 0}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save className="size-4" />
                  {submitting ? "Creating..." : "Create Campaign"}
                </button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-border/70 bg-card/95 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-foreground text-base">Live Preview</CardTitle>
                <CardDescription className="text-muted-foreground text-sm">
                  Snapshot of the campaign being created.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="bg-muted/35 border-border rounded-lg border px-3 py-2">
                  <p className="text-muted-foreground text-xs">Title</p>
                  <p className="text-foreground mt-1 font-medium">{title || "Untitled Campaign"}</p>
                </div>
                <div className="bg-muted/35 border-border rounded-lg border px-3 py-2">
                  <p className="text-muted-foreground text-xs">Foods</p>
                  <p className="text-foreground mt-1 font-medium">{numberFormatter.format(lines.length)} rows</p>
                </div>
                <div className="bg-muted/35 border-border rounded-lg border px-3 py-2">
                  <p className="text-muted-foreground text-xs">Total Quantity</p>
                  <p className="text-foreground mt-1 font-medium">{numberFormatter.format(totalQuantity)}</p>
                </div>
                <div className="bg-muted/35 border-border rounded-lg border px-3 py-2">
                  <p className="text-muted-foreground text-xs">Estimated Value</p>
                  <p className="text-foreground mt-1 font-medium">{formatCurrency(subtotal)}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-card/95 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-foreground text-base">Recently Created</CardTitle>
                <CardDescription className="text-muted-foreground text-sm">Latest successful campaign create result.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {createdCampaign ? (
                  <>
                    <div className="bg-muted/35 border-border rounded-lg border px-3 py-2">
                      <p className="text-muted-foreground text-xs">Title</p>
                      <p className="text-foreground mt-1 font-medium">{createdCampaign.title}</p>
                    </div>
                    <div className="bg-muted/35 border-border rounded-lg border px-3 py-2">
                      <p className="text-muted-foreground text-xs">Status</p>
                      <p className="text-foreground mt-1 font-medium">{createdCampaign.status}</p>
                    </div>
                    <div className="bg-muted/35 border-border rounded-lg border px-3 py-2">
                      <p className="text-muted-foreground text-xs">Quantity</p>
                      <p className="text-foreground mt-1 font-medium">{numberFormatter.format(createdCampaign.quantity_available)}</p>
                    </div>
                    <div className="bg-muted/35 border-border rounded-lg border px-3 py-2">
                      <p className="text-muted-foreground text-xs inline-flex items-center gap-1">
                        <CalendarClock className="size-3.5" /> Start Time
                      </p>
                      <p className="text-foreground mt-1 font-medium">{formatDateTime(createdCampaign.start_time)}</p>
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground">No campaign created in this session yet.</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-card/95 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-foreground text-base">Best Practices</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p className="inline-flex items-center gap-2">
                  <Megaphone className="size-4" /> Use clear campaign titles that reflect menu and timing.
                </p>
                <p className="inline-flex items-center gap-2">
                  <CalendarClock className="size-4" /> Set end/delivery times to avoid stale campaigns.
                </p>
                <p className="inline-flex items-center gap-2">
                  <Save className="size-4" /> Keep quantity realistic to prevent overselling.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}
