import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseServer } from '@/lib/supabaseServer';
import { productSchema } from '@/lib/validators';

// GET /api/products - Fetch products with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const gender = searchParams.get('gender');
    const storeId = searchParams.get('store_id');
    const search = searchParams.get('search');
    const minPrice = searchParams.get('min_price');
    const maxPrice = searchParams.get('max_price');

    let query = supabase
      .from('products')
      .select('*, stores(id, name, logo_url)')
      .eq('is_active', true);

    if (category) {
      query = query.eq('category', category);
    }

    if (gender) {
      query = query.eq('gender_filter', gender);
    }

    if (storeId) {
      query = query.eq('store_id', storeId);
    }

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    if (minPrice) {
      query = query.gte('price', parseFloat(minPrice));
    }

    if (maxPrice) {
      query = query.lte('price', parseFloat(maxPrice));
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ products: data });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/products - Create product (merchant only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = productSchema.parse(body);

    // Get authorization header
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

    // Verify user is a merchant and owns the store
    const { data: store, error: storeError } = await supabaseServer
      .from('stores')
      .select('*')
      .eq('id', body.store_id)
      .eq('merchant_id', user.id)
      .single();

    if (storeError || !store) {
      return NextResponse.json(
        { error: 'Store not found or unauthorized' },
        { status: 403 }
      );
    }

    // Create product
    const { data: product, error: productError } = await supabaseServer
      .from('products')
      .insert({
        ...validatedData,
        store_id: body.store_id,
        image_urls: body.image_urls || [],
      })
      .select()
      .single();

    if (productError) {
      return NextResponse.json(
        { error: productError.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Product created successfully', product },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
