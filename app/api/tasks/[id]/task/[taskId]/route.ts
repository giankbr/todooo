import { db } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

// Define interfaces for our data structures
interface TaskData {
  description: string;
  completed: boolean;
}

interface UpdateTaskDescriptionRequest {
  newDescription: string;
}

export async function DELETE(req: Request, { params }: { params: { id: string; taskId: string } }): Promise<NextResponse> {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updateId = params.id;
    const taskId = params.taskId;

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
    const taskIdParts = taskId.split('-');
    const taskIndex = parseInt(taskIdParts[1], 10);

    // Check if the index is valid
    if (isNaN(taskIndex) || taskIndex < 0 || taskIndex >= tasks.length) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Filter out the task to delete
    const updatedTasks = tasks.filter((_, index) => index !== taskIndex);

    // Update the database
    await db.update.update({
      where: { id: updateId },
      data: {
        tasks: JSON.stringify(updatedTasks),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Task deletion error:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string; taskId: string } }): Promise<NextResponse> {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updateId = params.id;
    const taskId = params.taskId;
    const { newDescription } = (await req.json()) as UpdateTaskDescriptionRequest;

    if (!newDescription?.trim()) {
      return NextResponse.json({ error: 'Task description cannot be empty' }, { status: 400 });
    }

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
    const taskIdParts = taskId.split('-');
    const taskIndex = parseInt(taskIdParts[1], 10);

    // Check if the index is valid
    if (isNaN(taskIndex) || taskIndex < 0 || taskIndex >= tasks.length) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Update the task description
    tasks[taskIndex].description = newDescription;

    // Update the database
    await db.update.update({
      where: { id: updateId },
      data: {
        tasks: JSON.stringify(tasks),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Task update error:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}
