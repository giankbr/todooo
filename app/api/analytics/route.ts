import { db } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    // Authenticate the user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    // Default to 30 days if not specified
    const days = parseInt(url.searchParams.get('days') || '30');

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch updates for the period
    const updates = await db.update.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        user: {
          email: session.user.email,
        },
      },
      include: {
        project: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Process update data
    const dateLabels = [];
    const contributionData = {};
    const projectDistribution = {};
    const taskCompletionByDay = {};
    const totalTasks = {
      completed: 0,
      total: 0,
    };

    // Prepare date labels for the full period
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      dateLabels.push(dateStr);
      contributionData[dateStr] = 0;
      taskCompletionByDay[dateStr] = { completed: 0, total: 0 };
    }

    // Process each update
    for (const update of updates) {
      const dateStr = update.createdAt.toISOString().split('T')[0];

      // Count update as a contribution
      contributionData[dateStr] = (contributionData[dateStr] || 0) + 1;

      // Track project distribution
      const projectName = update.projectName || update.project?.name || 'No Project';
      projectDistribution[projectName] = (projectDistribution[projectName] || 0) + 1;

      // Process tasks
      try {
        const tasks = JSON.parse(update.tasks || '[]');
        if (Array.isArray(tasks)) {
          tasks.forEach((task) => {
            // Overall task stats
            totalTasks.total++;
            if (task.completed) {
              totalTasks.completed++;
            }

            // Daily task completion
            if (taskCompletionByDay[dateStr]) {
              taskCompletionByDay[dateStr].total++;
              if (task.completed) {
                taskCompletionByDay[dateStr].completed++;
              }
            }
          });
        }
      } catch (error) {
        console.error('Error parsing tasks for update:', update.id);
      }
    }

    // Format data for charts
    const contributionChartData = dateLabels.map((date) => ({
      date,
      count: contributionData[date] || 0,
    }));

    const projectChartData = Object.entries(projectDistribution).map(([name, count]) => ({
      name,
      value: count,
    }));

    const completionTrendData = dateLabels.map((date) => {
      const dayData = taskCompletionByDay[date];
      const completionRate = dayData.total > 0 ? Math.round((dayData.completed / dayData.total) * 100) : 0;

      return {
        date,
        rate: completionRate,
      };
    });

    // Calculate impact score - a weighted metric based on contributions and task completion
    const contributionWeight = 0.4;
    const completionWeight = 0.6;

    // Calculate average daily contributions
    const totalContributions = Object.values(contributionData).reduce((sum: number, count: number) => sum + count, 0);
    const avgDailyContribution = days > 0 ? totalContributions / days : 0;
    const normalizedContributionScore = Math.min(avgDailyContribution / 3, 1); // Normalize: 3 contributions per day = 100%

    // Calculate overall completion rate
    const completionRate = totalTasks.total > 0 ? totalTasks.completed / totalTasks.total : 0;

    // Calculate impact score (0-100)
    const impactScore = Math.round((normalizedContributionScore * contributionWeight + completionRate * completionWeight) * 100);

    return NextResponse.json({
      success: true,
      impactScore,
      totalTasks,
      completionRate: Math.round(completionRate * 100),
      contributionData: contributionChartData,
      projectDistribution: projectChartData,
      completionTrend: completionTrendData,
    });
  } catch (error) {
    console.error('Error generating analytics:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}
