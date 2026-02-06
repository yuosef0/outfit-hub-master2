import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseServer } from '@/lib/supabaseServer';
import { productSchema } from '@/lib/validators';

// GET /api/products/[id] - Get single product
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: product, error } = await supabase
      .from('products')
      .select('*, stores(id, name, logo_url, address, maps_link)')
      .eq('id', params.id)
      .single();

    if (error || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Get product reviews
    const { data: reviews } = await supabase
      .from('reviews')
      .select('*, users(full_name, avatar_url)')
      .eq('product_id', params.id);

    return NextResponse.json({
      product,
      reviews: reviews || [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/products/[id] - Update product
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = productSchema.partial().parse(body);

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
    const { data: product } = await supabaseServer
      .from('products')
      .select('*, stores!inner(merchant_id)')
      .eq('id', params.id)
      .single();

    if (!product || product.stores.merchant_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to update this product' },
        { status: 403 }
      );
    }

    // Update product
    const { data: updatedProduct, error: updateError } = await supabaseServer
      .from('products')
      .update({
        ...validatedData,
        image_urls: body.image_urls,
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
      message: 'Product updated successfully',
      product: updatedProduct,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] - Delete product
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Verify ownership
    const { data: product } = await supabaseServer
      .from('products')
      .select('*, stores!inner(merchant_id)')
      .eq('id', params.id)
      .single();

    if (!product || product.stores.merchant_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this product' },
        { status: 403 }
      );
    }

    // Delete product
    const { error: deleteError } = await supabaseServer
      .from('products')
      .delete()
      .eq('id', params.id);

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: 'Product deleted successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
