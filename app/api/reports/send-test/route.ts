import { sendReportEmail } from '@/lib/email';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';

// Define schema for validation
const testEmailSchema = z.object({
  impactLevel: z.number().int().min(1).max(100),
  priorityThreshold: z.enum(['all', 'high', 'medium', 'low']),
  recipients: z.array(z.string().email()).min(1),
  isTest: z.boolean(),
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
    const validationResult = testEmailSchema.safeParse(requestData);

    if (!validationResult.success) {
      return NextResponse.json({ error: 'Invalid request data', details: validationResult.error.errors }, { status: 400 });
    }

    const data = validationResult.data;

    // Fetch tasks for the report
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7); // Get tasks from the last week

    // Construct the priority parameter
    const priorityParam = data.priorityThreshold === 'all' ? '' : `&priority=${data.priorityThreshold}`;

    const tasksResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/tasks?startDate=${startDate.toISOString().split('T')[0]}&endDate=${new Date().toISOString().split('T')[0]}${priorityParam}`, {
      headers: { Cookie: `next-auth.session-token=${req.headers.get('cookie')?.split('next-auth.session-token=')[1]?.split(';')[0]}` },
    });

    if (!tasksResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch tasks for report' }, { status: 500 });
    }

    const tasksData = await tasksResponse.json();

    // Filter to completed tasks and limit to impact level
    const completedTasks = tasksData.tasks.filter((task: any) => task.completed).slice(0, data.impactLevel);

    // Format email data
    const emailData = {
      'Weekly Impact Report': [
        {
          user: {
            name: data.userName,
            email: data.userEmail,
          },
          projectName: 'Impact Tasks',
          tasks: JSON.stringify(
            completedTasks.map((task: any) => ({
              description: task.title,
              completed: true,
            }))
          ),
        },
      ],
    };

    // Send the email
    try {
      const emailSent = await sendReportEmail({
        subject: `[TEST] ${data.userName}'s Weekly Impact Report`,
        data: emailData,
        recipients: data.recipients,
      });

      if (!emailSent) {
        console.error('Email sending failed');
        return NextResponse.json({ error: 'Failed to send test email. Check server logs for details.' }, { status: 500 });
      }
    } catch (emailError) {
      console.error('Email error:', emailError);
      return NextResponse.json(
        {
          error: 'Email configuration error',
          details: emailError instanceof Error ? emailError.message : 'Unknown email error',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json({ error: 'Failed to send test email' }, { status: 500 });
  }
}
