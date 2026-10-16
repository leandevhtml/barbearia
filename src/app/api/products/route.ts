import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import Product from '@/models/Product';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const barbershopId = searchParams.get('barbershopId');

    // Se estiver logado, pode usar a barbearia do usuário da sessão
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

    const query: any = { active: true };
    if (filterShopId) query.barbershopId = filterShopId;

    const products = await Product.find(query);
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
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

    let barbershopId = (session.user as any).barbershopId;
    if (!barbershopId) {
      const Barbershop = (await import('@/models/Barbershop')).default;
      const defaultShop = await Barbershop.findOne({});
      if (defaultShop) barbershopId = defaultShop._id;
    }

    const newProduct = new Product({
      ...body,
      barbershopId,
    });
    await newProduct.save();

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ message: 'Error creating product' }, { status: 500 });
  }
}
