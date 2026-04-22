// api/onboarding/route.ts
import { getServerToken } from '@/lib/session';
import { getOnboardingSlides } from '@/services/onboarding';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const token = await getServerToken();
    
    // Si necesitas que sea estrictamente privado, podrías validar el token aquí
    const data = await getOnboardingSlides(token);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error("API Onboarding Error:", error);
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}