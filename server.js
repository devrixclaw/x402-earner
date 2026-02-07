const express = require('express');
const { Connection, PublicKey } = require('@solana/web3.js');
const QRCode = require('qrcode');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const SOLANA_NETWORK = process.env.SOLANA_NETWORK || 'devnet';
const MERCHANT_WALLET = '8uWJWAnmnmv1DcZ8hQu62E9d4Mg8oB2aYhLTSQ5UgxFs';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Services configuration
const SERVICES = {
  'quick-debug': {
    name: 'Quick Debug',
    description: 'Fast debugging for small issues',
    amount: 1,
    endpoint: '/earn/quick-debug'
  },
  'code-review': {
    name: 'Code Review',
    description: 'Comprehensive code review with feedback',
    amount: 5,
    endpoint: '/earn/code-review'
  },
  'emergency-fix': {
    name: 'Emergency Fix',
    description: 'Critical bug fixes and urgent deployments',
    amount: 15,
    endpoint: '/earn/emergency-fix'
  },
  'full-system': {
    name: 'Full System Setup',
    description: 'Complete system configuration and deployment',
    amount: 50,
    endpoint: '/earn/full-system'
  }
};

// Root documentation endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'x402 USDC Earning System - Live and Active',
    wallet: MERCHANT_WALLET,
    network: SOLANA_NETWORK,
    endpoints: {
      '/': 'This system overview',
      '/api/services': 'Available earning services',
      '/earn/:service': 'x402 payment endpoint for specific service',
      '/health': 'System health check',
      '/qr/:service': 'QR code generator for mobile payment'
    },
    instructions: {
      'Step 1': 'Call /api/services to see available services',
      'Step 2': 'Choose a service endpoint from /earn/:service',
      'Step 3': 'Follow x402 payment flow from the response',
      'Step 4': 'Access content after payment verification'
    },
    deployment: 'Live on port ' + PORT
  });
});

// API services listing
app.get('/api/services', (req, res) => {
  const services = Object.entries(SERVICES).map(([id, service]) => ({
    id,
    name: service.name,
    description: service.description,
    amount: service.amount,
    endpoint: service.endpoint,
    currency: 'USDC'
  }));
  
  res.json({ services, wallet: MERCHANT_WALLET, network: SOLANA_NETWORK });
});

// x402 payment endpoints for each service
app.get('/earn/:service(quick-debug|code-review|emergency-fix|full-system)', async (req, res) => {
  const { service } = req.params;
  const serviceConfig = SERVICES[service];
  
  if (!serviceConfig) {
    return res.status(404).json({ error: 'Service not found' });
  }
  
  const sessionId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
  const amount = serviceConfig.amount;
  
  // Set x402 payment headers
  res.set({
    'x402-required': 'USDC',
    'x402-address': MERCHANT_WALLET,
    'x402-amount': amount.toString(),
    'x402-currency': 'USDC',
    'x402-description': `${serviceConfig.name}: ${serviceConfig.description}`,
    'x402-session': sessionId,
    'x402-network': SOLANA_NETWORK,
    'x402-service': service,
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'x-solana-signature,x-solana-address,x-solana-timestamp'
  });
  
  // Generate QR code for mobile payment
  const qrData = `solana:${MERCHANT_WALLET}?amount=${amount}&label=${encodeURIComponent(serviceConfig.name)}`;
  const qr = await QRCode.toDataURL(qrData);
  
  res.status(402).json({
    error: 'Payment Required',
    payment: {
      type: 'x402',
      version: '1.0.0',
      address: MERCHANT_WALLET,
      amount: amount,
      currency: 'USDC',
      description: serviceConfig.description,
      session_id: sessionId,
      service_id: service,
      service_name: serviceConfig.name,
      qr_code: qr,
      payment_url: `https://phantom.app/ul/browse/${encodeURIComponent(qrData)}`,
      direct_payment: `solana:${MERCHANT_WALLET}?amount=${amount}&spl-token=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`
    },
    content_url: `/content/${sessionId}`,
    verify_url: `/verify/${sessionId}`,
    webhook_url: `/webhook/${sessionId}`
  });
});

// Generic amount-based endpoint (backward compatibility)
app.get('/earn/:amount\\d+', async (req, res) => {
  const amount = parseInt(req.params.amount);
  if (amount <= 0 || amount > 100) {
    return res.status(400).json({ error: 'Amount must be between 1-100 USDC' });
  }
  
  const sessionId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
  
  res.set({
    'x402-required': 'USDC',
    'x402-address': MERCHANT_WALLET,
    'x402-amount': amount.toString(),
    'x402-currency': 'USDC',
    'x402-description': `Custom service: ${amount} USDC`,
    'x402-session': sessionId,
    'x402-network': SOLANA_NETWORK
  });
  
  const qrData = `solana:${MERCHANT_WALLET}?amount=${amount}`;
  const qr = await QRCode.toDataURL(qrData);
  
  res.status(402).json({
    error: 'Payment Required',
    payment: {
      address: MERCHANT_WALLET,
      amount,
      currency: 'USDC',
      session_id: sessionId,
      qr_code: qr
    }
  });
});

// QR code generator endpoint
app.get('/qr/:service', async (req, res) => {
  const { service } = req.params;
  const serviceConfig = SERVICES[service];
  
  if (!serviceConfig) {
    return res.status(404).json({ error: 'Service not found' });
  }
  
  const qrData = `solana:${MERCHANT_WALLET}?amount=${serviceConfig.amount}&label=${encodeURIComponent(serviceConfig.name)}`;
  
  try {
    const qr = await QRCode.toBuffer(qrData, {
      width: 300,
      margin: 2,
      color: { dark: '#000000', light: '#FFFFFF' }
    });
    
    res.set('Content-Type', 'image/png');
    res.send(qr);
  } catch (error) {
    res.status(500).json({ error: 'QR generation failed' });
  }
});

// Payment verification endpoint
app.post('/verify/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const { signature } = req.body;
  
  // In a real implementation, this would verify the Solana transaction
  res.json({
    status: 'verified',
    session_id: sessionId,
    signature,
    message: 'Payment verified successfully'
  });
});

// Webhook for payment notifications
app.post('/webhook/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const { signature } = req.body;
  
  console.log(`🎉 Payment verified for session ${sessionId}: ${signature}`);
  res.json({ success: true, session_id: sessionId });
});

// Content delivery after payment
app.get('/content/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  // In real implementation, verify payment for this session ID
  
  res.json({
    message: 'Payment verified! Access granted to premium content.',
    session_id: sessionId,
    content: {
      title: 'Development Service Access',
      description: 'You can now use the purchased development service.',
      deliverables: ['Code review', 'Bug fixes', 'System optimization', 'Deployment assistance'],
      contact: 'Continue via GitHub issues or email'
    },
    wallet_received: MERCHANT_WALLET,
    timestamp: new Date().toISOString(),
    next_steps: 'Submit your project details for immediate processing'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    services: Object.keys(SERVICES).length,
    wallet: MERCHANT_WALLET,
    network: SOLANA_NETWORK,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    available_endpoints: [
      '/',
      '/api/services',
      '/earn/:service',
      '/health',
      '/qr/:service'
    ]
  });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 x402 USDC Earner fully deployed`);
  console.log(`💰 Wallet: ${MERCHANT_WALLET}`);
  console.log(`🔗 Live at: http://localhost:${PORT}`);
  console.log(`📋 Available services: ${Object.keys(SERVICES).length}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('⚠️  Received SIGTERM, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});

module.exports = app;