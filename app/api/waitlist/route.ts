import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, plan, country } = body;

    // Validate email
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, message: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Get Supabase client
    const supabase = await createClient();

    // Check if email already exists in waitlist
    const { data: existing } = await supabase
      .from('waitlist')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      return NextResponse.json(
        { 
          success: true, 
          message: 'Email already on waitlist',
          new: false 
        }
      );
    }

    // Add to waitlist
    const { data, error } = await supabase
      .from('waitlist')
      .insert({
        email,
        plan: plan || 'individual',
        country: country || 'SA',
        joined_at: new Date().toISOString(),
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('[v0] Waitlist insert error:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        email,
        plan
      });
      return NextResponse.json(
        { 
          success: false, 
          message: `Database error: ${error.message || 'Failed to add to waitlist'}`,
          error: error.code 
        },
        { status: 500 }
      );
    }

    // Send confirmation email (optional - you can integrate with Resend, SendGrid, etc.)
    // For now, we just return success
    
    return NextResponse.json({
      success: true,
      message: 'Successfully added to waitlist',
      new: true,
    });
  } catch (error) {
    console.error('Waitlist API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
