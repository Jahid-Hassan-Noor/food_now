import Image from "next/image";
import { MenuIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";

const liveCampaigns = 18;

const campaigns = [
  {
    id: "spice-route",
    title: "Spice Route Biryani",
    chef: "Ayaan",
    location: "Dorm B Kitchen",
    price: "$6.00",
    pickup: "Pickup window 6:10 - 6:40 pm",
    status: "available",
    time: "Ready in 20 min",
    tags: ["Indian", "Dinner", "Budget"],
    slots: "12 orders left",
    image: "/images/food-1.svg",
  },
  {
    id: "sweet-cravings",
    title: "Chai & Cardamom Donuts",
    chef: "Meera",
    location: "Arts Hall 2nd floor",
    price: "$4.50",
    pickup: "Pickup window 7:30 - 8:10 pm",
    status: "preorder",
    time: "Pre-orders open 6:45 pm",
    tags: ["Desserts", "Snacks"],
    slots: "8 pre-orders left",
    image: "/images/food-2.svg",
  },
  {
    id: "wok-night",
    title: "Wok Night Chow Mein",
    chef: "Jun",
    location: "Dorm C Lounge",
    price: "$5.50",
    pickup: "Pickup window 6:30 - 7:00 pm",
    status: "available",
    time: "Ready in 25 min",
    tags: ["Chinese", "Late Night"],
    slots: "6 orders left",
    image: "/images/food-3.svg",
  },
  {
    id: "comfort-dal",
    title: "Comfort Dal Bowl",
    chef: "Ria",
    location: "Library Cafe Patio",
    price: "$5.00",
    pickup: "Pickup window 8:00 - 8:30 pm",
    status: "preorder",
    time: "Pre-orders open 7:15 pm",
    tags: ["Indian", "Vegan"],
    slots: "14 pre-orders left",
    image: "/images/food-4.svg",
  },
  {
    id: "midnight-burger",
    title: "Midnight Smash Burger",
    chef: "Ethan",
    location: "Tech Hall Courtyard",
    price: "$7.50",
    pickup: "Pickup window 9:10 - 9:40 pm",
    status: "available",
    time: "Ready in 30 min",
    tags: ["Premium", "Late Night"],
    slots: "5 orders left",
    image: "/images/food-5.svg",
  },
  {
    id: "samosa-pack",
    title: "Spicy Samosa Pack",
    chef: "Huda",
    location: "Dorm A Lobby",
    price: "$3.50",
    pickup: "Pickup window 6:50 - 7:20 pm",
    status: "preorder",
    time: "Pre-orders open 6:20 pm",
    tags: ["Snacks", "Budget"],
    slots: "18 pre-orders left",
    image: "/images/food-6.svg",
  },
] as const;

const availableCampaigns = campaigns.filter(
  (campaign) => campaign.status === "available"
);

const preorderCampaigns = campaigns.filter(
  (campaign) => campaign.status === "preorder"
);

const consumerSteps = [
  "Browse live student-made menus.",
  "Pay securely and lock your pickup time.",
  "Grab your food without waiting in line.",
];

const chefSteps = [
  "Launch a campaign with your dishes.",
  "Track orders and prep quantities.",
  "Serve students and earn income.",
];

const chefs = [
  {
    name: "Chef Saira",
    specialty: "Pakistani bowls",
    orders: "142 orders",
    rating: "4.9",
    image: "/images/chef-1.svg",
  },
  {
    name: "Chef Hugo",
    specialty: "Ramen + gyoza",
    orders: "118 orders",
    rating: "4.8",
    image: "/images/chef-2.svg",
  },
  {
    name: "Chef Nabila",
    specialty: "Dessert drops",
    orders: "96 orders",
    rating: "5.0",
    image: "/images/chef-3.svg",
  },
];

const stats = [
  { label: "Orders completed", value: "500+ this month" },
  { label: "Verified student chefs", value: "85 active" },
  { label: "Average pickup", value: "17 minutes" },
];

const testimonials = [
  {
    quote:
      "No more WhatsApp chaos. I can see what is cooking and lock my spot fast.",
    name: "Lina · Sophomore",
  },
  {
    quote:
      "I sell out every Thursday. Food Now makes it feel professional.",
    name: "Imran · Student Chef",
  },
];

const categories = [
  "Indian",
  "Pakistani",
  "Chinese",
  "Desserts",
  "Snacks",
  "Lunch specials",
  "Dinner",
  "Late night",
  "Budget-friendly",
  "Premium",
];

const navItems = [
  { label: "Active campaigns", href: "#campaigns" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Featured chefs", href: "#chefs" },
  { label: "Community", href: "#community" },
];

type Campaign = (typeof campaigns)[number];

function renderCampaignCard(campaign: Campaign, index: number) {
  const isAvailable = campaign.status === "available";
  return (
    <Card
      key={campaign.id}
      className={cn(
        "group rounded-3xl border-none p-5 shadow-lg shadow-slate-900/5 transition duration-500 hover:-translate-y-1 hover:shadow-2xl animate-fade-up motion-reduce:animate-none",
        isAvailable
          ? "bg-emerald-50/80 dark:bg-emerald-500/10"
          : "bg-amber-50/80 dark:bg-amber-500/10"
      )}
      style={{ animationDelay: `${index * 120}ms` }}
    >
      <div className="relative mb-4 overflow-hidden rounded-2xl">
        <Image
          src={campaign.image}
          alt={campaign.title}
          width={800}
          height={600}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="h-36 w-full object-cover transition duration-500 group-hover:scale-105 sm:h-40"
        />
        <div className="absolute left-3 top-3">
          <Badge
            className={cn(
              "rounded-full",
              isAvailable ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
            )}
          >
            {isAvailable ? "Available now" : "Pre-order"}
          </Badge>
        </div>
      </div>

      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="mt-3 text-lg font-semibold text-slate-900 dark:text-white">
            {campaign.title}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-300">
            by {campaign.chef} · {campaign.location}
          </p>
        </div>
        <span className="text-lg font-semibold text-slate-900 dark:text-white">
          {campaign.price}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {campaign.tags.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="rounded-full bg-white/70 text-slate-600 dark:bg-slate-900/60 dark:text-slate-200"
          >
            {tag}
          </Badge>
        ))}
      </div>

      <div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
        <div className="flex items-center justify-between">
          <span>{campaign.time}</span>
          <span>{campaign.slots}</span>
        </div>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
          {campaign.pickup}
        </p>
      </div>

      <Button
        className={cn(
          "mt-5 w-full rounded-full",
          isAvailable
            ? "bg-emerald-600 text-white hover:bg-emerald-500"
            : "bg-amber-500 text-white hover:bg-amber-400"
        )}
      >
        {isAvailable ? "Order now" : "Reserve a spot"}
      </Button>
    </Card>
  );
}

export default function Page() {
  return (
    <div className="min-h-screen bg-campus text-slate-900 dark:text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-70 dark:opacity-40" />

      <header className="fixed left-1/2 top-3 z-50 flex w-[calc(100%-1rem)] max-w-6xl -translate-x-1/2 flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/70 bg-white/70 px-4 py-3 shadow-lg shadow-slate-900/10 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/65 sm:w-[calc(100%-2rem)] sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/30 dark:bg-white dark:text-slate-900">
            FN
          </div>
          <div>
            <p className="font-display text-lg font-semibold">Food Now</p>
            <p className="text-xs uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
              Student Kitchen Network
            </p>
          </div>
        </div>
        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300 md:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              className="hover:text-slate-900 dark:hover:text-white"
              href={item.href}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger
                render={
                  <Button
                    variant="outline"
                    size="icon-md"
                    aria-label="Open mobile menu"
                  />
                }
              >
                <MenuIcon className="size-5" />
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-[86%] border-r border-slate-200/70 bg-white/95 p-0 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95"
              >
                <div className="flex h-full flex-col">
                  <div className="border-b border-slate-200/70 p-5 dark:border-slate-800">
                    <SheetTitle className="font-display text-xl">Food Now</SheetTitle>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                      Student Kitchen Network
                    </p>
                  </div>

                  <nav className="flex flex-col gap-2 p-5">
                    {navItems.map((item) => (
                      <a
                        key={item.href}
                        href={item.href}
                        className="rounded-xl px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white"
                      >
                        {item.label}
                      </a>
                    ))}
                  </nav>

                  <div className="mt-auto border-t border-slate-200/70 p-5 dark:border-slate-800">
                    <div className="grid gap-2">
                      <Button
                        className="rounded-xl bg-amber-500 text-white hover:bg-amber-400"
                        render={<a href="/login" />}
                      >
                        Login
                      </Button>
                      <Button
                        className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-500"
                        render={<a href="/signup" />}
                      >
                        Sign up
                      </Button>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <ThemeToggle />
          <Button
            className="hidden rounded-full bg-amber-500 px-4 text-white hover:bg-amber-400 sm:px-5 md:inline-flex"
            render={<a href="/login" />}
          >
            Login
          </Button>
          <Button
            className="hidden rounded-full bg-emerald-600 px-4 text-white hover:bg-emerald-500 sm:px-5 md:inline-flex"
            render={<a href="/signup" />}
          >
            Sign up
          </Button>
        </div>
      </header>

      <main className="relative z-10 pt-28 sm:pt-32">
        <section className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-10 px-4 pb-14 pt-4 sm:px-6 sm:pb-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="rounded-full bg-slate-900/90 text-white dark:bg-white dark:text-slate-900">
                Verified campus chefs
              </Badge>
              <div className="flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 shadow-sm dark:bg-slate-900/60 dark:text-slate-200">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse-glow" />
                {liveCampaigns} meals cooking now
              </div>
            </div>
            <h1 className="font-display text-3xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
              Homemade campus food, one tap away.
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 sm:text-lg">
              Discover delicious meals cooked by fellow students. No more
              WhatsApp hunting, just real-time menus, quick pickups, and happy
              bellies.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button className="w-full rounded-full bg-amber-500 px-6 text-white hover:bg-amber-400 sm:w-auto">
                Browse what&apos;s cooking
              </Button>
              <Button
                variant="outline"
                className="w-full rounded-full border-emerald-400/60 px-6 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-300/40 dark:text-emerald-200 dark:hover:bg-emerald-500/10 sm:w-auto"
                render={<a href="/signup" />}
              >
                Start selling your food
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-6 pt-2 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-3">
              <div>
                <p className="text-2xl font-semibold text-slate-900 dark:text-white">
                  17 min
                </p>
                <p>Average pickup time</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900 dark:text-white">
                  85+
                </p>
                <p>Student chefs active</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900 dark:text-white">
                  24/7
                </p>
                <p>Late night options</p>
              </div>
            </div>
          </div>

          <Card className="relative overflow-hidden rounded-[28px] border-none bg-white/90 p-5 shadow-2xl shadow-amber-500/10 backdrop-blur animate-float-slow motion-reduce:animate-none sm:rounded-[32px] sm:p-6 dark:bg-slate-900/70">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-200/40 blur-3xl dark:bg-amber-500/20" />
            <div className="absolute -bottom-12 left-6 h-32 w-32 rounded-full bg-emerald-200/40 blur-3xl dark:bg-emerald-500/20" />
            <div className="relative space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                    Live pickup
                  </p>
                  <p className="text-2xl font-semibold text-slate-900 dark:text-white">
                    Spice Route Biryani
                  </p>
                </div>
                <Badge className="rounded-full bg-emerald-500 text-white">
                  20 min
                </Badge>
              </div>
              <div className="space-y-3">
                {["Chicken biryani", "Mint raita", "Mango lassi"].map((item) => (
                  <div
                    key={item}
                    className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:bg-slate-800/70 dark:text-slate-200"
                  >
                    <span>{item}</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      Cooking
                    </span>
                  </div>
                ))}
              </div>
                <div className="rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white dark:bg-white dark:text-slate-900">
                  Walk to Pickup C in 4 minutes
                </div>
              </div>
            </Card>
        </section>

        <section id="campaigns" className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6">
            <div className="space-y-2">
              <Badge className="rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-200">
                Active campaigns
              </Badge>
              <h2 className="font-display text-3xl font-semibold sm:text-4xl">
                Real student-made food, cooking right now.
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 sm:text-base">
                Two card types help students spot meals that are available now or
                opening soon for pre-order.
              </p>
            </div>
            <Button variant="outline" className="rounded-full">
              View all campaigns
            </Button>
          </div>

          <div className="space-y-10">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Badge className="rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-200">
                    Available now
                  </Badge>
                  <span className="text-sm text-slate-500 dark:text-slate-300">
                    {availableCampaigns.length} live campaigns
                  </span>
                </div>
                <Button variant="outline" className="rounded-full">
                  Order instantly
                </Button>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {availableCampaigns.map((campaign, index) =>
                  renderCampaignCard(campaign, index)
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Badge className="rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-200">
                    Pre-order
                  </Badge>
                  <span className="text-sm text-slate-500 dark:text-slate-300">
                    {preorderCampaigns.length} upcoming drops
                  </span>
                </div>
                <Button
                  variant="outline"
                  className="rounded-full border-amber-200/60 text-amber-700 hover:bg-amber-50 dark:border-amber-400/30 dark:text-amber-200 dark:hover:bg-amber-500/10"
                >
                  Reserve early
                </Button>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {preorderCampaigns.map((campaign, index) =>
                  renderCampaignCard(campaign, index)
                )}
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="rounded-[32px] border-none bg-slate-900 p-8 text-white shadow-2xl animate-fade-up motion-reduce:animate-none">
              <Badge className="rounded-full bg-white/15 text-white">
                For consumers
              </Badge>
              <h2 className="mt-4 font-display text-3xl font-semibold">
                Grab homemade food in three quick steps.
              </h2>
              <div className="mt-6 space-y-4 text-sm text-slate-200">
                {consumerSteps.map((step, index) => (
                  <div
                    key={step}
                    className="flex items-start gap-3 rounded-2xl bg-white/10 p-4"
                  >
                    <span className="font-semibold text-emerald-200">
                      0{index + 1}
                    </span>
                    <p>{step}</p>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="rounded-[32px] border-none bg-white/90 p-8 shadow-2xl backdrop-blur animate-fade-up motion-reduce:animate-none dark:bg-slate-900/60">
              <Badge className="rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-200">
                For student chefs
              </Badge>
              <h2 className="mt-4 font-display text-3xl font-semibold text-slate-900 dark:text-white">
                Turn your kitchen into a campus hotspot.
              </h2>
              <div className="mt-6 space-y-4 text-sm text-slate-600 dark:text-slate-200">
                {chefSteps.map((step, index) => (
                  <div
                    key={step}
                    className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/70"
                  >
                    <span className="font-semibold text-amber-500">
                      0{index + 1}
                    </span>
                    <p>{step}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>

        <section id="chefs" className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6">
            <div className="space-y-2">
              <Badge className="rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-200">
                Featured chefs
              </Badge>
              <h2 className="font-display text-3xl font-semibold sm:text-4xl">
                Top-rated student chefs this week.
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 sm:text-base">
                Each chef is verified with university ID and community reviews.
              </p>
            </div>
            <Button className="rounded-full bg-emerald-600 px-5 text-white hover:bg-emerald-500">
              Become a chef
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {chefs.map((chef, index) => (
              <Card
                key={chef.name}
                className="rounded-3xl border-none bg-white/90 p-5 shadow-lg shadow-slate-900/5 transition duration-500 hover:-translate-y-1 hover:shadow-2xl animate-fade-up motion-reduce:animate-none sm:p-6 dark:bg-slate-900/70"
                style={{ animationDelay: `${index * 140}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 overflow-hidden rounded-2xl bg-slate-100 shadow-sm dark:bg-slate-800">
                    <Image
                      src={chef.image}
                      alt={chef.name}
                      width={200}
                      height={200}
                      sizes="64px"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-lg font-semibold text-slate-900 dark:text-white">
                      {chef.name}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-300">
                      {chef.specialty}
                    </p>
                  </div>
                  <Badge className="rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                    {chef.rating}
                  </Badge>
                </div>
                <div className="mt-6 flex items-center justify-between text-sm text-slate-600 dark:text-slate-200">
                  <span>{chef.orders}</span>
                  <span>Top 10%</span>
                </div>
                <Button variant="outline" className="mt-5 w-full rounded-full">
                  View profile
                </Button>
              </Card>
            ))}
          </div>
        </section>

        <section id="community" className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <Card className="rounded-[32px] border-none bg-white/90 p-8 shadow-2xl backdrop-blur animate-fade-up motion-reduce:animate-none dark:bg-slate-900/70">
              <Badge className="rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-200">
                Trust & community
              </Badge>
              <h2 className="mt-4 font-display text-3xl font-semibold text-slate-900 dark:text-white">
                Made by students, for students.
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Every chef is verified with AIU ID cards and campaigns are
                monitored to keep pickups smooth.
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl bg-slate-50 p-4 text-sm dark:bg-slate-800/70"
                  >
                    <p className="text-lg font-semibold text-slate-900 dark:text-white">
                      {stat.value}
                    </p>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            <div className="grid gap-4">
              {testimonials.map((testimonial, index) => (
                <Card
                  key={testimonial.name}
                  className="relative overflow-hidden rounded-3xl border-none bg-slate-900 p-6 text-white shadow-lg animate-fade-up motion-reduce:animate-none"
                >
                  <div className="absolute -top-4 right-6 text-6xl text-white/10">
                    “
                  </div>
                  <p className="text-sm text-slate-200">{testimonial.quote}</p>
                  <p className="mt-4 text-xs uppercase tracking-[0.3em] text-slate-400">
                    {testimonial.name}
                  </p>
                  {index === 0 && (
                    <div className="absolute -bottom-10 -left-10 h-24 w-24 rounded-full bg-emerald-400/20 blur-2xl" />
                  )}
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6">
          <div className="rounded-[40px] border border-slate-200/70 bg-white/80 p-8 shadow-lg backdrop-blur animate-fade-up motion-reduce:animate-none dark:border-slate-800 dark:bg-slate-900/60">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="space-y-2">
                <Badge className="rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-200">
                  Categories & tags
                </Badge>
                <h2 className="font-display text-3xl font-semibold">
                  Find cravings fast.
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Browse by cuisine, meal time, or budget.
                </p>
              </div>
              <Button variant="outline" className="rounded-full">
                Explore all tags
              </Button>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              {categories.map((category) => (
                <Badge
                  key={category}
                  variant="secondary"
                  className="rounded-full bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-200"
                >
                  {category}
                </Badge>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6">
          <div className="relative overflow-hidden rounded-[40px] bg-emerald-500 px-8 py-12 text-white">
            <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-amber-200/40 blur-3xl" />
            <div className="absolute -bottom-24 left-10 h-60 w-60 rounded-full bg-white/10 blur-3xl" />
            <div className="relative z-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
              <div className="space-y-4">
                <Badge className="rounded-full bg-white/20 text-white">
                  Start earning
                </Badge>
                <h2 className="font-display text-3xl font-semibold sm:text-4xl">
                  Have a signature dish? Start earning today.
                </h2>
                <p className="text-sm text-emerald-50 sm:text-base">
                  Launch a campaign in minutes, unlock subscription perks, and
                  build a following across campus.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button className="rounded-full bg-slate-900 px-6 text-white hover:bg-slate-800">
                  Create chef profile
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full bg-emerald-500 border-white/40 text-white hover:bg-white/10"
                >
                  See chef benefits
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-slate-200/60 px-4 py-10 dark:border-slate-800 sm:px-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 text-sm text-slate-500 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Food Now. Homemade campus food made simple.</p>
          <div className="flex flex-wrap gap-4">
            <a className="hover:text-slate-800 dark:hover:text-white" href="#">
              Privacy
            </a>
            <a className="hover:text-slate-800 dark:hover:text-white" href="#">
              Terms
            </a>
            <a className="hover:text-slate-800 dark:hover:text-white" href="#">
              Support
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
