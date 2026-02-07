import Header from "@/components/layout/header"

export default function CreateCampaignPage() {
  return (
    <>
      <Header />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <h1 className="text-3xl font-bold">Create New Campaign</h1>
        <div className="rounded-lg border p-6">
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Campaign Name</label>
              <input type="text" className="mt-1 block w-full rounded border px-3 py-2 dark:bg-gray-800 dark:border-gray-700" placeholder="Enter campaign name" />
            </div>
            <div>
              <label className="block text-sm font-medium">Description</label>
              <textarea className="mt-1 block w-full rounded border px-3 py-2 dark:bg-gray-800 dark:border-gray-700" placeholder="Enter campaign description" />
            </div>
            <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
              Create Campaign
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
