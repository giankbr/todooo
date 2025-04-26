import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';

// Update the schema to include 'all' as a valid priority option

// Define schema for validation
const scheduleSchema = z.object({
  impactLevel: z.number().int().min(1).max(100),
  priorityThreshold: z.enum(['all', 'high', 'medium', 'low']),
  recipients: z.array(z.string().email()).min(1),
  scheduleDays: z.array(z.string()),
  scheduleTime: z.string(),
  endType: z.enum(['never', 'on-date', 'after']),
  endDate: z.string().nullable(),
  endCount: z.number().nullable(),
  sendCopyToSelf: z.boolean(),
  userEmail: z.string().email(),
  userName: z.string(),
});

export async function POST(req: Request) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const requestData = await req.json();
    const validationResult = scheduleSchema.safeParse(requestData);

    if (!validationResult.success) {
      return NextResponse.json({ error: 'Invalid request data', details: validationResult.error.errors }, { status: 400 });
    }

    const data = validationResult.data;

    // Store schedule in database
    await db.reportSchedule.create({
      data: {
        userId: session.user.email,
        impactLevel: data.impactLevel,
        priorityThreshold: data.priorityThreshold,
        recipients: JSON.stringify(data.recipients),
        scheduleDays: JSON.stringify(data.scheduleDays),
        scheduleTime: data.scheduleTime,
        endType: data.endType,
        endDate: data.endDate,
        endCount: data.endCount,
        sendCopyToSelf: data.sendCopyToSelf,
        active: true,
        lastSentAt: null,
        nextSendAt: calculateNextSendTime(data.scheduleDays[0], data.scheduleTime),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error scheduling report:', error);
    return NextResponse.json({ error: 'Failed to schedule report' }, { status: 500 });
  }
}

// Helper to calculate next send time
function calculateNextSendTime(day: string, time: string): Date {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = new Date();
  const dayIndex = days.indexOf(day);
  const [hours, minutes] = time.split(':').map(Number);

  // Calculate days until next occurrence of the specified day
  const currentDayOfWeek = today.getDay();
  const daysUntilNext = (dayIndex + 7 - currentDayOfWeek) % 7;

  // Create date for next occurrence
  const nextDate = new Date(today);
  nextDate.setDate(today.getDate() + daysUntilNext);
  nextDate.setHours(hours, minutes, 0, 0);

  // If today is the scheduled day but the time has passed, move to next week
  if (daysUntilNext === 0 && today > nextDate) {
    nextDate.setDate(nextDate.getDate() + 7);
  }

  return nextDate;
}
