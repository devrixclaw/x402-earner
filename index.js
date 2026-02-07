import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import dotenv from 'dotenv';
import { X402Protocol } from './x402Protocol.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Initialize x402 protocol handler
const x402Protocol = new X402Protocol();

// Rate limiting
const rateLimiter = new RateLimiterMemory({
    keyPrefix: 'x402-ips',
    points: 100, // Number of requests
    duration: 3600, // Per hour
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        service: 'x402-usdc-revenue-system',
        timestamp: new Date().toISOString()
    });
});

// Public API endpoints
app.get('/api/status', (req, res) => {
    res.json({
        'X-Payment-Version': '402-0.1',
        'X-Payment-Network': 'base-mainnet',
        'X-Payment-Tokens': process.env.USDC_ADDRESS || '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        'supported_endpoints': [
            'GET /earn/weather',
            'GET /earn/crypto-price',
            'POST /earn/validate-payment'
        ]
    });
});

// Protected endpoints requiring payment
const paymentRequired = async (req, res, next) => {
    try {
        const paymentHeader = req.headers['x-payment-proof'] || req.headers['authorization'];
        if (!paymentHeader) {
            const paymentHeaders = await x402Protocol.create402Header(
                process.env.DEFAULT_PRICE_USD || 1,
                'API endpoint access'
            );
            return res.status(402).set(paymentHeaders).json({
                error: 'Payment Required',
                message: 'This endpoint requires USDC payment via x402 protocol',
                headers: paymentHeaders
            });
        }

        // Validate payment
        const isValid = await x402Protocol.validatePayment(paymentHeader, process.env.DEFAULT_PRICE_USD || 1);
        if (!isValid) {
            return res.status(402).json({
                error: 'Invalid Payment',
                message: 'Payment proof is invalid or expired'
            });
        }

        next();
    } catch (error) {
        console.error('Payment middleware error:', error);
        return res.status(500).json({
            error: 'Payment processing error',
            message: error.message
        });
    }
};

// Paid endpoints with x402 protection
app.get('/earn/weather', paymentRequired, async (req, res) => {
    try {
        const mockWeather = {
            location: req.query.location || 'San Francisco',
            temperature: Math.floor(Math.random() * 30) + 50,
            condition: ['Sunny', 'Cloudy', 'Rainy', 'Partly Cloudy'][Math.floor(Math.random() * 4)],
            timestamp: new Date().toISOString(),
            paid_access: true,
            price: process.env.DEFAULT_PRICE_USD || 1
        };
        res.json(mockWeather);
    } catch (error) {
        res.status(500).json({ error: 'Weather service unavailable' });
    }
});

app.get('/earn/crypto-price', paymentRequired, async (req, res) => {
    try {
        const symbol = req.query.symbol || 'ETH';
        const mockPrices = {
            BTC: { price: Math.floor(Math.random() * 10000) + 50000, change: (Math.random() * 10 - 5).toFixed(2) },
            ETH: { price: Math.floor(Math.random() * 500) + 2500, change: (Math.random() * 15 - 7).toFixed(2) },
            USDC: { price: 1.00, change: 0.0 }
        };
        
        res.json({
            symbol,
            ...mockPrices[symbol] || mockPrices.ETH,
            timestamp: new Date().toISOString(),
            paid_access: true,
            price: process.env.DEFAULT_PRICE_USD || 1
        });
    } catch (error) {
        res.status(500).json({ error: 'Price service unavailable' });
    }
});

// Endpoint to validate payments and get access tokens
app.post('/earn/validate-payment', async (req, res) => {
    try {
        const { paymentProof, expectedAmount } = req.body;
        
        if (!paymentProof) {
            return res.status(400).json({
                error: 'Missing payment proof',
                message: 'Please provide payment proof in request body'
            });
        }

        const isValid = await x402Protocol.validatePayment(paymentProof, expectedAmount || process.env.DEFAULT_PRICE_USD || 1);
        
        if (isValid) {
            res.json({
                valid: true,
                accessToken: `x402_${Date.now()}`,
                expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour
                endpoints: [
                    '/earn/weather',
                    '/earn/crypto-price',
                    '/earn/validate-payment'
                ]
            });
        } else {
            res.status(402).json({
                valid: false,
                error: 'Invalid payment proof'
            });
        }
    } catch (error) {
        res.status(500).json({
            error: 'Validation failed',
            message: error.message
        });
    }
});

// Rate limiting middleware
app.use(async (req, res, next) => {
    try {
        await rateLimiter.consume(req.ip);
        next();
    } catch (rejRes) {
        res.status(429).json({
            error: 'Too Many Requests',
            retryAfter: Math.round(rejRes.msBeforeNext) || 60
        });
    }
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
    });
});

// Catch-all route
app.get('*', (req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: 'The requested resource was not found. Check /api/status for available endpoints.'
    });
});

// Start server
app.listen(port, () => {
    console.log(`🚀 x402 USDC Revenue System running on port ${port}`);
    console.log(`📊 Health check: http://localhost:${port}/health`);
    console.log(`💰 Available endpoints:`);
    console.log(`   GET /earn/weather - Paid weather access ($${process.env.DEFAULT_PRICE_USD || 1} USDC)`);
    console.log(`   GET /earn/crypto-price - Paid crypto prices ($${process.env.DEFAULT_PRICE_USD || 1} USDC)`);
    console.log(`   POST /earn/validate-payment - Payment validation`);
    console.log(`
⚡ x402 Protocol Integration:`);
    console.log(`   Network: Base Mainnet`);
    console.log(`   Token: USDC (${process.env.USDC_ADDRESS || '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'})`);
    console.log(`   Price: $${process.env.DEFAULT_PRICE_USD || 1} per API call`);
});