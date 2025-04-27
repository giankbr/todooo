import { db } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    // Pass auth options to getServerSession
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get today's date in ISO format with timezone handling
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    // Log date range for debugging
    console.log('Fetching updates between:', todayStart, 'and', todayEnd);

    // Fetch all updates from today - CHANGED image TO avatar
    const updates = await db.update.findMany({
      where: {
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      include: {
        user: {
          select: { name: true, email: true, department: true, avatar: true },
        },
        project: true,
      },
    });

    console.log(`Found ${updates.length} updates for today`);

    // Process updates to extract tasks
    const tasks = [];
    const userStats = {};
    let totalTasks = 0;
    let completedTasks = 0;

    for (const update of updates) {
      try {
        // Make sure tasks is valid JSON
        let parsedTasks = [];
        try {
          parsedTasks = JSON.parse(update.tasks || '[]');
          if (!Array.isArray(parsedTasks)) parsedTasks = [];
        } catch (e) {
          console.error('Invalid tasks JSON in update:', update.id);
          parsedTasks = [];
        }

        // Track user stats - CHANGED image TO avatar
        const userName = update.user?.name || 'Unknown User';
        if (!userStats[userName]) {
          userStats[userName] = {
            completed: 0,
            total: 0,
            avatar: update.user?.avatar || '',
            initials: getInitials(userName),
          };
        }

        // Map tasks with additional metadata - CHANGED image TO avatar
        for (const task of parsedTasks) {
          if (!task || typeof task !== 'object') continue;

          const formattedTask = {
            id: `${update.id}-${totalTasks}`,
            title: task.description || 'No description',
            completed: Boolean(task.completed),
            project: update.projectName || update.project?.name || 'No Project',
            date: formatDate(update.createdAt),
            user: {
              name: userName,
              avatar: update.user?.avatar || '',
              initials: userStats[userName].initials,
            },
          };

          // Add to tasks array
          tasks.push(formattedTask);

          // Update stats
          totalTasks++;
          if (task.completed) {
            completedTasks++;
            userStats[userName].completed++;
          }
          userStats[userName].total++;
        }
      } catch (error) {
        console.error(`Error processing tasks from update ${update.id}:`, error);
      }
    }

    // Convert user stats to array format
    const teamMembers = Object.entries(userStats).map(([name, stats]) => ({
      name,
      avatar: stats.avatar,
      initials: stats.initials,
      completed: stats.completed,
      total: stats.total,
    }));

    return NextResponse.json({
      success: true,
      tasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      teamMembers,
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// Helper function to format date
function formatDate(date: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

  return date.toLocaleDateString();
}

// Helper function to get initials from name
function getInitials(name: string): string {
  return (
    name
      .split(' ')
      .map((part) => part[0] || '')
      .join('')
      .toUpperCase()
      .substring(0, 2) || 'NA'
  );
}
