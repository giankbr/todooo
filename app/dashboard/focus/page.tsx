'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { ArrowLeft, Clock, Coffee, Pause, Play, RotateCcw, Settings, Timer as TimerIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// Interface for task type
interface FocusTask {
  id: string;
  title: string;
  estimatedTime: number; // in minutes
  completed: boolean;
  priority?: 'low' | 'medium' | 'high';
  date?: string;
  category?: string;
}

// Pomodoro settings interface
interface PomodoroSettings {
  workDuration: number; // in minutes
  shortBreakDuration: number; // in minutes
  longBreakDuration: number; // in minutes
  sessionsBeforeLongBreak: number;
}

// Timer mode types
type TimerMode = 'work' | 'shortBreak' | 'longBreak';

export default function FocusModePage() {
  const router = useRouter();

  // Pomodoro settings
  const [settings, setSettings] = useState<PomodoroSettings>({
    workDuration: 25, // Default 25 minutes
    shortBreakDuration: 5, // Default 5 minutes
    longBreakDuration: 15, // Default 15 minutes
    sessionsBeforeLongBreak: 4, // Default 4 sessions
  });

  // Timer state
  const [timerMode, setTimerMode] = useState<TimerMode>('work');
  const [timeRemaining, setTimeRemaining] = useState(settings.workDuration * 60);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);

  // Task states
  const [currentTask, setCurrentTask] = useState<FocusTask | null>(null);
  const [availableTasks, setAvailableTasks] = useState<FocusTask[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);

  // Dialog states
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showTaskDialog, setShowTaskDialog] = useState(false);

  // Load tasks from database on component mount
  useEffect(() => {
    fetchTasks();
  }, []);

  // Load saved pomodoro settings and timer state from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('pomodoroSettings');
    const savedTimerMode = localStorage.getItem('timerMode');
    const savedTimeRemaining = localStorage.getItem('timeRemaining');
    const savedIsActive = localStorage.getItem('isActive');
    const savedIsPaused = localStorage.getItem('isPaused');
    const savedCompletedSessions = localStorage.getItem('completedSessions');
    const savedTaskId = localStorage.getItem('currentTaskId');

    if (savedSettings) setSettings(JSON.parse(savedSettings));
    if (savedTimerMode) setTimerMode(savedTimerMode as TimerMode);
    if (savedTimeRemaining) setTimeRemaining(parseInt(savedTimeRemaining));
    if (savedIsActive) setIsActive(savedIsActive === 'true');
    if (savedIsPaused) setIsPaused(savedIsPaused === 'true');
    if (savedCompletedSessions) setCompletedSessions(parseInt(savedCompletedSessions));

    // If there was a saved task ID, wait until tasks are loaded and then set it
    if (savedTaskId) {
      const checkTaskLoaded = setInterval(() => {
        if (availableTasks.length > 0) {
          const task = availableTasks.find((t) => t.id === savedTaskId);
          if (task) {
            setCurrentTask(task);
            clearInterval(checkTaskLoaded);
          }
        }
      }, 100);

      // Clear the interval after 5 seconds to prevent it running forever
      setTimeout(() => clearInterval(checkTaskLoaded), 5000);
    }
  }, [availableTasks.length]);

  // Save state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('pomodoroSettings', JSON.stringify(settings));
    localStorage.setItem('timerMode', timerMode);
    localStorage.setItem('timeRemaining', timeRemaining.toString());
    localStorage.setItem('isActive', isActive.toString());
    localStorage.setItem('isPaused', isPaused.toString());
    localStorage.setItem('completedSessions', completedSessions.toString());
    if (currentTask) localStorage.setItem('currentTaskId', currentTask.id);
  }, [settings, timerMode, timeRemaining, isActive, isPaused, completedSessions, currentTask]);

  // Effect to handle timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && !isPaused) {
      interval = setInterval(() => {
        setTimeRemaining((prevTime) => {
          if (prevTime <= 1) {
            // Time's up
            clearInterval(interval!);
            handleTimerComplete();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else if (interval) {
      clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, isPaused]);

  // Fetch tasks from the database
  const fetchTasks = async () => {
    try {
      setIsLoadingTasks(true);

      console.log('Fetching tasks with completed=false');

      const response = await fetch('/api/tasks?completed=false', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      console.log('Task API response status:', response.status);

      if (!response.ok) {
        throw new Error(`Failed to fetch tasks: ${response.status}`);
      }

      const data = await response.json();
      console.log(`Received ${data.tasks?.length || 0} tasks from API`);

      if (!data.tasks || data.tasks.length === 0) {
        console.log('No tasks returned from API');

        // Add mock tasks for testing if in development
        if (process.env.NODE_ENV === 'development') {
          const mockTasks: FocusTask[] = [
            {
              id: 'mock-1',
              title: 'Mock task 1 (High priority)',
              estimatedTime: 60,
              completed: false,
              priority: 'high',
              category: 'Development',
            },
            {
              id: 'mock-2',
              title: 'Mock task 2 (Medium priority)',
              estimatedTime: 45,
              completed: false,
              priority: 'medium',
              category: 'Design',
            },
            {
              id: 'mock-3',
              title: 'Mock task 3 (Low priority)',
              estimatedTime: 30,
              completed: false,
              priority: 'low',
              category: 'Planning',
            },
          ];

          setAvailableTasks(mockTasks);
          if (!currentTask) {
            setCurrentTask(mockTasks[0]);
          }
          console.log('Using mock tasks for development');
          return;
        }
      }

      // Format tasks if needed to match expected structure
      const formattedTasks: FocusTask[] = data.tasks.map((task: any) => ({
        id: task.id,
        title: task.title,
        estimatedTime: task.estimatedTime || 30,
        completed: task.completed,
        priority: task.priority,
        date: task.date,
        category: task.category,
      }));

      console.log('Tasks after formatting:', formattedTasks.slice(0, 2));

      setAvailableTasks(formattedTasks);

      // Set the first task as current if none selected
      if (!currentTask && formattedTasks.length > 0) {
        setCurrentTask(formattedTasks[0]);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast({
        title: 'Error',
        description: 'Failed to load tasks',
        variant: 'destructive',
      });

      // Use mock tasks in development mode
      if (process.env.NODE_ENV === 'development') {
        const mockTasks: FocusTask[] = [
          {
            id: 'mock-1',
            title: 'Mock task 1 (High priority)',
            estimatedTime: 60,
            completed: false,
            priority: 'high',
            category: 'Development',
          },
          {
            id: 'mock-2',
            title: 'Mock task 2 (Medium priority)',
            estimatedTime: 45,
            completed: false,
            priority: 'medium',
            category: 'Design',
          },
          {
            id: 'mock-3',
            title: 'Mock task 3 (Low priority)',
            estimatedTime: 30,
            completed: false,
            priority: 'low',
            category: 'Planning',
          },
        ];

        setAvailableTasks(mockTasks);
        if (!currentTask) {
          setCurrentTask(mockTasks[0]);
        }
        console.log('Using mock tasks due to error');
      }
    } finally {
      setIsLoadingTasks(false);
    }
  };

  // Update settings handler
  const updateSettings = (newSettings: Partial<PomodoroSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  // Apply settings and start a new timer session
  const applySettings = () => {
    resetTimer();
    setShowSettingsDialog(false);
  };

  // Reset the timer based on the current mode
  const resetTimer = () => {
    setIsActive(false);
    setIsPaused(false);

    if (timerMode === 'work') {
      setTimeRemaining(settings.workDuration * 60);
    } else if (timerMode === 'shortBreak') {
      setTimeRemaining(settings.shortBreakDuration * 60);
    } else {
      setTimeRemaining(settings.longBreakDuration * 60);
    }
  };

  // Handle start button click
  const handleStart = () => {
    setIsActive(true);
    setIsPaused(false);
    toast({
      title: `${timerMode === 'work' ? 'Focus' : 'Break'} session started`,
      description: timerMode === 'work' ? 'Your timer is now running. Stay focused!' : 'Take a well-deserved break!',
      duration: 3000,
    });
  };

  // Handle pause button click
  const handlePause = () => {
    setIsPaused(true);
    toast({
      title: 'Session paused',
      description: 'Resume when you are ready.',
      duration: 3000,
    });
  };

  // Handle reset button click
  const handleReset = () => {
    resetTimer();
    toast({
      title: 'Timer reset',
      description: 'Your timer has been reset.',
      duration: 3000,
    });
  };

  // Handle timer completion
  const handleTimerComplete = () => {
    setIsActive(false);

    // Play notification sound
    const audio = new Audio('/notification-sound.mp3');
    audio.play().catch((err) => console.error('Error playing sound:', err));

    if (timerMode === 'work') {
      // Completed a work session
      const newCompletedSessions = completedSessions + 1;
      setCompletedSessions(newCompletedSessions);

      // Check if it's time for a long break
      if (newCompletedSessions % settings.sessionsBeforeLongBreak === 0) {
        setTimerMode('longBreak');
        setTimeRemaining(settings.longBreakDuration * 60);
        toast({
          title: 'Time for a long break!',
          description: `You've completed ${settings.sessionsBeforeLongBreak} work sessions. Take a longer break.`,
          duration: 5000,
        });
      } else {
        setTimerMode('shortBreak');
        setTimeRemaining(settings.shortBreakDuration * 60);
        toast({
          title: 'Time for a short break!',
          description: 'Work session completed. Take a quick breather.',
          duration: 5000,
        });
      }
    } else {
      // Completed a break
      setTimerMode('work');
      setTimeRemaining(settings.workDuration * 60);
      toast({
        title: 'Break finished',
        description: 'Time to get back to work!',
        duration: 5000,
      });
    }
  };

  // Handle task selection
  const selectTask = async (task: FocusTask) => {
    setCurrentTask(task);
    setShowTaskDialog(false);

    toast({
      title: 'Task selected',
      description: `Now focusing on: ${task.title}`,
      duration: 3000,
    });
  };

  // Handle task completion toggle
  const handleTaskToggle = async (checked: boolean) => {
    if (!currentTask) return;

    try {
      // Update task in the database
      const response = await fetch(`/api/tasks/${currentTask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: checked }),
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }

      // Update local state
      setCurrentTask({ ...currentTask, completed: checked });

      if (checked) {
        // If task is marked complete, also stop the timer
        setIsActive(false);
        toast({
          title: 'Task completed',
          description: 'Congratulations on completing your task!',
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: 'Error',
        description: 'Failed to update task status',
        variant: 'destructive',
      });
    }
  };

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Get progress percentage for progress bar
  const getProgressPercentage = () => {
    let totalTime: number;

    switch (timerMode) {
      case 'work':
        totalTime = settings.workDuration * 60;
        break;
      case 'shortBreak':
        totalTime = settings.shortBreakDuration * 60;
        break;
      case 'longBreak':
        totalTime = settings.longBreakDuration * 60;
        break;
    }

    return ((totalTime - timeRemaining) / totalTime) * 100;
  };

  // Get color for the progress bar based on timer mode
  const getProgressColor = () => {
    switch (timerMode) {
      case 'work':
        return 'bg-red-500';
      case 'shortBreak':
        return 'bg-green-500';
      case 'longBreak':
        return 'bg-blue-500';
    }
  };

  // Get priority badge color
  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

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
          <Button variant="outline" size="sm" className="gap-1" onClick={() => setShowSettingsDialog(true)}>
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </Button>
          <Button variant="outline" size="sm" className="gap-1" onClick={handleReset} disabled={!isActive && timeRemaining === settings.workDuration * 60 && timerMode === 'work'}>
            <RotateCcw className="h-4 w-4" />
            <span className="hidden sm:inline">Reset</span>
          </Button>
        </div>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center p-4">
        <div className="mb-6">
          <Tabs
            value={timerMode}
            onValueChange={(value) => {
              if (!isActive) {
                setTimerMode(value as TimerMode);
                if (value === 'work') {
                  setTimeRemaining(settings.workDuration * 60);
                } else if (value === 'shortBreak') {
                  setTimeRemaining(settings.shortBreakDuration * 60);
                } else {
                  setTimeRemaining(settings.longBreakDuration * 60);
                }
              }
            }}
            className="w-[300px]"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="work" disabled={isActive}>
                <TimerIcon className="mr-2 h-4 w-4" />
                Work
              </TabsTrigger>
              <TabsTrigger value="shortBreak" disabled={isActive}>
                <Coffee className="mr-2 h-4 w-4" />
                Short Break
              </TabsTrigger>
              <TabsTrigger value="longBreak" disabled={isActive}>
                <Coffee className="mr-2 h-4 w-4" />
                Long Break
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="mb-8 text-center">
          <div className="text-7xl font-bold tabular-nums">{formatTime(timeRemaining)}</div>
          <p className="mt-2 text-sm text-muted-foreground">
            {isActive && !isPaused ? (timerMode === 'work' ? 'Focus Time Running' : 'Break Time Running') : isPaused ? 'Timer Paused' : 'Time Remaining'}
          </p>
          <p className="text-xs text-muted-foreground">{timerMode === 'work' && `Session ${completedSessions + 1} of ${settings.sessionsBeforeLongBreak}`}</p>
        </div>

        <div className="mb-8 flex gap-4">
          {!isActive || isPaused ? (
            <Button size="lg" className="h-12 w-12 rounded-full p-0" onClick={handleStart} disabled={timeRemaining === 0 || (currentTask?.completed && timerMode === 'work')}>
              <Play className="h-6 w-6" />
              <span className="sr-only">Start</span>
            </Button>
          ) : (
            <Button size="lg" variant="outline" className="h-12 w-12 rounded-full p-0" onClick={handlePause}>
              <Pause className="h-6 w-6" />
              <span className="sr-only">Pause</span>
            </Button>
          )}
        </div>

        {timerMode === 'work' && (
          <div className="w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Current Task</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowTaskDialog(true)}>
                Choose Different Task
              </Button>
            </div>

            {currentTask ? (
              <Card>
                <CardContent className="p-4">
                  <div className="task-item flex items-center gap-3">
                    <Checkbox id="focus-task" checked={currentTask.completed} onCheckedChange={handleTaskToggle} disabled={isActive} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <label htmlFor="focus-task" className={`font-medium ${currentTask.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {currentTask.title}
                        </label>
                        {currentTask.priority && <div className={`h-2 w-2 rounded-full ${getPriorityColor(currentTask.priority)}`} />}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>Estimated: {currentTask.estimatedTime} minutes</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : isLoadingTasks ? (
              <div className="flex justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">No task selected</p>
                  <Button className="mt-4" onClick={() => setShowTaskDialog(true)}>
                    Select a task
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Progress bar */}
        <div className="mt-4 w-full max-w-md">
          <div className="h-2 w-full rounded-full bg-muted">
            <div className={`h-full rounded-full transition-all duration-300 ease-in-out ${getProgressColor()}`} style={{ width: `${getProgressPercentage()}%` }}></div>
          </div>
        </div>
      </div>

      {/* Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pomodoro Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="work-duration">Work Duration (minutes)</Label>
              <Input id="work-duration" type="number" min="1" max="60" value={settings.workDuration} onChange={(e) => updateSettings({ workDuration: parseInt(e.target.value) || 25 })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="short-break">Short Break (minutes)</Label>
              <Input id="short-break" type="number" min="1" max="30" value={settings.shortBreakDuration} onChange={(e) => updateSettings({ shortBreakDuration: parseInt(e.target.value) || 5 })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="long-break">Long Break (minutes)</Label>
              <Input id="long-break" type="number" min="1" max="60" value={settings.longBreakDuration} onChange={(e) => updateSettings({ longBreakDuration: parseInt(e.target.value) || 15 })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sessions">Sessions Before Long Break</Label>
              <Input
                id="sessions"
                type="number"
                min="1"
                max="10"
                value={settings.sessionsBeforeLongBreak}
                onChange={(e) => updateSettings({ sessionsBeforeLongBreak: parseInt(e.target.value) || 4 })}
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={applySettings}>Save Settings</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Task Selection Dialog */}
      <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select a Task</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {isLoadingTasks ? (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              </div>
            ) : availableTasks.length > 0 ? (
              <div className="space-y-2">
                {availableTasks.map((task) => (
                  <Card key={task.id} className={`cursor-pointer transition-colors hover:bg-accent ${currentTask?.id === task.id ? 'border-primary' : ''}`} onClick={() => selectTask(task)}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`mt-1 h-3 w-3 rounded-full ${getPriorityColor(task.priority)}`} />
                        <div className="flex-1">
                          <div className="font-medium">{task.title}</div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {task.category && <span>{task.category}</span>}
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{task.estimatedTime} min</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No tasks found</p>
                <Button className="mt-4" onClick={() => router.push('/dashboard/tasks/new')}>
                  Create a task
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
