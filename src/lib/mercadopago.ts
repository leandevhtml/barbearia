import { MercadoPagoConfig, Preference } from 'mercadopago';
import connectToDatabase from './mongodb';
import GlobalSetting from '@/models/Settings';

export async function getMercadoPagoClient() {
  await connectToDatabase();
  const settings = await GlobalSetting.findOne({});
  
  if (!settings || !settings.mpAccessToken) {
    throw new Error('Mercado Pago Access Token not configured');
  }

  const client = new MercadoPagoConfig({ 
    accessToken: settings.mpAccessToken,
    options: { timeout: 5000 }
  });

  return client;
}
