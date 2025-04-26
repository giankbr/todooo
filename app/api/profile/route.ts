import { db } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

interface ProfileUpdateData {
  name?: string;
  avatar?: string;
  department?: string;
  phone?: string;
}

export async function PATCH(req: Request): Promise<NextResponse> {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = (await req.json()) as ProfileUpdateData;
    console.log('Received profile update data:', data);

    // Validate input
    if (data.name && data.name.trim().length < 2) {
      return NextResponse.json({ error: 'Name must be at least 2 characters' }, { status: 400 });
    }

    if (data.phone && !/^\+?[\d\s()-]{7,}$/.test(data.phone)) {
      return NextResponse.json({ error: 'Please enter a valid phone number' }, { status: 400 });
    }

    // Prepare update fields
    const updateData: ProfileUpdateData = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.avatar !== undefined) updateData.avatar = data.avatar.trim();
    if (data.department !== undefined) updateData.department = data.department.trim();
    if (data.phone !== undefined) updateData.phone = data.phone.trim();

    console.log('Updating user with data:', updateData);
    console.log('User email:', session.user.email);

    try {
      // Update user in database
      const updatedUser = await db.user.update({
        where: {
          email: session.user.email as string,
        },
        data: updateData,
      });

      console.log('User updated successfully:', updatedUser.id);

      // Return the updated user data
      return NextResponse.json({
        success: true,
        message: 'Profile updated successfully',
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          avatar: updatedUser.avatar,
          department: updatedUser.department,
          phone: updatedUser.phone,
          role: updatedUser.role,
        },
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        {
          error: 'Database update failed',
          details: dbError instanceof Error ? dbError.message : 'Unknown database error',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      {
        error: 'Failed to update profile',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
