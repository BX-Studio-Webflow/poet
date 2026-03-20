import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Revalidate the jobs API route
    revalidatePath('/api/jobs');

    return NextResponse.json({
      success: true,
      message: 'Jobs cache has been reset',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error resetting cache:', error);
    return NextResponse.json({ error: 'Failed to reset cache' }, { status: 500 });
  }
}
