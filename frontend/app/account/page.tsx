import Header from "@/components/layout/header"

export default function AccountPage() {
  return (
    <>
      <Header />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <h1 className="text-3xl font-bold">Account Settings</h1>
        <div className="rounded-lg border p-6">
          <form className="space-y-6">
            <div>
              <label className="block text-sm font-medium">Full Name</label>
              <input type="text" className="mt-1 block w-full rounded border px-3 py-2 dark:bg-gray-800 dark:border-gray-700" defaultValue="shadcn" />
            </div>
            <div>
              <label className="block text-sm font-medium">Email</label>
              <input type="email" className="mt-1 block w-full rounded border px-3 py-2 dark:bg-gray-800 dark:border-gray-700" defaultValue="m@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium">Password</label>
              <input type="password" className="mt-1 block w-full rounded border px-3 py-2 dark:bg-gray-800 dark:border-gray-700" placeholder="Enter new password" />
            </div>
            <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
              Save Changes
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
