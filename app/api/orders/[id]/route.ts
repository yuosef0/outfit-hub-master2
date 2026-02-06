import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseServer } from '@/lib/supabaseServer';
import { z } from 'zod';

const orderStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'completed', 'cancelled']),
});

// GET /api/orders/[id] - Get order details
export async function GET(
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

    const { data: order, error } = await supabaseServer
      .from('orders')
      .select('*, stores(name, logo_url, address), users(full_name, email, phone)')
      .eq('id', params.id)
      .single();

    if (error || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Verify access rights
    const { data: profile } = await supabaseServer
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const isCustomer = order.customer_id === user.id;
    const isMerchant = profile?.role === 'merchant';

    if (!isCustomer && isMerchant) {
      // Verify merchant owns the store
      const { data: store } = await supabaseServer
        .from('stores')
        .select('merchant_id')
        .eq('id', order.store_id)
        .single();

      if (!store || store.merchant_id !== user.id) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        );
      }
    } else if (!isCustomer && !isMerchant) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get order items
    const { data: items } = await supabaseServer
      .from('order_items')
      .select('*, products(name, image_urls, price)')
      .eq('order_id', params.id);

    return NextResponse.json({
      order,
      items: items || [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/orders/[id] - Update order status
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = orderStatusSchema.parse(body);

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

    // Get order
    const { data: order } = await supabaseServer
      .from('orders')
      .select('*, stores(merchant_id)')
      .eq('id', params.id)
      .single();

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Only merchant can update order status
    if (order.stores.merchant_id !== user.id) {
      return NextResponse.json(
        { error: 'Only the merchant can update order status' },
        { status: 403 }
      );
    }

    // Update order
    const updateData: any = {
      status: validatedData.status,
    };

    if (validatedData.status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    const { data: updatedOrder, error: updateError } = await supabaseServer
      .from('orders')
      .update(updateData)
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
      message: 'Order updated successfully',
      order: updatedOrder,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
