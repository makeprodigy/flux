const BACKEND_URL = 'https://assignment-flux.onrender.com';

async function testApi() {
  console.log("=== Testing Live Flux API ===");
  try {
    const timestamp = Date.now();
    const email = `testuser_${timestamp}@example.com`;
    const password = 'password123';
    
    // 1. Register
    console.log(`\n1. Registering user ${email}...`);
    const regRes = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test User', email, password, role: 'teacher' })
    });
    console.log(`Status: ${regRes.status}`);
    const regData = await regRes.json();
    console.log("Response:", JSON.stringify(regData));
    
    if (regRes.status !== 201) throw new Error("Registration failed - Database connection might be broken");
    
    const cookies = regRes.headers.get('set-cookie');
    console.log("Cookies received:", cookies ? "Yes" : "No");

    // 2. Get Me (Auth Check)
    console.log(`\n2. Fetching /api/auth/me to verify session...`);
    const meRes = await fetch(`${BACKEND_URL}/api/auth/me`, {
      headers: { 'Cookie': cookies }
    });
    console.log(`Status: ${meRes.status}`);
    const meData = await meRes.json();
    console.log("Response:", JSON.stringify(meData));

    // 3. Create Assignment (Triggers Redis & BullMQ)
    console.log(`\n3. Creating an assignment to test Redis queues and AI Generation...`);
    const assignmentPayload = {
      subject: "Science",
      topic: "Photosynthesis",
      className: "8th Grade",
      schoolName: "Test School",
      timeAllowed: "30 mins",
      dueDate: "2024-12-31T23:59:59.000Z",
      totalMarks: 20,
      difficulty: "medium",
      questionTypes: [{ type: "Multiple Choice Questions", count: 2, marks: 1 }]
    };
    
    const createRes = await fetch(`${BACKEND_URL}/api/assignments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': cookies },
      body: JSON.stringify(assignmentPayload)
    });
    console.log(`Status: ${createRes.status}`);
    const createData = await createRes.json();
    console.log("Response:", JSON.stringify(createData));

    if (!createData.data || !createData.data.jobId) {
       console.log("❌ No jobId returned! The Redis connection or Queue might be failing.");
       return;
    }
    
    const jobId = createData.data.jobId;
    
    // 4. Poll Result
    console.log(`\n4. Polling result for jobId: ${jobId} (Waiting for background worker)...`);
    let attempts = 0;
    let success = false;
    while(attempts < 15) {
       await new Promise(resolve => setTimeout(resolve, 3000));
       const resRes = await fetch(`${BACKEND_URL}/api/results/${jobId}`, {
          headers: { 'Cookie': cookies }
       });
       const resData = await resRes.json();
       
       if (resRes.status === 200 && resData.success) {
           console.log(`✅ Attempt ${attempts + 1}: Assignment generated successfully!`);
           console.log("Paper sections:", resData.data.paper?.sections?.length || 0);
           success = true;
           break;
       } else {
           console.log(`⏳ Attempt ${attempts + 1}: Job still pending...`);
       }
       attempts++;
    }
    
    if (!success) {
        console.log("❌ Job timed out or failed. Check Render logs for Gemini AI or Redis worker errors.");
    }

  } catch(e) {
    console.error("Test Error:", e);
  }
}

testApi();
