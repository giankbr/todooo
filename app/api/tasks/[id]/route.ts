import { db } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

// Define interfaces for our data structures
interface TaskData {
  description: string;
  completed: boolean;
}

interface UpdateTaskRequest {
  taskId: string;
  completed: boolean;
}

export async function PATCH(req: Request, { params }: { params: { id: string } }): Promise<NextResponse> {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updateId = params.id;
    const { taskId, completed } = (await req.json()) as UpdateTaskRequest;

    // Get the update from the database
    const update = await db.update.findUnique({
      where: { id: updateId },
    });

    if (!update) {
      return NextResponse.json({ error: 'Update not found' }, { status: 404 });
    }

    // Parse the tasks JSON
    const tasks = JSON.parse(update.tasks) as TaskData[];

    // Extract the task description from the composite taskId
    const taskDescSnippet = taskId.split('-')[1];

    // Find and update the task status
    const updatedTasks = tasks.map((task) => {
      // Check if this is the task we want to update
      // (using substring comparison since we only stored the first 10 chars in the taskId)
      if (task.description.substring(0, 10) === taskDescSnippet) {
        return { ...task, completed };
      }
      return task;
    });

    // Update the database
    await db.update.update({
      where: { id: updateId },
      data: {
        tasks: JSON.stringify(updatedTasks),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Task update error:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}
