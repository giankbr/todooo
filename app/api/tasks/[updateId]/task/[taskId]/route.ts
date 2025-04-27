import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

export async function PATCH(req: Request, { params }: { params: { updateId: string; taskId: string } }) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!session.user.email) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 });
    }

    const { updateId, taskId } = params;
    const data = await req.json();

    console.log('Task update request:', { updateId, taskId, data });

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

    // Parse tasks from the update
    try {
      const tasks = JSON.parse(update.tasks || '[]');

      // Extract the task index from the taskId
      const parts = taskId.split('-');
      const taskIndex = parseInt(parts[1]);

      if (isNaN(taskIndex) || !tasks[taskIndex]) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      }

      // Update the task completed status
      tasks[taskIndex].completed = data.completed;

      // Save back to database
      await db.update.update({
        where: { id: updateId },
        data: {
          tasks: JSON.stringify(tasks),
        },
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error updating task:', error);
      return NextResponse.json({ error: 'Failed to process task update' }, { status: 500 });
    }
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
