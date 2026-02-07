import Header from "@/components/layout/header"

export default function CampaignHistoryPage() {
  return (
    <>
      <Header />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <h1 className="text-3xl font-bold">Campaign History</h1>
        <div className="rounded-lg border p-6">
          <p className="text-gray-600 dark:text-gray-400">Past campaigns will be displayed here</p>
        </div>
      </div>
    </>
  )
}
