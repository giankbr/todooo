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

    console.log('Task update request:', { id, taskId, data });

    // Fetch the update to verify ownership and get the tasks
    const update = await db.update.findFirst({
      where: {
        id: id,
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

      // Update the task completed status
      tasks[taskIndex].completed = data.completed;

      // Save back to database
      await db.update.update({
        where: { id },
        data: {
          tasks: JSON.stringify(tasks),
        },
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error updating task:', error);
      return NextResponse.json({ success: false, error: 'Failed to process task update' }, { status: 500 });
    }
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// Also implement DELETE method
export async function DELETE(req: Request, { params }: { params: { id: string; taskId: string } }) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id, taskId } = params;

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

      // Remove the task
      tasks.splice(taskIndex, 1);

      // Save back to database
      await db.update.update({
        where: { id },
        data: {
          tasks: JSON.stringify(tasks),
        },
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error deleting task:', error);
      return NextResponse.json({ success: false, error: 'Failed to process task delete' }, { status: 500 });
    }
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// Add PUT method for updating task description
export async function PUT(req: Request, { params }: { params: { id: string; taskId: string } }) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id, taskId } = params;
    const data = await req.json();

    if (!data.newDescription) {
      return NextResponse.json({ success: false, error: 'New description is required' }, { status: 400 });
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

      // Update task description
      tasks[taskIndex].description = data.newDescription;

      // Save back to database
      await db.update.update({
        where: { id },
        data: {
          tasks: JSON.stringify(tasks),
        },
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error updating task description:', error);
      return NextResponse.json({ success: false, error: 'Failed to update task description' }, { status: 500 });
    }
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
