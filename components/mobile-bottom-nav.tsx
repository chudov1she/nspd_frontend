"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ListChecksIcon, SquaresFourIcon, UsersIcon } from "@phosphor-icons/react"

import { cn } from "@/lib/utils"

const mobileNavItems = [
  { title: "Дашборд", url: "/dashboard", icon: SquaresFourIcon },
  { title: "Пользователи", url: "/users", icon: UsersIcon },
  { title: "Задачи", url: "/tasks", icon: ListChecksIcon },
]

export function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur md:hidden">
      <ul className="grid grid-cols-3 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2">
        {mobileNavItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.url
          return (
            <li key={item.url}>
              <Link
                href={item.url}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 rounded-md py-2 text-[11px] text-muted-foreground transition-colors",
                  isActive && "bg-muted text-foreground"
                )}
              >
                <Icon className="size-5" />
                <span>{item.title}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
