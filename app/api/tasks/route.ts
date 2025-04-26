import { db } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

// Define interfaces for our data structures
interface TaskData {
  description: string;
  completed: boolean;
  priority?: string; // Add priority as an optional property
  dueDate?: string; // Add dueDate as an optional property
  notes?: string; // Add notes as an optional property if you plan to use it
}

interface FormattedTask {
  id: string;
  title: string;
  completed: boolean;
  category: string;
  priority: string;
  dueDate?: string; // Make sure it's included here too
  date: string;
  user: {
    name: string;
    avatar: string;
    initials: string;
  };
}

interface TaskRequestBody {
  project: string;
  tasks: TaskData[];
}

export async function GET(req: Request): Promise<NextResponse> {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    // Get today's start and end
    const startOfDay = new Date(`${date}T00:00:00Z`);
    const endOfDay = new Date(`${date}T23:59:59Z`);

    // Query updates for today
    const updates = await db.update.findMany({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
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
    });

    // Process and format tasks
    const formattedTasks: FormattedTask[] = updates.flatMap((update) => {
      const tasks = JSON.parse(update.tasks || '[]') as TaskData[];
      const projectName = update.project?.name || update.projectName || 'No Project';

      return tasks.map((task, index) => ({
        // Add index to make IDs unique even if descriptions start the same
        id: `${update.id}-${index}-${task.description.substring(0, 10)}`,
        title: task.description,
        completed: task.completed,
        category: projectName,
        priority: task.priority || 'medium',
        dueDate: task.dueDate,
        date: update.createdAt.toLocaleDateString(),
        user: {
          name: update.user.name,
          avatar: update.user.avatar || '/placeholder.svg',
          initials: update.user.name
            .split(' ')
            .map((n) => n[0])
            .join(''),
        },
      }));
    });

    return NextResponse.json({ tasks: formattedTasks });
  } catch (error) {
    console.error('Tasks API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { project, tasks } = (await req.json()) as TaskRequestBody;

    if (!project || !tasks || !tasks.length) {
      return NextResponse.json({ error: 'Invalid task data' }, { status: 400 });
    }

    // Find the user by email (since that's what's available in the session)
    const user = await db.user.findUnique({
      where: {
        email: session.user.email as string,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find project or create reference by name
    let projectId: string | null = null;
    if (project) {
      const existingProject = await db.project.findFirst({
        where: { name: project },
      });

      if (existingProject) {
        projectId = existingProject.id;
      }
    }

    // Create update with tasks using the user connection
    const update = await db.update.create({
      data: {
        user: {
          connect: { id: user.id },
        },
        project: projectId
          ? {
              connect: { id: projectId },
            }
          : undefined,
        projectName: !projectId ? project : undefined,
        tasks: JSON.stringify(tasks),
        source: 'manual',
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
    });

    return NextResponse.json(
      {
        update,
        message: 'Tasks created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Tasks API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
