import SimpleUniversalLink from '@/components/SimpleUniversalLink';
import { Header } from '@/components/Header';

export default function UniversalLinkDemoPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Universal Link API Demo</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            A simple demonstration of the universal link API for Polygon ID verification
          </p>
        </div>
        
        <div className="flex justify-center">
          <SimpleUniversalLink />
        </div>
        
        <div className="mt-12 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">How It Works</h2>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">1. Generate Auth Request</h3>
              <p className="text-gray-600">
                Call <code>/api/universal-link?sessionId=123</code> to generate an auth request.
                The API returns a JSON object that can be encoded and used in a universal link.
              </p>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">2. Create Universal Link</h3>
              <p className="text-gray-600">
                Encode the auth request as base64 and create a universal link:
                <br />
                <code>https://wallet.privado.id/#i_m=[encoded_request]</code>
              </p>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">3. Handle Callback</h3>
              <p className="text-gray-600">
                When the user completes verification in their wallet, the proof is sent to:
                <br />
                <code>/api/universal-link?sessionId=123</code>
                <br />
                The API verifies the proof and returns the result.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
