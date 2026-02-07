import Header from "@/components/layout/header"

export default function OrderHistoryPage() {
  return (
    <>
      <Header />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <h1 className="text-3xl font-bold">Order History</h1>
        <div className="rounded-lg border">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="p-4 text-left">Order ID</th>
                <th className="p-4 text-left">Item</th>
                <th className="p-4 text-left">Price</th>
                <th className="p-4 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-4">No orders yet</td>
                <td colSpan={3}></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
