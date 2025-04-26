import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { Header } from "@/components/dashboard/header"
import { Progress } from "@/components/ui/progress"

export default function ProjectsPage() {
  const projects = [
    {
      id: "1",
      name: "Oslona Website",
      tasks: 12,
      completed: 8,
      priority: "high",
    },
    {
      id: "2",
      name: "Dribbble",
      tasks: 8,
      completed: 5,
      priority: "medium",
    },
    {
      id: "3",
      name: "Personal Project",
      tasks: 5,
      completed: 2,
      priority: "low",
    },
  ]

  return (
    <>
      <Header title="Projects" />
      <div className="flex-1 overflow-y-auto p-4">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Manage and track progress across all your projects</p>
            </div>
            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              <span>New Project</span>
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Card key={project.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <div
                      className={`priority-dot priority-${project.priority}`}
                      title={`Priority: ${project.priority}`}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span>Progress</span>
                        <span>
                          {project.completed}/{project.tasks} tasks
                        </span>
                      </div>
                      <Progress value={(project.completed / project.tasks) * 100} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{Math.round((project.completed / project.tasks) * 100)}% complete</Badge>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
