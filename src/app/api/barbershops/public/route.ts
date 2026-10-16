import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Barbershop from '@/models/Barbershop';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');

  if (!slug) {
    return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
  }

  try {
    await connectToDatabase();
    let barbershop = await Barbershop.findOne({ slug, isActive: true }).select('name logoUrl primaryColor slug');

    if (!barbershop) {
      barbershop = await Barbershop.findOne({ isActive: true }).select('name logoUrl primaryColor slug');
    }

    if (!barbershop) {
      return NextResponse.json({
        name: 'Gigantes do Corte',
        logoUrl: '/logo.png',
        primaryColor: '#EA580C',
        slug: slug || 'gigantes-do-corte',
      });
    }

    return NextResponse.json(barbershop);
  } catch (error) {
    return NextResponse.json({
      name: 'Gigantes do Corte',
      logoUrl: '/logo.png',
      primaryColor: '#EA580C',
      slug: slug || 'gigantes-do-corte',
    });
  }
}
