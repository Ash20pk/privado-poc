'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Home, QrCode } from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/components/Header';

export default function VerificationCompletePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background noise-bg">
      <Header />

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          {/* Success Animation */}
          <div className="flex justify-center mb-6">
            <div className="flex items-center justify-center w-24 h-24 bg-green-500 rounded-full animate-pulse">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
          </div>

          {/* Success Message */}
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-3xl text-green-700">
                Verification Complete!
              </CardTitle>
              <CardDescription className="text-lg text-green-600">
                Your proof has been successfully submitted
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-green-700">
                  Thank you for completing the verification process. Your zero-knowledge proof 
                  has been generated and submitted successfully.
                </p>
                
                <Card className="bg-white border-green-200">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold mb-2">What happens next?</h4>
                    <ul className="text-sm text-gray-600 space-y-1 text-left">
                      <li>• Your proof is being verified by the application</li>
                      <li>• You will be notified of the verification result</li>
                      <li>• No personal data was shared during this process</li>
                      <li>• Only cryptographic proof of your credentials was provided</li>
                    </ul>
                  </CardContent>
                </Card>

                <div className="flex gap-4 justify-center pt-4">
                  <Button asChild variant="default">
                    <Link href="/">
                      <Home className="w-4 h-4 mr-2" />
                      Return Home
                    </Link>
                  </Button>
                  
                  <Button asChild variant="outline">
                    <Link href="/universal-link">
                      <QrCode className="w-4 h-4 mr-2" />
                      Generate Another Link
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
