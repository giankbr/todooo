import { db } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

interface TaskData {
  description: string;
  completed: boolean;
  priority?: string;
  dueDate?: string;
  notes?: string;
}

interface UpdatePriorityRequest {
  priority: string;
}

export async function PATCH(req: Request, { params }: { params: { id: string; taskId: string } }): Promise<NextResponse> {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updateId = params.id;
    const taskId = params.taskId;
    const { priority } = (await req.json()) as UpdatePriorityRequest;

    // Get the update from the database
    const update = await db.update.findUnique({
      where: { id: updateId },
    });

    if (!update) {
      return NextResponse.json({ error: 'Update not found' }, { status: 404 });
    }

    // Parse the tasks JSON
    const tasks = JSON.parse(update.tasks) as TaskData[];

    // Extract the task index from the taskId
    // Format is: updateId-taskIndex-descriptionSnippet
    const taskIdParts = taskId.split('-');
    const taskIndex = parseInt(taskIdParts[1], 10);

    // Check if the index is valid
    if (isNaN(taskIndex) || taskIndex < 0 || taskIndex >= tasks.length) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Update the task priority
    tasks[taskIndex].priority = priority;

    // Update the database
    await db.update.update({
      where: { id: updateId },
      data: {
        tasks: JSON.stringify(tasks),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Task priority update error:', error);
    return NextResponse.json({ error: 'Failed to update task priority' }, { status: 500 });
  }
}
