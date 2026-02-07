#!/bin/bash
# Direct Render deployment - no GitHub needed

cat > render.yaml << 'EOF'
services:
- type: web
  name: x402-earner
  env: node
  branch: main
  buildCommand: npm install
  startCommand: node server.js
  envVars:
  - key: SOLANA_NETWORK
    value: mainnet-beta
  - key: MERCHANT_WALLET
    value: 8uWJWAnmnmv1DcZ8hQu62E9d4Mg8oB2aYhLTSQ5UgxFs
  - key: PORT
    value: 10000
EOF

npm install --production
echo "✅ Ready for direct deployment:"
echo "  Deploy to: https://render.com/deploy?url=https://%2A/path/to/this/folder"
echo "  Or copy files and deploy via Render dashboard"