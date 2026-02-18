"use client"

import * as React from "react"
import {
  CirclePlus,
  Package,
  RefreshCcw,
  Save,
  ShoppingBag,
  Sparkles,
  Upload,
  Wallet,
} from "lucide-react"

import Header from "@/components/layout/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { apiFetch } from "@/lib/auth"

type FoodItem = {
  uid: string
  food_name: string
  food_description: string
  chef: string
  food_price: number
  food_image?: string
}

type ListedFoodsResponse = {
  chef: string
  summary: {
    total_items: number
    avg_price: number
    min_price: number
    max_price: number
  }
  foods: FoodItem[]
}

type AddFoodResponse = {
  message: string
  food: FoodItem
}

const currencyFormatter = new Intl.NumberFormat("en-MY", {
  style: "currency",
  currency: "MYR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function formatCurrency(value: number) {
  return currencyFormatter.format(value || 0)
}

export default function AddFoodItemsPage() {
  const [loading, setLoading] = React.useState(true)
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)

  const [chef, setChef] = React.useState("")
  const [totalItems, setTotalItems] = React.useState(0)
  const [avgPrice, setAvgPrice] = React.useState(0)
  const [recentFoods, setRecentFoods] = React.useState<FoodItem[]>([])
  const [lastAdded, setLastAdded] = React.useState<FoodItem | null>(null)

  const [foodName, setFoodName] = React.useState("")
  const [foodDescription, setFoodDescription] = React.useState("")
  const [foodPrice, setFoodPrice] = React.useState("")
  const [foodImage, setFoodImage] = React.useState<File | null>(null)
  const [foodImageName, setFoodImageName] = React.useState("")

  const loadOverview = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiFetch<ListedFoodsResponse>("/food_inventory/listed/?sort=newest")
      setChef(response.chef || "")
      setTotalItems(response.summary?.total_items ?? 0)
      setAvgPrice(response.summary?.avg_price ?? 0)
      setRecentFoods((response.foods ?? []).slice(0, 6))
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Unable to load inventory overview."
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void loadOverview()
  }, [loadOverview])

  const resetForm = () => {
    setFoodName("")
    setFoodDescription("")
    setFoodPrice("")
    setFoodImage(null)
    setFoodImageName("")
  }

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null
    setFoodImage(nextFile)
    setFoodImageName(nextFile?.name ?? "")
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    if (!foodName.trim()) {
      setError("Food name is required.")
      return
    }

    const price = Number(foodPrice)
    if (!Number.isFinite(price) || price < 0) {
      setError("Price must be a valid non-negative number.")
      return
    }

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append("food_name", foodName.trim())
      formData.append("food_description", foodDescription.trim())
      formData.append("food_price", String(price))
      if (foodImage) {
        formData.append("food_image", foodImage)
      }

      const response = await apiFetch<AddFoodResponse>("/food_inventory/add/", {
        method: "POST",
        body: formData,
      })

      setSuccess(response.message || "Food item added successfully.")
      setLastAdded(response.food)
      resetForm()
      await loadOverview()
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Unable to add food item."
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
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-amber-200/45 blur-3xl dark:bg-amber-700/25" />
          <div className="absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-emerald-200/55 blur-3xl dark:bg-emerald-700/25" />

          <div className="relative space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-foreground font-display text-3xl font-semibold tracking-tight">Add Food Items</h1>
                <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
                  Add new foods to your inventory so they are available for campaign creation.
                </p>
                <p className="text-muted-foreground/90 mt-3 text-xs">Chef: {chef || "N/A"}</p>
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
              <CardTitle className="text-red-700 dark:text-red-300">Unable to add food</CardTitle>
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

        <div className="grid gap-6 xl:grid-cols-3">
          <Card className="border-border/70 bg-card/95 shadow-sm xl:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-foreground text-base">New Food Form</CardTitle>
              <CardDescription className="text-muted-foreground text-sm">
                Fill in the details and save to inventory.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-foreground text-sm font-medium">Food Name</label>
                    <input
                      value={foodName}
                      onChange={(event) => setFoodName(event.target.value)}
                      placeholder="Chicken Kebab Bowl"
                      className="bg-background text-foreground border-border w-full rounded-lg border px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-foreground text-sm font-medium">Description</label>
                    <textarea
                      value={foodDescription}
                      onChange={(event) => setFoodDescription(event.target.value)}
                      placeholder="Rice bowl with grilled kebab and spicy sauce"
                      rows={3}
                      className="bg-background text-foreground border-border w-full rounded-lg border px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-foreground text-sm font-medium">Price</label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={foodPrice}
                      onChange={(event) => setFoodPrice(event.target.value)}
                      placeholder="9.99"
                      className="bg-background text-foreground border-border w-full rounded-lg border px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-foreground text-sm font-medium">Food Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="bg-background text-foreground border-border w-full rounded-lg border px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-blue-600 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-blue-700"
                    />
                    <p className="text-muted-foreground text-xs inline-flex items-center gap-1">
                      <Upload className="size-3.5" />
                      {foodImageName || "No image selected"}
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || loading}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save className="size-4" />
                  {submitting ? "Saving..." : "Add Food Item"}
                </button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-border/70 bg-card/95 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-foreground text-base">Inventory Snapshot</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="bg-muted/35 border-border rounded-lg border px-3 py-2">
                  <p className="text-muted-foreground text-xs inline-flex items-center gap-1">
                    <Package className="size-3.5" /> Total Items
                  </p>
                  <p className="text-foreground mt-1 font-semibold">{totalItems}</p>
                </div>
                <div className="bg-muted/35 border-border rounded-lg border px-3 py-2">
                  <p className="text-muted-foreground text-xs inline-flex items-center gap-1">
                    <Wallet className="size-3.5" /> Average Price
                  </p>
                  <p className="text-foreground mt-1 font-semibold">{formatCurrency(avgPrice)}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-card/95 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-foreground text-base">Recently Added</CardTitle>
                <CardDescription className="text-muted-foreground text-sm">Latest items from your listed inventory.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {loading ? <p className="text-muted-foreground text-sm">Loading...</p> : null}
                {!loading && recentFoods.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No food items yet.</p>
                ) : null}
                {recentFoods.map((food) => (
                  <div key={food.uid} className="bg-muted/35 border-border rounded-lg border px-3 py-2 text-sm">
                    <p className="text-foreground font-medium">{food.food_name}</p>
                    <p className="text-muted-foreground mt-1 text-xs">{formatCurrency(food.food_price)}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-card/95 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-foreground text-base">Last Added Item</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {lastAdded ? (
                  <>
                    <p className="text-foreground inline-flex items-center gap-2 font-medium">
                      <CirclePlus className="size-4" /> {lastAdded.food_name}
                    </p>
                    <p className="text-muted-foreground">{formatCurrency(lastAdded.food_price)}</p>
                    <p className="text-muted-foreground text-xs">{lastAdded.food_description || "No description"}</p>
                  </>
                ) : (
                  <p className="text-muted-foreground inline-flex items-center gap-2">
                    <Sparkles className="size-4" /> Add a food item to see it here.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-card/95 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-foreground text-base">Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p className="inline-flex items-center gap-2">
                  <ShoppingBag className="size-4" /> Keep names short and descriptive.
                </p>
                <p className="inline-flex items-center gap-2">
                  <Wallet className="size-4" /> Update prices before launching campaigns.
                </p>
                <p className="inline-flex items-center gap-2">
                  <Package className="size-4" /> Maintain clean descriptions for better clarity.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}
