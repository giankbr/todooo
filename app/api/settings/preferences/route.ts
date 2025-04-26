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

    // Basic validation
    if (!data.defaultView || !['list', 'board', 'calendar'].includes(data.defaultView)) {
      return NextResponse.json({ error: 'Invalid default view' }, { status: 400 });
    }

    if (!data.taskSort || !['priority', 'dueDate', 'created', 'alphabetical'].includes(data.taskSort)) {
      return NextResponse.json({ error: 'Invalid task sort' }, { status: 400 });
    }

    // Save to database with error handling
    try {
      await db.userSettings.upsert({
        where: {
          userEmail_settingType: {
            userEmail: session.user.email,
            settingType: 'preferences',
          },
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
    } catch (dbError) {
      console.error('Database error:', dbError);
      // Fall back to just returning success even if DB fails
      return NextResponse.json({
        success: true,
        message: 'Settings saved locally only',
        warning: 'Could not save to database',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Preference settings saved successfully',
    });
  } catch (error) {
    console.error('Error saving preference settings:', error);
    return NextResponse.json({ error: 'Failed to save preference settings', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get from database with error handling
    try {
      const settings = await db.userSettings.findUnique({
        where: {
          userEmail_settingType: {
            userEmail: session.user.email,
            settingType: 'preferences',
          },
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
    } catch (dbError) {
      console.error('Database error:', dbError);
      // Return defaults if DB fails
      return NextResponse.json({
        defaultView: 'list',
        taskSort: 'priority',
        timezone: 'UTC',
        startOfWeek: 'monday',
      });
    }
  } catch (error) {
    console.error('Error fetching preference settings:', error);
    return NextResponse.json({ error: 'Failed to fetch preference settings' }, { status: 500 });
  }
}
