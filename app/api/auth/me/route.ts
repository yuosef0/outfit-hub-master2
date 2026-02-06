import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    let user = null;
    let error = null;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const result = await supabase.auth.getUser(token);
      user = result.data.user;
      error = result.error;
    } else {
      // Fallback to cookie check if no header (though client sends header)
      const result = await supabase.auth.getUser();
      user = result.data.user;
      error = result.error;
    }

    if (error || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check if user has a store (is a merchant)
    const { data: store } = await supabase
      .from('stores')
      .select('id, name')
      .eq('merchant_id', user.id)
      .single();

    // Build profile object
    const profile = {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || store?.name || '',
      role: store ? 'merchant' : 'customer',
    };

    return NextResponse.json({
      user: user,
      profile: profile,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
