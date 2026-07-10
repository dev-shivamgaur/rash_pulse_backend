const autocannon = require('autocannon');

function startTest() {
  const url = 'http://localhost:8000/api/v1/flash-sale/book'; // Aapka API endpoint

  const instance = autocannon({
    url,
    connections: 1000,      // 100 concurrent users ek sath active rahenge
    duration: 15,          // Test 10 seconds tak chalega
    pipelining: 1,         // Standard HTTP pipelining
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    // 📦 Postman wala Body payload yahan jayega DTO format mein
    body: JSON.stringify({
      productId: 'iphone_15_pro' // Yeh wahi ID honi chahiye jo aapne sale start karte waqt set ki thi
    })
  }, (err, result) => {
    if (err) {
      console.error('🔴 Test fail ho gaya:', err);
    } else {
      console.log('🏁 Test Khatam! Yeh rahe aapke results:');
    }
  });

  // 📈 Live updates dekhne ke liye console par output print karein
  autocannon.track(instance, { renderProgressBar: true });
}

console.log('🚀 Autocannon Load Test Shuru ho raha hai...');
startTest();