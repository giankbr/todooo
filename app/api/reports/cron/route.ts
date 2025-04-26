import { db } from '@/lib/db';
import { sendReportEmail } from '@/lib/email';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const formattedDate = yesterday.toISOString().split('T')[0];

    // Fetch all updates from yesterday
    const updates = await db.update.findMany({
      where: {
        createdAt: {
          gte: new Date(`${formattedDate}T00:00:00Z`),
          lt: new Date(`${formattedDate}T23:59:59Z`),
        },
      },
      include: {
        user: {
          select: { name: true, email: true, department: true },
        },
        project: true,
      },
    });

    // Group updates by department
    const groupedUpdates = updates.reduce((acc, update) => {
      const dept = update.user.department || 'Unassigned';
      if (!acc[dept]) acc[dept] = [];
      acc[dept].push(update);
      return acc;
    }, {});

    // Generate and send report to team leads
    await sendReportEmail({
      subject: `Daily Update Report - ${formattedDate}`,
      data: groupedUpdates,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to generate report:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
