import ExpressUniversalLink from '@/components/ExpressUniversalLink';
import { Header } from '@/components/Header';

export default function ExpressLinkPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Express API Universal Link</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Generate universal links using the Express API running on ngrok
          </p>
        </div>
        
        <div className="flex justify-center">
          <ExpressUniversalLink />
        </div>
        
        <div className="mt-12 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">How It Works</h2>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">1. Generate Auth Request</h3>
              <p className="text-gray-600">
                The Express server creates an auth request when you call <code>/api/sign-in</code>.
                This request includes a proof request for KYC age verification.
              </p>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">2. Create Universal Link</h3>
              <p className="text-gray-600">
                The auth request is encoded and used to create a universal link that opens in the Polygon ID wallet.
              </p>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">3. Handle Callback</h3>
              <p className="text-gray-600">
                When the user completes verification in their wallet, the proof is sent to <code>/api/callback</code> on the Express server.
                The server verifies the proof and returns the result.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
