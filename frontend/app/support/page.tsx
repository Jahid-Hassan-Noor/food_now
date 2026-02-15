import Header from "@/components/layout/header"

export default function SupportPage() {
  return (
    <>
      <Header />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <h1 className="text-3xl font-bold">Support</h1>
        <div className="rounded-lg border p-6">
          <p className="text-sm text-muted-foreground">
            Need help with an order or your account? Reach out to support@foodnow.local.
          </p>
        </div>
      </div>
    </>
  )
}
