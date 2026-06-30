// Creates a demo teacher user + seeds their assignments via the live API
const BACKEND_URL = 'http://localhost:4000';

const DEMO_EMAIL = 'demo@flux.app';
const DEMO_PASSWORD = 'Demo@1234';
const DEMO_NAME = 'Demo Teacher';

async function seedDemo() {
  console.log('=== Seeding Demo User on Production ===\n');

  // 1. Try registering (will fail if already exists, that's OK)
  console.log(`1. Creating demo user: ${DEMO_EMAIL}`);
  const regRes = await fetch(`${BACKEND_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: DEMO_NAME,
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      role: 'teacher',
      schoolName: 'Springfield Academy',
      schoolLocation: 'New Delhi, India',
    }),
  });

  let token = null;

  if (regRes.status === 201) {
    const data = await regRes.json();
    token = data.data.token;
    console.log('✅ Demo user created successfully!');
  } else if (regRes.status === 409) {
    console.log('ℹ️  Demo user already exists, logging in instead...');
    // Login
    const loginRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: DEMO_EMAIL, password: DEMO_PASSWORD, role: 'teacher' }),
    });
    if (!loginRes.ok) throw new Error('Login failed: ' + await loginRes.text());
    const data = await loginRes.json();
    token = data.data.token;
    console.log('✅ Logged in as demo user');
  } else {
    const text = await regRes.text();
    throw new Error(`Registration failed (${regRes.status}): ${text}`);
  }

  // 2. Seed demo assignments
  console.log('\n2. Seeding 15 demo assignments...');
  const seedRes = await fetch(`${BACKEND_URL}/api/assignments/seed`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  const seedData = await seedRes.json();
  if (seedRes.ok) {
    console.log('✅', seedData.message);
  } else {
    console.log('ℹ️  Seed response:', JSON.stringify(seedData));
  }

  console.log('\n=== Done! ===');
  console.log(`\nDemo credentials for the login page:`);
  console.log(`  Email:    ${DEMO_EMAIL}`);
  console.log(`  Password: ${DEMO_PASSWORD}`);
}

seedDemo().catch(console.error);
