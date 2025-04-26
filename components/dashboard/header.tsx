"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ModeToggle } from "@/components/mode-toggle"
import { Bell, Search, Sparkles } from "lucide-react"

interface HeaderProps {
  title: string
}

export function Header({ title }: HeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b px-4">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Search for task name..." className="w-[300px] rounded-md pl-8" />
        </div>

        <Button variant="outline" size="sm" className="gap-1">
          <Search className="h-4 w-4 md:hidden" />
          <span className="hidden md:inline">Focus Mode</span>
        </Button>

        <Button variant="outline" size="sm" className="gap-1">
          <Sparkles className="h-4 w-4" />
          <span className="hidden md:inline">AI Assist</span>
        </Button>

        <Button variant="ghost" size="icon" className="rounded-full">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notifications</span>
        </Button>

        <ModeToggle />
      </div>
    </header>
  )
}
