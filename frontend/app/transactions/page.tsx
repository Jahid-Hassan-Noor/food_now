import Header from "@/components/layout/header"

export default function TransactionsPage() {
  return (
    <>
      <Header />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <h1 className="text-3xl font-bold">Transactions</h1>
        <p className="text-gray-600 dark:text-gray-400">Select an option from the sidebar</p>
      </div>
    </>
  )
}
