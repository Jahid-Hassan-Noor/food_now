import Header from "@/components/layout/header"

export default function NotificationsPage() {
  return (
    <>
      <Header />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <h1 className="text-3xl font-bold">Notifications</h1>
        <div className="space-y-2">
          <div className="rounded-lg border border-l-4 border-l-blue-600 p-4">
            <h3 className="font-semibold">Order Confirmed</h3>
            <p className="text-sm text-gray-600">Your order #12345 has been confirmed</p>
            <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
          </div>
          <div className="rounded-lg border border-l-4 border-l-green-600 p-4">
            <h3 className="font-semibold">Payment Received</h3>
            <p className="text-sm text-gray-600">Payment for subscription has been received</p>
            <p className="text-xs text-gray-500 mt-1">1 day ago</p>
          </div>
          <div className="rounded-lg border border-l-4 border-l-yellow-600 p-4">
            <h3 className="font-semibold">Subscription Expiring</h3>
            <p className="text-sm text-gray-600">Your subscription expires in 7 days</p>
            <p className="text-xs text-gray-500 mt-1">3 days ago</p>
          </div>
        </div>
      </div>
    </>
  )
}
