// Deletes all assignments + results for the demo user so the account is clean
const BACKEND_URL = 'https://assignment-flux.onrender.com';

async function clearDemo() {
  console.log('=== Clearing Demo Account Data ===\n');

  // Login
  const loginRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'demo@flux.app', password: 'Demo@1234', role: 'teacher' }),
  });
  const loginData = await loginRes.json();
  const token = loginData.data?.token;
  if (!token) throw new Error('Login failed: ' + JSON.stringify(loginData));
  console.log('✅ Logged in as demo@flux.app');

  // Get all assignments
  const listRes = await fetch(`${BACKEND_URL}/api/assignments`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const listData = await listRes.json();
  const assignments = listData.data || [];
  console.log(`Found ${assignments.length} assignments to delete...`);

  // Delete each one
  let deleted = 0;
  for (const a of assignments) {
    const id = a._id;
    const delRes = await fetch(`${BACKEND_URL}/api/assignments/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (delRes.ok) deleted++;
  }

  console.log(`✅ Deleted ${deleted}/${assignments.length} assignments`);
  console.log('\nDemo account is now clean — no pre-loaded data!');
}

clearDemo().catch(console.error);
