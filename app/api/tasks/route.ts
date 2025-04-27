import { db } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

// Define interfaces for our data structures
interface TaskData {
  description: string;
  completed: boolean;
  priority?: string;
  dueDate?: string;
  notes?: string;
  estimatedTime?: number;
}

interface FormattedTask {
  id: string;
  title: string;
  completed: boolean;
  category: string;
  priority: string;
  estimatedTime: number; // Adding this field which was missing
  dueDate?: string;
  date: string;
  user: {
    name: string;
    avatar: string;
    initials: string;
  };
}

export async function GET(req: Request): Promise<NextResponse> {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    // Handle various parameters
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const priority = searchParams.get('priority');
    const completed = searchParams.get('completed'); // Add handling for completed parameter

    console.log('API request params:', { date, startDate, endDate, priority, completed });

    // Build query filters based on provided params
    let dateFilter: any = {};

    if (date) {
      // Single day filter
      const startOfDay = new Date(`${date}T00:00:00Z`);
      const endOfDay = new Date(`${date}T23:59:59Z`);

      dateFilter = {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      };
    } else if (startDate || endDate) {
      // Date range filter
      dateFilter = {
        createdAt: {},
      };

      if (startDate) {
        dateFilter.createdAt.gte = new Date(`${startDate}T00:00:00Z`);
      }

      if (endDate) {
        dateFilter.createdAt.lte = new Date(`${endDate}T23:59:59Z`);
      }
    } else {
      // Default to all tasks if no date specified
      dateFilter = {};
    }

    // Query updates with the filters
    const updates = await db.update.findMany({
      where: {
        ...dateFilter,
        user: {
          email: session.user.email,
        },
      },
      include: {
        user: {
          select: {
            name: true,
            avatar: true,
          },
        },
        project: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit to 100 most recent updates
    });

    // Process and format tasks
    const formattedTasks: FormattedTask[] = [];

    for (const update of updates) {
      try {
        const tasks = JSON.parse(update.tasks || '[]') as TaskData[];
        const projectName = update.project?.name || update.projectName || 'No Project';

        // Filter tasks by priority if specified
        let filteredTasks = priority && priority !== 'all' ? tasks.filter((task) => task.priority === priority) : tasks;

        // Filter by completion status if specified
        if (completed !== null) {
          const isCompleted = completed === 'true';
          filteredTasks = filteredTasks.filter((task) => task.completed === isCompleted);
        }

        const mappedTasks = filteredTasks.map((task, index) => ({
          id: `${update.id}-${index}-${task.description.substring(0, 10).replace(/[^a-zA-Z0-9]/g, '')}`,
          title: task.description,
          completed: task.completed,
          category: projectName,
          priority: task.priority || 'medium',
          estimatedTime: task.estimatedTime || 30, // Default to 30 minutes if not specified
          dueDate: task.dueDate,
          date: update.createdAt.toISOString(),
          user: {
            name: update.user.name,
            avatar: update.user.avatar || '/placeholder.svg',
            initials: update.user.name
              .split(' ')
              .map((n) => n[0])
              .join(''),
          },
        }));

        formattedTasks.push(...mappedTasks);
      } catch (e) {
        console.error('Error processing tasks for update:', e);
      }
    }

    console.log(`Found ${formattedTasks.length} formatted tasks`);
    return NextResponse.json({ tasks: formattedTasks });
  } catch (error) {
    console.error('Tasks API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
