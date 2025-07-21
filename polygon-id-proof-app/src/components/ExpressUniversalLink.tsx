'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { QrCode, Copy, CheckCircle, Clock, Loader2, XCircle, Gift, Sparkles, AlertCircle } from 'lucide-react';
import QRCode from 'qrcode';
import { useDynamicWallet } from '@/hooks/useDynamicWallet';
import { ethers } from 'ethers';
import { abi as contractAbi, CONTRACT_ADDRESS } from '@/lib/krnlConfig';
import { toast } from 'sonner';

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
  const [airdropAddress, setAirdropAddress] = useState<string>('');
  
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
      toast.info(
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Generating verification QR code...</span>
        </div>
      );

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

        toast.success(
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>QR code generated successfully! Scan with your Privado ID wallet.</span>
          </div>
        );
      }
      
    } catch (err) {
      console.error('Error generating QR code:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate QR code';
      setError(errorMessage);
      
      toast.error(
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{errorMessage}</span>
        </div>
      );
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
    
  };
  
  // Check verification status
  const checkVerificationStatus = async (sessionId: string) => {
    try {
      // Check if polling has timed out (5 minutes)
      if (pollingStartTimeRef.current && Date.now() - pollingStartTimeRef.current > POLLING_TIMEOUT) {
        setVerificationStatus('failed');
        stopPolling();
        setError('Verification timeout. Please try again.');
        
        toast.error(
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>Verification timeout. Please try again.</span>
          </div>
        );
        return;
      }
      
      const response = await fetch(`/api/verification-status?sessionId=${sessionId}`);
      
      if (!response.ok) {
        console.error(`Status check failed: ${response.status}`);
        return;
      }
      
      const data = await response.json();
      
      // Only update details if they changed to avoid unnecessary re-renders
      setVerificationDetails((prevDetails: any) => {
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
        
        toast.success(
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>Verification successful! You can now claim your tokens.</span>
          </div>
        );
      } else if (data.verified === false) {
        // Verification explicitly failed (has been processed and failed)
        setVerificationStatus('failed');
        stopPolling();
        
        console.log('Verification failed. Polling stopped.');
        
        toast.error(
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4" />
            <span>Verification failed. Please try again.</span>
          </div>
        );
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
      toast.error(
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>Missing required information for contract call</span>
        </div>
      );
      return;
    }
    
    if (!wallet?.signer) {
      const errorMsg = 'Wallet not connected or signer not available';
      setError(errorMsg);
      setContractCallStatus('failed');
      toast.error(
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{errorMsg}</span>
        </div>
      );
      return;
    }
    
    setContractCallStatus('calling');
    toast.info(
      <div className="flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Preparing to claim tokens...</span>
      </div>
    );
    
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
      
      toast.info(
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Fetching verification data...</span>
        </div>
      );
      
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
      const executeResult = sessionData;
      
      if (!executeResult) {
        throw new Error('Execute result not found in session data');
      }
      
      // Create contract instance
      if (!CONTRACT_ADDRESS) {
        throw new Error("Contract address is required");
      }
      
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi, wallet.signer);
      
      // Format payload as expected by AirdropContract.sol
      const krnlPayload = {
        auth: executeResult.data.auth,
        kernelResponses: executeResult.data.kernel_responses,
        kernelParams: executeResult.data.kernel_params
      };

      
      toast.info(
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Submitting transaction to claim tokens...</span>
        </div>
      );
      
      // Call `submitRequest` on contract
      const tx = await contract.submitRequest(krnlPayload, airdropAddress);
      
      toast.info(
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Transaction submitted! Waiting for confirmation...</span>
        </div>
      );
      
      const receipt = await tx.wait();
      
      setTxHash(receipt.hash);
      setContractCallStatus('success');
      
      toast.success(
        <div className="flex items-center gap-2">
          <Gift className="w-4 h-4" />
          <span>Tokens claimed successfully!</span>
        </div>
      );
      
    } catch (err: any) {
      console.error('Error calling contract:', err);
      const errorMessage = err.message || 'Failed to call contract';
      setError(errorMessage);
      setContractCallStatus('failed');
      
      toast.error(
        <div className="flex items-center gap-2">
          <XCircle className="w-4 h-4" />
          <span>{errorMessage}</span>
        </div>
      );
    }
  };

  // Determine the current step based on verification and contract call status
  const getCurrentStep = () => {
    if (!qrCodeDataUrl) return 1;
    if (verificationStatus === 'pending') return 1;
    if (verificationStatus === 'success' && contractCallStatus !== 'success') return 2;
    if (verificationStatus === 'success' && contractCallStatus === 'success') return 3;
    return 1;
  };
  
  const currentStep = getCurrentStep();
  
  return (
    <div className="w-full space-y-8">
      {/* Glass Progress Indicator */}
      <div className="flex items-center justify-center">
        <div className="flex items-center space-x-3">
          {/* Step 1: Generate QR & Verify */}
          <div className={`w-10 h-10 ${currentStep >= 1 ? 'bg-gradient-to-r from-blue-500 to-purple-500 shadow-xl shadow-blue-500/50' : 'bg-white/5 border border-white/20'} rounded-2xl flex items-center justify-center transition-all duration-500`} style={{ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}>
            {currentStep > 1 ? (
              <CheckCircle className="w-5 h-5 text-white" />
            ) : (
              <span className={`text-sm font-bold ${currentStep >= 1 ? 'text-white' : 'text-white/60'}`}>1</span>
            )}
          </div>
          <div className={`w-12 h-1 ${currentStep >= 2 ? 'bg-gradient-to-r from-blue-500/50 to-purple-500/50' : 'bg-white/20'} rounded-full transition-all duration-500`}></div>
          
          {/* Step 2: Verification Success */}
          <div className={`w-10 h-10 ${currentStep >= 2 ? 'bg-gradient-to-r from-blue-500 to-purple-500 shadow-xl shadow-blue-500/50' : 'bg-white/5 border border-white/20'} rounded-2xl flex items-center justify-center transition-all duration-500`} style={{ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}>
            {currentStep > 2 ? (
              <CheckCircle className="w-5 h-5 text-white" />
            ) : (
              <span className={`text-sm font-bold ${currentStep >= 2 ? 'text-white' : 'text-white/60'}`}>2</span>
            )}
          </div>
          <div className={`w-12 h-1 ${currentStep >= 3 ? 'bg-gradient-to-r from-blue-500/50 to-purple-500/50' : 'bg-white/20'} rounded-full transition-all duration-500`}></div>
          
          {/* Step 3: Claim Tokens */}
          <div className={`w-10 h-10 ${currentStep >= 3 ? 'bg-gradient-to-r from-blue-500 to-purple-500 shadow-xl shadow-blue-500/50' : 'bg-white/5 border border-white/20'} rounded-2xl flex items-center justify-center transition-all duration-500`} style={{ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}>
            {currentStep === 3 && contractCallStatus === 'success' ? (
              <Gift className="w-5 h-5 text-white" />
            ) : (
              <span className={`text-sm font-bold ${currentStep >= 3 ? 'text-white' : 'text-white/60'}`}>3</span>
            )}
          </div>
        </div>
      </div>
      
      {/* Step Labels */}
      <div className="flex items-center justify-center text-xs text-white/70">
        <div className="flex items-center space-x-3 px-1">
          <div className="w-10 text-center">
            <span className={`${currentStep === 1 ? 'text-white font-bold' : ''}`}>Verify</span>
          </div>
          <div className="w-12"></div>
          <div className="w-10 text-center">
            <span className={`${currentStep === 2 ? 'text-white font-bold' : ''}`}>Success</span>
          </div>
          <div className="w-12"></div>
          <div className="w-10 text-center">
            <span className={`${currentStep === 3 ? 'text-white font-bold' : ''}`}>Claim</span>
          </div>
        </div>
      </div>

      {/* Glass Status Display */}
      {wallet.isConnected && (
        <div className="bg-white/5 border border-white/20 rounded-3xl p-5 shadow-xl shadow-black/25" style={{ backdropFilter: 'blur(15px)', WebkitBackdropFilter: 'blur(15px)' }}>
          <div className="flex items-center gap-4">
            <div className="w-4 h-4 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-400/50"></div>
            <span className="text-white text-sm font-semibold">
              {wallet.account?.slice(0, 6)}...{wallet.account?.slice(-4)} connected
            </span>
          </div>
        </div>
      )}
      
      {/* Glass Generate QR Button */}
      <Button
        onClick={handleGenerateLink}
        disabled={isLoading}
        className="w-full bg-purple-500/90 hover:bg-purple-600/90 text-white font-bold py-5 text-lg rounded-3xl transition-all duration-300 shadow-xl shadow-purple-500/40 flex items-center justify-center gap-3 border border-white/20 disabled:opacity-50 disabled:hover:bg-purple-500/90"
        style={{ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Generating QR Code...</span>
          </>
        ) : (
          <>
            <QrCode className="w-6 h-6" />
            <span>Generate Verification QR</span>
          </>
        )}
      </Button>
        
      {/* Glass Error Display */}
      {error && (
        <div className="p-6 bg-white/5 border border-red-500/50 text-red-300 rounded-3xl shadow-xl shadow-red-500/25" style={{ backdropFilter: 'blur(15px)', WebkitBackdropFilter: 'blur(15px)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-500 rounded-2xl flex items-center justify-center">
              <XCircle className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold">Error:</span>
          </div>
          <p className="mt-3 font-medium">{error}</p>
        </div>
      )}
        
      {/* Glass QR Code Section */}
      {qrCodeDataUrl && (
        <div className="space-y-8">
          {/* Glass QR Code Display */}
          <div className="bg-white/5 border border-white/20 p-8 rounded-3xl flex justify-center shadow-2xl shadow-black/25" style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
            <img 
              src={qrCodeDataUrl} 
              alt="Verification QR Code"
              width={220}
              height={220}
              className="rounded-2xl"
            />
          </div>
          
          {/* Glass Action Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={copyToClipboard}
              variant="outline"
              size="sm"
              className="bg-emerald-500/90 hover:bg-emerald-600/90 text-white font-medium py-3 rounded-2xl transition-all duration-300 shadow-xl shadow-emerald-500/40 flex items-center justify-center gap-2 border border-white/20"
              style={{ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
            >
              {copied ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  <span>Copy Link</span>
                </>
              )}
            </Button>
            
            <Button
              onClick={openInWallet}
              variant="outline"
              size="sm"
              className="bg-blue-500/90 hover:bg-blue-600/90 text-white font-medium py-3 rounded-2xl transition-all duration-300 shadow-xl shadow-blue-500/40 flex items-center justify-center gap-2 border border-white/20"
              style={{ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
            >
              <QrCode className="w-5 h-5" />
              <span>Open in Wallet</span>
            </Button>
          </div>
            
          {/* Glass Instructions */}
          <div className="p-8 bg-white/5 border border-white/20 rounded-3xl shadow-xl shadow-black/25" style={{ backdropFilter: 'blur(15px)', WebkitBackdropFilter: 'blur(15px)' }}>
            <p className="font-bold mb-6 flex items-center gap-3 text-white">
              <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg">Instructions:</span>
            </p>
            {verificationStatus === null && (
              <ol className="list-decimal list-inside space-y-3 ml-10 text-white/80 font-medium">
                <li className="font-bold text-white">Scan QR code with your Privado ID wallet</li>
                <li>Complete the verification process in your wallet</li>
                <li>After verification, return here to claim your tokens</li>
              </ol>
            )}
            {verificationStatus === 'pending' && (
              <ol className="list-decimal list-inside space-y-3 ml-10 text-white/80 font-medium">
                <li className="font-bold text-white">Open the QR code in your Privado ID wallet</li>
                <li className="font-bold text-white">Complete the verification process</li>
                <li>Wait for verification confirmation</li>
                <li>Once verified, you'll be able to claim your tokens</li>
              </ol>
            )}
            {verificationStatus === 'success' && contractCallStatus !== 'success' && (
              <ol className="list-decimal list-inside space-y-3 ml-10 text-white/80 font-medium">
                <li className="line-through opacity-50">Scan QR code with your Privado ID wallet</li>
                <li className="line-through opacity-50">Complete the verification process</li>
                <li className="font-bold text-white">Confirm your wallet address below</li>
                <li className="font-bold text-white">Click the "Claim 100 PROJECT X Tokens" button</li>
              </ol>
            )}
            {verificationStatus === 'success' && contractCallStatus === 'success' && (
              <div className="ml-10 text-white/80 font-medium">
                <p className="text-emerald-400 font-bold flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  <span>All steps completed! Your tokens have been claimed.</span>
                </p>
                <p className="mt-3">You can view your transaction on the block explorer using the link below.</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Glass Verification Status */}
      {verificationStatus && (
        <div className={`p-6 rounded-3xl border shadow-xl ${
          verificationStatus === 'success' 
            ? 'bg-white/5 border-emerald-500/50 shadow-emerald-500/25' 
            : verificationStatus === 'failed' 
            ? 'bg-white/5 border-red-500/50 shadow-red-500/25' 
            : 'bg-white/5 border-blue-500/50 shadow-blue-500/25'
        }`} style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
          <div className="flex items-center gap-4">
            {verificationStatus === 'pending' && (
              <>
                <div className="w-12 h-12 bg-blue-500 rounded-3xl flex items-center justify-center shadow-xl shadow-blue-500/50">
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                </div>
                <div>
                  <p className="font-bold text-white text-lg">Verification in Progress</p>
                  <p className="text-sm text-white/70 font-medium">Scan the QR code to continue...</p>
                </div>
              </>
            )}
            {verificationStatus === 'success' && (
              <>
                <div className="w-12 h-12 bg-emerald-500 rounded-3xl flex items-center justify-center shadow-xl shadow-emerald-500/50">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-white text-lg">Verification Successful! 🎉</p>
                  <p className="text-sm text-white/70 font-medium">Ready to claim your tokens</p>
                </div>
              </>
            )}
            {verificationStatus === 'failed' && (
              <>
                <div className="w-12 h-12 bg-red-500 rounded-3xl flex items-center justify-center shadow-xl shadow-red-500/50">
                  <XCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-white text-lg">Verification Failed</p>
                  <p className="text-sm text-white/70 font-medium">Please try again</p>
                </div>
              </>
            )}
          </div>
          {verificationStatus === 'pending' && isPolling && (
            <div className="flex items-center mt-6 pt-6 border-t border-white/20">
              <div className="animate-spin h-5 w-5 border-2 border-white/40 rounded-full border-t-white mr-3"></div>
              <span className="text-white/80 text-sm font-medium">Checking status...</span>
            </div>
          )}
          {/* Glass Contract Claiming Section */}
          {verificationStatus === 'success' && verificationDetails?.processed_responses && (
            <div className="mt-8 pt-8 border-t border-white/20 space-y-6">
              <div className="text-sm text-white bg-white/5 border border-white/20 rounded-2xl p-4" style={{ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}>
                <p className="font-semibold">✓ Verified at {new Date(verificationDetails.timestamp).toLocaleString()}</p>
              </div>
              
              <div className="space-y-4">
                <label className="text-sm text-white font-bold">Claim Address:</label>
                <input
                  type="text"
                  className="w-full text-sm bg-white/5 border border-white/20 rounded-2xl p-4 text-white font-mono placeholder-white/50 focus:border-white/40 focus:outline-none shadow-lg"
                  style={{ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
                  value={airdropAddress}
                  onChange={(e) => setAirdropAddress(e.target.value)}
                  placeholder="0x... (wallet address)"
                />
              </div>
              
              <Button
                onClick={() => callContract(localStorage.getItem('sessionId') || '')}
                disabled={contractCallStatus === 'calling' || !airdropAddress}
                className={`w-full font-bold py-5 text-lg rounded-3xl transition-all duration-300 flex items-center justify-center gap-3 border border-white/20 disabled:opacity-50 ${contractCallStatus === 'success' 
                  ? 'bg-emerald-500/90 hover:bg-emerald-600/90 text-white shadow-xl shadow-emerald-500/40' 
                  : contractCallStatus === 'failed'
                  ? 'bg-red-500/90 hover:bg-red-600/90 text-white shadow-xl shadow-red-500/40'
                  : 'bg-emerald-500/90 hover:bg-emerald-600/90 text-white shadow-xl shadow-emerald-500/40'
                }`}
                style={{ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
              >
                {contractCallStatus === 'calling' ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Claiming Tokens...</span>
                  </>
                ) : contractCallStatus === 'success' ? (
                  <>
                    <Gift className="w-6 h-6" />
                    <span>100 PROJECT X Claimed! 🎉</span>
                  </>
                ) : contractCallStatus === 'failed' ? (
                  <>
                    <XCircle className="w-6 h-6" />
                    <span>Claim Failed - Try Again</span>
                  </>
                ) : (
                  <>
                    <Gift className="w-6 h-6" />
                    <span>Claim 100 PROJECT X Tokens</span>
                  </>
                )}
              </Button>
                      
              {txHash && (
                <div className="mt-6 p-5 bg-white/5 border border-white/20 rounded-3xl shadow-xl shadow-black/25" style={{ backdropFilter: 'blur(15px)', WebkitBackdropFilter: 'blur(15px)' }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-white font-bold">Transaction Successful!</span>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <p className="text-sm text-white/70 font-medium mb-2">Transaction Hash:</p>
                    <a 
                      href={`https://mumbai.polygonscan.com/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-xs font-mono break-all underline font-medium flex items-center gap-2"
                    >
                      {txHash.slice(0, 18)}...{txHash.slice(-18)}
                      <span className="inline-block bg-blue-500/20 text-blue-300 rounded-full px-2 py-1 text-[10px] font-bold">View on Explorer</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Glass Failed Status Details */}
      {verificationStatus === 'failed' && verificationDetails?.message && (
        <div className="p-5 bg-white/5 border border-red-500/50 rounded-3xl shadow-xl shadow-red-500/25" style={{ backdropFilter: 'blur(15px)', WebkitBackdropFilter: 'blur(15px)' }}>
          <p className="text-red-300 text-sm font-semibold">Reason: {verificationDetails.message}</p>
        </div>
      )}
      
      {/* Glass API Info */}
      {qrCodeDataUrl && (
        <div className="text-center">
          <div className="bg-white/5 border border-white/20 rounded-2xl px-4 py-2 inline-block shadow-lg" style={{ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}>
            <p className="text-xs text-white/70 font-semibold">Secured by Privado ID</p>
          </div>
        </div>
      )}
    </div>
  );
}