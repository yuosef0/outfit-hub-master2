import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseServer } from '@/lib/supabaseServer';
import { z } from 'zod';

const reviewSchema = z.object({
  store_id: z.string().uuid().optional(),
  product_id: z.string().uuid().optional(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
}).refine(data => data.store_id || data.product_id, {
  message: 'Either store_id or product_id must be provided',
});

// GET /api/reviews - List reviews
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('store_id');
    const productId = searchParams.get('product_id');

    let query = supabase
      .from('reviews')
      .select('*, users(full_name, avatar_url), stores(name), products(name)');

    if (storeId) {
      query = query.eq('store_id', storeId);
    }

    if (productId) {
      query = query.eq('product_id', productId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ reviews: data });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/reviews - Create review
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = reviewSchema.parse(body);

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

    // Create review
    const { data: review, error: reviewError } = await supabaseServer
      .from('reviews')
      .insert({
        customer_id: user.id,
        store_id: validatedData.store_id,
        product_id: validatedData.product_id,
        rating: validatedData.rating,
        comment: validatedData.comment,
      })
      .select()
      .single();

    if (reviewError) {
      return NextResponse.json(
        { error: reviewError.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Review created successfully', review },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
