'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/dashboard/header';
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Calendar, CheckCircle, PieChart } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Analytics data interface
interface AnalyticsData {
  impactScore: number;
  totalTasks: {
    completed: number;
    total: number;
  };
  completionRate: number;
  contributionData: Array<{ date: string; count: number }>;
  projectDistribution: Array<{ name: string; value: number }>;
  completionTrend: Array<{ date: string; rate: number }>;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalytics(timeRange);
  }, [timeRange]);

  const fetchAnalytics = async (days: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/analytics?days=${days}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        setData(result);
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load analytics',
        variant: 'destructive',
      });

      // For development, use mock data if real data fails
      if (process.env.NODE_ENV === 'development') {
        setMockData();
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Set mock data for development/preview
  const setMockData = () => {
    setData({
      impactScore: 56,
      totalTasks: {
        completed: 142,
        total: 189,
      },
      completionRate: 75,
      contributionData: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        count: Math.floor(Math.random() * 3) + 1,
      })),
      projectDistribution: [
        { name: 'CMS Krimum', value: 8 },
        { name: 'Website Redesign', value: 12 },
        { name: 'Mobile App', value: 6 },
        { name: 'Internal Tools', value: 4 },
      ],
      completionTrend: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        rate: 50 + Math.floor(Math.random() * 50),
      })),
    });
  };

  // Helper function to render the contribution heatmap
  const renderContributionHeatmap = () => {
    if (!data) return null;

    // Group by week and day (7x12 grid)
    const weeks = 12;
    const days = 7;
    const grid = Array(weeks)
      .fill(0)
      .map(() => Array(days).fill(0));

    // Fill in the data
    data.contributionData.slice(-84).forEach((item, index) => {
      const weekIndex = Math.floor(index / 7) % 12;
      const dayIndex = index % 7;
      if (weekIndex < weeks && dayIndex < days) {
        grid[weekIndex][dayIndex] = item.count;
      }
    });

    return (
      <div className="grid grid-cols-12 gap-1">
        {grid.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-rows-7 gap-1">
            {week.map((count, dayIndex) => {
              // Calculate opacity based on count (0 to 1)
              const opacity = count > 0 ? Math.min(0.2 + count * 0.25, 1) : 0;
              return (
                <div
                  key={dayIndex}
                  className={`h-3 w-3 rounded-sm ${count > 0 ? `bg-primary opacity-${Math.round(opacity * 100)}` : 'bg-muted'}`}
                  style={{ opacity: count > 0 ? opacity : undefined }}
                  title={`${count} contributions`}
                ></div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  // Helper function to render the impact score gauge
  const renderImpactScore = () => {
    if (!data) return null;

    const score = data.impactScore;
    const circumference = 2 * Math.PI * 40; // Circle circumference (2πr)
    const dashOffset = circumference * (1 - score / 100);

    return (
      <div className="flex items-center justify-between">
        <div>
          <p className="text-3xl font-bold">{score}%</p>
          <p className="text-xs text-muted-foreground">Impact Score</p>
          <p className="mt-2 text-sm">
            {data.totalTasks.completed} of {data.totalTasks.total} tasks completed
          </p>
        </div>
        <div className="h-28 w-28 relative">
          <svg className="h-full w-full" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 50 50)"
              strokeLinecap="round"
            />
            <text x="50" y="55" textAnchor="middle" fontSize="18" fill="currentColor">
              {score}%
            </text>
          </svg>
        </div>
      </div>
    );
  };

  // Helper function to render the project distribution chart
  const renderProjectDistribution = () => {
    if (!data || !data.projectDistribution.length) {
      return <p className="text-center py-6 text-muted-foreground">No project data available</p>;
    }

    const total = data.projectDistribution.reduce((sum, item) => sum + item.value, 0);

    return (
      <div className="space-y-2 mt-2">
        {data.projectDistribution.map((project, index) => {
          const percentage = Math.round((project.value / total) * 100);
          return (
            <div key={index} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>{project.name}</span>
                <span>{percentage}%</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${percentage}%` }}></div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <Header title="Analytics">
        <div className="ml-auto">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="180">Last 6 months</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Header>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-6">
            <p className="text-sm text-muted-foreground">Summary of your work over time, including completed tasks and contributions</p>
          </div>

          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading analytics data...</span>
            </div>
          ) : (
            <>
              <div className="mb-8 grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-lg">Impact Score</CardTitle>
                    <Badge variant="outline" className="flex gap-1">
                      <CheckCircle className="h-4 w-4" />
                      {data?.completionRate || 0}% Completion
                    </Badge>
                  </CardHeader>
                  <CardContent>{renderImpactScore()}</CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Project Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>{renderProjectDistribution()}</CardContent>
                </Card>
              </div>

              <Card className="mb-8">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Calendar className="h-5 w-5" />
                    Contribution History
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {data ? `${data.contributionData.reduce((sum, day) => sum + day.count, 0)} contributions in the selected period` : 'No data available'}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="h-[120px] w-full">{renderContributionHeatmap()}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <PieChart className="h-5 w-5" />
                    Completion Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px] w-full">
                    {data && data.completionTrend.length > 0 ? (
                      <div className="flex h-full items-end gap-1">
                        {data.completionTrend.slice(-30).map((day, index) => (
                          <div
                            key={index}
                            className="flex-1 bg-primary rounded-t"
                            style={{
                              height: `${day.rate}%`,
                              opacity: 0.3 + day.rate / 200, // Higher rates are more opaque
                            }}
                            title={`${day.date}: ${day.rate}%`}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-center py-12 text-muted-foreground">No completion data available</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </>
  );
}
