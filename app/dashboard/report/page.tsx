import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Header } from "@/components/dashboard/header"

export default function ReportPage() {
  const tasks = [
    {
      id: "1",
      title: "Setup CMS using Laravel 11, Inertia",
      completed: true,
      project: "CMS Krimum",
      date: "Today",
      user: {
        name: "Gian",
        avatar: "",
        initials: "GN",
      },
    },
    {
      id: "2",
      title: "Management account and permission",
      completed: true,
      project: "CMS Krimum",
      date: "Today",
      user: {
        name: "Gian",
        avatar: "",
        initials: "GN",
      },
    },
    {
      id: "3",
      title: "CRUD profiles, department, himbauan, galeri",
      completed: true,
      project: "CMS Krimum",
      date: "Today",
      user: {
        name: "Gian",
        avatar: "",
        initials: "GN",
      },
    },
    {
      id: "4",
      title: "API profiles, department, himbauan, galeri",
      completed: false,
      project: "CMS Krimum",
      date: "Today",
      user: {
        name: "Gian",
        avatar: "",
        initials: "GN",
      },
    },
  ]

  return (
    <>
      <Header title="Today's Report" />
      <div className="flex-1 overflow-y-auto p-4">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-6">
            <p className="text-sm text-muted-foreground">Summary of tasks completed today across all team members</p>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Team Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tasks.map((task) => (
                  <div key={task.id} className="task-card flex items-center gap-3">
                    <Checkbox id={`task-${task.id}`} checked={task.completed} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor={`task-${task.id}`}
                          className={`font-medium ${task.completed ? "line-through text-muted-foreground" : ""}`}
                        >
                          {task.title}
                        </label>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{task.project}</Badge>
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={task.user.avatar || "/placeholder.svg"} alt={task.user.name} />
                            <AvatarFallback>{task.user.initials}</AvatarFallback>
                          </Avatar>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">{task.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Completion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold">75%</p>
                    <p className="text-xs text-muted-foreground">Tasks completed today</p>
                  </div>
                  <div className="h-24 w-24 rounded-full border-8 border-primary/30">
                    <div className="relative h-full w-full">
                      <div
                        className="absolute inset-0 rounded-full border-8 border-primary"
                        style={{ clipPath: "polygon(0 0, 100% 0, 100% 75%, 0 75%)" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Team Members</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="/placeholder.svg" alt="Gian" />
                        <AvatarFallback>GN</AvatarFallback>
                      </Avatar>
                      <span>Gian</span>
                    </div>
                    <Badge variant="outline" className="bg-primary/10 text-primary">
                      3/4
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="/placeholder.svg" alt="Alex" />
                        <AvatarFallback>AX</AvatarFallback>
                      </Avatar>
                      <span>Alex</span>
                    </div>
                    <Badge variant="outline" className="bg-primary/10 text-primary">
                      2/3
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="/placeholder.svg" alt="Sarah" />
                        <AvatarFallback>SH</AvatarFallback>
                      </Avatar>
                      <span>Sarah</span>
                    </div>
                    <Badge variant="outline" className="bg-primary/10 text-primary">
                      4/5
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}
