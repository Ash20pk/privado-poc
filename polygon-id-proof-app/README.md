# Polygon ID Signature-Based Proof Generator

A Next.js application that demonstrates signature-based zero-knowledge proof generation using Polygon ID (now Privado ID). This app provides a user-friendly interface for the complete Polygon ID workflow including identity creation, credential issuance, and signature-based proof generation.

## Features

- **Identity Management**: Create user and issuer identities using Polygon ID
- **Credential Issuance**: Issue KYC Age credentials with proper schema validation
- **Signature-Based Proofs**: Generate AtomicQuerySigV2 proofs for privacy-preserving verification
- **Proof Verification**: Verify generated proofs using the Polygon ID SDK
- **Blockchain Integration**: Publish state transitions to Polygon Amoy testnet

## Technology Stack

- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **@0xpolygonid/js-sdk** for Polygon ID functionality
- **ethers.js** for blockchain interactions

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   
   Update `.env.local` with your configuration:
   ```bash
   RHS_URL=https://rhs-staging.polygonid.me
   WALLET_KEY=your_wallet_private_key_here
   RPC_URL=https://rpc-amoy.polygon.technology
   CONTRACT_ADDRESS=0x1a4cC30f2aA0377b0c3bc9848766D90cb4404124
   CHAIN_ID=80002
   ```

   **Important**: Replace `your_wallet_private_key_here` with a valid Ethereum private key that has MATIC tokens on Polygon Amoy testnet for state transitions.

3. **Run the Application**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:3000](http://localhost:3000) to access the application.

## Workflow

The application implements the complete Polygon ID signature-based proof workflow:

1. **Identity Creation**: Creates both user and issuer identities
2. **Credential Issuance**: Issues a KYC Age credential to the user
3. **State Transition**: Publishes credential state to the blockchain
4. **Proof Generation**: Generates a signature-based proof using AtomicQuerySigV2 circuit
5. **Proof Verification**: Verifies the generated proof

## Key Components

- **`/src/lib/polygonIdService.ts`**: Core Polygon ID workflow logic (unchanged from original script)
- **`/src/components/ProofGenerator.tsx`**: React component for the user interface
- **`/src/app/api/generate-proof/route.ts`**: API route for secure proof generation
- **`/public/circuits/`**: ZK circuit files required for proof generation

## Security Notes

- Private keys and sensitive operations are handled server-side in API routes
- The original polygon-id-demo.ts logic is preserved without modifications
- All cryptographic operations use the official Polygon ID SDK

## Development

The app is built with security and user experience in mind:
- Responsive design for mobile and desktop
- Real-time progress indicators during proof generation
- Detailed error handling and user feedback
- Clean separation between client UI and sensitive operations

## Troubleshooting

- Ensure your wallet has sufficient MATIC tokens on Polygon Amoy testnet
- Verify all environment variables are correctly set
- Check that the RHS service is accessible
- Confirm circuit files are properly copied to the public directory
