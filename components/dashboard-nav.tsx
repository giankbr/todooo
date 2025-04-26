"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { BarChart, Home, ListTodo, Settings, Users } from "lucide-react"

export function DashboardNav() {
  const pathname = usePathname()

  return (
    <nav className="grid items-start gap-2 py-6">
      <Link href="/dashboard">
        <Button variant={pathname === "/dashboard" ? "default" : "ghost"} className="w-full justify-start">
          <Home className="mr-2 h-4 w-4" />
          Dashboard
        </Button>
      </Link>
      <Link href="/dashboard/tasks">
        <Button variant={pathname === "/dashboard/tasks" ? "default" : "ghost"} className="w-full justify-start">
          <ListTodo className="mr-2 h-4 w-4" />
          Tasks
        </Button>
      </Link>
      <Link href="/dashboard/team">
        <Button variant={pathname === "/dashboard/team" ? "default" : "ghost"} className="w-full justify-start">
          <Users className="mr-2 h-4 w-4" />
          Team
        </Button>
      </Link>
      <Link href="/dashboard/reports">
        <Button variant={pathname === "/dashboard/reports" ? "default" : "ghost"} className="w-full justify-start">
          <BarChart className="mr-2 h-4 w-4" />
          Reports
        </Button>
      </Link>
      <Link href="/dashboard/settings">
        <Button variant={pathname === "/dashboard/settings" ? "default" : "ghost"} className="w-full justify-start">
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </Button>
      </Link>
    </nav>
  )
}
