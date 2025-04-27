import { db } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

export async function PATCH(req: Request, { params }: { params: { id: string; taskId: string } }) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id, taskId } = params;
    const data = await req.json();

    if (!data.priority) {
      return NextResponse.json({ success: false, error: 'Priority is required' }, { status: 400 });
    }

    const update = await db.update.findFirst({
      where: {
        id,
        user: {
          email: session.user.email,
        },
      },
    });

    if (!update) {
      return NextResponse.json({ success: false, error: 'Update not found' }, { status: 404 });
    }

    try {
      const tasks = JSON.parse(update.tasks || '[]');

      // Extract the task index from the taskId
      const parts = taskId.split('-');
      const taskIndex = parseInt(parts[1]);

      if (isNaN(taskIndex) || !tasks[taskIndex]) {
        return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
      }

      // Update task priority
      tasks[taskIndex].priority = data.priority;

      // Save back to database
      await db.update.update({
        where: { id },
        data: {
          tasks: JSON.stringify(tasks),
        },
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error updating task priority:', error);
      return NextResponse.json({ success: false, error: 'Failed to update priority' }, { status: 500 });
    }
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
