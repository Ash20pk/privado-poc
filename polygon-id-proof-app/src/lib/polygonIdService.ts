import {
  CredentialRequest,
  CircuitId,
  ZeroKnowledgeProofRequest,
  core,
  CredentialStatusType,
  IdentityCreationOptions,
} from '@0xpolygonid/js-sdk';

import {
  initInMemoryDataStorageAndWallets,
  initCircuitStorage,
  initProofService
} from './walletSetup';

import { ethers } from 'ethers';

export function getDefaultIdentityCreationOptions(): IdentityCreationOptions {
  return {
    method: core.DidMethod.PolygonId,
    blockchain: core.Blockchain.Polygon,
    networkId: core.NetworkId.Amoy,
    revocationOpts: {
      type: CredentialStatusType.Iden3ReverseSparseMerkleTreeProof,
      id: process.env.RHS_URL as string
    }
  };
}

export function createUniquenessCredential(did: core.DID): CredentialRequest {
  return {
    credentialSchema:
      'https://raw.githubusercontent.com/Ash20pk/privado-poc/refs/heads/main/public/schemas/json/UniquenessCredential.json',
    type: 'UniquenessCredential',
    credentialSubject: {
      id: did.string(),
      captureMethod: 'activePhoto',
      userHash: 'unique-user-hash-' + Math.random().toString(36).substr(2, 9),
      reputationLevel: 5,
      lastVerificationDate: Math.floor(Date.now() / 1000),
      firstVerificationDate: Math.floor(Date.now() / 1000),
      confidenceScore: 95,
      captureDevice: {
        deviceType: 'mobile',
        operatingSystem: 'Android'
      }
    },
    expiration: 12345678888,
    revocationOpts: {
      type: CredentialStatusType.Iden3ReverseSparseMerkleTreeProof,
      id: process.env.RHS_URL as string
    }
  };
}

export function createUniquenessCredentialRequest(
  circuitId: CircuitId,
  credentialRequest: CredentialRequest
): ZeroKnowledgeProofRequest {
  const proofReqSig: ZeroKnowledgeProofRequest = {
    id: 1,
    circuitId: CircuitId.AtomicQuerySigV2,
    optional: false,
    query: {
      allowedIssuers: ['*'],
      type: credentialRequest.type,
      context:
        'https://raw.githubusercontent.com/Ash20pk/privado-poc/refs/heads/main/public/schemas/json-ld/UniquenessCredential.jsonld',
      credentialSubject: {
        confidenceScore: {
          $gt: 80 // Prove that confidence score is >= 80
        }
      }
    }
  };

  return proofReqSig;
}

export interface PolygonIdWorkflowResult {
  userDID: string;
  issuerDID: string;
  sigProofValid: boolean | null;
  proof: unknown;
  pub_signals: unknown;
}

export async function initializePolygonIdServices() {
  const defaultNetworkConnection = {
    rpcUrl: process.env.RPC_URL as string,
    contractAddress: process.env.CONTRACT_ADDRESS as string,
    chainId: parseInt(process.env.CHAIN_ID as string)
  };

  const { dataStorage, credentialWallet, identityWallet } = await initInMemoryDataStorageAndWallets(
    defaultNetworkConnection
  );
  const circuitStorage = await initCircuitStorage();
  const proofService = await initProofService(
    identityWallet,
    credentialWallet,
    dataStorage.states,
    circuitStorage
  );

  return {
    dataStorage,
    credentialWallet,
    identityWallet,
    circuitStorage,
    proofService
  };
}

export async function runSignatureProofWorkflow(ethSigner?: ethers.Signer): Promise<PolygonIdWorkflowResult> {
  console.log('========== POLYGON ID WORKFLOW DEMO ==========');
  
  // Initialize SDK components
  console.log('Initializing SDK components...');
  const {
    dataStorage,
    identityWallet,
    proofService
  } = await initializePolygonIdServices();

  // Step 1: Identity Creation
  console.log('\n========== STEP 1: IDENTITY CREATION ==========');
  
  // Create user identity
  console.log('Creating user identity...');
  const { did: userDID } = await identityWallet.createIdentity({
    ...getDefaultIdentityCreationOptions()
  });
  console.log(`User DID created: ${userDID.string()}`);

  // Create issuer identity
  console.log('Creating issuer identity...');
  const { did: issuerDID } = await identityWallet.createIdentity({
    ...getDefaultIdentityCreationOptions()
  });
  console.log(`Issuer DID created: ${issuerDID.string()}`);

  // Step 2: Issue Credential
  console.log('\n========== STEP 2: CREDENTIAL ISSUANCE ==========');
  
  // Create credential request
  console.log('Creating credential request...');
  const credentialRequest = createUniquenessCredential(userDID);
  
  // Issue credential
  console.log('Issuing credential...');
  console.log('📊 Credential request details:', {
    type: credentialRequest.type,
    schema: credentialRequest.credentialSchema,
    subjectFields: Object.keys(credentialRequest.credentialSubject)
  });
  
  let credential;
  try {
    credential = await identityWallet.issueCredential(issuerDID, credentialRequest);
    console.log('✅ Credential issued successfully');
    console.log('📋 Credential type:', credential.type);
  } catch (issuanceError) {
    console.error('❌ Credential issuance failed:', issuanceError);
    throw new Error(`Credential issuance failed: ${issuanceError instanceof Error ? issuanceError.message : 'Unknown error'}`);
  }
  
  // Save credential to storage
  await dataStorage.credential.saveCredential(credential);
  console.log('Credential saved to storage');

  // Step 3: State Transition
  console.log('\n========== STEP 3: STATE TRANSITION ==========');
  
  // Add credential to Merkle Tree
  console.log('Adding credential to Merkle Tree...');
  const res = await identityWallet.addCredentialsToMerkleTree([credential], issuerDID);
  console.log('Credential added to Merkle Tree');

  // Publish revocation information
  console.log('Publishing revocation information to RHS...');
  await identityWallet.publishRevocationInfoByCredentialStatusType(
    issuerDID,
    CredentialStatusType.Iden3ReverseSparseMerkleTreeProof,
    { rhsUrl: process.env.RHS_URL as string }
  );
  console.log('Revocation information published');

  // Publish state to blockchain
  console.log('Publishing state to blockchain...');
  console.log('⏳ This step may take 1-3 minutes due to blockchain confirmation times...');
  
  // Use provided signer or fallback to private key
  let finalSigner: ethers.Signer;
  if (ethSigner) {
    // Use the provided signer (e.g., from MetaMask)
    finalSigner = ethSigner;
    console.log('Using provided signer:', await finalSigner.getAddress());
  } else {
    // Fallback to private key (server-side only)
    if (!process.env.WALLET_KEY) {
      throw new Error('No signer provided and WALLET_KEY not available. Please connect MetaMask or run in server environment.');
    }
    console.log('No signer provided, using private key fallback');
    finalSigner = new ethers.Wallet(
      process.env.WALLET_KEY,
      dataStorage.states.getRpcProvider()
    );
  }
  
  // Add timeout and better error handling for blockchain operations
  console.log('💰 Checking wallet balance...');
  const walletAddress = await finalSigner.getAddress();
  const balance = await finalSigner.provider!.getBalance(walletAddress);
  console.log(`Wallet balance: ${ethers.formatEther(balance)} MATIC`);
  
  if (balance === BigInt(0)) {
    throw new Error('Insufficient MATIC balance. Please add funds to your wallet on Polygon Amoy testnet.');
  }
  
  // For MetaMask, ensure we're connected to the correct network
  if (ethSigner && typeof window !== 'undefined') {
    console.log('🦊 Ensuring MetaMask is on correct network...');
    const network = await finalSigner.provider!.getNetwork();
    console.log(`Connected to network: ${network.name} (${network.chainId})`);
    
    if (network.chainId !== BigInt(80002)) {
      throw new Error('Please switch MetaMask to Polygon Amoy testnet (Chain ID: 80002)');
    }
  }
  
  console.log('📡 Preparing state transition to blockchain...');
  
  // Enhanced gas estimation for MetaMask transactions
  if (ethSigner && typeof window !== 'undefined') {
    console.log('⛽ Preparing MetaMask transaction...');
    
    try {
      // Get current gas price from network
      const feeData = await finalSigner.provider!.getFeeData();
      console.log('Current network fee data:', {
        gasPrice: feeData.gasPrice ? ethers.formatUnits(feeData.gasPrice, 'gwei') + ' gwei' : 'null',
        maxFeePerGas: feeData.maxFeePerGas ? ethers.formatUnits(feeData.maxFeePerGas, 'gwei') + ' gwei' : 'null',
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ? ethers.formatUnits(feeData.maxPriorityFeePerGas, 'gwei') + ' gwei' : 'null'
      });
      
      // Ensure sufficient gas for the operation
      const recommendedGasLimit = 500000; // Conservative gas limit for state transition
      const estimatedCost = feeData.maxFeePerGas ? 
        (BigInt(recommendedGasLimit) * feeData.maxFeePerGas) : 
        BigInt(recommendedGasLimit) * BigInt('50000000000'); // 50 gwei fallback
      
      console.log(`Estimated transaction cost: ${ethers.formatEther(estimatedCost)} MATIC`);
      
      if (balance < estimatedCost) {
        const requiredBalance = ethers.formatEther(estimatedCost);
        throw new Error(`Insufficient MATIC for gas fees. Required: ~${requiredBalance} MATIC`);
      }
      
    } catch (gasError) {
      console.warn('⚠️ Could not estimate gas costs, proceeding with transaction:', gasError);
    }
  }
  
  console.log('📡 Submitting state transition to blockchain...');
  const startTime = Date.now();
  
  // Add timeout wrapper for blockchain operation
  const blockchainTimeout = 120000; // 2 minutes timeout
  
  try {
    const txId = await Promise.race([
      proofService.transitState(
        issuerDID,
        res.oldTreeState,
        true,
        dataStorage.states,
        finalSigner
      ),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Blockchain operation timed out after ${blockchainTimeout/1000}s`)), blockchainTimeout)
      )
    ]) as string;
    
    const duration = (Date.now() - startTime) / 1000;
    console.log(`✅ State published to blockchain in ${duration.toFixed(1)}s`);
    console.log(`🔗 Transaction ID: ${txId}`);
    
    // Continue with proof generation after successful state transition
    
    // Step 4: Generate Proofs
    console.log('\n========== STEP 4: GENERATE PROOFS ==========');
    
    // Generate Signature-based proof (AtomicQuerySigV2)
    console.log('Generating signature-based proof (AtomicQuerySigV2)...');
    const proofReqSig = createUniquenessCredentialRequest(CircuitId.AtomicQuerySigV2, credentialRequest);
    
    let proof, pub_signals;
    try {
      const result = await proofService.generateProof(proofReqSig, userDID);
      proof = result.proof;
      pub_signals = result.pub_signals;
      console.log('✅ Signature-based proof generated successfully');
    } catch (proofError) {
      console.error('❌ Proof generation failed:', proofError);
      throw proofError;
    }

    console.log('\n========== WORKFLOW COMPLETED ==========');
    console.log('🎉 Proof generation completed successfully!');
    console.log('💡 Proof verification will be handled server-side for better compatibility');
    
    return {
      userDID: userDID.string(),
      issuerDID: issuerDID.string(),
      sigProofValid: null, // Will be verified server-side
      proof,
      pub_signals
    };
    
  } catch (stateTransitionError) {
    console.error('❌ State transition failed:', stateTransitionError);
    
    // If using MetaMask, provide specific guidance
    if (ethSigner && typeof window !== 'undefined') {
      if (stateTransitionError instanceof Error) {
        const errorMessage = stateTransitionError.message.toLowerCase();
        
        if (errorMessage.includes('user rejected') || 
            errorMessage.includes('user denied') ||
            errorMessage.includes('user cancelled')) {
          throw new Error('Transaction was rejected by user in MetaMask. Please approve the transaction to continue.');
        } else if (errorMessage.includes('insufficient funds')) {
          throw new Error('Insufficient MATIC balance for gas fees. Please add more MATIC to your wallet.');
        } else if (errorMessage.includes('gas') || 
                   errorMessage.includes('out of gas') ||
                   errorMessage.includes('intrinsic gas too low')) {
          throw new Error('Gas estimation failed. Try refreshing MetaMask or increasing gas limit manually.');
        } else if (errorMessage.includes('nonce') || 
                   errorMessage.includes('replacement transaction underpriced')) {
          throw new Error('Transaction nonce issue. Try resetting MetaMask account or waiting for pending transactions.');
        } else if (errorMessage.includes('network') || 
                   errorMessage.includes('connection')) {
          throw new Error('Network connection issue. Please check your internet connection and try again.');
        } else if (errorMessage.includes('internal json-rpc error')) {
          throw new Error('RPC error occurred. This might be a temporary network issue. Please try again in a few moments.');
        }
      }
      
      // Enhanced error reporting for debugging
      console.error('Full MetaMask error details:', {
        message: stateTransitionError instanceof Error ? stateTransitionError.message : 'Unknown error',
        stack: stateTransitionError instanceof Error ? stateTransitionError.stack : 'No stack trace',
        name: stateTransitionError instanceof Error ? stateTransitionError.name : 'Unknown error type'
      });
      
      throw new Error(`MetaMask transaction failed: ${stateTransitionError instanceof Error ? stateTransitionError.message : 'Unknown error'}. Check console for details.`);
    }
    
    throw stateTransitionError;
  }

  // This code block is unreachable due to the return statement above
  // Keeping it for reference, but it will never execute
}