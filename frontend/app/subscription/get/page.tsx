import Header from "@/components/layout/header"

export default function GetSubscriptionPage() {
  return (
    <>
      <Header />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <h1 className="text-3xl font-bold">Get a Subscription</h1>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border p-6">
            <h3 className="text-lg font-semibold">Basic</h3>
            <p className="mt-2 text-2xl font-bold">$9.99/mo</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>✓ Basic recipes</li>
              <li>✓ Limited orders</li>
            </ul>
            <button className="mt-4 w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
              Subscribe
            </button>
          </div>
          <div className="rounded-lg border p-6">
            <h3 className="text-lg font-semibold">Pro</h3>
            <p className="mt-2 text-2xl font-bold">$19.99/mo</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>✓ All recipes</li>
              <li>✓ Unlimited orders</li>
            </ul>
            <button className="mt-4 w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
              Subscribe
            </button>
          </div>
          <div className="rounded-lg border p-6">
            <h3 className="text-lg font-semibold">Premium</h3>
            <p className="mt-2 text-2xl font-bold">$29.99/mo</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>✓ All features</li>
              <li>✓ Priority support</li>
            </ul>
            <button className="mt-4 w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
              Subscribe
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
