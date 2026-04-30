import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import mongoose from 'mongoose';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const collections = mongoose.connection.collections;
    const results: any = {};

    for (const key in collections) {
      if (key === 'users') {
        // Clear non-admins
        const res = await collections[key].deleteMany({ role: { $ne: 'admin' } });
        results[key] = res.deletedCount;
      } else if (key === 'settings') {
        // Keep settings
        results[key] = 'preserved';
      } else {
        const res = await collections[key].deleteMany({});
        results[key] = res.deletedCount;
      }
    }

    return NextResponse.json({ message: 'Database reset successful', details: results });
  } catch (error: any) {
    console.error('Reset DB error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
