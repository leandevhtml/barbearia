import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import Service from '@/models/Service';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    await connectToDatabase();

    const updatedService = await Service.findOneAndUpdate(
      { _id: id, barbershopId: (session.user as any).barbershopId },
      body, 
      { new: true }
    );
    
    if (!updatedService) {
      return NextResponse.json({ message: 'Service not found' }, { status: 404 });
    }

    return NextResponse.json(updatedService);
  } catch (error) {
    return NextResponse.json({ message: 'Error updating service' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectToDatabase();

    // SENIOR FIX: Soft Delete
    const deletedService = await Service.findOneAndUpdate(
      { _id: id, barbershopId: (session.user as any).barbershopId },
      { active: false }
    );
    
    if (!deletedService) {
      return NextResponse.json({ message: 'Service not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Service deactivated successfully' });
  } catch (error) {
    return NextResponse.json({ message: 'Error deleting service' }, { status: 500 });
  }
}
