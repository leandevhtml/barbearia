import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import Barbershop from '@/models/Barbershop';
import User from '@/models/User';

// GET /api/superadmin/barbershops
// Retorna a lista de todas as barbearias (Apenas superadmin)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== 'superadmin') {
      return NextResponse.json({ error: 'Acesso restrito' }, { status: 403 });
    }

    await connectToDatabase();

    const barbershops = await Barbershop.find().sort({ createdAt: -1 }).lean();
    
    // Obter estatísticas adicionais (ex: total de usuários por barbearia)
    const barbershopsWithStats = await Promise.all(
      barbershops.map(async (shop) => {
        const adminUser = await User.findOne({ barbershopId: shop._id, role: 'admin' }).lean();
        const totalBarbers = await User.countDocuments({ barbershopId: shop._id, role: 'barber' });
        
        return {
          ...shop,
          adminEmail: adminUser?.email || shop.ownerEmail,
          totalBarbers,
        };
      })
    );

    return NextResponse.json(barbershopsWithStats);
  } catch (error) {
    console.error('Erro no superadmin:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
