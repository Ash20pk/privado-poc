import { NextRequest, NextResponse } from "next/server";
import { ethers } from "krnl-sdk";
import { abi as contractAbi, CONTRACT_ADDRESS, ENTRY_ID, ACCESS_TOKEN } from "../../../lib/krnlConfig";
import path from "path";

// Create a provider for KRNL RPC
const krnlProvider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_KRNL);

// Check if required environment variables are available
if (!CONTRACT_ADDRESS) {
  console.error("Contract address not found");
}

if (!ENTRY_ID || !ACCESS_TOKEN || ENTRY_ID == undefined || ACCESS_TOKEN == undefined) {
  console.error("Entry ID or Access Token not found");
}

// Encode parameters for kernel 
const abiCoder = new ethers.AbiCoder();

/**
 * API handler for executing KRNL with the provided address and player's move
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, sessionId } = body;
    
    // Validate session ID
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: "Session ID is required" },
        { status: 400 }
      );
    }
    
    // Read the session data from file
    const fs = require('fs');
    const sessionFilePath = path.join(process.cwd(), 'sessions', `${sessionId}.json`);
    
    if (!fs.existsSync(sessionFilePath)) {
      return NextResponse.json(
        { success: false, error: "Session not found" },
        { status: 404 }
      );
    }
    
    const sessionData = JSON.parse(fs.readFileSync(sessionFilePath, 'utf-8'));
    const senderAddress = sessionData.from || "";
    
    // Execute KRNL
    const executeResult = await executeKrnl(token, senderAddress, sessionId);
    
    // If signer is provided in the request, we'll return just the execute result
    // Otherwise, we'll return both the execute result and a message
    return NextResponse.json({
      success: true,
      data: executeResult,
      message: "KRNL execution successful"
    });

    
  } catch (error: any) {
    console.error("Error executing KRNL:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to execute KRNL" },
      { status: 500 }
    );
  }
}

/**
 * Execute KRNL with the provided token and sender address
 * @param token Polygon ID token
 * @param senderAddress Wallet address (from wallet connection)
 * @param sessionId Session ID
 * @param customKernelId Optional kernel ID to use
 * @returns KRNL payload result
 */
async function executeKrnl(token: string, senderAddress: string, sessionId: string, customKernelId?: string) {
  // Validate address
  const walletAddress = senderAddress;
  if (!walletAddress) {
    throw new Error("Wallet address is required");
  }
  
  // Use provided kernel ID or default to 1655 (can be overridden via env)
  const kernelId = customKernelId || "1683";
  
  // Create the kernel request data with the correct structure
  const kernelRequestData = {
    senderAddress: walletAddress,
    kernelPayload: {
      [kernelId]: {
        "parameters": {
            "header": {},
            "body": {
                "token": token
            },
            "query": {
                "sessionId": sessionId
            },
            "path": {}
        }
        }
    }
  } as any; // Use type assertion to bypass TypeScript type checking
  
  // Encode player move for smart-contract signature
  const functionParams = abiCoder.encode(["address"], [walletAddress]);
  
  // Check if ENTRY_ID and ACCESS_TOKEN are defined
  if (!ENTRY_ID || !ACCESS_TOKEN) {
    throw new Error("ENTRY_ID or ACCESS_TOKEN is not defined");
  }
  
  // Execute KRNL kernels
  const krnlPayload = await krnlProvider.executeKernels(
    ENTRY_ID, 
    ACCESS_TOKEN, 
    kernelRequestData, 
    functionParams
  );
  
  return krnlPayload;
}

/**
 * Helper function for client-side use
 * Call the `play` function on the Game contract with KRNL payload and the player's move.
 * Note: This function can't be used directly in the API route since it requires a signer,
 * but it's included here for reference and documentation purposes.
 * 
 * @param executeResult The result from executeKrnl
 * @param playerMove Player move (same value passed to executeKrnl)
 * @param signer The signer to use for the transaction
 * @returns Transaction hash
 */
async function callAirdropContract(executeResult: any, playerMove: number, signer?: ethers.Signer) {
  if (!signer) {
    throw new Error("Signer is required");
  }

  if (!CONTRACT_ADDRESS) {
    throw new Error("Contract address is required");
  }
  
  // Create contract instance
  const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi, signer);
  
  // Format payload as expected by Game.sol
  const krnlPayload = {
    auth: executeResult.auth,
    kernelResponses: executeResult.kernel_responses,
    kernelParams: executeResult.kernel_params
  };
  
  // Call `play` on contract
  const tx = await contract.play(krnlPayload, playerMove);
  await tx.wait();
  return tx.hash;
}
