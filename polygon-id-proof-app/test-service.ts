#!/usr/bin/env tsx

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '.env.local') });

// Set correct circuits path for standalone execution
process.env.CIRCUITS_PATH = path.join(__dirname, 'public', 'circuits');

// Make sure we have the RHS_URL properly set
if (!process.env.RHS_URL) {
  console.error('❌ Missing RHS_URL environment variable');
  process.exit(1);
}

// Import our service
import { runSignatureProofWorkflow } from './src/lib/polygonIdService';

async function testService() {
  console.log('🧪 Testing Next.js Polygon ID Service Standalone');
  console.log('📂 Using .env.local configuration');
  console.log(`🔗 RPC URL: ${process.env.RPC_URL}`);
  console.log(`🏭 Contract: ${process.env.CONTRACT_ADDRESS}`);
  console.log(`⛓️  Chain ID: ${process.env.CHAIN_ID}`);
  console.log(`🔑 Wallet: ${process.env.WALLET_KEY?.substring(0, 10)}...`);
  console.log(`🧮 Circuits: ${process.env.CIRCUITS_PATH}`);
  console.log(`🔗 RHS URL: ${process.env.RHS_URL}`);
  console.log('');
  
  // Debug environment variables
  console.log('🔍 Environment check:');
  console.log(`RHS_URL defined: ${!!process.env.RHS_URL}`);
  console.log(`WALLET_KEY defined: ${!!process.env.WALLET_KEY}`);
  console.log(`RPC_URL defined: ${!!process.env.RPC_URL}`);
  console.log(`CONTRACT_ADDRESS defined: ${!!process.env.CONTRACT_ADDRESS}`);
  console.log(`CHAIN_ID defined: ${!!process.env.CHAIN_ID}`);
  console.log('');

  const startTime = Date.now();
  
  try {
    const result = await runSignatureProofWorkflow();
    
    const totalTime = (Date.now() - startTime) / 1000;
    
    console.log('\n🎉 SUCCESS! Service test completed');
    console.log(`⏱️  Total time: ${totalTime.toFixed(1)}s`);
    console.log('\n📊 Results:');
    console.log(`User DID: ${result.userDID}`);
    console.log(`Issuer DID: ${result.issuerDID}`);
    console.log(`Signature Proof Valid: ${result.sigProofValid ? '✅' : '❌'}`);
    
  } catch (error) {
    const totalTime = (Date.now() - startTime) / 1000;
    console.error(`\n💥 FAILED after ${totalTime.toFixed(1)}s`);
    console.error('Error:', error);
    
    if (error instanceof Error) {
      console.error('Stack:', error.stack);
    }
  }
}

// Run the test
testService();