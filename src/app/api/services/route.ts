import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import Service from '@/models/Service';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const barbershopId = searchParams.get('barbershopId');

    // Se estiver logado, pode usar a barbearia do usuário da sessão, caso não passe o parametro
    let filterShopId = barbershopId;

    if (!filterShopId) {
      const session = await getServerSession(authOptions);
      if (session?.user) {
        filterShopId = (session.user as any).barbershopId;
      }
    }

    await connectToDatabase();

    if (!filterShopId) {
      const Barbershop = (await import('@/models/Barbershop')).default;
      const defaultShop = await Barbershop.findOne({});
      if (defaultShop) filterShopId = defaultShop._id.toString();
    }

    const includeAll = searchParams.get('includeAll') === 'true';
    const query: any = includeAll ? {} : { active: true };
    if (filterShopId) query.barbershopId = filterShopId;

    const services = await Service.find(query).sort({ name: 1 });
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

    const newService = new Service({
      ...body,
      barbershopId: (session.user as any).barbershopId, // Força a barbearia da sessão
    });
    await newService.save();

    return NextResponse.json(newService, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Error creating service' }, { status: 500 });
  }
}
