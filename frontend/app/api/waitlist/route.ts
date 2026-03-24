import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { limiters, rateLimitResponse } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  // Rate limit by IP: 5 attempts per 10 minutes
  const ip = request.headers.get("x-forwarded-for") ?? "unknown"
  const rl = limiters.auth(ip)
  if (!rl.success) return rateLimitResponse(rl.reset)

  try {
    const body = await request.json();
    const { email, plan, country } = body;

    // Validate email with a proper regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Sanitize plan and country to allowed values only (matches plan_type column constraint)
    const allowedPlans = ['free', 'individual', 'company']
    const safePlan = allowedPlans.includes(plan) ? plan : 'free'
    const safeCountry = typeof country === 'string' && country.length === 2 ? country.toUpperCase() : 'SA'

    // Get Supabase admin client with service role key
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { success: false, message: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

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

    // Add to waitlist (columns: email, plan_type, country, status, created_at)
    const { data, error } = await supabase
      .from('waitlist')
      .insert({
        email,
        plan_type: safePlan,
        country: safeCountry,
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
