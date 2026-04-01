"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { SquaresFourIcon, UsersIcon, ListChecksIcon } from "@phosphor-icons/react"
import { useAuthStore } from "@/lib/auth/store"

const navItems = [
  { title: "Дашборд", url: "/dashboard", icon: SquaresFourIcon },
  { title: "Пользователи", url: "/users", icon: UsersIcon },
  { title: "Задачи", url: "/tasks", icon: ListChecksIcon },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const currentUser = useAuthStore((state) => state.currentUser)

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="data-[slot=sidebar-menu-button]:p-1.5!">
              <span className="text-base font-semibold">NSPD Admin Panel</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.url
            return (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                  <Link href={item.url}>
                    <Icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        {currentUser ? (
          <NavUser
            user={{
              id: currentUser.id,
              name: currentUser.name,
              email: currentUser.email,
              avatar: "",
            }}
          />
        ) : null}
      </SidebarFooter>
    </Sidebar>
  )
}
