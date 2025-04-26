import { db } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();

    // Validate input
    if (!data.defaultView || !['list', 'board', 'calendar'].includes(data.defaultView)) {
      return NextResponse.json({ error: 'Invalid default view' }, { status: 400 });
    }

    if (!data.taskSort || !['priority', 'dueDate', 'created', 'alphabetical'].includes(data.taskSort)) {
      return NextResponse.json({ error: 'Invalid task sort' }, { status: 400 });
    }

    // Save to database
    await db.userSettings.upsert({
      where: {
        userEmail: session.user.email,
        settingType: 'preferences',
      },
      update: {
        value: JSON.stringify(data),
      },
      create: {
        userEmail: session.user.email,
        settingType: 'preferences',
        value: JSON.stringify(data),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Preference settings saved successfully',
    });
  } catch (error) {
    console.error('Error saving preference settings:', error);
    return NextResponse.json({ error: 'Failed to save preference settings' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get from database
    const settings = await db.userSettings.findUnique({
      where: {
        userEmail: session.user.email,
        settingType: 'preferences',
      },
    });

    if (!settings) {
      return NextResponse.json({
        defaultView: 'list',
        taskSort: 'priority',
        timezone: 'UTC',
        startOfWeek: 'monday',
      });
    }

    return NextResponse.json(JSON.parse(settings.value));
  } catch (error) {
    console.error('Error fetching preference settings:', error);
    return NextResponse.json({ error: 'Failed to fetch preference settings' }, { status: 500 });
  }
}
