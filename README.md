# x402 USDC Revenue System

A production-ready Express server implementing the x402 protocol for USDC-based micropayments on Base Mainnet. This system provides secure, real-time payment processing for premium API endpoints.

## 🚀 Features

- **x402 Protocol Integration**: Full implementation of the x402 payment protocol
- **USDC Payments**: Native USDC (Base Mainnet) support with 6-decimal precision
- **Protected Endpoints**: Real API endpoints requiring USDC payment
- **Rate Limiting**: IP-based rate limiting with flexible configuration
- **Payment Verification**: On-chain payment validation using ethers.js
- **Production Ready**: Security headers, CORS, error handling, and monitoring

## 🔧 Quick Start

### Prerequisites

- Node.js 18+ (supports ES modules)
- USDC on Base wallet with sufficient balance
- Private key for payment verification

### Installation

```bash
npm install
```

### Configuration

1. Copy `.env.example` to `.env`
2. Fill in your credentials:
   - `PRIVATE_KEY`: Your wallet private key (without 0x prefix)
   - `USDC_ADDRESS`: USDC contract on Base Mainnet
   - `NETWORK_URL`: Base Mainnet RPC endpoint
   - `DEFAULT_PRICE_USD`: API access price (default: 1 USDC)

### Environment Variables

```bash
PORT=3000
HOST=localhost
PRIVATE_KEY=your_private_key_here
NETWORK_URL=https://mainnet.base.org
USDC_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
DEFAULT_PRICE_USD=1
```

### Running the Server

```bash
# Development
npm run dev

# Production
npm start
```

## 💰 API Endpoints

### Public Endpoints

```http
GET /health                          # Server health check
GET /api/status                     # Payment protocol status
```

### Paid Endpoints

```http
GET /earn/weather?location=San%20Francisco   # Weather data ($1 USDC)
GET /earn/crypto-price?symbol=ETH           # Crypto prices ($1 USDC)
POST /earn/validate-payment                  # Manual payment validation
```

### Usage Example

#### 1. Get 402 Required Headers
```bash
curl -X GET http://localhost:3000/earn/weather
# Returns 402 with payment headers
```

#### 2. Process Payment (Client Side)
```javascript
// This would happen in your client using web3/ethers
const paymentHeaders = await client.createPayment(1, 'Weather API');
```

#### 3. Access Resource with Proof
```bash
curl -H "x-payment-proof: <base64-encoded-proof>" \
  http://localhost:3000/earn/weather?location=San%20Francisco
```

## 🔍 x402 Protocol Flow

1. **Initial Request**: Client requests protected endpoint
2. **402 Response**: Server returns 402 with payment requirements
3. **Payment Creation**: Client creates USDC payment proof
4. **Authorized Request**: Client sends payment proof in headers
5. **Validation**: Server verifies payment on-chain
6. **Response**: Server provides requested data

## 💻 Technical Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│     Client      │    │  Express Server  │    │  Base Network   │
│                 │    │                  │    │                 │
│ 1. Request      │───►│ 2. Return 402    │    │                 │
│                 │    │ 3. Wait proof    │    │                 │
│ 4. Create       │    │                  │    │                 │
    payment proof │    │ 5. Validate on-chain │◄──┤   Verify sig   │
│ 6. Send proof   │───►│ 7. Return data   │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🛡️ Security Features

- **Rate Limiting**: IP-based throttling (100 req/hour)
- **CORS Protection**: Configurable CORS policy
- **Helmet**: Security headers via Helmet.js
- **Validation**: Cryptographic payment proof verification
- **Non-repudiation**: Unique nonces per transaction
- **Expiration**: 1-hour payment tokens

## 🧪 Testing

### Manual Test
```bash
# 1. Health check
GET /health

# 2. Get status with 402 challenge
GET /earn/weather

# 3. Test with valid payment (requires configured wallet)
curl -X POST http://localhost:3000/earn/validate-payment \
  -H "Content-Type: application/json" \
  -d '{"paymentProof": "eyJwYXltZW50SW50..."}'
```

### Automated Testing
cp test/test.js /dev/null 2>/dev/null || true