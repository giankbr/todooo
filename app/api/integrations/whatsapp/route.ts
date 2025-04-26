import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

interface WhatsAppMessage {
  from: string;
  body: string;
  timestamp: string;
}

// Parse WhatsApp message format: "[DD/MM/YY, HH.MM.SS] Name: message"
function parseWhatsAppMessage(message: string): WhatsAppMessage | null {
  const regex = /\[(\d{2}\/\d{2}\/\d{2}), (\d{2}\.\d{2}\.\d{2})\] ([^:]+): (.*)/;
  const match = message.match(regex);

  if (!match) return null;

  const [_, date, time, name, body] = match;
  const timestamp = `20${date} ${time.replace(/\./g, ':')}`;

  return {
    from: name.trim(),
    body: body.trim(),
    timestamp: new Date(timestamp).toISOString(),
  };
}

// Extract tasks from message body with checkmarks
function extractTasks(messageBody: string): { description: string; completed: boolean }[] {
  // Split by newline and process each line
  return messageBody
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      const isCompleted = line.includes('✓') || line.includes('✅');
      // Remove checkmarks and clean up
      const description = line.replace(/[✓✅]/g, '').trim();
      return { description, completed: isCompleted };
    });
}

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    const parsedMessage = parseWhatsAppMessage(message);

    if (!parsedMessage) {
      return NextResponse.json({ error: 'Invalid message format' }, { status: 400 });
    }

    // Look for project name in first line
    const lines = parsedMessage.body.split('\n');
    const projectName = lines[0].replace(/to do|tasks|today/gi, '').trim();

    // Extract tasks from the rest of the message
    const tasks = extractTasks(parsedMessage.body);

    // Find user by name or create placeholder
    const user = (await db.user.findFirst({
      where: { name: { contains: parsedMessage.from } },
    })) || { id: 'unknown' };

    // Create update in database
    await db.update.create({
      data: {
        userId: user.id,
        projectName,
        tasks: JSON.stringify(tasks),
        source: 'whatsapp',
        rawContent: message,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('WhatsApp integration error:', error);
    return NextResponse.json({ error: 'Failed to process message' }, { status: 500 });
  }
}
