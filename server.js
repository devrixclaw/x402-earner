// x402 Revenue Auto-pay Server for 8uWJWAnmnmv1DcZ8hQu62E9d4Mg8oB2aYhLTSQ5UgxFs
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

const services = {
  'code-review': { price: '5000000', service: 'AI Code Review', description: 'Full PR review with USDC - $5' },
  'ci-fix': { price: '15000000', service: 'CI/CD Fix', description: 'Emergency pipeline repair - $15' },
  'script': { price: '10000000', service: 'Shell Script', description: 'Quick automation script - $10' },
  'debug': { price: '8000000', service: 'Debug Session', description: '15min problem-solving - $8' }
};

// Health check endpoint for Render
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Root endpoint with service listing
app.get('/', (req, res) => {
  res.json({
    message: 'x402 Revenue System Active',
    wallet: '8uWJWAnmnmv1DcZ8hQu62E9d4Mg8oB2aYhLTSQ5UgxFs',
    services: Object.keys(services).map(key => ({
      endpoint: `/api/${key}`,
      ...services[key]
    }))
  });
});

// Service endpoints with x402 payment headers
Object.keys(services).forEach(service => {
  app.get(`/api/${service}`, (req, res) => {
    const x402 = `x402:addr:8uWJWAnmnmv1DcZ8hQu62E9d4Mg8oB2aYhLTSQ5UgxFs;amount:${services[service].price}`;
    res.set('x402', x402);
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Expose-Headers', 'x402');
    res.json({
      ...services[service],
      pay_url: `https://x402.dev/pay?service=${service}&wallet=8uWJWAnmnmv1DcZ8hQu62E9d4Mg8oB2aYhLTSQ5UgxFs`
    });
  });
});

// Payment confirmation webhook (for x402 callbacks)
app.post('/webhook/paid', express.raw({type: 'application/json'}), (req, res) => {
  console.log('Payment received:', req.body.toString());
  res.json({ received: true });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`x402 revenue server active on port ${PORT}`);
});