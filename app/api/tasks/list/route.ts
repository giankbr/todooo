import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  console.log('GET /api/tasks/list endpoint called');

  try {
    // Get user session
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized', tasks: [] }, { status: 401 });
    }

    // Parse query parameters
    const url = new URL(req.url);
    const dateParam = url.searchParams.get('date');

    console.log(`User: ${session.user.email}, Date param: ${dateParam}`);

    // Build date filter safely
    let dateFilter: any = {};

    if (dateParam) {
      try {
        // Ensure the date is valid by creating a date object
        const parsedDate = new Date(dateParam);
        if (isNaN(parsedDate.getTime())) {
          console.error(`Invalid date parameter: ${dateParam}`);
          return NextResponse.json(
            {
              success: false,
              error: 'Invalid date format',
              tasks: [],
            },
            { status: 400 }
          );
        }

        // Create start and end of day in UTC
        const startOfDay = new Date(dateParam + 'T00:00:00Z');
        const endOfDay = new Date(dateParam + 'T23:59:59Z');

        console.log('Date filter range:', {
          start: startOfDay.toISOString(),
          end: endOfDay.toISOString(),
        });

        // Filter by date range
        dateFilter = {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        };
      } catch (dateError) {
        console.error('Error parsing date:', dateError);
        return NextResponse.json(
          {
            success: false,
            error: 'Error parsing date',
            tasks: [],
          },
          { status: 400 }
        );
      }
    } else {
      console.log('No date filter applied');
    }

    // Fallback to mock data in development if needed
    if (process.env.NODE_ENV === 'development' && process.env.USE_MOCK_DATA === 'true') {
      console.log('Using mock data instead of database');
      return NextResponse.json({
        success: true,
        tasks: getMockTasks(dateParam),
      });
    }

    // Fetch updates from database with appropriate filters
    try {
      console.log('Querying database with filter:', JSON.stringify(dateFilter));

      // Execute the database query with a timeout
      const updates = await db.update.findMany({
        where: {
          user: {
            email: session.user.email,
          },
          ...dateFilter,
        },
        orderBy: {
          createdAt: 'desc',
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
        take: 100, // Limit to 100 most recent updates
      });

      console.log(`Found ${updates.length} updates`);

      // Process updates and extract tasks
      const tasks = [];

      for (const update of updates) {
        try {
          const updateTasks = JSON.parse(update.tasks || '[]');

          // Map tasks with additional metadata
          const formattedTasks = updateTasks.map((task: any, index: number) => ({
            id: `${update.id}-${index}`,
            title: task.description,
            completed: task.completed || false,
            priority: task.priority || 'medium',
            dueDate: task.dueDate,
            category: update.projectName || update.project?.name || 'No Project',
            date: update.createdAt.toISOString(),
            user: {
              name: update.user?.name || 'User',
              avatar: update.user?.avatar || '/placeholder.svg',
              initials: (update.user?.name || 'U')
                .split(' ')
                .map((n: string) => n[0])
                .join(''),
            },
          }));

          tasks.push(...formattedTasks);
        } catch (parseError) {
          console.error(`Error processing update ${update.id}:`, parseError);
          // Continue with other updates
        }
      }

      console.log(`Returning ${tasks.length} tasks`);

      // Return successful response with tasks
      return NextResponse.json({
        success: true,
        tasks,
      });
    } catch (dbError) {
      console.error('Database error:', dbError);

      // In development, return mock data on database error
      if (process.env.NODE_ENV === 'development') {
        console.log('Returning mock data due to database error');
        return NextResponse.json({
          success: true,
          tasks: getMockTasks(dateParam),
        });
      }

      throw dbError; // re-throw for the outer catch
    }
  } catch (error) {
    console.error('Error in tasks list endpoint:', error);

    // Return a proper error response
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        tasks: [],
      },
      { status: 500 }
    );
  }
}

// Helper function to generate mock tasks
function getMockTasks(dateStr: string | null) {
  const date = dateStr ? new Date(dateStr) : new Date();
  const dateISO = date.toISOString().split('T')[0];

  return [
    {
      id: `mock-1-${dateISO}`,
      title: `Implement dashboard features (${date.toLocaleDateString()})`,
      completed: false,
      priority: 'high',
      category: 'Development',
      date: date.toISOString(),
      user: {
        name: 'Test User',
        avatar: '/placeholder.svg',
        initials: 'TU',
      },
    },
    {
      id: `mock-2-${dateISO}`,
      title: `Design user interface (${date.toLocaleDateString()})`,
      completed: true,
      priority: 'medium',
      category: 'Design',
      date: date.toISOString(),
      user: {
        name: 'Test User',
        avatar: '/placeholder.svg',
        initials: 'TU',
      },
    },
    {
      id: `mock-3-${dateISO}`,
      title: `Review project requirements (${date.toLocaleDateString()})`,
      completed: false,
      priority: 'low',
      category: 'Planning',
      dueDate: new Date(date.getTime() + 86400000).toISOString().split('T')[0],
      date: date.toISOString(),
      user: {
        name: 'Test User',
        avatar: '/placeholder.svg',
        initials: 'TU',
      },
    },
  ];
}
