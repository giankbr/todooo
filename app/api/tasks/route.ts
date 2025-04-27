import { db } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    console.log('Task creation endpoint called');

    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body carefully
    let data;
    try {
      const bodyText = await req.text();
      console.log(`Request body length: ${bodyText.length}`);

      if (!bodyText) {
        return NextResponse.json({ success: false, error: 'Empty request body' }, { status: 400 });
      }

      data = JSON.parse(bodyText);
    } catch (e) {
      console.error('Error parsing request body:', e);
      return NextResponse.json({ success: false, error: 'Invalid JSON in request body' }, { status: 400 });
    }

    console.log('Task creation data:', data);

    // Validate required fields
    if (!data.project || !data.tasks || !Array.isArray(data.tasks) || data.tasks.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data. Project and at least one task are required.',
        },
        { status: 400 }
      );
    }

    // Check if user email exists
    if (!session.user.email) {
      return NextResponse.json({ success: false, error: 'User email is required' }, { status: 400 });
    }

    // Create new update with the tasks
    const newUpdate = await db.update.create({
      data: {
        projectName: data.project,
        tasks: JSON.stringify(data.tasks),
        user: {
          connect: {
            email: session.user.email,
          },
        },
      },
    });

    console.log('Created new update:', newUpdate.id);

    // Always return a valid JSON response
    return NextResponse.json({
      success: true,
      updateId: newUpdate.id,
    });
  } catch (error) {
    console.error('Error creating tasks:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create tasks',
      },
      { status: 500 }
    );
  }
}
