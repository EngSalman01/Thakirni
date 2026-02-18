import fetch from 'node-fetch';

const API_URL = process.env.API_URL || 'http://localhost:3000';

async function createAdminUser() {
  try {
    console.log('[v0] Creating admin user: salman.rm03@gmail.com');
    
    const response = await fetch(`${API_URL}/api/admin/create-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'salman.rm03@gmail.com',
        password: 'AdminSalman@123456',
        isAdmin: true,
      }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      console.log('[v0] Admin user created successfully!');
      console.log('[v0] User ID:', data.user.id);
      console.log('[v0] Email:', data.user.email);
      console.log('[v0] Is Admin:', data.user.isAdmin);
    } else {
      console.error('[v0] Error:', data.error);
      process.exit(1);
    }
  } catch (error) {
    console.error('[v0] Failed to create admin user:', error);
    process.exit(1);
  }
}

createAdminUser();
