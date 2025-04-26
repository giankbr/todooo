"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { PlusCircle, X } from "lucide-react"

export function TaskForm() {
  const [tasks, setTasks] = useState<string[]>([
    "Setup CMS using Laravel 11, Inertia",
    "Management account and permission",
  ])
  const [newTask, setNewTask] = useState("")
  const [projectName, setProjectName] = useState("CMS Krimum")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])

  const addTask = () => {
    if (newTask.trim()) {
      setTasks([...tasks, newTask.trim()])
      setNewTask("")
    }
  }

  const removeTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would send the data to your backend
    console.log({
      projectName,
      date,
      tasks,
    })
    alert("Tasks submitted successfully!")
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="project">Project Name</Label>
        <Input
          id="project"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          placeholder="Enter project name"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="date">Date</Label>
        <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label>Tasks</Label>
        <div className="space-y-2">
          {tasks.map((task, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="flex-1 rounded-md border bg-muted p-2">{task}</div>
              <Button type="button" variant="ghost" size="icon" onClick={() => removeTask(index)}>
                <X className="h-4 w-4" />
                <span className="sr-only">Remove</span>
              </Button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="Add a new task" />
          <Button type="button" onClick={addTask} variant="outline" size="icon">
            <PlusCircle className="h-4 w-4" />
            <span className="sr-only">Add</span>
          </Button>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Additional Notes</Label>
        <Textarea id="notes" placeholder="Any additional notes or context" className="min-h-[100px]" />
      </div>
      <Button type="submit" className="w-full">
        Submit Tasks
      </Button>
    </form>
  )
}
