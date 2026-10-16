import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import Product from '@/models/Product';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (!session || (role !== 'admin' && role !== 'superadmin')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    await connectToDatabase();

    // Remover _id e id do corpo de atualização para evitar erro de campo imutável no MongoDB
    const updateData = { ...body };
    delete updateData._id;
    delete updateData.id;

    const mongoose = (await import('mongoose')).default;
    const isValidId = mongoose.Types.ObjectId.isValid(id);
    const filterId = isValidId ? new mongoose.Types.ObjectId(id) : id;

    let barbershopId = (session.user as any).barbershopId;
    if (!barbershopId) {
      const Barbershop = (await import('@/models/Barbershop')).default;
      const defaultShop = await Barbershop.findOne({});
      if (defaultShop) barbershopId = defaultShop._id;
    }

    let updatedProduct = null;
    if (barbershopId) {
      const bId = mongoose.Types.ObjectId.isValid(barbershopId) ? new mongoose.Types.ObjectId(barbershopId) : barbershopId;
      updatedProduct = await Product.findOneAndUpdate(
        { _id: filterId, barbershopId: bId },
        { $set: updateData }, 
        { new: true }
      );
    }

    // Fallback por _id direto se barbershopId não bateu ou é nulo
    if (!updatedProduct) {
      updatedProduct = await Product.findByIdAndUpdate(filterId, { $set: updateData }, { new: true });
    }
    
    if (!updatedProduct) {
      return NextResponse.json({ message: 'Product not found', id }, { status: 404 });
    }

    return NextResponse.json(updatedProduct);
  } catch (error: any) {
    console.error('Error updating product:', error);
    return NextResponse.json({ message: error?.message || 'Error updating product' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (!session || (role !== 'admin' && role !== 'superadmin')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectToDatabase();

    let barbershopId = (session.user as any).barbershopId;
    if (!barbershopId) {
      const Barbershop = (await import('@/models/Barbershop')).default;
      const defaultShop = await Barbershop.findOne({});
      if (defaultShop) barbershopId = defaultShop._id;
    }

    let deletedProduct = null;
    if (barbershopId) {
      deletedProduct = await Product.findOneAndDelete({ 
        _id: id, 
        barbershopId 
      });
    }

    if (!deletedProduct) {
      deletedProduct = await Product.findByIdAndDelete(id);
    }
    
    if (!deletedProduct) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Product deleted' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ message: 'Error deleting product' }, { status: 500 });
  }
}

