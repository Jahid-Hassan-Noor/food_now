import Link from "next/link"
import { ArrowRight, Clock3, History, PlusCircle } from "lucide-react"

import Header from "@/components/layout/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const sections = [
  {
    title: "Current Campaign",
    description: "Monitor active/scheduled campaigns and manage status changes.",
    href: "/campaign/current",
    icon: Clock3,
  },
  {
    title: "Create New Campaign",
    description: "Build and publish a new campaign with food and quantity mapping.",
    href: "/campaign/create",
    icon: PlusCircle,
  },
  {
    title: "Campaign History",
    description: "Review completed and cancelled campaigns with performance data.",
    href: "/campaign/history",
    icon: History,
  },
]

export default function CampaignPage() {
  return (
    <>
      <Header />
      <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
        <section className="from-muted/50 via-background to-muted/20 border-border relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-cyan-200/45 blur-3xl dark:bg-cyan-700/25" />
          <div className="absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-orange-200/55 blur-3xl dark:bg-orange-700/25" />

          <div className="relative">
            <h1 className="text-foreground font-display text-3xl font-semibold tracking-tight">Campaign Hub</h1>
            <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
              Manage every stage of your campaign lifecycle from one place.
            </p>
          </div>
        </section>

        <div className="grid gap-4 xl:grid-cols-3">
          {sections.map((section) => (
            <Card key={section.href} className="border-border/70 bg-card/95 shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-foreground text-base">{section.title}</CardTitle>
                  <span className="bg-muted/50 border-border text-muted-foreground rounded-lg border p-2">
                    <section.icon className="size-4" />
                  </span>
                </div>
                <CardDescription className="text-muted-foreground text-sm">{section.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Link
                  href={section.href}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Open
                  <ArrowRight className="size-4" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  )
}
