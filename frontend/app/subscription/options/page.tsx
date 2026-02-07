import Header from "@/components/layout/header"

export default function SubscriptionOptionsPage() {
  return (
    <>
      <Header />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <h1 className="text-3xl font-bold">Subscription Options</h1>
        <div className="rounded-lg border p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="font-semibold">Auto-Renewal</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Automatically renew subscription</p>
              </div>
              <input type="checkbox" defaultChecked className="h-4 w-4" />
            </div>
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="font-semibold">Notifications</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Get renewal notifications</p>
              </div>
              <input type="checkbox" defaultChecked className="h-4 w-4" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Newsletter</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Subscribe to newsletter</p>
              </div>
              <input type="checkbox" className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
