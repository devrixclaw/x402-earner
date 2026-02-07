const fetch = require('node-fetch');

const ENDPOINTS = [
  'https://x402-earner.onrender.com/',
  'https://x402-earner.onrender.com/api/services',
  'https://x402-earner.onrender.com/health',
  'https://x402-earner.onrender.com/earn/code-review'
];

async function verifyDeployment() {
  console.log('🔍 Verifying x402-earner deployment...\n');
  
  for (const endpoint of ENDPOINTS) {
    try {
      console.log(`Testing: ${endpoint}`);
      const response = await fetch(endpoint);
      console.log(`  Status: ${response.status}`);
      
      if (response.ok || response.status === 402) {
        console.log('  ✅ Working correctly');
        
        if (response.headers.get('x402-required')) {
          console.log(`  💰 x402 payment header present: ${response.headers.get('x402-amount')} USDC`);
        }
      } else {
        console.log('  ❌ Not responding correctly');
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    }
    console.log('');
  }
}

if (require.main === module) {
  verifyDeployment();
}

module.exports = { verifyDeployment };