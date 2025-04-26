import { mkdir, writeFile } from 'fs/promises';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import path from 'path';

// Simple unique ID generator
function generateUniqueId() {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${randomStr}`;
}

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Make sure the uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'public/uploads');

    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (err) {
      console.log('Directory exists or cannot be created:', err);
    }

    // Get the form data from the request
    const formData = await req.formData();
    const file = formData.get('avatar') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 2MB' }, { status: 400 });
    }

    // Generate a unique filename
    const uniqueId = generateUniqueId();
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${uniqueId}.${fileExt}`;
    const filePath = path.join(uploadsDir, fileName);

    // Save the file
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(filePath, buffer);

      const publicPath = `/uploads/${fileName}`;

      return NextResponse.json({
        success: true,
        path: publicPath,
        message: 'File uploaded successfully',
      });
    } catch (fileError) {
      console.error('File write error:', fileError);
      return NextResponse.json(
        {
          error: 'Failed to save the file',
          details: fileError instanceof Error ? fileError.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      {
        error: 'Failed to upload file',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
