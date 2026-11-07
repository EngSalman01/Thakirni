import fetch from 'node-fetch';

// Credentials come from the environment — never hardcode them.
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD before running this script');
}

const API_URL = process.env.API_URL || 'http://localhost:3000';

async function createAdminUser() {
  try {
    console.log(`Creating admin user: ${ADMIN_EMAIL}`);
    
    const response = await fetch(`${API_URL}/api/admin/create-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        isAdmin: true,
      }),
    });

    const data = await response.json() as { success: boolean; user?: { id: string; email: string; isAdmin: boolean }; error?: string };

    if (response.ok && data.success) {
      console.log('Admin user created successfully!');
      console.log('User ID:', data.user?.id);
      console.log('Email:', data.user?.email);
      console.log('Is Admin:', data.user?.isAdmin);
    } else {
      console.error('Error:', data.error);
      process.exit(1);
    }
  } catch (error) {
    console.error('Failed to create admin user:', error);
    process.exit(1);
  }
}

createAdminUser();
