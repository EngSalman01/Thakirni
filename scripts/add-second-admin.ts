import { createClient } from '@supabase/supabase-js';

// Credentials come from the environment — never hardcode them.
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD before running this script');
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createSecondAdminUser() {
  try {
    console.log(`Creating second admin user: ${ADMIN_EMAIL}`);

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
      console.error('Auth error:', authError);
      throw authError;
    }

    console.log('User created in Auth:', authUser.user?.id);

    // Create admin profile in the database
    if (authUser.user) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: authUser.user.id,
            is_admin: true,
            role: 'admin',
            subscription_type: 'admin',
          },
        ])
        .select();

      if (profileError && !profileError.message.includes('duplicate')) {
        console.error('Profile error:', profileError);
        // Continue anyway - user is created
      }

      console.log('Admin profile created:', profile);

      console.log('\n✓ Second admin user created successfully!');
      console.log(`Email: ${ADMIN_EMAIL}`);
      console.log('User ID: ' + authUser.user.id);
      console.log('Role: Admin (Full Access to All Subscriptions)');
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createSecondAdminUser();
