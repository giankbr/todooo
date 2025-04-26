import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Clock, Pause, Play, RotateCcw } from "lucide-react"
import Link from "next/link"

export default function FocusModePage() {
  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex h-14 items-center justify-between border-b px-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back to Dashboard</span>
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Focus Mode</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1">
            <RotateCcw className="h-4 w-4" />
            <span>Reset</span>
          </Button>
        </div>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center p-4">
        <div className="mb-8 text-center">
          <div className="text-7xl font-bold tabular-nums">120:00</div>
          <p className="mt-2 text-sm text-muted-foreground">Time Remaining</p>
        </div>

        <div className="mb-8 flex gap-4">
          <Button size="lg" className="h-12 w-12 rounded-full p-0">
            <Play className="h-6 w-6" />
            <span className="sr-only">Start</span>
          </Button>
          <Button size="lg" variant="outline" className="h-12 w-12 rounded-full p-0">
            <Pause className="h-6 w-6" />
            <span className="sr-only">Pause</span>
          </Button>
        </div>

        <div className="w-full max-w-md space-y-4">
          <h2 className="text-center text-xl font-bold">Current Task</h2>
          <Card>
            <CardContent className="p-4">
              <div className="task-item">
                <Checkbox id="focus-task" />
                <div className="flex-1">
                  <label htmlFor="focus-task" className="font-medium">
                    Create Financial landing pages mood board
                  </label>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Estimated: 2 hours</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
