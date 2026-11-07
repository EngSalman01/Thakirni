import { createClient } from '@supabase/supabase-js';

// Credentials come from the environment — never hardcode them.
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD before running this script');
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createAdminUser() {
  try {
    console.log(`[v0] Creating admin user: ${ADMIN_EMAIL}`);

    // Create the user in Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: {
        role: 'admin',
        is_admin: true,
      },
    });

    if (authError) {
      console.error('[v0] Auth error:', authError);
      throw authError;
    }

    console.log('[v0] User created in Auth:', authUser.user?.id);

    // Create admin profile in the database
    if (authUser.user) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: authUser.user.id,
            email: ADMIN_EMAIL,
            is_admin: true,
            role: 'admin',
            subscription_type: 'admin',
          },
        ])
        .select();

      if (profileError && !profileError.message.includes('duplicate')) {
        console.error('[v0] Profile error:', profileError);
        throw profileError;
      }

      console.log('[v0] Admin profile created:', profile);

      console.log('\n✓ Admin user created successfully!');
      console.log(`Email: ${ADMIN_EMAIL}`);
      console.log('Role: Admin (Full Access)');
    }
  } catch (error) {
    console.error('[v0] Error creating admin user:', error);
    process.exit(1);
  }
}

createAdminUser();
