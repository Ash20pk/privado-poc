'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { QrCode, Copy, CheckCircle, Clock } from 'lucide-react';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

interface UniversalLinkState {
  authRequest: any;
  universalLink: string | null;
  qrCodeDataUrl: string | null;
  sessionId: string | null;
}

export default function SimpleUniversalLink() {
  const [linkState, setLinkState] = useState<UniversalLinkState>({
    authRequest: null,
    universalLink: null,
    qrCodeDataUrl: null,
    sessionId: null
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [verificationResult, setVerificationResult] = useState<any>(null);

  // Generate universal link using our API
  const handleGenerateLink = async () => {
    setIsGenerating(true);
    
    try {
      // Generate a unique session ID
      const sessionId = uuidv4();
      
      // Call our API to get the auth request
      const response = await fetch(`/api/universal-link?sessionId=${sessionId}&credentialType=UniquenessCredential`);
      const authRequest = await response.json();
      
      // Generate universal link
      const encodedRequest = btoa(JSON.stringify(authRequest));
      const backUrl = encodeURIComponent(window.location.href);
      const finishUrl = encodeURIComponent(`${window.location.origin}/verification-complete`);
      const universalLink = `https://wallet.privado.id/#i_m=${encodedRequest}&back_url=${backUrl}&finish_url=${finishUrl}`;
      
      // Generate QR code
      const qrCodeDataUrl = await QRCode.toDataURL(universalLink, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      setLinkState({
        authRequest,
        universalLink,
        qrCodeDataUrl,
        sessionId
      });
      
      // Start polling for verification status
      startPollingVerificationStatus(sessionId);
      
    } catch (error) {
      console.error('Error generating universal link:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Poll for verification status
  const startPollingVerificationStatus = (sessionId: string) => {
    setVerificationStatus('pending');
    
    // In a real application, you would implement WebSockets or polling
    // For this example, we'll just simulate the verification process
    // In a production app, you might want to check a status endpoint that verifies if
    // the callback has been received for this session ID
    
    // This is just a placeholder for demonstration purposes
    const checkInterval = setInterval(() => {
      // In a real implementation, you would check if the verification has completed
      // by making an API call to a status endpoint
      
      // For now, we'll just clear the interval after some time
      clearInterval(checkInterval);
    }, 2000);
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

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Universal Link Generator</CardTitle>
          <CardDescription>
            Generate a universal link for Polygon ID verification
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button
              onClick={handleGenerateLink}
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <QrCode className="w-4 h-4 mr-2" />
                  Generate Universal Link
                </>
              )}
            </Button>
            
            {linkState.qrCodeDataUrl && (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg shadow flex justify-center">
                  <img 
                    src={linkState.qrCodeDataUrl} 
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
                  
                  <div className="text-sm text-gray-500">
                    Session ID: {linkState.sessionId?.substring(0, 8)}...
                  </div>
                </div>
                
                {verificationStatus === 'pending' && (
                  <div className="text-sm text-blue-600 flex items-center">
                    <Clock className="w-4 h-4 mr-1 animate-spin" />
                    Waiting for verification...
                  </div>
                )}
                
                {verificationStatus === 'success' && (
                  <div className="text-sm text-green-600 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Verification successful!
                  </div>
                )}
                
                {verificationStatus === 'error' && (
                  <div className="text-sm text-red-600">
                    Verification failed. Please try again.
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
