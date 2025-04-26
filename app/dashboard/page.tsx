'use client';

import { Header } from '@/components/dashboard/header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { UpdateTemplate } from '@/components/update-template';
import { Edit2, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

// Define types for our task data
interface TaskUser {
  name: string;
  avatar: string;
  initials: string;
}

type Priority = 'high' | 'medium' | 'low';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  category: string;
  priority: Priority;
  date: string;
  user: TaskUser;
}

interface TaskWithDueDate extends Task {
  dueDate?: string;
  notes?: string;
}

// Define the expected shape of submitted data
interface TaskSubmitData {
  project: string;
  tasks: {
    description: string;
    completed: boolean;
  }[];
}

// Priority order for sorting
const priorityOrder = {
  high: 0,
  medium: 1,
  low: 2,
};

export default function DashboardPage() {
  // Type the state variables properly
  const [tasks, setTasks] = useState<TaskWithDueDate[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<TaskWithDueDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTaskText, setEditTaskText] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  useEffect(() => {
    fetchTasks();
  }, [selectedDate]); // Refetch when date changes

  useEffect(() => {
    // Initialize filtered tasks whenever tasks change
    setFilteredTasks(tasks);
  }, [tasks]);

  const fetchTasks = async (): Promise<void> => {
    try {
      setLoading(true);
      const res = await fetch(`/api/tasks?date=${selectedDate}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to load tasks');

      setTasks(data.tasks);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskSubmit = async (data: TaskSubmitData): Promise<void> => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) throw new Error(result.error || 'Failed to add tasks');

      toast.success('Tasks added successfully');
      setIsAddTaskOpen(false);
      fetchTasks(); // Refresh the task list
    } catch (error) {
      console.error('Failed to add tasks:', error);
      toast.error('Failed to add tasks');
    }
  };

  const toggleTaskStatus = async (taskId: string, isCompleted: boolean): Promise<void> => {
    try {
      // Set saving state
      setSavingTaskId(taskId);

      // Optimistic UI update
      setTasks(tasks.map((task) => (task.id === taskId ? { ...task, completed: isCompleted } : task)));

      // Parse taskId to get the actual update ID
      const [updateId] = taskId.split('-');

      // Send update to the server
      const res = await fetch(`/api/tasks/${updateId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId: taskId,
          completed: isCompleted,
        }),
      });

      if (!res.ok) {
        // If server update fails, revert the optimistic update
        setTasks(tasks.map((task) => (task.id === taskId ? { ...task, completed: !isCompleted } : task)));
        throw new Error('Failed to update task status');
      }
    } catch (error) {
      console.error('Failed to update task status:', error);
      toast.error('Failed to update task status');
    } finally {
      // Clear saving state
      setSavingTaskId(null);
    }
  };

  const updateTaskPriority = async (taskId: string, priority: Priority): Promise<void> => {
    try {
      setSavingTaskId(taskId);

      // Optimistic UI update
      setTasks(tasks.map((task) => (task.id === taskId ? { ...task, priority } : task)));

      // Parse taskId
      const [updateId] = taskId.split('-');

      const res = await fetch(`/api/tasks/${updateId}/task/${taskId}/priority`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priority }),
      });

      if (!res.ok) {
        // Revert on failure
        setTasks(tasks.map((task) => (task.id === taskId ? { ...task, priority: task.priority } : task)));
        throw new Error('Failed to update priority');
      }

      toast.success('Task priority updated');
    } catch (error) {
      console.error('Failed to update priority:', error);
      toast.error('Failed to update priority');
    } finally {
      setSavingTaskId(null);
    }
  };

  const updateTaskDueDate = async (taskId: string, dueDate: string): Promise<void> => {
    try {
      setSavingTaskId(taskId);

      // Optimistic UI update
      setTasks(tasks.map((task) => (task.id === taskId ? { ...task, dueDate } : task)));

      // Parse taskId
      const [updateId] = taskId.split('-');

      const res = await fetch(`/api/tasks/${updateId}/task/${taskId}/duedate`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dueDate }),
      });

      if (!res.ok) {
        // Revert on failure
        setTasks(tasks.map((task) => (task.id === taskId ? { ...task, dueDate: task.dueDate } : task)));
        throw new Error('Failed to update due date');
      }
    } catch (error) {
      console.error('Failed to update due date:', error);
      toast.error('Failed to update due date');
    } finally {
      setSavingTaskId(null);
    }
  };

  const isTaskOverdue = (task: TaskWithDueDate): boolean => {
    if (!task.dueDate) return false;

    const dueDate = new Date(task.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time part for date comparison

    return dueDate < today && !task.completed;
  };

  const deleteTask = async (taskId: string): Promise<void> => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      setSavingTaskId(taskId);

      // Optimistic UI update
      setTasks(tasks.filter((task) => task.id !== taskId));

      // Parse taskId to get the actual update ID
      const [updateId] = taskId.split('-');

      const res = await fetch(`/api/tasks/${updateId}/task/${taskId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        // Restore task on error
        fetchTasks();
        throw new Error('Failed to delete task');
      }

      toast.success('Task deleted successfully');
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast.error('Failed to delete task');
    } finally {
      setSavingTaskId(null);
    }
  };

  const saveTaskEdit = async (taskId: string): Promise<void> => {
    if (!editTaskText.trim()) return;

    try {
      setSavingTaskId(taskId);

      // Get original task
      const taskToEdit = tasks.find((t) => t.id === taskId);
      if (!taskToEdit) return;

      const originalTitle = taskToEdit.title;

      // Optimistic UI update
      setTasks(tasks.map((task) => (task.id === taskId ? { ...task, title: editTaskText } : task)));

      // Parse taskId
      const [updateId] = taskId.split('-');

      const res = await fetch(`/api/tasks/${updateId}/task/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newDescription: editTaskText,
        }),
      });

      if (!res.ok) {
        // Revert on failure
        setTasks(tasks.map((task) => (task.id === taskId ? { ...task, title: originalTitle } : task)));
        throw new Error('Failed to update task');
      }

      setEditingTaskId(null);
      toast.success('Task updated successfully');
    } catch (error) {
      console.error('Failed to update task:', error);
      toast.error('Failed to update task');
    } finally {
      setSavingTaskId(null);
    }
  };

  const handleTaskSelect = (taskId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedTaskIds([...selectedTaskIds, taskId]);
    } else {
      setSelectedTaskIds(selectedTaskIds.filter((id) => id !== taskId));
    }
  };

  const bulkCompleteSelected = async () => {
    try {
      // Optimistic UI update
      setTasks(tasks.map((task) => (selectedTaskIds.includes(task.id) ? { ...task, completed: true } : task)));

      // Call API for each task
      const promises = selectedTaskIds.map((taskId) => {
        const [updateId] = taskId.split('-');
        return fetch(`/api/tasks/${updateId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            taskId: taskId,
            completed: true,
          }),
        });
      });

      await Promise.all(promises);
      toast.success(`Completed ${selectedTaskIds.length} tasks`);
      setSelectedTaskIds([]);
    } catch (error) {
      console.error('Failed to complete tasks:', error);
      toast.error('Failed to complete tasks');
      fetchTasks(); // Refresh to get correct state
    }
  };

  const bulkDeleteSelected = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedTaskIds.length} tasks?`)) return;

    try {
      // Optimistic UI update
      setTasks(tasks.filter((task) => !selectedTaskIds.includes(task.id)));

      // Call API for each task
      const promises = selectedTaskIds.map((taskId) => {
        const [updateId] = taskId.split('-');
        return fetch(`/api/tasks/${updateId}/task/${taskId}`, {
          method: 'DELETE',
        });
      });

      await Promise.all(promises);
      toast.success(`Deleted ${selectedTaskIds.length} tasks`);
      setSelectedTaskIds([]);
    } catch (error) {
      console.error('Failed to delete tasks:', error);
      toast.error('Failed to delete tasks');
      fetchTasks(); // Refresh to get correct state
    }
  };

  return (
    <>
      <Header title="Today's Task" />
      <div className="flex-1 overflow-y-auto p-4">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-4">
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                const query = e.target.value.toLowerCase();
                setFilteredTasks(tasks.filter((task) => task.title.toLowerCase().includes(query) || task.category.toLowerCase().includes(query)));
              }}
              className="max-w-sm"
            />
          </div>

          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <select
                className="rounded-md border p-2 text-sm"
                onChange={(e) => {
                  if (e.target.value === 'all') setFilteredTasks(tasks);
                  else setFilteredTasks(tasks.filter((t) => (e.target.value === 'completed' ? t.completed : !t.completed)));
                }}
              >
                <option value="all">All Tasks</option>
                <option value="completed">Completed</option>
                <option value="incomplete">Incomplete</option>
              </select>

              <select
                className="rounded-md border p-2 text-sm"
                onChange={(e) => {
                  const value = e.target.value;
                  setFilteredTasks(
                    [...tasks].sort((a, b) => {
                      if (value === 'priority') return priorityOrder[a.priority] - priorityOrder[b.priority];
                      if (value === 'date') return new Date(a.date).getTime() - new Date(b.date).getTime();
                      return 0;
                    })
                  );
                }}
              >
                <option value="default">Sort By</option>
                <option value="priority">Priority</option>
                <option value="date">Date</option>
              </select>
            </div>
            <Button size="sm" className="gap-1" onClick={() => setIsAddTaskOpen(true)}>
              <Plus className="h-4 w-4" />
              <span>Add Task</span>
            </Button>
          </div>

          <div className="flex items-center justify-center gap-3 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const yesterday = new Date(selectedDate);
                yesterday.setDate(yesterday.getDate() - 1);
                setSelectedDate(yesterday.toISOString().split('T')[0]);
              }}
            >
              Yesterday
            </Button>

            <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-40" />

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const tomorrow = new Date(selectedDate);
                tomorrow.setDate(tomorrow.getDate() + 1);
                setSelectedDate(tomorrow.toISOString().split('T')[0]);
              }}
            >
              Tomorrow
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading tasks...</div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">{searchQuery ? 'No tasks match your search.' : 'No tasks for today. Add some tasks to get started.'}</div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((task) => (
                <div key={task.id} className={`task-card relative rounded-lg border p-3 ${isTaskOverdue(task) ? 'border-destructive/30' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className="flex items-center gap-2">
                      <Checkbox id={`select-${task.id}`} checked={selectedTaskIds.includes(task.id)} onCheckedChange={(checked) => handleTaskSelect(task.id, !!checked)} className="mt-1" />
                      <Checkbox id={`task-${task.id}`} checked={task.completed} onCheckedChange={(checked) => toggleTaskStatus(task.id, !!checked)} disabled={savingTaskId === task.id} />
                    </div>

                    <div className="flex-1">
                      <div className="flex flex-col gap-2">
                        {editingTaskId === task.id ? (
                          <div className="flex flex-1 items-center gap-2">
                            <Input
                              value={editTaskText}
                              onChange={(e) => setEditTaskText(e.target.value)}
                              className="h-8"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveTaskEdit(task.id);
                                if (e.key === 'Escape') setEditingTaskId(null);
                              }}
                            />
                            <Button size="sm" onClick={() => saveTaskEdit(task.id)} disabled={!editTaskText.trim()}>
                              Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingTaskId(null)}>
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-start justify-between">
                              <label htmlFor={`task-${task.id}`} className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                                {task.title}
                                {savingTaskId === task.id && <span className="ml-2 text-xs text-muted-foreground animate-pulse">Saving...</span>}
                              </label>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => {
                                    setEditingTaskId(task.id);
                                    setEditTaskText(task.title);
                                  }}
                                  disabled={savingTaskId === task.id}
                                >
                                  <Edit2 className="h-4 w-4" />
                                  <span className="sr-only">Edit</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    deleteTask(task.id);
                                  }}
                                  disabled={savingTaskId === task.id}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Delete</span>
                                </Button>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-1">
                              <div className="flex items-center gap-1">
                                <div className="text-xs text-muted-foreground">Priority:</div>
                                <Button
                                  variant={task.priority === 'low' ? 'default' : 'outline'}
                                  size="sm"
                                  className="h-6 px-2 rounded-l-md rounded-r-none"
                                  onClick={() => updateTaskPriority(task.id, 'low')}
                                >
                                  Low
                                </Button>
                                <Button variant={task.priority === 'medium' ? 'default' : 'outline'} size="sm" className="h-6 px-2 rounded-none" onClick={() => updateTaskPriority(task.id, 'medium')}>
                                  Med
                                </Button>
                                <Button
                                  variant={task.priority === 'high' ? 'default' : 'outline'}
                                  size="sm"
                                  className="h-6 px-2 rounded-l-none rounded-r-md"
                                  onClick={() => updateTaskPriority(task.id, 'high')}
                                >
                                  High
                                </Button>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground text-xs">Due:</span>
                                <Input type="date" className="h-6 w-32 px-1 text-xs" value={task.dueDate || ''} onChange={(e) => updateTaskDueDate(task.id, e.target.value)} />
                                {isTaskOverdue(task) && <span className="text-destructive text-xs">Overdue!</span>}
                              </div>

                              <Badge variant="outline">{task.category}</Badge>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Bulk action bar */}
          {selectedTaskIds.length > 0 && (
            <div className="sticky bottom-4 left-0 right-0 flex justify-center">
              <div className="flex items-center gap-2 bg-background p-2 rounded-md shadow-lg border">
                <span className="text-sm">{selectedTaskIds.length} selected</span>
                <Button size="sm" onClick={bulkCompleteSelected}>
                  Mark Complete
                </Button>
                <Button size="sm" variant="destructive" onClick={bulkDeleteSelected}>
                  Delete
                </Button>
                <Button size="sm" variant="outline" onClick={() => setSelectedTaskIds([])}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Tasks</DialogTitle>
          </DialogHeader>
          <UpdateTemplate onSubmit={handleTaskSubmit} />
        </DialogContent>
      </Dialog>
    </>
  );
}
