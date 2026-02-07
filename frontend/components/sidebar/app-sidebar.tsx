"use client"

import * as React from "react"
import {
  BookOpen,
  Bot,
  Command,
  Frame,
  LifeBuoy,
  Map,
  PieChart,
  Send,
  Settings2,
  SquareTerminal,
} from "lucide-react"

import { NavMain } from "@/components/sidebar/nav-main"
import { NavSecondary } from "@/components/sidebar/nav-secondary"
import { NavUser } from "@/components/sidebar/nav-user"
import { ChefPromo } from "@/components/sidebar/chef-promo"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
    user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/images/avatar.png",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: PieChart,
      items: [
        {
          title: "Admin Dashboard",
          url: "/dashboard/admin",
        },
        {
          title: "Chef Dashboard",
          url: "/dashboard/chef",
        },
        {
          title: "User Dashboard",
          url: "/dashboard/user",
        },
      ],
    },
    {
      title: "Campaign",
      url: "/campaign",
      icon: Bot,
      items: [
        {
          title: "Current Campaign",
          url: "/campaign/current",
        },
        {
          title: "Create New Campaign",
          url: "/campaign/create",
        },
        {
          title: "Campaign History",
          url: "/campaign/history",
        },
      ],
    },
    {
      title: "Campaign Orders",
      url: "/campaign-orders",
      icon: SquareTerminal,
      items: [
        {
          title: "Pending Orders",
          url: "/campaign-orders/pending",
        },
        {
          title: "Order History",
          url: "/campaign-orders/history",
        },
      ],
    },
    {
      title: "Your Orders",
      url: "/your-orders",
      icon: Frame,
      items: [
        {
          title: "Pending Orders",
          url: "/your-orders/pending",
        },
        {
          title: "Order History",
          url: "/your-orders/history",
        },
      ],
    },
    {
      title: "Subscription",
      url: "/subscription",
      icon: BookOpen,
      items: [
        {
          title: "Get a Subscription",
          url: "/subscription/get",
        },
        {
          title: "Pending Subscription",
          url: "/subscription/pending",
        },
        {
          title: "Subscription Options",
          url: "/subscription/options",
        },
        {
          title: "Subscription History",
          url: "/subscription/history",
        },
      ],
    },
    {
      title: "Transactions",
      url: "/transactions",
      icon: Map,
      items: [
        {
          title: "Pending Transactions",
          url: "/transactions/pending",
        },
        {
          title: "Transaction History",
          url: "/transactions/history",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Support",
      url: "#",
      icon: LifeBuoy,
    },
    {
      title: "Feedback",
      url: "#",
      icon: Send,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<a href="#" />}>
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <Command className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">Acme Inc</span>
                <span className="truncate text-xs">Enterprise</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <ChefPromo />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
