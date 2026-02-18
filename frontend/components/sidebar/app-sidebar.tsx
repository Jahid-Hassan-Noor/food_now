"use client"

import * as React from "react"
import {
  ClipboardList,
  Command,
  CreditCard,
  LifeBuoy,
  Megaphone,
  Package,
  PieChart,
  Receipt,
  Send,
  ShoppingBag,
  type LucideIcon,
} from "lucide-react"

import { NavMain } from "@/components/sidebar/nav-main"
import { NavSecondary } from "@/components/sidebar/nav-secondary"
import { NavUser } from "@/components/sidebar/nav-user"
import { ChefPromo } from "@/components/sidebar/chef-promo"
import { canAccessRole, defaultRouteForRole, type AuthUser, type UserRole } from "@/lib/auth"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

type NavSubItem = {
  title: string
  url: string
  requiredRole: UserRole
}

type NavMainItem = {
  title: string
  url: string
  icon: LucideIcon
  requiredRole: UserRole
  items?: NavSubItem[]
}

type NavSecondaryItem = {
  title: string
  url: string
  icon: LucideIcon
  requiredRole: UserRole
}

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: PieChart,
      requiredRole: "user",
      items: [
        {
          title: "Admin Dashboard",
          url: "/dashboard/admin",
          requiredRole: "admin",
        },
        {
          title: "Chef Dashboard",
          url: "/dashboard/chef",
          requiredRole: "chef",
        },
        {
          title: "User Dashboard",
          url: "/dashboard/user",
          requiredRole: "user",
        },
      ],
    },
    {
      title: "Campaign",
      url: "/campaign",
      icon: Megaphone,
      requiredRole: "chef",
      items: [
        {
          title: "Current Campaign",
          url: "/campaign/current",
          requiredRole: "chef",
        },
        {
          title: "Create New Campaign",
          url: "/campaign/create",
          requiredRole: "chef",
        },
        {
          title: "Campaign History",
          url: "/campaign/history",
          requiredRole: "chef",
        },
      ],
    },
    {
      title: "Campaign Orders",
      url: "/campaign-orders",
      icon: ClipboardList,
      requiredRole: "chef",
      items: [
        {
          title: "Pending Orders",
          url: "/campaign-orders/pending",
          requiredRole: "chef",
        },
        {
          title: "Order History",
          url: "/campaign-orders/history",
          requiredRole: "chef",
        },
      ],
    },
    {
      title: "Your Orders",
      url: "/your-orders",
      icon: ShoppingBag,
      requiredRole: "user",
      items: [
        {
          title: "Pending Orders",
          url: "/your-orders/pending",
          requiredRole: "user",
        },
        {
          title: "Order History",
          url: "/your-orders/history",
          requiredRole: "user",
        },
      ],
    },
    {
      title: "Subscription",
      url: "/subscription",
      icon: CreditCard,
      requiredRole: "chef",
      items: [
        {
          title: "Get a Subscription",
          url: "/subscription/get",
          requiredRole: "chef",
        },
        {
          title: "Pending Subscription",
          url: "/subscription/pending",
          requiredRole: "admin",
        },
        {
          title: "Subscription Options",
          url: "/subscription/options",
          requiredRole: "admin",
        },
        {
          title: "Subscription History",
          url: "/subscription/history",
          requiredRole: "admin",
        },
      ],
    },
    {
      title: "Transactions",
      url: "/transactions",
      icon: Receipt,
      requiredRole: "admin",
      items: [
        {
          title: "Pending Transactions",
          url: "/transactions/pending",
          requiredRole: "admin",
        },
        {
          title: "Transaction History",
          url: "/transactions/history",
          requiredRole: "admin",
        },
      ],
    },
    {
      title: "Food Inventory",
      url: "/food-inventory",
      icon: Package,
      requiredRole: "chef",
      items: [
        {
          title: "Listed Foods",
          url: "/food-inventory/listed-foods",
          requiredRole: "chef",
        },
        {
          title: "Add Food Items",
          url: "/food-inventory/add-items",
          requiredRole: "chef",
        },
      ],
    },
    {
      title: "User Feedbacks",
      url: "/user-feedbacks",
      icon: Send,
      requiredRole: "admin",
    },
  ],
  navSecondary: [
    {
      title: "Support",
      url: "/support",
      icon: LifeBuoy,
      requiredRole: "user",
    },
    {
      title: "Feedback",
      url: "/feedback",
      icon: Send,
      requiredRole: "user",
    },
  ],
}

export function AppSidebar({
  role,
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  role: UserRole
  user: AuthUser
}) {
  const filteredNavMain = React.useMemo(() => {
    return (data.navMain as NavMainItem[])
      .map((item) => ({
        ...item,
        items: item.items?.filter((subItem) => canAccessRole(role, subItem.requiredRole)),
      }))
      .filter((item) => {
        if (!canAccessRole(role, item.requiredRole)) {
          return false
        }
        if (!item.items) {
          return true
        }
        return item.items.length > 0
      })
      .map((item) => ({
        title: item.title,
        url: item.url,
        icon: item.icon,
        items: item.items?.map(({ title, url }) => ({ title, url })),
      }))
  }, [role])

  const filteredNavSecondary = React.useMemo(() => {
    return (data.navSecondary as NavSecondaryItem[]).filter((item) => canAccessRole(role, item.requiredRole))
  }, [role])

  const displayName =
    [user.first_name, user.last_name].filter(Boolean).join(" ").trim() || user.username || "User"

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<a href={defaultRouteForRole(role)} />}>
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <Command className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">Food Now</span>
                <span className="truncate text-xs">{role.toUpperCase()}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={filteredNavMain} />
        {role === "user" ? <ChefPromo /> : null}
        <NavSecondary items={filteredNavSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: displayName,
            email: user.email || "no-email@foodnow.local",
            avatar: "/images/avatar.png",
          }}
        />
      </SidebarFooter>
    </Sidebar>
  )
}
