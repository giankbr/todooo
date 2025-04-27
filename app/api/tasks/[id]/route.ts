import { db } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession();
    if (!session?.user || !session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = params.id;
    const data = await req.json();

    console.log('Task update request:', { id, data });

    // Parse task ID to get the update ID
    const idParts = id.split('-');
    if (idParts.length < 2) {
      return NextResponse.json({ error: 'Invalid task ID format' }, { status: 400 });
    }

    const updateId = idParts[0];
    const taskIndex = parseInt(idParts[1]);

    if (isNaN(taskIndex)) {
      return NextResponse.json({ error: 'Invalid task index' }, { status: 400 });
    }

    // Fetch the update to verify ownership and get the tasks
    const update = await db.update.findFirst({
      where: {
        id: updateId,
        user: {
          email: session.user.email,
        },
      },
    });

    if (!update) {
      return NextResponse.json({ error: 'Update not found' }, { status: 404 });
    }

    // Parse tasks, modify the specific task, and save back
    try {
      const tasks = JSON.parse(update.tasks || '[]');

      if (!tasks[taskIndex]) {
        return NextResponse.json({ error: 'Task not found in update' }, { status: 404 });
      }

      // Update the task properties
      tasks[taskIndex].completed = data.completed;

      // Save back to database
      const updatedUpdate = await db.update.update({
        where: { id: updateId },
        data: {
          tasks: JSON.stringify(tasks),
        },
      });

      return NextResponse.json({
        success: true,
        taskId: id,
        completed: data.completed,
      });
    } catch (error) {
      console.error('Error updating task:', error);
      return NextResponse.json({ error: 'Failed to parse or update tasks' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in PATCH /api/tasks/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
