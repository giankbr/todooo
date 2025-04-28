import { db } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // First, check if we can even find the user
    const user = await db.user.findUnique({
      where: {
        email: session.user.email,
      },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Rather than trying complex queries, let's get updates only
    const updates = await db.update.findMany({
      where: {
        user: {
          email: session.user.email,
        },
        projectName: {
          not: null,
          not: '', // Ensure it's not empty string
        },
      },
      select: {
        id: true,
        projectName: true,
      },
      distinct: ['projectName'],
    });

    // Log this for debugging
    console.log('Found updates with projects:', updates.length);

    // Create a simple array of unique projects from updates
    const projectSet = new Set();
    const projects = [];

    for (const update of updates) {
      if (update.projectName && !projectSet.has(update.projectName)) {
        projectSet.add(update.projectName);

        const projectName = update.projectName.trim();
        const slug = createSlug(projectName);

        projects.push({
          id: slug,
          name: projectName,
          slug: slug,
        });
      }
    }

    console.log('Returning projects:', projects.length);

    return NextResponse.json({
      success: true,
      projects: projects,
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
      },
      { status: 500 }
    );
  }
}

// Helper function to create URL-friendly slugs
function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
