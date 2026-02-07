import Header from "@/components/layout/header"

export default function UserDashboardPage() {
  return (
    <>
      <Header />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <h1 className="text-3xl font-bold">User Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border p-4">
            <h2 className="font-semibold">My Orders</h2>
            <p className="text-2xl font-bold mt-2">15</p>
          </div>
          <div className="rounded-lg border p-4">
            <h2 className="font-semibold">Favorites</h2>
            <p className="text-2xl font-bold mt-2">8</p>
          </div>
          <div className="rounded-lg border p-4">
            <h2 className="font-semibold">Subscriptions</h2>
            <p className="text-2xl font-bold mt-2">1</p>
          </div>
        </div>
      </div>
    </>
  )
}
