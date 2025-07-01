"use client";

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Wallet, User, Shield, FileCheck, CheckCircle, AlertCircle } from "lucide-react";

// Import our custom hook
import { useWallet } from '@/hooks/useWallet';

// Use dynamic import for the HumanityVerificationWallet component
const HumanityVerificationWallet = dynamic(
  () => import('@/components/HumanityVerificationWallet'),
  { 
    ssr: false,
    loading: () => <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  }
);

export default function WalletPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("identity");
  const [success, setSuccess] = useState<string | null>(null);
  const [showLegacyWallet, setShowLegacyWallet] = useState(false);
  
  // Use our custom wallet hook
  const {
    isInitialized,
    isLoading,
    error,
    identities,
    credentials,
    createIdentity,
    issueCredential,
    generateProof,
    refreshWallet
  } = useWallet();
  
  // Handle creating a new identity
  const handleCreateIdentity = async () => {
    const identity = await createIdentity();
    if (identity) {
      setSuccess("Identity created successfully!");
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    }
  };
  
  // Handle issuing a credential
  const handleIssueCredential = async () => {
    if (identities.length === 0) {
      return;
    }
    
    const issuerDid = identities[0].did;
    const credential = await issueCredential(
      "HumanityVerification",
      {
        isHuman: true,
        verificationLevel: "medium",
        timestamp: Date.now()
      },
      issuerDid
    );
    
    if (credential) {
      setSuccess("Credential issued successfully!");
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    }
  };
  
  // Go back to home
  const handleGoBack = () => {
    router.push('/');
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <Wallet className="h-8 w-8" />
          <h1 className="text-2xl font-bold">Polygon ID Wallet</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleGoBack}>
            Back to Home
          </Button>
          <Button variant="outline" onClick={() => setShowLegacyWallet(!showLegacyWallet)}>
            {showLegacyWallet ? "New Wallet UI" : "Legacy Wallet UI"}
          </Button>
        </div>
      </header>
      
      {success && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}
      
      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}
      
      {showLegacyWallet ? (
        <HumanityVerificationWallet />
      ) : (
        <div>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="identity">
                  <User className="h-4 w-4 mr-2" /> Identity
                </TabsTrigger>
                <TabsTrigger value="credentials">
                  <FileCheck className="h-4 w-4 mr-2" /> Credentials
                </TabsTrigger>
                <TabsTrigger value="proofs">
                  <Shield className="h-4 w-4 mr-2" /> Proofs
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="identity" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Identity Management</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {identities.length === 0 ? (
                      <div className="text-center py-8">
                        <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-medium mb-2">No Identities Found</h3>
                        <p className="text-gray-500 mb-6">
                          Create your first Polygon ID identity to get started.
                        </p>
                        <Button onClick={handleCreateIdentity} disabled={isLoading}>
                          {isLoading ? "Creating..." : "Create Identity"}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-medium">Your Identities</h3>
                          <Button onClick={handleCreateIdentity} disabled={isLoading}>
                            Create New Identity
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-4">
                          {identities.map((identity) => (
                            <div key={identity.did} className="border rounded-lg p-4">
                              <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-2">
                                  <User className="h-5 w-5" />
                                  <h4 className="font-medium">Identity</h4>
                                </div>
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  Active
                                </Badge>
                              </div>
                              <div className="space-y-3">
                                <div>
                                  <p className="text-sm font-medium mb-1">DID</p>
                                  <p className="text-sm text-gray-600 break-all bg-gray-50 p-2 rounded">
                                    {identity.did}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium mb-1">Created</p>
                                  <p className="text-sm text-gray-600">
                                    {new Date(identity.created).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="credentials" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Credential Management</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {identities.length === 0 ? (
                      <div className="text-center py-8">
                        <FileCheck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-medium mb-2">No Identity Found</h3>
                        <p className="text-gray-500 mb-6">
                          You need to create an identity before you can manage credentials.
                        </p>
                        <Button onClick={() => setActiveTab("identity")}>
                          Go to Identity Tab
                        </Button>
                      </div>
                    ) : credentials.length === 0 ? (
                      <div className="text-center py-8">
                        <FileCheck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-medium mb-2">No Credentials Found</h3>
                        <p className="text-gray-500 mb-6">
                          Issue your first credential to get started.
                        </p>
                        <Button onClick={handleIssueCredential} disabled={isLoading}>
                          {isLoading ? "Issuing..." : "Issue Humanity Credential"}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-medium">Your Credentials</h3>
                          <Button onClick={handleIssueCredential} disabled={isLoading}>
                            Issue New Credential
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {credentials.map((credential) => (
                            <div key={credential.id} className="border rounded-lg p-4">
                              <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-2">
                                  <FileCheck className="h-5 w-5" />
                                  <h4 className="font-medium">
                                    {credential.type[credential.type.length - 1]}
                                  </h4>
                                </div>
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                  Valid
                                </Badge>
                              </div>
                              <div className="space-y-3">
                                <div>
                                  <p className="text-sm font-medium mb-1">Issuer</p>
                                  <p className="text-sm text-gray-600 break-all">
                                    {credential.issuer}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium mb-1">Issued Date</p>
                                  <p className="text-sm text-gray-600">
                                    {new Date(credential.issuanceDate).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="proofs" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Zero-Knowledge Proofs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-medium mb-2">Generate Proofs</h3>
                      <p className="text-gray-500 mb-6 max-w-md mx-auto">
                        Generate zero-knowledge proofs from your credentials to prove claims without revealing sensitive information.
                      </p>
                      {credentials.length === 0 ? (
                        <Button onClick={() => setActiveTab("credentials")} disabled={identities.length === 0}>
                          Go to Credentials Tab
                        </Button>
                      ) : (
                        <Button disabled={isLoading}>
                          Generate New Proof
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      )}
    </div>
  );
}