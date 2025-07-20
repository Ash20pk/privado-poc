import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import supabase from '@/lib/supabase';

// ABI for the contract
const contractAbi = [{"type":"constructor","inputs":[{"name":"_tokenAuthorityPublicKey","type":"address","internalType":"address"}],"stateMutability":"nonpayable"},{"type":"function","name":"airdropAmount","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"contractOwner","inputs":[],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},{"type":"function","name":"executed","inputs":[{"name":"","type":"bytes","internalType":"bytes"}],"outputs":[{"name":"","type":"bool","internalType":"bool"}],"stateMutability":"view"},{"type":"function","name":"getAirdropAmount","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"getContractOwner","inputs":[],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},{"type":"function","name":"getHasClaimed","inputs":[{"name":"airdropAddress","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"bool","internalType":"bool"}],"stateMutability":"view"},{"type":"function","name":"hasClaimed","inputs":[{"name":"","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"bool","internalType":"bool"}],"stateMutability":"view"},{"type":"function","name":"owner","inputs":[],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},{"type":"function","name":"renounceOwnership","inputs":[],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"setAirdropAmount","inputs":[{"name":"_newAmount","type":"uint256","internalType":"uint256"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"setTokenAddress","inputs":[{"name":"_tokenAddress","type":"address","internalType":"address"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"setTokenAuthorityPublicKey","inputs":[{"name":"_tokenAuthorityPublicKey","type":"address","internalType":"address"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"submitRequest","inputs":[{"name":"krnlPayload","type":"tuple","internalType":"struct KrnlPayload","components":[{"name":"auth","type":"bytes","internalType":"bytes"},{"name":"kernelResponses","type":"bytes","internalType":"bytes"},{"name":"kernelParams","type":"bytes","internalType":"bytes"}]},{"name":"airdropAddress","type":"address","internalType":"address"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"token","inputs":[],"outputs":[{"name":"","type":"address","internalType":"contract IERC20"}],"stateMutability":"view"},{"type":"function","name":"tokenAuthorityPublicKey","inputs":[],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},{"type":"function","name":"transferOwnership","inputs":[{"name":"newOwner","type":"address","internalType":"address"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"withdraw","inputs":[{"name":"amount","type":"uint256","internalType":"uint256"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"event","name":"AirdropAmountSet","inputs":[{"name":"airdropAmount","type":"uint256","indexed":false,"internalType":"uint256"}],"anonymous":false},{"type":"event","name":"AirdropClaimed","inputs":[{"name":"recipient","type":"address","indexed":false,"internalType":"address"},{"name":"amount","type":"uint256","indexed":false,"internalType":"uint256"}],"anonymous":false},{"type":"event","name":"OwnershipTransferred","inputs":[{"name":"previousOwner","type":"address","indexed":true,"internalType":"address"},{"name":"newOwner","type":"address","indexed":true,"internalType":"address"}],"anonymous":false},{"type":"event","name":"TokenAddressSet","inputs":[{"name":"tokenAddress","type":"address","indexed":false,"internalType":"address"}],"anonymous":false},{"type":"event","name":"TokensWithdrawn","inputs":[{"name":"to","type":"address","indexed":false,"internalType":"address"},{"name":"amount","type":"uint256","indexed":false,"internalType":"uint256"}],"anonymous":false},{"type":"error","name":"ECDSAInvalidSignature","inputs":[]},{"type":"error","name":"ECDSAInvalidSignatureLength","inputs":[{"name":"length","type":"uint256","internalType":"uint256"}]},{"type":"error","name":"ECDSAInvalidSignatureS","inputs":[{"name":"s","type":"bytes32","internalType":"bytes32"}]},{"type":"error","name":"OwnableInvalidOwner","inputs":[{"name":"owner","type":"address","internalType":"address"}]},{"type":"error","name":"OwnableUnauthorizedAccount","inputs":[{"name":"account","type":"address","internalType":"address"}]},{"type":"error","name":"UnauthorizedTransaction","inputs":[]}];

// Contract address from environment variable
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_KRNL_CONTRACT_ADDRESS;

// RPC URL from environment variable
const RPC_URL = "https://1rpc.io/sepolia";

// Private key for server-side wallet
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { sessionId, airdropAddress } = body;
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    if (!airdropAddress) {
      return NextResponse.json(
        { error: 'Airdrop address is required' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Fetch session data from Supabase
    const { data: sessionRecord, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('session_id', sessionId)
      .gt('expires_at', new Date().toISOString())
      .single();
    
    if (error || !sessionRecord) {
      console.error("Error fetching session:", error);
      return NextResponse.json(
        { error: 'Session not found or expired' },
        { status: 404, headers: corsHeaders }
      );
    }
    
    // Check if verification was successful
    const verificationStatus = sessionRecord.verification_status || {};
    if (!verificationStatus.success) {
      return NextResponse.json(
        { error: 'Verification has not been completed successfully' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Get the execute result from session data
    const executeResult = sessionRecord.data;
    if (!executeResult) {
      return NextResponse.json(
        { error: 'Execute result not found in session data' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Call the contract
    const txHash = await callAirdropContract(executeResult, airdropAddress);
    
    // Update session with transaction hash
    await supabase
      .from('sessions')
      .update({
        contract_call: {
          tx_hash: txHash,
          timestamp: new Date().toISOString(),
          airdrop_address: airdropAddress
        }
      })
      .eq('session_id', sessionId);
    
    return NextResponse.json({
      success: true,
      tx_hash: txHash,
      message: 'Contract call successful'
    }, {
      headers: corsHeaders
    });
    
  } catch (error: any) {
    console.error('Error calling contract:', error);
    return NextResponse.json(
      { 
        error: 'Failed to call contract',
        details: error.message || 'Unknown error'
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * Call the `submitRequest` function on the AirdropContract with KRNL payload and the airdrop address.
 * 
 * @param executeResult The result from executeKrnl
 * @param airdropAddress Address to receive the airdrop
 * @returns Transaction hash
 */
async function callAirdropContract(executeResult: any, airdropAddress: string) {
  if (!CONTRACT_ADDRESS) {
    throw new Error("Contract address is required");
  }
  
  if (!PRIVATE_KEY) {
    throw new Error("Private key is required for server-side signing");
  }
  
  // Create provider and wallet
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  // Create contract instance
  const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi, wallet);
  
  // Format payload as expected by AirdropContract.sol
  const krnlPayload = {
    auth: executeResult.auth,
    kernelResponses: executeResult.kernel_responses,
    kernelParams: executeResult.kernel_params
  };
  
  // Call `submitRequest` on contract
  const tx = await contract.submitRequest(krnlPayload, airdropAddress);
  const receipt = await tx.wait();
  return receipt.hash;
}
