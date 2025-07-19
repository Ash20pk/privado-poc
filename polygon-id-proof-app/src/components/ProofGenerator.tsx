'use client';

import { useState } from 'react';
import { PolygonIdWorkflowResult, runSignatureProofWorkflow } from '@/lib/polygonIdService';
import { useWagmiWallet } from '@/hooks/useWagmiWallet';
import { DynamicWidget } from '@dynamic-labs/sdk-react-core';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Shield, CheckCircle, AlertCircle, Clock, Wallet, User, Building2, Code, Radio, ArrowRight } from 'lucide-react';
import { Header } from '@/components/Header';

export default function ProofGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<PolygonIdWorkflowResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { wallet, user, refreshWallet } = useWagmiWallet();

  const handleGenerateProof = async () => {
    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      console.log(wallet)
      if (!wallet.isConnected) {
        throw new Error('Please connect your wallet first');
      }

      if (!wallet.account) {
        throw new Error('Wallet account not available. Please reconnect your wallet.');
      }

      if (!wallet.signer) {
        console.log('Signer not available, attempting to refresh...');
        await refreshWallet();
        
        // Wait a moment for the signer to be updated
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (!wallet.signer) {
          throw new Error('Wallet signer not available. Please reconnect your wallet and try again.');
        }
      }

      console.log('🚀 Starting complete proof generation with wallet...');
      console.log('💰 Wallet will be used for blockchain state transition');
      
      // Pass the wallet signer to the service
      const result = await runSignatureProofWorkflow(wallet.signer);
      
      console.log('✅ Proof generation completed successfully!');
      console.log('📡 Starting server-side verification (this may take 10-30 seconds)...');
      
      // Show the result immediately with pending verification
      setResult({...result, sigProofValid: null});
      
      // Verify the proof server-side in background
      const verifyProofAsync = async () => {
        try {
          console.log('📡 Sending proof to server for verification...');
          
          // Add timeout to fetch request
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 35000); // 35 second timeout
          
          const verificationResponse = await fetch('http://localhost:3001/verify-proof', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              proof: result.proof,
              pub_signals: result.pub_signals
            }),
            signal: controller.signal
          });

          clearTimeout(timeoutId);
          
          if (!verificationResponse.ok) {
            throw new Error(`HTTP ${verificationResponse.status}: ${verificationResponse.statusText}`);
          }

          const verificationData = await verificationResponse.json();
          
          if (verificationData.success) {
            const isValid = verificationData.data.isValid;
            const duration = verificationData.data.verificationTimeMs ? 
              `in ${(verificationData.data.verificationTimeMs / 1000).toFixed(1)}s` : '';
            console.log(`✅ Server-side verification completed ${duration}: ${isValid ? 'VALID' : 'INVALID'}`);
            
            // Update the result with verification status
            setResult(prev => prev ? {...prev, sigProofValid: isValid} : null);
          } else {
            console.warn('⚠️ Server-side verification failed:', verificationData.error);
            if (verificationData.timeout) {
              console.warn('⏰ Verification timed out - this is usually due to circuit loading delays');
            }
            setResult(prev => prev ? {...prev, sigProofValid: false} : null);
          }
        } catch (verificationError) {
          console.warn('⚠️ Could not verify proof server-side:', verificationError);
          
          if (verificationError instanceof Error) {
            if (verificationError.name === 'AbortError') {
              console.warn('⏰ Verification request timed out after 35 seconds');
            } else {
              console.warn('🔗 Network or server error during verification:', verificationError.message);
            }
          }
          
          setResult(prev => prev ? {...prev, sigProofValid: false} : null);
        }
      };
      
      // Start verification in background
      verifyProofAsync();
      
      console.log('✅ Complete workflow with MetaMask completed!');
    } catch (err) {
      console.error('❌ Error generating proof:', err);
      
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Unknown error occurred');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  console.log(wallet)

  return (
    <div className="min-h-screen bg-background noise-bg">
      <Header />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16 relative">
          {/* Floating elements */}
          <div className="absolute top-0 left-1/4 w-32 h-32 bg-black/5 rounded-full blur-xl float-animation"></div>
          <div className="absolute bottom-0 right-1/4 w-24 h-24 bg-black/3 rounded-full blur-xl float-animation" style={{ animationDelay: '1s' }}></div>
          
          <div className="relative z-10">
            <div className="flex justify-center mb-6">
              <div className="flex items-center justify-center w-20 h-20 bg-black rounded-2xl hover-glow pulse-glow">
                <Shield className="w-10 h-10 text-white" />
              </div>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-black glow-text">
              Sybil-Resistant Airdrop Platform
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Participate in fair airdrops powered by zero-knowledge proofs. No personal data revealed, just proof of uniqueness.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <Card variant="glass" className="mb-12 hover-scale border-gradient">
          <CardHeader className="text-center p-8">
            <CardTitle className="text-3xl md:text-4xl mb-4 text-black glow-text">
              How It Works
            </CardTitle>
            <CardDescription className="text-lg md:text-xl text-gray-600">
              Three simple steps to participate in sybil-resistant airdrops
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center p-6 hover-glow flex-1">
                <div className="flex items-center justify-center w-16 h-16 bg-black rounded-xl mx-auto mb-6 pulse-glow">
                  <span className="text-white font-bold text-xl">1</span>
                </div>
                <h4 className="font-semibold mb-4 text-lg text-black">Generate Proof</h4>
                <p className="text-gray-600 leading-relaxed">
                  Create a zero-knowledge proof of your uniqueness
                </p>
              </div>
              
              <ArrowRight className="hidden md:block w-8 h-8 text-gray-400" />
              <ArrowRight className="block md:hidden w-8 h-8 text-gray-400 rotate-90 my-2" />
              
              <div className="text-center p-6 hover-glow flex-1">
                <div className="flex items-center justify-center w-16 h-16 bg-black rounded-xl mx-auto mb-6 pulse-glow" style={{ animationDelay: '0.5s' }}>
                  <span className="text-white font-bold text-xl">2</span>
                </div>
                <h4 className="font-semibold mb-4 text-lg text-black">Submit to Contract</h4>
                <p className="text-gray-600 leading-relaxed">
                  Your proof is submitted for verification
                </p>
              </div>
              
              <ArrowRight className="hidden md:block w-8 h-8 text-gray-400" />
              <ArrowRight className="block md:hidden w-8 h-8 text-gray-400 rotate-90 my-2" />
              
              <div className="text-center p-6 hover-glow flex-1">
                <div className="flex items-center justify-center w-16 h-16 bg-black rounded-xl mx-auto mb-6 pulse-glow" style={{ animationDelay: '1s' }}>
                  <span className="text-white font-bold text-xl">3</span>
                </div>
                <h4 className="font-semibold mb-4 text-lg text-black">Claim Tokens</h4>
                <p className="text-gray-600 leading-relaxed">
                  Receive your airdrop after verification
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Proof Requirements */}
        <Card className="mb-8">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Zero-Knowledge Proof Requirements
            </CardTitle>
            <CardDescription>
              Your privacy is protected - only proof of meeting criteria is revealed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <div className="font-semibold">Confidence Score &gt; 80</div>
                    <div className="text-sm text-muted-foreground">Actual value hidden</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <div className="font-semibold">Reputation Level &gt; 3</div>
                    <div className="text-sm text-muted-foreground">Actual value hidden</div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <div className="font-semibold">Active Photo Capture</div>
                    <div className="text-sm text-muted-foreground">Verification method</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <div className="font-semibold">Mobile Device Security</div>
                    <div className="text-sm text-muted-foreground">Device verification</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Proof Generator */}
        <Card variant="glass" className="mb-12 hover-scale border-gradient">
          <CardHeader className="text-center p-8">
            <CardTitle className="text-3xl md:text-4xl mb-4 text-black glow-text">
              Generate Your Proof
            </CardTitle>
            <CardDescription className="text-lg md:text-xl text-gray-600">
              Connect your wallet and generate a zero-knowledge proof
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            {/* Step 1: Connect Wallet */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-8 h-8 bg-black rounded-full">
                  <span className="text-white font-bold text-sm">1</span>
                </div>
                <h3 className="font-semibold text-lg">Connect Your Wallet</h3>
              </div>
              
              {wallet.account && (
                <Card className="glass-card hover-glow mb-6">
                  <CardContent className="pt-6">
                    <div className="space-y-3 text-base">
                      <p className="flex items-center gap-2">
                        <span className="font-medium">Address:</span>
                        <span className="text-muted-foreground">{wallet.account?.substring(0, 6)}...{wallet.account?.substring(38)}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="font-medium">Balance:</span>
                        <span className="text-muted-foreground">{wallet.balance} POL</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="font-medium">Signer:</span>
                        <span className={wallet.signer ? 'text-green-600' : 'text-red-600'}>
                          {wallet.signer ? '✅ Available' : '❌ Not available'}
                        </span>
                      </p>
                      {user?.email && (
                        <p className="flex items-center gap-2">
                          <span className="font-medium">Email:</span>
                          <span className="text-muted-foreground">{user.email}</span>
                        </p>
                      )}
                    </div>
                    {!wallet.signer && (
                      <div className="mt-6 pt-6 border-t">
                        <Button
                          onClick={refreshWallet}
                          variant="outline"
                          size="sm"
                          className="w-full hover-glow"
                        >
                          Refresh Signer
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
            

            <Button
              onClick={handleGenerateProof}
              disabled={isGenerating}
              className="w-full text-lg px-8 py-6 bg-black hover:bg-black/90 text-white transition-all duration-300 hover-glow pulse-glow"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Clock className="w-5 h-5 mr-3 animate-spin" />
                  Generating Proof... (2-5 minutes)
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5 mr-3" />
                  Generate Sybil-Resistant Proof
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isGenerating && (
          <Card className="mb-8">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Clock className="w-5 h-5 animate-spin" />
                Processing Your Proof
              </CardTitle>
              <CardDescription>
                Please wait while we generate your zero-knowledge proof
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Progress value={33} className="w-full" />
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold mb-3">Current Steps:</h4>
                    <div className="space-y-2">
                      <div className="text-sm space-y-1">
                        <p className="flex items-center gap-2">
                          <Clock className="w-4 h-4 animate-spin" />
                          Client-side processing with wallet integration
                        </p>
                        <ul className="ml-6 space-y-1">
                          <li>• Creating user and issuer identities</li>
                          <li>• Issuing Uniqueness credential</li>
                          <li>• Publishing state to blockchain <Badge variant="secondary">wallet signature required</Badge></li>
                          <li>• Generating zero-knowledge uniqueness proof</li>
                          <li>• Verifying proof server-side</li>
                        </ul>
                        <Card className="bg-blue-100 border-blue-200 mt-3">
                          <CardContent className="pt-3">
                            <p className="text-xs flex items-center gap-2">
                              <Wallet className="w-3 h-3" />
                              Your wallet will prompt you to sign the state transition transaction.
                            </p>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Card className="mb-8 border-red-200">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-red-600">
                <AlertCircle className="w-5 h-5" />
                Error Occurred
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Success State */}
        {result && (
          <div className="space-y-6">
            <Card className="border-green-200">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2 text-green-600">
                  <CheckCircle className="w-8 h-8" />
                  Sybil-Resistant Proof Generated!
                </CardTitle>
                <Badge variant={result.sigProofValid === null ? "secondary" : result.sigProofValid ? "default" : "destructive"}>
                  {result.sigProofValid === null 
                    ? 'Verifying on-chain...' 
                    : result.sigProofValid 
                      ? 'VERIFIED - Eligible for airdrop' 
                      : 'VERIFICATION FAILED'
                  }
                </Badge>
              </CardHeader>
              <CardContent>
                {result.sigProofValid === false && (
                  <Card className="bg-orange-50 border-orange-200 mb-6">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-orange-600" />
                        <span className="text-orange-800">Proof verification failed - please try again or contact support</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {result.sigProofValid === true && (
                  <Card className="bg-green-50 border-green-200 mb-6">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="font-semibold">Eligibility Confirmed!</span>
                      </div>
                      <p className="text-green-800 mb-4">
                        You meet all uniqueness criteria for the airdrop
                      </p>
                      <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold">Ready for Airdrop Claim!</div>
                              <div className="text-green-100 text-sm">
                                Your proof is valid for claiming 1,000 SRT tokens
                              </div>
                            </div>
                            <div className="text-2xl font-bold">1,000 SRT</div>
                          </div>
                        </CardContent>
                      </Card>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>

            {/* Technical Details */}
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  <Code className="w-5 h-5" />
                  Technical Details
                </CardTitle>
                <CardDescription>
                  Your proof and identity information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <User className="w-4 h-4" />
                        User DID
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <code className="text-xs break-all bg-muted p-2 rounded block">
                        {result.userDID}
                      </code>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        Issuer DID
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <code className="text-xs break-all bg-muted p-2 rounded block">
                        {result.issuerDID}
                      </code>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Generated Proof
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="text-xs bg-muted p-4 rounded overflow-auto max-h-40">
                        {JSON.stringify(result.proof, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Radio className="w-4 h-4" />
                        Public Signals
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="text-xs bg-muted p-4 rounded overflow-auto max-h-40">
                        {JSON.stringify(result.pub_signals, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}