import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseServer } from '@/lib/supabaseServer';
import { z } from 'zod';

const wishlistSchema = z.object({
  product_id: z.string().uuid(),
});

// GET /api/wishlist - Get wishlist
export async function GET(request: NextRequest) {
  try {
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

    const { data, error } = await supabaseServer
      .from('wishlist')
      .select('*, products(*, stores(name, logo_url))')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ wishlist: data });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/wishlist - Add to wishlist
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = wishlistSchema.parse(body);

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

    // Check if already in wishlist
    const { data: existing } = await supabaseServer
      .from('wishlist')
      .select('id')
      .eq('customer_id', user.id)
      .eq('product_id', validatedData.product_id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Product already in wishlist' },
        { status: 400 }
      );
    }

    // Add to wishlist
    const { data: wishlistItem, error: wishlistError } = await supabaseServer
      .from('wishlist')
      .insert({
        customer_id: user.id,
        product_id: validatedData.product_id,
      })
      .select()
      .single();

    if (wishlistError) {
      return NextResponse.json(
        { error: wishlistError.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Product added to wishlist', wishlistItem },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
