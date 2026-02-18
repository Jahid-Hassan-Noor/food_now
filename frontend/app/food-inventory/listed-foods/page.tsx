"use client"

import * as React from "react"
import {
  Pencil,
  RefreshCcw,
  Search,
  ShoppingBag,
  Trash2,
  Wallet,
  X,
} from "lucide-react"

import Header from "@/components/layout/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { apiFetch } from "@/lib/auth"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000"

type SortKey = "newest" | "oldest" | "name_asc" | "name_desc" | "price_low" | "price_high"

type FoodItem = {
  uid: string
  food_name: string
  food_description: string
  chef: string
  food_price: number
  food_image?: string
}

type FoodSummary = {
  total_items: number
  avg_price: number
  min_price: number
  max_price: number
}

type ListedFoodsResponse = {
  chef: string
  summary: FoodSummary
  foods: FoodItem[]
}

type FilterState = {
  search: string
  sort: SortKey
}

type EditState = {
  uid: string
  food_name: string
  food_description: string
  food_price: string
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

function resolveImageUrl(image?: string) {
  if (!image) return ""
  if (image.startsWith("http://") || image.startsWith("https://")) return image
  if (image.startsWith("/")) return `${API_BASE}${image}`
  return `${API_BASE}/media/${image}`
}

function buildQuery(filter: FilterState) {
  const params = new URLSearchParams()
  if (filter.search.trim()) params.set("search", filter.search.trim())
  params.set("sort", filter.sort)
  return params.toString()
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

export default function ListedFoodsPage() {
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null)
  const [data, setData] = React.useState<ListedFoodsResponse | null>(null)

  const [filterDraft, setFilterDraft] = React.useState<FilterState>({
    search: "",
    sort: "newest",
  })
  const [appliedFilter, setAppliedFilter] = React.useState<FilterState>({
    search: "",
    sort: "newest",
  })

  const [editState, setEditState] = React.useState<EditState | null>(null)
  const [savingId, setSavingId] = React.useState<string | null>(null)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)

  const loadFoods = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const query = buildQuery(appliedFilter)
      const endpoint = query ? `/food_inventory/listed/?${query}` : "/food_inventory/listed/"
      const response = await apiFetch<ListedFoodsResponse>(endpoint)
      setData(response)
      setLastUpdated(new Date())
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Unable to load listed foods."
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [appliedFilter])

  React.useEffect(() => {
    void loadFoods()
  }, [loadFoods])

  const handleApplyFilters = () => {
    setAppliedFilter(filterDraft)
  }

  const openEdit = (food: FoodItem) => {
    setEditState({
      uid: food.uid,
      food_name: food.food_name,
      food_description: food.food_description || "",
      food_price: String(food.food_price ?? 0),
    })
  }

  const handleSaveEdit = async () => {
    if (!editState) return

    if (!editState.food_name.trim()) {
      setError("Food name is required.")
      return
    }

    const numericPrice = Number(editState.food_price)
    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      setError("Price must be a valid non-negative number.")
      return
    }

    setSavingId(editState.uid)
    setError(null)
    try {
      await apiFetch<{ message: string }>(`/food_inventory/item/${editState.uid}/`, {
        method: "PATCH",
        body: JSON.stringify({
          food_name: editState.food_name.trim(),
          food_description: editState.food_description.trim(),
          food_price: numericPrice,
        }),
      })
      setEditState(null)
      await loadFoods()
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Unable to update food item."
      setError(message)
    } finally {
      setSavingId(null)
    }
  }

  const handleDelete = async (food: FoodItem) => {
    if (!window.confirm(`Delete food item "${food.food_name}"? This cannot be undone.`)) {
      return
    }

    setDeletingId(food.uid)
    setError(null)
    try {
      await apiFetch<{ message: string }>(`/food_inventory/item/${food.uid}/`, {
        method: "DELETE",
      })
      if (editState?.uid === food.uid) {
        setEditState(null)
      }
      await loadFoods()
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : "Unable to delete food item."
      setError(message)
    } finally {
      setDeletingId(null)
    }
  }

  const foods = data?.foods ?? []
  const summary = data?.summary

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
                <h1 className="text-foreground font-display text-3xl font-semibold tracking-tight">Listed Foods</h1>
                <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
                  Manage your food catalog, revise pricing, and keep inventory clean.
                </p>
                <p className="text-muted-foreground/90 mt-3 text-xs">
                  Last updated: {lastUpdated ? lastUpdated.toLocaleString() : "Not loaded yet"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void loadFoods()}
                className="bg-background text-foreground border-border inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-muted/70"
              >
                <RefreshCcw className="size-4" />
                Refresh
              </button>
            </div>

            <div className="bg-background/80 border-border grid gap-3 rounded-xl border p-3 md:grid-cols-4">
              <div className="relative md:col-span-2">
                <Search className="text-muted-foreground pointer-events-none absolute left-2.5 top-2.5 size-4" />
                <input
                  value={filterDraft.search}
                  onChange={(event) =>
                    setFilterDraft((current) => ({ ...current, search: event.target.value }))
                  }
                  placeholder="Search by name or description"
                  className="bg-background text-foreground border-border w-full rounded-lg border py-2 pl-9 pr-3 text-sm"
                />
              </div>
              <select
                value={filterDraft.sort}
                onChange={(event) =>
                  setFilterDraft((current) => ({ ...current, sort: event.target.value as SortKey }))
                }
                className="bg-background text-foreground border-border rounded-lg border px-3 py-2 text-sm"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="name_asc">Name (A-Z)</option>
                <option value="name_desc">Name (Z-A)</option>
                <option value="price_low">Price (Low-High)</option>
                <option value="price_high">Price (High-Low)</option>
              </select>
              <button
                type="button"
                onClick={handleApplyFilters}
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
              <CardTitle className="text-red-700 dark:text-red-300">Inventory action failed</CardTitle>
              <CardDescription className="text-red-700/80 dark:text-red-200/80">{error}</CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        {loading ? (
          <Card className="border-border/70 bg-card/95 shadow-sm">
            <CardContent className="py-8 text-sm text-muted-foreground">Loading foods...</CardContent>
          </Card>
        ) : null}

        {!loading ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                title="Total Items"
                value={formatNumber(summary?.total_items ?? 0)}
                subtitle={`Chef: ${data?.chef || "N/A"}`}
                icon={ShoppingBag}
              />
              <MetricCard
                title="Average Price"
                value={formatCurrency(summary?.avg_price ?? 0)}
                subtitle="Across listed items"
                icon={Wallet}
              />
              <MetricCard
                title="Min Price"
                value={formatCurrency(summary?.min_price ?? 0)}
                subtitle="Lowest priced item"
                icon={Wallet}
              />
              <MetricCard
                title="Max Price"
                value={formatCurrency(summary?.max_price ?? 0)}
                subtitle="Highest priced item"
                icon={Wallet}
              />
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              {foods.map((food) => {
                const editing = editState?.uid === food.uid
                const saving = savingId === food.uid
                const deleting = deletingId === food.uid
                const imageUrl = resolveImageUrl(food.food_image)

                return (
                  <Card key={food.uid} className="border-border/70 bg-card/95 shadow-sm">
                    <CardHeader className="space-y-2 pb-2">
                      <div className="flex items-start justify-between gap-3">
                        {editing ? (
                          <input
                            value={editState.food_name}
                            onChange={(event) =>
                              setEditState((current) =>
                                current ? { ...current, food_name: event.target.value } : current
                              )
                            }
                            className="bg-background text-foreground border-border w-full rounded-lg border px-3 py-2 text-sm font-semibold"
                          />
                        ) : (
                          <CardTitle className="text-foreground text-base">{food.food_name}</CardTitle>
                        )}

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (editing) {
                                setEditState(null)
                              } else {
                                openEdit(food)
                              }
                            }}
                            className="bg-muted/50 border-border text-foreground rounded-lg border p-2 transition hover:bg-muted"
                            title={editing ? "Cancel" : "Edit"}
                          >
                            {editing ? <X className="size-4" /> : <Pencil className="size-4" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(food)}
                            disabled={deleting}
                            className="rounded-lg border border-red-300 p-2 text-red-600 transition hover:bg-red-50 disabled:opacity-60 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/30"
                            title="Delete"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3">
                      {imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={imageUrl}
                          alt={food.food_name}
                          className="border-border h-40 w-full rounded-lg border object-cover"
                        />
                      ) : null}

                      <div className="grid gap-2 sm:grid-cols-2">
                        <div className="bg-muted/35 border-border rounded-lg border px-3 py-2 text-xs">
                          <p className="text-muted-foreground">Price</p>
                          {editing ? (
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={editState.food_price}
                              onChange={(event) =>
                                setEditState((current) =>
                                  current ? { ...current, food_price: event.target.value } : current
                                )
                              }
                              className="bg-background text-foreground border-border mt-1 w-full rounded-lg border px-2 py-1.5 text-xs"
                            />
                          ) : (
                            <p className="text-foreground mt-1 font-semibold">{formatCurrency(food.food_price)}</p>
                          )}
                        </div>
                        <div className="bg-muted/35 border-border rounded-lg border px-3 py-2 text-xs">
                          <p className="text-muted-foreground">Chef</p>
                          <p className="text-foreground mt-1 font-semibold">{food.chef || "N/A"}</p>
                        </div>
                      </div>

                      <div className="bg-muted/35 border-border rounded-lg border px-3 py-2 text-xs">
                        <p className="text-muted-foreground">Description</p>
                        {editing ? (
                          <textarea
                            value={editState.food_description}
                            onChange={(event) =>
                              setEditState((current) =>
                                current ? { ...current, food_description: event.target.value } : current
                              )
                            }
                            rows={2}
                            className="bg-background text-foreground border-border mt-1 w-full rounded-lg border px-2 py-1.5 text-xs"
                          />
                        ) : (
                          <p className="text-foreground mt-1 font-medium">{food.food_description || "No description"}</p>
                        )}
                      </div>

                      {editing ? (
                        <button
                          type="button"
                          onClick={() => void handleSaveEdit()}
                          disabled={saving}
                          className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                        >
                          {saving ? "Saving..." : "Save Changes"}
                        </button>
                      ) : null}
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {!foods.length ? (
              <Card className="border-border/70 bg-card/95 shadow-sm">
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  No food items found for the selected filters.
                </CardContent>
              </Card>
            ) : null}
          </>
        ) : null}
      </div>
    </>
  )
}
