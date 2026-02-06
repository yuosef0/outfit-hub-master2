import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseServer } from '@/lib/supabaseServer';
import { z } from 'zod';

const reviewUpdateSchema = z.object({
  rating: z.number().min(1).max(5).optional(),
  comment: z.string().optional(),
});

// PUT /api/reviews/[id] - Update review
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = reviewUpdateSchema.parse(body);

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
    const { data: review } = await supabaseServer
      .from('reviews')
      .select('customer_id')
      .eq('id', params.id)
      .single();

    if (!review || review.customer_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to update this review' },
        { status: 403 }
      );
    }

    // Update review
    const { data: updatedReview, error: updateError } = await supabaseServer
      .from('reviews')
      .update(validatedData)
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
      message: 'Review updated successfully',
      review: updatedReview,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/reviews/[id] - Delete review
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
    const { data: review } = await supabaseServer
      .from('reviews')
      .select('customer_id')
      .eq('id', params.id)
      .single();

    if (!review || review.customer_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this review' },
        { status: 403 }
      );
    }

    // Delete review
    const { error: deleteError } = await supabaseServer
      .from('reviews')
      .delete()
      .eq('id', params.id);

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: 'Review deleted successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
