import { db } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

export async function PATCH(req: Request, { params }: { params: { id: string; taskId: string } }) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!session.user.email) {
      return NextResponse.json({ success: false, error: 'Email not found' }, { status: 400 });
    }

    const { id, taskId } = params;
    const data = await req.json();

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

      // Update task due date
      tasks[taskIndex].dueDate = data.dueDate;

      // Save back to database
      await db.update.update({
        where: { id },
        data: {
          tasks: JSON.stringify(tasks),
        },
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error updating task due date:', error);
      return NextResponse.json({ success: false, error: 'Failed to update due date' }, { status: 500 });
    }
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
