'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, FileText, Settings, Sparkles } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Match", href: "/match", icon: FileText },
  { label: "Paramètres", href: "/settings", icon: Settings },
]

export function Navbar() {
  const pathname = usePathname()

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800 bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <nav className="mx-auto flex max-w-6xl items-center justify-between py-4 px-6">
        {/* Logo */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-xl font-bold tracking-tight transition-colors hover:text-primary"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-blue-500 text-white">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="hidden sm:inline">CVre</span>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-3">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === item.href
                : pathname.startsWith(item.href)

            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative px-4 py-2.5 rounded-lg text-base font-medium flex items-center gap-2.5",
                  "transition-all duration-300 ease-in-out",
                  isActive
                    ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 shadow-sm scale-105"
                    : "text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-foreground hover:scale-102",
                )}
              >
                {isActive && (
                  <span className="absolute inset-0 rounded-lg bg-blue-500/10 dark:bg-blue-400/10 animate-in fade-in zoom-in-95 duration-300" />
                )}
                <Icon className={cn(
                  "h-5 w-5 transition-transform duration-300",
                  isActive && "scale-110"
                )} />
                <span className="hidden md:inline relative z-10">{item.label}</span>
              </Link>
            )
          })}
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />
      </nav>
    </header>
  )
}

