'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { useState } from 'react';

type TodoItem = {
  id: string;
  task: string;
  status: 'completed' | 'in-progress' | 'pending';
  date: string;
  assignee?: {
    name: string;
    avatar: string;
    initials: string;
  };
};

export default function TodosPage() {
  const [todos, setTodos] = useState<TodoItem[]>([
    {
      id: '1',
      task: 'Setup CMS using Laravel 11',
      status: 'completed',
      date: 'Today',
      assignee: {
        name: 'John Doe',
        avatar: '/placeholder.svg?height=32&width=32',
        initials: 'JD',
      },
    },
    {
      id: '2',
      task: 'Management account and permission',
      status: 'completed',
      date: 'Today',
      assignee: {
        name: 'Jane Smith',
        avatar: '/placeholder.svg?height=32&width=32',
        initials: 'JS',
      },
    },
    {
      id: '3',
      task: 'CRUD profiles, department, himbauan, galeri',
      status: 'in-progress',
      date: 'Today',
      assignee: {
        name: 'Alex Johnson',
        avatar: '/placeholder.svg?height=32&width=32',
        initials: 'AJ',
      },
    },
    {
      id: '4',
      task: 'API for profiles and departments',
      status: 'pending',
      date: 'Tomorrow',
      assignee: {
        name: 'Sarah Williams',
        avatar: '/placeholder.svg?height=32&width=32',
        initials: 'SW',
      },
    },
  ]);
  const [newTask, setNewTask] = useState('');
  const [newTaskStatus, setNewTaskStatus] = useState<'completed' | 'in-progress' | 'pending'>('pending');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleStatusChange = (id: string, checked: boolean) => {
    setTodos(todos.map((todo) => (todo.id === id ? { ...todo, status: checked ? 'completed' : 'in-progress' } : todo)));
  };

  const addNewTask = () => {
    if (newTask.trim()) {
      const newTodo: TodoItem = {
        id: Date.now().toString(),
        task: newTask,
        status: newTaskStatus,
        date: 'Today',
        assignee: {
          name: 'John Doe',
          avatar: '/placeholder.svg?height=32&width=32',
          initials: 'JD',
        },
      };
      setTodos([newTodo, ...todos]);
      setNewTask('');
      setNewTaskStatus('pending');
      setIsDialogOpen(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
          <span>Project:</span>
          <Badge variant="outline" className="bg-background">
            Develop new app
          </Badge>
        </div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-4xl font-bold text-primary">Today</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Task</DialogTitle>
                <DialogDescription>Create a new task for your list.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="task">Task</Label>
                  <Input id="task" placeholder="Enter your task" value={newTask} onChange={(e) => setNewTask(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={newTaskStatus} onValueChange={(value) => setNewTaskStatus(value as 'completed' | 'in-progress' | 'pending')}>
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={addNewTask}>Add Task</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          {todos.map((todo) => (
            <div key={todo.id} className="task-item">
              <Checkbox id={`todo-${todo.id}`} checked={todo.status === 'completed'} onCheckedChange={(checked) => handleStatusChange(todo.id, checked as boolean)} />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <label htmlFor={`todo-${todo.id}`} className={`font-medium ${todo.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                    {todo.task}
                  </label>
                  <div className="flex items-center gap-2">
                    {todo.status === 'in-progress' && <Badge variant="secondary">In Progress</Badge>}
                    {todo.status === 'pending' && <Badge>Pending</Badge>}
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={todo.assignee?.avatar || '/placeholder.svg'} alt={todo.assignee?.name} />
                      <AvatarFallback>{todo.assignee?.initials}</AvatarFallback>
                    </Avatar>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{todo.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
