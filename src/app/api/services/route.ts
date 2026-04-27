import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import Service from '@/models/Service';

export async function GET() {
  try {
    await connectToDatabase();
    const services = await Service.find({}).sort({ name: 1 });
    return NextResponse.json(services);
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching services' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    await connectToDatabase();

    const newService = new Service(body);
    await newService.save();

    return NextResponse.json(newService, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Error creating service' }, { status: 500 });
  }
}
