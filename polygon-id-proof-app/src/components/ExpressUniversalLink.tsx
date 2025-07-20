'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { QrCode, Copy, CheckCircle, Clock } from 'lucide-react';
import QRCode from 'qrcode';
import { useDynamicWallet } from '@/hooks/useDynamicWallet';

export default function ExpressUniversalLink() {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [universalLink, setUniversalLink] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  // Get wallet address from wagmi
  const { wallet } = useDynamicWallet();
  
  // API endpoint configuration - using our Next.js proxy route instead of direct ngrok URL
  const apiUrl = "/api/proxy";
  
  // Generate universal link
  const handleGenerateLink = async () => {
    setIsLoading(true);
    setError(null);
    
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
      }
      
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate link');
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
                <li>The verification will be processed by the Express server</li>
              </ol>
            </div>
            
            <div className="text-xs text-gray-500 text-center">
              Using Express API at http://localhost:8080
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
