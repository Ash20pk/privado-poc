# Polygon ID Proof App - Verification Server Setup

This application now uses a **dedicated Node.js verification server** to handle proof verification, solving the browser compatibility issues with the Polygon ID JS SDK.

## Architecture

```
┌─────────────────┐    HTTP    ┌──────────────────────┐
│   Next.js App   │ ---------> │ Verification Server  │
│  (Frontend)     │            │    (Node.js)         │
│  Port: 3000     │            │    Port: 3001        │
└─────────────────┘            └──────────────────────┘
```

### Components

1. **Next.js Frontend** (`port 3000`)
   - MetaMask integration
   - Proof generation with user wallet
   - UI for the complete Polygon ID workflow

2. **Verification Server** (`port 3001`)
   - Dedicated Node.js Express server
   - Pre-loaded circuit storage
   - Fast proof verification (2-10 seconds vs 30+ seconds)

## Quick Start

### Option 1: Start Both Servers Together
```bash
./start-all.sh
```

### Option 2: Start Manually

1. **Start Verification Server:**
```bash
npm run dev:verification
```

2. **Start Next.js App** (in another terminal):
```bash
npm run dev
```

### Option 3: Use npm script
```bash
npm run dev:all
```

## URLs

- **Frontend**: http://localhost:3000
- **Verification Server**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## Environment Setup

Ensure you have the following environment variables in `.env.local`:

```env
RHS_URL=https://rhs-staging.polygonid.me
RPC_URL=https://polygon-amoy.publicnode.com
CONTRACT_ADDRESS=0x1a4cC30f2aA0377b0c3bc9848766D90cb4404124
CHAIN_ID=80002
CIRCUITS_PATH=public/circuits
```

The verification server has its own `.env` file in `verification-server/.env`.

## How It Works

1. **Proof Generation**: Happens in the browser using MetaMask
2. **State Transition**: Uses MetaMask for blockchain transactions
3. **Proof Verification**: Sent to dedicated Node.js server
4. **Results**: Real-time updates in the frontend

## Performance Benefits

- ✅ **Fast Verification**: 2-10 seconds (vs 30+ seconds in serverless)
- ✅ **No Browser Issues**: Runs in Node.js environment
- ✅ **Pre-loaded Circuits**: Initialized once at startup
- ✅ **Persistent Services**: No cold start delays
- ✅ **Better Error Handling**: Detailed logging and timeouts

## Troubleshooting

### Verification Server Won't Start
```bash
cd verification-server
npm install
npm start
```

### CORS Issues
The verification server is configured to accept requests from `http://localhost:3000`. If you're running on different ports, update the CORS configuration in `verification-server/server.js`.

### Circuit Loading Issues
Ensure the `public/circuits` directory contains the required circuit files:
- `credentialAtomicQuerySigV2/circuit.wasm`
- `credentialAtomicQuerySigV2/circuit_final.zkey`
- `credentialAtomicQuerySigV2/verification_key.json`

## Development

- Frontend runs with hot reload on port 3000
- Verification server runs on port 3001
- Both can be started simultaneously with the provided scripts

## Production Deployment

For production:
1. Deploy the Next.js app as usual
2. Deploy the verification server to a Node.js hosting service
3. Update the verification endpoint URL in the frontend code
4. Ensure both services can communicate (CORS configuration)