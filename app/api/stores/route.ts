import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseServer } from '@/lib/supabaseServer';
import { z } from 'zod';

const storeSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  address: z.string().min(5),
  maps_link: z.string().url().optional(),
  category: z.string(),
  logo_url: z.string().url().optional(),
});

// GET /api/stores - Get all stores
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const isActive = searchParams.get('is_active');

    let query = supabase
      .from('stores')
      .select('*, users(full_name, email)');

    if (category) {
      query = query.eq('category', category);
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ stores: data });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/stores - Create store
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = storeSchema.parse(body);

    // Get authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'No authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user is a merchant
    const { data: profile } = await supabaseServer
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'merchant') {
      return NextResponse.json(
        { error: 'Only merchants can create stores' },
        { status: 403 }
      );
    }

    // Create store
    const { data: store, error: storeError } = await supabaseServer
      .from('stores')
      .insert({
        ...validatedData,
        merchant_id: user.id,
        subscription_plan: 'basic',
        is_active: false, // Admin needs to activate
      })
      .select()
      .single();

    if (storeError) {
      return NextResponse.json(
        { error: storeError.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Store created successfully', store },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
