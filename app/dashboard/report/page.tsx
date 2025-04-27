'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Header } from '@/components/dashboard/header';
import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  project: string;
  date: string;
  user: {
    name: string;
    avatar: string;
    initials: string;
  };
}

interface TeamMember {
  name: string;
  avatar: string;
  initials: string;
  completed: number;
  total: number;
}

export default function ReportPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [completionRate, setCompletionRate] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch report data on component mount
  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      setIsLoading(true);

      const response = await fetch('/api/reports/daily', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch report data: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setTasks(data.tasks || []);
        setTeamMembers(data.teamMembers || []);
        setCompletionRate(data.completionRate || 0);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load report data',
        variant: 'destructive',
      });

      // If in development and no data, use mock data
      if (process.env.NODE_ENV === 'development' && tasks.length === 0) {
        setMockData();
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Updates task completion status
  const handleTaskToggle = async (taskId: string, completed: boolean) => {
    // Implementation would go here - requires task update API endpoint
    // This would update the task status in the database
    console.log(`Toggle task ${taskId} to ${completed}`);
  };

  // Set mock data for development
  const setMockData = () => {
    // Your existing mock data remains as fallback
    const mockTasks = [
      {
        id: '1',
        title: 'Setup CMS using Laravel 11, Inertia',
        completed: true,
        project: 'CMS Krimum',
        date: 'Today',
        user: {
          name: 'Gian',
          avatar: '',
          initials: 'GN',
        },
      },
      // Add other mock tasks here...
    ];
    setTasks(mockTasks);
    setTeamMembers([
      { name: 'Gian', avatar: '', initials: 'GN', completed: 3, total: 4 },
      { name: 'Alex', avatar: '', initials: 'AX', completed: 2, total: 3 },
      { name: 'Sarah', avatar: '', initials: 'SH', completed: 4, total: 5 },
    ]);
    setCompletionRate(75);
  };

  return (
    <>
      <Header title="Today's Report" />
      <div className="flex-1 overflow-y-auto p-4">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-6">
            <p className="text-sm text-muted-foreground">Summary of tasks completed today across all team members</p>
          </div>

          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading report data...</span>
            </div>
          ) : tasks.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p>No tasks reported today</p>
                <p className="text-sm text-muted-foreground mt-1">Tasks will appear here once team members log their updates</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Team Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {tasks.map((task) => (
                      <div key={task.id} className="task-card flex items-center gap-3">
                        <Checkbox id={`task-${task.id}`} checked={task.completed} onCheckedChange={(checked) => handleTaskToggle(task.id, !!checked)} />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <label htmlFor={`task-${task.id}`} className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                              {task.title}
                            </label>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{task.project}</Badge>
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={task.user.avatar || '/placeholder.svg'} alt={task.user.name} />
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
                        <p className="text-3xl font-bold">{completionRate}%</p>
                        <p className="text-xs text-muted-foreground">Tasks completed today</p>
                      </div>
                      <div className="h-24 w-24 rounded-full border-8 border-primary/30">
                        <div className="relative h-full w-full">
                          <div className="absolute inset-0 rounded-full border-8 border-primary" style={{ clipPath: `polygon(0 0, 100% 0, 100% ${completionRate}%, 0 ${completionRate}%)` }}></div>
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
                      {teamMembers.map((member) => (
                        <div key={member.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={member.avatar || '/placeholder.svg'} alt={member.name} />
                              <AvatarFallback>{member.initials}</AvatarFallback>
                            </Avatar>
                            <span>{member.name}</span>
                          </div>
                          <Badge variant="outline" className="bg-primary/10 text-primary">
                            {member.completed}/{member.total}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
