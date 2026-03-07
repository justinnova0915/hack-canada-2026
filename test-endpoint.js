async function testEndpoint() {
  try {
    const res = await fetch('https://api-dxtzkxil5q-uc.a.run.app/api/upload-receipt-base64', {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg=='
      })
    });
    
    const data = await res.json();
    console.log('STATUS:', res.status);
    console.log('RESPONSE:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('ERROR:', err.message);
  }
}

testEndpoint();
