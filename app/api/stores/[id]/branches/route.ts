import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const branchSchema = z.object({
  name: z.string().min(2),
  address: z.string().min(3),
  governorate: z.string().min(1),
  district: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  maps_link: z.union([z.string().url(), z.literal(''), z.null()]).optional(),
});

// GET /api/stores/[id]/branches - List all branches for a store
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: branches, error } = await supabaseServer
      .from('store_branches')
      .select('*')
      .eq('store_id', id)
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) {
      // Table may not exist yet - return empty array instead of error
      console.error('store_branches query error:', error.message);
      return NextResponse.json({ branches: [] }, {
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
      });
    }

    return NextResponse.json({ branches: branches || [] }, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/stores/[id]/branches - Create a new branch
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = branchSchema.parse(body);

    // Get authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'No authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token);

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
      .eq('id', id)
      .single();

    if (!store || store.merchant_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to manage this store' },
        { status: 403 }
      );
    }

    // Insert branch
    const { data: branch, error: insertError } = await supabaseServer
      .from('store_branches')
      .insert({
        store_id: id,
        name: validatedData.name,
        address: validatedData.address,
        governorate: validatedData.governorate,
        district: validatedData.district || null,
        phone: validatedData.phone || null,
        maps_link: validatedData.maps_link || null,
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: 'A branch already exists in this location' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: insertError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: 'Branch created successfully',
      branch,
    }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/stores/[id]/branches - Update a branch
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { branchId, ...updateData } = body;

    if (!branchId) {
      return NextResponse.json(
        { error: 'branchId is required' },
        { status: 400 }
      );
    }

    const validatedData = branchSchema.parse(updateData);

    // Get authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'No authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token);

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
      .eq('id', id)
      .single();

    if (!store || store.merchant_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to manage this store' },
        { status: 403 }
      );
    }

    // Update branch
    const { data: branch, error: updateError } = await supabaseServer
      .from('store_branches')
      .update({
        name: validatedData.name,
        address: validatedData.address,
        governorate: validatedData.governorate,
        district: validatedData.district || null,
        phone: validatedData.phone || null,
        maps_link: validatedData.maps_link || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', branchId)
      .eq('store_id', id)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === '23505') {
        return NextResponse.json(
          { error: 'A branch already exists in this location' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: updateError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: 'Branch updated successfully',
      branch,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/stores/[id]/branches - Delete a branch
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId');

    if (!branchId) {
      return NextResponse.json(
        { error: 'branchId is required' },
        { status: 400 }
      );
    }

    // Get authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'No authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token);

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
      .eq('id', id)
      .single();

    if (!store || store.merchant_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to manage this store' },
        { status: 403 }
      );
    }

    // Delete branch
    const { error: deleteError } = await supabaseServer
      .from('store_branches')
      .delete()
      .eq('id', branchId)
      .eq('store_id', id);

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: 'Branch deleted successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
