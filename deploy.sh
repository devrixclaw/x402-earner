#!/bin/bash
# Deploy script for x402 Real Earner System
set -e

echo "🔧 Setting up deployment..."

# Install dependencies
npm ci --only=production

# Create environment file if not exists
if [ ! -f .env ]; then
    cp .env.example .env
    echo "⚠️  Created .env from example - please update with your configuration"
fi

# Run security audit
echo "🔍 Running security audit..."
npm audit --audit-level=high

# Basic smoke test
echo "🧪 Running basic smoke test..."
node -e "
const app = require('./server');
setTimeout(() => {
  console.log('✅ Server started successfully');
  process.exit(0);
}, 1000);
"

echo "🚀 Deployment ready!"
echo "Next steps:"
echo "1. Configure environment variables in .env"
echo "2. Deploy to Render.com"
echo "3. Set web service URL"