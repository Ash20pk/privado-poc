'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { QrCode, ExternalLink, Copy, CheckCircle, AlertCircle, Clock, Smartphone, Globe, RefreshCw } from 'lucide-react';
import { Header } from '@/components/Header';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import {
  CircuitId,
  ZeroKnowledgeProofRequest,
  AuthorizationRequestMessage,
  PROTOCOL_CONSTANTS,
  core,
  CredentialStatusType
} from '@0xpolygonid/js-sdk';

interface UniversalLinkState {
  authRequest: AuthorizationRequestMessage | null;
  universalLink: string | null;
  qrCodeDataUrl: string | null;
  requestId: string | null;
}

export default function UniversalLinkGenerator() {
  const [linkState, setLinkState] = useState<UniversalLinkState>({
    authRequest: null,
    universalLink: null,
    qrCodeDataUrl: null,
    requestId: null
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Create KYC Age Credential proof request
  const createUniquenessCredentialRequest = (): ZeroKnowledgeProofRequest => {
    return {
      id: 1,
      circuitId: CircuitId.AtomicQuerySigV2,
      optional: false,
      query: {
        allowedIssuers: ['*'],
        type: 'UniquenessCredential',
        context: 'https://raw.githubusercontent.com/Ash20pk/privado-poc/refs/heads/main/public/schemas/json-ld/UniquenessCredential.jsonld',
        credentialSubject: {
          confidenceScore: {
            $gt: 80 // Prove that confidence score is >= 80
          }
        }
      }
    };
  };

  // Generate authorization request
  const generateAuthRequest = (): AuthorizationRequestMessage => {
    const requestId = uuidv4();
    const verifierDID = 'did:polygonid:polygon:amoy:2qM4krYhpKkCPHv3tHgW8d1yJE3aWZrpREeD2CE9nk';
    const proofRequest = createUniquenessCredentialRequest();

    const authRequest: AuthorizationRequestMessage = {
      id: requestId,
      thid: requestId,
      typ: PROTOCOL_CONSTANTS.MediaType.PlainMessage,
      type: PROTOCOL_CONSTANTS.PROTOCOL_MESSAGE_TYPE.AUTHORIZATION_REQUEST_MESSAGE_TYPE,
      from: verifierDID,
      body: {
        callbackUrl: `${window.location.origin}/api/verify-proof`,
        reason: 'Verify your age to access this service',
        message: 'Please prove you are over 22 years old using your KYC credential',
        scope: [proofRequest]
      }
    };

    return authRequest;
  };

  // Generate universal link from auth request
  const generateUniversalLink = (authRequest: AuthorizationRequestMessage): string => {
    const encodedRequest = btoa(JSON.stringify(authRequest));
    const backUrl = encodeURIComponent(window.location.href);
    const finishUrl = encodeURIComponent(`${window.location.origin}/verification-complete`);
    
    return `https://wallet.privado.id/#i_m=${encodedRequest}&back_url=${backUrl}&finish_url=${finishUrl}`;
  };

  // Generate QR code from universal link
  const generateQRCode = async (universalLink: string): Promise<string> => {
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(universalLink, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      return qrCodeDataUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  };

  // Handle generating the complete flow
  const handleGenerateLink = async () => {
    setIsGenerating(true);
    
    try {
      console.log('🔗 Generating authorization request...');
      const authRequest = generateAuthRequest();
      
      console.log('🌐 Creating universal link...');
      const universalLink = generateUniversalLink(authRequest);
      
      console.log('📱 Generating QR code...');
      const qrCodeDataUrl = await generateQRCode(universalLink);
      
      setLinkState({
        authRequest,
        universalLink,
        qrCodeDataUrl,
        requestId: authRequest.id
      });
      
      console.log('✅ Universal link and QR code generated successfully!');
    } catch (error) {
      console.error('❌ Error generating universal link:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy link to clipboard
  const copyToClipboard = async () => {
    if (linkState.universalLink) {
      try {
        await navigator.clipboard.writeText(linkState.universalLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
      }
    }
  };

  // Open link in new tab
  const openInNewTab = () => {
    if (linkState.universalLink) {
      window.open(linkState.universalLink, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-background noise-bg">
      <Header />

      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16 relative">
          <div className="absolute top-0 left-1/4 w-32 h-32 bg-black/5 rounded-full blur-xl float-animation"></div>
          <div className="absolute bottom-0 right-1/4 w-24 h-24 bg-black/3 rounded-full blur-xl float-animation" style={{ animationDelay: '1s' }}></div>
          
          <div className="relative z-10">
            <div className="flex justify-center mb-6">
              <div className="flex items-center justify-center w-20 h-20 bg-black rounded-2xl hover-glow pulse-glow">
                <QrCode className="w-10 h-10 text-white" />
              </div>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-black glow-text">
              Privado ID Universal Link Generator
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Generate universal links and QR codes for seamless wallet verification
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
              Three simple steps to verify credentials with Privado ID
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center p-6 hover-glow flex-1">
                <div className="flex items-center justify-center w-16 h-16 bg-black rounded-xl mx-auto mb-6 pulse-glow">
                  <span className="text-white font-bold text-xl">1</span>
                </div>
                <h4 className="font-semibold mb-4 text-lg text-black">Generate Link</h4>
                <p className="text-gray-600 leading-relaxed">
                  Create a verification request with specific credential requirements
                </p>
              </div>
              
              <div className="text-center p-6 hover-glow flex-1">
                <div className="flex items-center justify-center w-16 h-16 bg-black rounded-xl mx-auto mb-6 pulse-glow" style={{ animationDelay: '0.5s' }}>
                  <span className="text-white font-bold text-xl">2</span>
                </div>
                <h4 className="font-semibold mb-4 text-lg text-black">Scan QR Code</h4>
                <p className="text-gray-600 leading-relaxed">
                  User scans QR code or clicks link to open in wallet
                </p>
              </div>
              
              <div className="text-center p-6 hover-glow flex-1">
                <div className="flex items-center justify-center w-16 h-16 bg-black rounded-xl mx-auto mb-6 pulse-glow" style={{ animationDelay: '1s' }}>
                  <span className="text-white font-bold text-xl">3</span>
                </div>
                <h4 className="font-semibold mb-4 text-lg text-black">Receive Proof</h4>
                <p className="text-gray-600 leading-relaxed">
                  Wallet generates proof and sends it back for verification
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Verification Requirements */}
        <Card className="mb-8">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Verification Requirements
            </CardTitle>
            <CardDescription>
              Users will need to prove the following with their KYC credential
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <div className="font-semibold">Age Verification</div>
                    <div className="text-sm text-muted-foreground">Must be born before 01/01/2002 (over 22)</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <div className="font-semibold">KYC Credential</div>
                    <div className="text-sm text-muted-foreground">Valid KYCAgeCredential from any issuer</div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <div className="font-semibold">Zero-Knowledge Proof</div>
                    <div className="text-sm text-muted-foreground">AtomicQuerySigV2 circuit</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <div className="font-semibold">Privacy Preserved</div>
                    <div className="text-sm text-muted-foreground">Only proof of age, no personal data</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Generator */}
        <Card variant="glass" className="mb-12 hover-scale border-gradient">
          <CardHeader className="text-center p-8">
            <CardTitle className="text-3xl md:text-4xl mb-4 text-black glow-text">
              Generate Universal Link
            </CardTitle>
            <CardDescription className="text-lg md:text-xl text-gray-600">
              Create a verification request for users to scan with their wallet
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <Button
              onClick={handleGenerateLink}
              disabled={isGenerating}
              className="w-full text-lg px-8 py-6 bg-black hover:bg-black/90 text-white transition-all duration-300 hover-glow pulse-glow"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Clock className="w-5 h-5 mr-3 animate-spin" />
                  Generating Link...
                </>
              ) : (
                <>
                  <QrCode className="w-5 h-5 mr-3" />
                  Generate Universal Link & QR Code
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Generated Link Results */}
        {linkState.universalLink && (
          <div className="space-y-6">
            {/* QR Code */}
            <Card className="border-green-200">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2 text-green-600">
                  <CheckCircle className="w-8 h-8" />
                  Universal Link Generated!
                </CardTitle>
                <Badge variant="default">Ready for scanning</Badge>
              </CardHeader>
              <CardContent className="text-center">
                <div className="flex flex-col items-center gap-6">
                  {/* QR Code Display */}
                  {linkState.qrCodeDataUrl && (
                    <div className="bg-white p-6 rounded-2xl shadow-lg hover-scale">
                      <img 
                        src={linkState.qrCodeDataUrl} 
                        alt="Verification QR Code"
                        className="mx-auto"
                        width={300}
                        height={300}
                      />
                    </div>
                  )}

                  {/* Instructions */}
                  <Card className="bg-blue-50 border-blue-200 max-w-md">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Smartphone className="w-5 h-5 text-blue-600" />
                        <span className="font-semibold text-blue-800">How to Use</span>
                      </div>
                      <ol className="text-sm text-blue-700 space-y-1">
                        <li>1. Open Privado ID wallet on your mobile device</li>
                        <li>2. Scan this QR code with your wallet</li>
                        <li>3. Follow the prompts to generate your proof</li>
                        <li>4. Your proof will be sent back for verification</li>
                      </ol>
                    </CardContent>
                  </Card>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Button
                      onClick={copyToClipboard}
                      variant="outline"
                      className="hover-glow"
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
                      onClick={openInNewTab}
                      variant="outline"
                      className="hover-glow"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open Link
                    </Button>

                    <Button
                      onClick={handleGenerateLink}
                      variant="outline"
                      className="hover-glow"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Regenerate
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Technical Details */}
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  <Globe className="w-5 h-5" />
                  Technical Details
                </CardTitle>
                <CardDescription>
                  Authorization request and universal link information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Request ID</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <code className="text-xs break-all bg-muted p-2 rounded block">
                        {linkState.requestId}
                      </code>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Universal Link</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <code className="text-xs break-all bg-muted p-2 rounded block">
                        {linkState.universalLink}
                      </code>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Authorization Request</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="text-xs bg-muted p-4 rounded overflow-auto max-h-60">
                        {JSON.stringify(linkState.authRequest, null, 2)}
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