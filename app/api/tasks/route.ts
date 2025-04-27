import { db } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!session.user.email) {
      return NextResponse.json({ success: false, error: 'Email not found' }, { status: 400 });
    }

    const url = new URL(req.url);
    const completed = url.searchParams.get('completed');

    // Find all updates for the user
    const updates = await db.update.findMany({
      where: {
        user: {
          email: session.user.email,
        },
      },
      include: {
        user: true,
        project: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const tasks = [];

    for (const update of updates) {
      try {
        const updateTasks = JSON.parse(update.tasks || '[]');
        
        // Filter by completion status if specified
        const filteredTasks = completed !== null 
          ? updateTasks.filter((task: any) => String(task.completed) === completed)
          : updateTasks;

        // Map tasks with additional metadata
        const formattedTasks = filteredTasks.map((task: any, index: number) => ({
          id: `${update.id}-${index}`,
          title: task.description,
          completed: task.completed || false,
          priority: task.priority || 'medium',
          dueDate: task.dueDate,
          estimatedTime: task.estimatedTime || 30,
          category: update.projectName || update.project?.name || 'No Project',
          date: update.createdAt.toISOString(),
        }));

        tasks.push(...formattedTasks);
      } catch (error) {
        console.error(`Error processing tasks from update ${update.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      tasks,
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
