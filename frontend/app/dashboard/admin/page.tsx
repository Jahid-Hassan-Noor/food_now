// AppSidebar is provided globally via Shell
import Header from "@/components/layout/header"

export default function AdminDashboardPage() {
  return (
    <>
      <Header />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border p-4">
            <h2 className="font-semibold">Total Users</h2>
            <p className="text-2xl font-bold mt-2">1,234</p>
          </div>
          <div className="rounded-lg border p-4">
            <h2 className="font-semibold">Total Orders</h2>
            <p className="text-2xl font-bold mt-2">5,678</p>
          </div>
          <div className="rounded-lg border p-4">
            <h2 className="font-semibold">Revenue</h2>
            <p className="text-2xl font-bold mt-2">$45,321</p>
          </div>
        </div>
        <div className="rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          <p className="text-gray-600">Admin dashboard content</p>
        </div>
      </div>
    </>
  )
}
