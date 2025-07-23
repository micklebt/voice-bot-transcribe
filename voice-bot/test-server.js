const http = require('http');

function testServerEndpoint() {
  console.log('🔍 Testing Server TTS Endpoint...');
  
  const postData = JSON.stringify({
    intent: 'pricing_inquiry',
    userText: 'How much do your dumpsters cost?'
  });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/test-tts',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers: ${JSON.stringify(res.headers)}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Response Body:');
      console.log(data);
    });
  });

  req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
  });

  req.write(postData);
  req.end();
}

testServerEndpoint(); 