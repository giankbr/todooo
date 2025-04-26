"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Task {
  id: string
  title: string
  completed: boolean
  project: string
  date: string
  user?: {
    name: string
    avatar: string
    initials: string
  }
}

interface TaskListProps {
  isTeam?: boolean
}

export function TaskList({ isTeam = false }: TaskListProps) {
  // Sample data - in a real app, this would come from your API
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: "1",
      title: "Setup CMS using Laravel 11, Inertia",
      completed: true,
      project: "CMS Krimum",
      date: "2025-04-25",
      user: isTeam
        ? {
            name: "Gian",
            avatar: "",
            initials: "GN",
          }
        : undefined,
    },
    {
      id: "2",
      title: "Management account and permission",
      completed: true,
      project: "CMS Krimum",
      date: "2025-04-25",
      user: isTeam
        ? {
            name: "Gian",
            avatar: "",
            initials: "GN",
          }
        : undefined,
    },
    {
      id: "3",
      title: "CRUD profiles, department, himbauan, galeri",
      completed: true,
      project: "CMS Krimum",
      date: "2025-04-25",
      user: isTeam
        ? {
            name: "Gian",
            avatar: "",
            initials: "GN",
          }
        : undefined,
    },
    {
      id: "4",
      title: "API profiles, department, himbauan, galeri",
      completed: true,
      project: "CMS Krimum",
      date: "2025-04-25",
      user: isTeam
        ? {
            name: "Gian",
            avatar: "",
            initials: "GN",
          }
        : undefined,
    },
    {
      id: "5",
      title: "Implement authentication system",
      completed: false,
      project: "CMS Krimum",
      date: "2025-04-26",
      user: isTeam
        ? {
            name: "Alex",
            avatar: "",
            initials: "AX",
          }
        : undefined,
    },
    {
      id: "6",
      title: "Design dashboard UI",
      completed: false,
      project: "CMS Krimum",
      date: "2025-04-26",
      user: isTeam
        ? {
            name: "Sarah",
            avatar: "",
            initials: "SH",
          }
        : undefined,
    },
  ])

  const toggleTaskCompletion = (id: string) => {
    setTasks(tasks.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)))
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <Card key={task.id}>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <Checkbox
                checked={task.completed}
                onCheckedChange={() => toggleTaskCompletion(task.id)}
                className="mt-1"
              />
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <p className={`font-medium ${task.completed ? "line-through text-muted-foreground" : ""}`}>
                    {task.title}
                  </p>
                  {isTeam && task.user && (
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={task.user.avatar || "/placeholder.svg"} alt={task.user.name} />
                      <AvatarFallback>{task.user.initials}</AvatarFallback>
                    </Avatar>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="outline">{task.project}</Badge>
                  <span>{task.date}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
