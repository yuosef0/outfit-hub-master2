import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseServer } from '@/lib/supabaseServer';
import { z } from 'zod';

const storeUpdateSchema = z.object({
  name: z.string().min(3).optional(),
  description: z.string().optional(),
  address: z.string().min(5).optional(),
  maps_link: z.string().url().optional(),
  category: z.string().optional(),
  logo_url: z.string().url().optional(),
});

// GET /api/stores/[id] - Get store details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: store, error } = await supabase
      .from('stores')
      .select('*, users(full_name, email)')
      .eq('id', params.id)
      .single();

    if (error || !store) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      );
    }

    // Get store products
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', params.id)
      .eq('is_active', true);

    // Get store reviews
    const { data: reviews } = await supabase
      .from('reviews')
      .select('*, users(full_name, avatar_url)')
      .eq('store_id', params.id);

    return NextResponse.json({
      store,
      products: products || [],
      reviews: reviews || [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/stores/[id] - Update store
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = storeUpdateSchema.parse(body);

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

    // Verify ownership
    const { data: store } = await supabaseServer
      .from('stores')
      .select('merchant_id')
      .eq('id', params.id)
      .single();

    if (!store || store.merchant_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to update this store' },
        { status: 403 }
      );
    }

    // Update store
    const { data: updatedStore, error: updateError } = await supabaseServer
      .from('stores')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: 'Store updated successfully',
      store: updatedStore,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
