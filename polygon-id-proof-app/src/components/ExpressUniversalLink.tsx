'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { QrCode, Copy, CheckCircle, Clock, Loader2, XCircle } from 'lucide-react';
import QRCode from 'qrcode';
import { useDynamicWallet } from '@/hooks/useDynamicWallet';
import { ethers } from 'ethers';
import { abi as contractAbi, CONTRACT_ADDRESS } from '@/lib/krnlConfig';

export default function ExpressUniversalLink() {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [universalLink, setUniversalLink] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'failed' | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [verificationDetails, setVerificationDetails] = useState<any>(null);
  const [contractCallStatus, setContractCallStatus] = useState<'idle' | 'calling' | 'success' | 'failed'>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [airdropAddress, setAirdropAddress] = useState<string>(''); // Address to receive the airdrop
  
  // Polling interval in milliseconds
  const POLLING_INTERVAL = 3000;
  const POLLING_TIMEOUT = 5 * 60 * 1000; // 5 minutes
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pollingStartTimeRef = useRef<number | null>(null);
  
  // Get wallet address from wagmi
  const { wallet } = useDynamicWallet();
  
  // API endpoint configuration - using our Next.js proxy route instead of direct ngrok URL
  const apiUrl = "/api/proxy";
  
  // Generate universal link
  const handleGenerateLink = async () => {
    setIsLoading(true);
    setError(null);
    setVerificationStatus(null);
    setVerificationDetails(null);
    setCopied(false);
    
    try {
      // Fetch auth request from our local Next.js API proxy
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          walletAddress: wallet.account || ''
        })
      });
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      
      const authRequest = await response.json();
      
      // Create universal link directly
      // This approach doesn't modify the auth request from the server
      const encodedRequest = btoa(JSON.stringify(authRequest.request));
      const link = `https://wallet.privado.id/#i_m=${encodedRequest}`;
      setUniversalLink(link);
      
      // Generate QR code
      const qrCode = await QRCode.toDataURL(link, {
        width: 300,
        margin: 2
      });
      setQrCodeDataUrl(qrCode);
      
      // Store the session ID for later use
      if (authRequest.sessionId) {
        localStorage.setItem('sessionId', authRequest.sessionId);
        
        // Start showing verification pending state and loader immediately
        setVerificationStatus('pending');
        setIsPolling(true);
        
        // Start polling for verification status
        startPolling(authRequest.sessionId);
      }
      
    } catch (err) {
      console.error('Error generating QR code:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate QR code');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Copy link to clipboard
  const copyToClipboard = async () => {
    if (universalLink) {
      try {
        await navigator.clipboard.writeText(universalLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy:', error);
      }
    }
  };
  
  // Open link in new tab
  const openInWallet = () => {
    if (universalLink) {
      window.open(universalLink, '_blank');
    }
  };
  
  // Start polling for verification status
  const startPolling = (sessionId: string) => {
    // Clear any existing polling timer
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
    }
    
    // Set polling start time for timeout
    pollingStartTimeRef.current = Date.now();
    
    // Initial check immediately
    checkVerificationStatus(sessionId);
    
    // Set up polling
    pollingTimerRef.current = setInterval(() => {
      checkVerificationStatus(sessionId);
    }, POLLING_INTERVAL);
    
    console.log(`Started polling for verification status with session ID: ${sessionId}`);
  };
  
  // Check verification status
  const checkVerificationStatus = async (sessionId: string) => {
    try {
      // Check if polling has timed out (5 minutes)
      if (pollingStartTimeRef.current && Date.now() - pollingStartTimeRef.current > POLLING_TIMEOUT) {
        console.log('Polling timeout reached (5 minutes). Stopping polling.');
        setVerificationStatus('failed');
        stopPolling();
        setError('Verification timeout. Please try again.');
        return;
      }
      
      const response = await fetch(`/api/verification-status?sessionId=${sessionId}`);
      
      if (!response.ok) {
        console.error(`Status check failed: ${response.status}`);
        return;
      }
      
      const data = await response.json();
      
      // Only update details if they changed to avoid unnecessary re-renders
      setVerificationDetails(prevDetails => {
        if (JSON.stringify(prevDetails) !== JSON.stringify(data)) {
          return data;
        }
        return prevDetails;
      });
      
      if (data.verified === true) {
        // Verification successful
        setVerificationStatus('success');
        stopPolling();
        
        // Set default airdrop address to the connected wallet address if available
        if (wallet?.account && !airdropAddress) {
          setAirdropAddress(wallet.account);
        }
        
        console.log('Verification successful! Polling stopped.');
      } else if (data.verified === false) {
        // Verification explicitly failed (has been processed and failed)
        setVerificationStatus('failed');
        stopPolling();
        
        console.log('Verification failed. Polling stopped.');
      }
      // If data.verified is null, continue polling (no verification attempt yet)
      
    } catch (err) {
      console.error('Error checking verification status:', err);
      // Don't stop polling on error, just continue trying
    }
  };
  
  // Stop polling
  const stopPolling = () => {
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
    pollingStartTimeRef.current = null;
    setIsPolling(false);
  };
  
  // Clean up polling on component unmount
  useEffect(() => {
    return () => {
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
      }
    };
  }, []);
  
  // Call the contract with the verification result
  const callContract = async (sessionId: string) => {
    if (!sessionId || contractCallStatus === 'calling' || !airdropAddress) {
      return;
    }
    
    if (!wallet?.signer) {
      setError('Wallet not connected or signer not available');
      setContractCallStatus('failed');
      return;
    }
    
    setContractCallStatus('calling');
    
    try {
      // First, get the session data with the KRNL payload
      const response = await fetch(`/api/verification-status?sessionId=${sessionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server returned ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.verified) {
        throw new Error('Session not verified');
      }
      
      // Get the execute result from session data
      const sessionResponse = await fetch(`/api/session?sessionId=${sessionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      
      if (!sessionResponse.ok) {
        const errorData = await sessionResponse.json();
        throw new Error(errorData.error || `Server returned ${sessionResponse.status}`);
      }
      
      const sessionData = await sessionResponse.json();
      console.log("Session data:", sessionData); 
      const executeResult = sessionData;
      
      if (!executeResult) {
        throw new Error('Execute result not found in session data');
      }
      
      // Create contract instance
      if (!CONTRACT_ADDRESS) {
        throw new Error("Contract address is required");
      }

      console.log("Contract address:", CONTRACT_ADDRESS); 
      console.log("Contract ABI:", contractAbi); 
      console.log("Wallet signer:", wallet.signer);
      
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi, wallet.signer);
      
      // Format payload as expected by AirdropContract.sol
      const krnlPayload = {
        auth: executeResult.data.auth,
        kernelResponses: executeResult.data.kernel_responses,
        kernelParams: executeResult.data.kernel_params
      };

      console.log("Contract payload:", krnlPayload); 
      console.log("Airdrop address:", airdropAddress); 
      console.log("Contract instance:", contract); 
      
      // Call `submitRequest` on contract
      const tx = await contract.submitRequest(krnlPayload, airdropAddress);
      const receipt = await tx.wait();
      
      setTxHash(receipt.hash);
      setContractCallStatus('success');
      
    } catch (err: any) {
      console.error('Error calling contract:', err);
      setError(err.message || 'Failed to call contract');
      setContractCallStatus('failed');
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="text-center">Express Universal Link</CardTitle>
        <CardDescription className="text-center">
          Generate a link for Polygon ID verification
        </CardDescription>
        {wallet.isConnected ? (
          <p className="text-green-500 text-sm text-center mt-2">
            Wallet connected: {wallet.account?.slice(0, 6)}...{wallet.account?.slice(-4)}
          </p>
        ) : (
          <p className="text-yellow-500 text-sm text-center mt-2">
            No wallet connected. Connect a wallet for better experience.
          </p>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Button
          onClick={handleGenerateLink}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Clock className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <QrCode className="w-4 h-4 mr-2" />
              Generate Link
            </>
          )}
        </Button>
        
        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
            Error: {error}
          </div>
        )}
        
        {qrCodeDataUrl && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg shadow flex justify-center">
              <img 
                src={qrCodeDataUrl} 
                alt="Verification QR Code"
                width={250}
                height={250}
              />
            </div>
            
            <div className="flex justify-between">
              <Button
                onClick={copyToClipboard}
                variant="outline"
                size="sm"
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Link
                  </>
                )}
              </Button>
              
              <Button
                onClick={openInWallet}
                variant="outline"
                size="sm"
              >
                Open in Wallet
              </Button>
            </div>
            
            <div className="p-3 bg-blue-50 text-blue-700 rounded-md text-sm">
              <p className="font-medium mb-1">Instructions:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Scan this QR code with your Polygon ID wallet</li>
                <li>Follow the prompts to provide proof</li>
                <li>The verification will be processed by the server</li>
              </ol>
            </div>
            
            {/* Verification Status */}
            {verificationStatus && (
              <div className={`p-4 rounded-lg ${verificationStatus === 'success' ? 'bg-green-50' : verificationStatus === 'failed' ? 'bg-red-50' : 'bg-blue-50'}`}>
                <div className="flex items-center">
                  {verificationStatus === 'pending' && (
                    <>
                      <Loader2 className="h-5 w-5 text-blue-500 animate-spin mr-2" />
                      <p className="text-blue-700">Waiting for verification... Scan the QR code with your Polygon ID wallet.</p>
                    </>
                  )}
                  {verificationStatus === 'success' && (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      <p className="text-green-700">Verification successful!</p>
                    </>
                  )}
                  {verificationStatus === 'failed' && (
                    <>
                      <XCircle className="h-5 w-5 text-red-500 mr-2" />
                      <p className="text-red-700">Verification failed.</p>
                    </>
                  )}
                </div>
                {verificationStatus === 'pending' && isPolling && (
                  <div className="flex items-center mt-1">
                    <div className="animate-spin h-4 w-4 border-2 border-yellow-500 rounded-full border-t-transparent mr-2"></div>
                    <span>Checking status...</span>
                  </div>
                )}
                {/* Show verification details when available */}
                {verificationStatus === 'success' && verificationDetails?.processed_responses && (
                  <div className="mt-2 border-t border-green-200 pt-2">
                    <p className="font-medium mb-1">Verification Details:</p>
                    <div className="text-xs">
                      <p>Timestamp: {new Date(verificationDetails.timestamp).toLocaleString()}</p>
                      {verificationDetails.processed_responses.map((response: any, index: number) => (
                        <div key={index} className="mt-1 border-l-2 border-green-300 pl-2">
                          <p>Kernel ID: {response.kernelId}</p>
                          <p>Result: {response.result || 'No result'}</p>
                          {response.error && <p className="text-red-600">Error: {response.error}</p>}
                        </div>
                      ))}
                    </div>
                    
                    {/* Contract call section */}
                    <div className="mt-3 pt-2 border-t border-green-200">
                      <p className="font-medium mb-1">Claim Airdrop:</p>
                      <div className="flex flex-col space-y-2 mb-2">
                        <label className="text-xs">Airdrop Address:</label>
                        <input
                          type="text"
                          className="text-xs border rounded p-1 w-full font-mono"
                          value={airdropAddress}
                          onChange={(e) => setAirdropAddress(e.target.value)}
                          placeholder="0x..."
                        />
                      </div>
                      
                      <Button
                        onClick={() => callContract(localStorage.getItem('sessionId') || '')}
                        disabled={contractCallStatus === 'calling'}
                        size="sm"
                        className="w-full"
                      >
                        {contractCallStatus === 'calling' ? (
                          <>
                            <Clock className="w-3 h-3 mr-1 animate-spin" />
                            Calling Contract...
                          </>
                        ) : contractCallStatus === 'success' ? (
                          <>✅ Contract Called Successfully</>
                        ) : contractCallStatus === 'failed' ? (
                          <>❌ Contract Call Failed</>
                        ) : (
                          <>Call Contract</>
                        )}
                      </Button>
                      
                      {txHash && (
                        <div className="mt-2 text-xs">
                          <p>Transaction Hash:</p>
                          <a 
                            href={`https://mumbai.polygonscan.com/tx/${txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 break-all"
                          >
                            {txHash}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {verificationStatus === 'failed' && verificationDetails?.message && (
                  <div className="mt-2 text-xs">
                    <p>Reason: {verificationDetails.message}</p>
                  </div>
                )}
              </div>
            )}
            
            <div className="text-xs text-gray-500 text-center">
              Using Express API at http://localhost:8080
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
