import Header from "@/components/layout/header"

export default function FeedbackPage() {
  return (
    <>
      <Header />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <h1 className="text-3xl font-bold">Feedback</h1>
        <div className="rounded-lg border p-6">
          <p className="text-sm text-muted-foreground">
            Share your experience and suggestions to improve Food Now for everyone.
          </p>
        </div>
      </div>
    </>
  )
}
