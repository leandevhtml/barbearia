import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import Settings from '@/models/Settings';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    let barbershopId = session ? (session.user as any)?.barbershopId : null;

    if (!barbershopId) {
      const Barbershop = (await import('@/models/Barbershop')).default;
      const defaultShop = await Barbershop.findOne({});
      if (defaultShop) {
        barbershopId = defaultShop._id;
      }
    }

    if (!barbershopId) {
      return NextResponse.json({ fidelityEnabled: true, stampsPerReward: 10 });
    }

    let settings = await Settings.findOne({ barbershopId });
    if (!settings) {
      settings = await Settings.create({ barbershopId });
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

    const barbershopId = (session.user as any).barbershopId;

    const body = await req.json();
    await connectToDatabase();

    let settings = await Settings.findOne({ barbershopId });
    if (!settings) {
      settings = new Settings({ ...body, barbershopId });
    } else {
      Object.assign(settings, body);
    }

    await settings.save();
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ message: 'Error updating settings' }, { status: 500 });
  }
}
