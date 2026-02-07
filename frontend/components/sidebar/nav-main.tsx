"use client"

import { ChevronRight, type LucideIcon } from "lucide-react"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  const pathname = usePathname()
  
  // Find which menu item should be open based on current path
  const getActiveMenuTitle = () => {
    for (const item of items) {
      if (item.items?.some(subItem => pathname === subItem.url || pathname.startsWith(subItem.url + "/"))) {
        return item.title
      }
      if (pathname === item.url || pathname.startsWith(item.url + "/")) {
        return item.title
      }
    }
    return null
  }

  const [openItems, setOpenItems] = useState<string[]>([])

  useEffect(() => {
    const activeTitle = getActiveMenuTitle()
    if (activeTitle) {
      setOpenItems([activeTitle])
    }
  }, [pathname])

  const toggleItem = (title: string) => {
    setOpenItems(prev =>
      prev.includes(title)
        ? prev.filter(t => t !== title)
        : [...prev, title]
    )
  }

  const isSubItemActive = (url: string) => {
    return pathname === url || pathname.startsWith(url + "/")
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible key={item.title} open={openItems.includes(item.title)} onOpenChange={() => item.items?.length && toggleItem(item.title)}>
            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={() => item.items?.length && toggleItem(item.title)}
                render={!item.items?.length ? <a href={item.url} /> : undefined}
                tooltip={item.title}
              >
                <item.icon />
                <span>{item.title}</span>
                {item.items?.length ? (
                  <ChevronRight className={`ml-auto transition-transform duration-200 ${openItems.includes(item.title) ? "rotate-90" : ""}`} />
                ) : null}
              </SidebarMenuButton>
            </SidebarMenuItem>
            {item.items?.length ? (
              <CollapsibleContent>
                <SidebarMenuSub>
                  {item.items?.map((subItem) => (
                    <SidebarMenuSubItem key={subItem.title}>
                      <SidebarMenuSubButton 
                        render={<a href={subItem.url} />}
                        className={isSubItemActive(subItem.url) ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""}
                      >
                        <span>{subItem.title}</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              ) : null}
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
