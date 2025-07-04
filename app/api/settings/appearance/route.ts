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
    if (!data.theme || !['light', 'dark', 'system'].includes(data.theme)) {
      return NextResponse.json({ error: 'Invalid theme' }, { status: 400 });
    }

    if (typeof data.compactMode !== 'boolean') {
      return NextResponse.json({ error: 'Invalid compactMode value' }, { status: 400 });
    }

    if (!data.fontScale || !['small', 'normal', 'large'].includes(data.fontScale)) {
      return NextResponse.json({ error: 'Invalid font scale' }, { status: 400 });
    }

    // Save to database
    try {
      await db.userSettings.upsert({
        where: {
          userEmail_settingType: {
            userEmail: session.user.email,
            settingType: 'appearance',
          },
        },
        update: {
          value: JSON.stringify(data),
        },
        create: {
          userEmail: session.user.email,
          settingType: 'appearance',
          value: JSON.stringify(data),
        },
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      // Fall back to just returning success even if DB fails
      // This lets the client-side still work with localStorage
      return NextResponse.json({
        success: true,
        message: 'Settings saved locally only',
        warning: 'Could not save to database',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Appearance settings saved successfully',
    });
  } catch (error) {
    console.error('Error saving appearance settings:', error);
    return NextResponse.json({ error: 'Failed to save appearance settings', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get from database
    try {
      const settings = await db.userSettings.findUnique({
        where: {
          userEmail_settingType: {
            userEmail: session.user.email,
            settingType: 'appearance',
          },
        },
      });

      if (!settings) {
        return NextResponse.json({
          theme: 'system',
          compactMode: false,
          fontScale: 'normal',
        });
      }

      return NextResponse.json(JSON.parse(settings.value));
    } catch (dbError) {
      console.error('Database error:', dbError);
      // Return defaults if DB fails
      return NextResponse.json({
        theme: 'system',
        compactMode: false,
        fontScale: 'normal',
      });
    }
  } catch (error) {
    console.error('Error fetching appearance settings:', error);
    return NextResponse.json({ error: 'Failed to fetch appearance settings' }, { status: 500 });
  }
}
