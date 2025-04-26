'use client';

import { Header } from '@/components/dashboard/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

// Types for report configuration
interface ReportConfig {
  impactLevel: number;
  priorityThreshold: 'all' | 'high' | 'medium' | 'low';
  recipients: string[];
  scheduleDays: string[];
  scheduleTime: string;
  endType: 'never' | 'on-date' | 'after';
  endDate: string | null;
  endCount: number | null;
  sendCopyToSelf: boolean;
}

// Types for report data
interface TaskPreview {
  id: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  date: string;
}

export default function ShareImpactPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [previewTasks, setPreviewTasks] = useState<TaskPreview[]>([]);
  const [completedTaskCount, setCompletedTaskCount] = useState(0);

  // Form state
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    impactLevel: 5,
    priorityThreshold: 'all', // Default to 'all' instead of 'high'
    recipients: [],
    scheduleDays: ['Monday'],
    scheduleTime: '09:00',
    endType: 'on-date',
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
    endCount: 4, // Default to 4 reports
    sendCopyToSelf: true,
  });

  // Separate state for the recipients input field for easier handling
  const [recipientsInput, setRecipientsInput] = useState('');

  // Effect to fetch preview tasks
  useEffect(() => {
    fetchPreviewTasks();
  }, [reportConfig.priorityThreshold, reportConfig.impactLevel]);

  // Fetch tasks for preview based on current settings
  const fetchPreviewTasks = async () => {
    try {
      setIsLoading(true);

      // Get current date in ISO format
      const today = new Date().toISOString().split('T')[0];
      // Get date from 7 days ago to simulate a week
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoStr = weekAgo.toISOString().split('T')[0];

      // Construct the URL with or without priority parameter
      let url = `/api/tasks?startDate=${weekAgoStr}&endDate=${today}`;
      if (reportConfig.priorityThreshold !== 'all') {
        url += `&priority=${reportConfig.priorityThreshold}`;
      }

      console.log('Fetching tasks from:', url);

      // Fetch tasks from API
      const response = await fetch(url);

      if (!response.ok) {
        // Get error details from response
        let errorMessage = 'Failed to fetch tasks';
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          console.error('Error parsing error response:', e);
        }

        throw new Error(`${errorMessage} (Status: ${response.status})`);
      }

      const data = await response.json();
      console.log(`Fetched ${data.tasks?.length || 0} tasks`);

      // Filter to completed tasks only
      const completedTasks = (data.tasks || []).filter((task: any) => task.completed);

      // Limit to impact level amount
      const limitedTasks = completedTasks.slice(0, reportConfig.impactLevel);

      setPreviewTasks(limitedTasks);
      setCompletedTaskCount(completedTasks.length);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load task preview',
        variant: 'destructive',
      });

      // Set empty arrays to prevent errors in the UI
      setPreviewTasks([]);
      setCompletedTaskCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (field: keyof ReportConfig, value: any) => {
    setReportConfig((prev) => ({ ...prev, [field]: value }));
  };

  // Parse recipients from comma-separated list
  const parseRecipients = () => {
    const emails = recipientsInput
      .split(',')
      .map((email) => email.trim())
      .filter((email) => email !== '');

    handleInputChange('recipients', emails);
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (reportConfig.recipients.length === 0) {
      toast({
        title: 'Missing recipients',
        description: 'Please add at least one recipient email',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);

      // Format data for the API
      const payload = {
        ...reportConfig,
        userEmail: session?.user?.email,
        userName: session?.user?.name,
      };

      // Send to API
      const response = await fetch('/api/reports/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to schedule report');
      }

      // Force toast to show
      toast({
        title: 'Report scheduled successfully',
        description: 'Your impact report has been scheduled to send',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error scheduling report:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to schedule report',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle sending a test email
  const handleSendTest = async () => {
    if (!testEmail) {
      toast({
        title: 'Missing email',
        description: 'Please enter a test recipient email',
        variant: 'destructive',
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(testEmail)) {
      toast({
        title: 'Invalid email',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSendingTest(true);

      // Format data for the API
      const payload = {
        ...reportConfig,
        recipients: [testEmail],
        isTest: true,
        userEmail: session?.user?.email,
        userName: session?.user?.name,
      };

      // Send to API
      const response = await fetch('/api/reports/send-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      // Get the response data
      const data = await response.json();

      if (!response.ok) {
        // Create a descriptive error message
        const errorMessage = data.details || data.error || 'Failed to send test email';
        throw new Error(errorMessage);
      }

      // Force toast to display
      toast({
        title: 'Test email sent',
        description: `A test report has been sent to ${testEmail}`,
        duration: 5000, // Show for 5 seconds to ensure visibility
      });
    } catch (error) {
      console.error('Error sending test email:', error);

      // Show a detailed error message
      toast({
        title: 'Email sending failed',
        description: error instanceof Error ? error.message : 'Could not send test email',
        variant: 'destructive',
        duration: 5000, // Show error for longer
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  // Get task priority color
  const getPriorityColor = (priority: string) => {
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
    <>
      <Header title="Share My Impact" />
      <div className="flex-1 overflow-y-auto p-4">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-6">
            <p className="text-sm text-muted-foreground">You need to share your impact to make an impact.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Set your criteria & frequency</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="impact-id">Share my Impact</Label>
                      <div className="mt-1 flex items-center gap-2">
                        <Input
                          id="impact-id"
                          type="number"
                          min="1"
                          max="20"
                          value={reportConfig.impactLevel}
                          onChange={(e) => handleInputChange('impactLevel', parseInt(e.target.value) || 5)}
                          className="w-16"
                        />
                        <span className="text-sm text-muted-foreground">What level to share (min 5 recommended)</span>
                      </div>
                    </div>

                    <div>
                      <Label>What priority tasks to include</Label>
                      <RadioGroup
                        value={reportConfig.priorityThreshold}
                        onValueChange={(value: 'all' | 'high' | 'medium' | 'low') => handleInputChange('priorityThreshold', value)}
                        className="mt-2 flex flex-wrap gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="all" id="all" />
                          <Label htmlFor="all">All priorities</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="high" id="high" />
                          <Label htmlFor="high">High</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="medium" id="medium" />
                          <Label htmlFor="medium">Medium</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="low" id="low" />
                          <Label htmlFor="low">Low</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div>
                      <Label htmlFor="share-with">Share with:</Label>
                      <Input
                        id="share-with"
                        placeholder="Enter email addresses separated by commas"
                        value={recipientsInput}
                        onChange={(e) => setRecipientsInput(e.target.value)}
                        onBlur={parseRecipients}
                        className="mt-1"
                      />
                      {reportConfig.recipients.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm text-muted-foreground">Recipients: {reportConfig.recipients.length}</p>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label>Report every</Label>
                      <div className="mt-1 grid grid-cols-2 gap-2">
                        <Select value={reportConfig.scheduleDays[0]} onValueChange={(value) => handleInputChange('scheduleDays', [value])}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select day" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Monday">Monday</SelectItem>
                            <SelectItem value="Tuesday">Tuesday</SelectItem>
                            <SelectItem value="Wednesday">Wednesday</SelectItem>
                            <SelectItem value="Thursday">Thursday</SelectItem>
                            <SelectItem value="Friday">Friday</SelectItem>
                          </SelectContent>
                        </Select>

                        <Input type="time" value={reportConfig.scheduleTime} onChange={(e) => handleInputChange('scheduleTime', e.target.value)} />
                      </div>
                    </div>

                    <div>
                      <Label>Ends</Label>
                      <RadioGroup value={reportConfig.endType} onValueChange={(value: 'never' | 'on-date' | 'after') => handleInputChange('endType', value)} className="mt-2 space-y-2">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="never" id="never" />
                          <Label htmlFor="never">Never</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="on-date" id="on-date" />
                          <Label htmlFor="on-date">On date</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="after" id="after" />
                          <Label htmlFor="after">After</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {reportConfig.endType === 'on-date' && (
                      <div>
                        <Label htmlFor="end-date">End on date</Label>
                        <Input id="end-date" type="date" className="mt-1" value={reportConfig.endDate || ''} onChange={(e) => handleInputChange('endDate', e.target.value)} />
                      </div>
                    )}

                    {reportConfig.endType === 'after' && (
                      <div>
                        <Label htmlFor="end-count">After how many reports</Label>
                        <Input
                          id="end-count"
                          type="number"
                          min="1"
                          className="mt-1"
                          value={reportConfig.endCount || 1}
                          onChange={(e) => handleInputChange('endCount', parseInt(e.target.value) || 1)}
                        />
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="send-copy"
                        checked={reportConfig.sendCopyToSelf}
                        onChange={(e) => handleInputChange('sendCopyToSelf', e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <Label htmlFor="send-copy">Send a copy to me at {session?.user?.email}</Label>
                    </div>

                    <Button className="w-full" onClick={handleSubmit} disabled={isLoading || reportConfig.recipients.length === 0}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Setting up report...
                        </>
                      ) : (
                        'Schedule Report'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Preview Report</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="rounded-lg border p-4">
                      <div className="mb-4 flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-primary/20"></div>
                        <span className="font-medium">MorfoTasks</span>
                      </div>

                      {isLoading ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : (
                        <>
                          <p className="mb-2 font-medium">
                            {session?.user?.name || 'You'} completed {completedTaskCount} {reportConfig.priorityThreshold} impact tasks this week
                          </p>

                          <div className="space-y-2">
                            {previewTasks.length > 0 ? (
                              previewTasks.map((task) => (
                                <div key={task.id} className="flex items-center gap-2">
                                  <div className={`h-4 w-4 rounded-sm ${getPriorityColor(task.priority)}`}></div>
                                  <span className="text-sm">{task.title}</span>
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-muted-foreground">No completed tasks to display</p>
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="email-address">Email Address</Label>
                      <Input id="email-address" type="email" className="mt-1" placeholder="recipient@email.com" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} />
                    </div>

                    <Button className="w-full" onClick={handleSendTest} disabled={isSendingTest || !testEmail || isLoading}>
                      {isSendingTest ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...
                        </>
                      ) : (
                        'Send Test'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
