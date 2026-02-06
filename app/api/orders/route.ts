import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseServer } from '@/lib/supabaseServer';
import { z } from 'zod';

const orderSchema = z.object({
  store_id: z.string().uuid(),
  items: z.array(z.object({
    product_id: z.string().uuid(),
    quantity: z.number().positive(),
    price: z.number().positive(),
  })),
  total_amount: z.number().positive(),
});

// Helper function to generate unique pickup code
function generatePickupCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

// GET /api/orders - List orders
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

    // Check if user is merchant or customer
    const { data: profile } = await supabaseServer
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    let query = supabaseServer
      .from('orders')
      .select('*, stores(name, logo_url), users(full_name, email)');

    if (profile?.role === 'merchant') {
      // Merchant sees orders for their stores
      const { data: stores } = await supabaseServer
        .from('stores')
        .select('id')
        .eq('merchant_id', user.id);

      const storeIds = stores?.map(s => s.id) || [];
      query = query.in('store_id', storeIds);
    } else {
      // Customer sees their own orders
      query = query.eq('customer_id', user.id);
    }

    const { data: orders, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // Get order items for each order
    const ordersWithItems = await Promise.all(
      (orders || []).map(async (order) => {
        const { data: items } = await supabaseServer
          .from('order_items')
          .select('*, products(name, image_urls)')
          .eq('order_id', order.id);

        return { ...order, items: items || [] };
      })
    );

    return NextResponse.json({ orders: ordersWithItems });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/orders - Create order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = orderSchema.parse(body);

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

    // Generate unique pickup code
    const pickupCode = generatePickupCode();

    // Create order
    const { data: order, error: orderError } = await supabaseServer
      .from('orders')
      .insert({
        customer_id: user.id,
        store_id: validatedData.store_id,
        total_amount: validatedData.total_amount,
        status: 'pending',
        pickup_code: pickupCode,
      })
      .select()
      .single();

    if (orderError) {
      return NextResponse.json(
        { error: orderError.message },
        { status: 400 }
      );
    }

    // Create order items
    const orderItems = validatedData.items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price,
    }));

    const { error: itemsError } = await supabaseServer
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      return NextResponse.json(
        { error: itemsError.message },
        { status: 400 }
      );
    }

    // Update product stock quantities
    for (const item of validatedData.items) {
      const { data: product } = await supabaseServer
        .from('products')
        .select('stock_quantity')
        .eq('id', item.product_id)
        .single();

      if (product) {
        await supabaseServer
          .from('products')
          .update({ stock_quantity: product.stock_quantity - item.quantity })
          .eq('id', item.product_id);
      }
    }

    return NextResponse.json(
      {
        message: 'Order created successfully',
        order,
        pickup_code: pickupCode,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
