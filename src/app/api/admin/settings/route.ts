import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import Settings from '@/models/Settings';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectToDatabase();
    let settings = await Settings.findOne({});
    if (!settings) {
      settings = await Settings.create({});
    }
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching settings' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    await connectToDatabase();

    let settings = await Settings.findOne({});
    if (!settings) {
      settings = new Settings(body);
    } else {
      Object.assign(settings, body);
    }

    await settings.save();
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ message: 'Error updating settings' }, { status: 500 });
  }
}
