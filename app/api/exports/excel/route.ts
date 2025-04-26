import { db } from '@/lib/db';
import { generateExcelReport } from '@/lib/export';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { startDate, endDate, department } = await req.json();

    // Query updates based on filters
    const updates = await db.update.findMany({
      where: {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
        ...(department && {
          user: {
            department,
          },
        }),
      },
      include: {
        user: {
          select: { name: true, department: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Generate Excel file
    const buffer = await generateExcelReport(updates, `Team Updates ${startDate} to ${endDate}`);

    // Return as downloadable file
    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=updates-${startDate}-${endDate}.xlsx`,
      },
    });
  } catch (error) {
    console.error('Excel export error:', error);
    return NextResponse.json({ error: 'Failed to generate Excel report' }, { status: 500 });
  }
}
