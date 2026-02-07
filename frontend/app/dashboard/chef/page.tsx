// AppSidebar is provided globally via Shell
import Header from "@/components/layout/header"

export default function ChefDashboardPage() {
  return (
    <>
      <Header />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <h1 className="text-3xl font-bold">Chef Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border p-4">
            <h2 className="font-semibold">My Recipes</h2>
            <p className="text-2xl font-bold mt-2">42</p>
          </div>
          <div className="rounded-lg border p-4">
            <h2 className="font-semibold">Orders</h2>
            <p className="text-2xl font-bold mt-2">128</p>
          </div>
          <div className="rounded-lg border p-4">
            <h2 className="font-semibold">Earnings</h2>
            <p className="text-2xl font-bold mt-2">$2,345</p>
          </div>
        </div>
        <div className="rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Orders</h2>
          <p className="text-gray-600">Chef dashboard content</p>
        </div>
      </div>
    </>
  )
}
