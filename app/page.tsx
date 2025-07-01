"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet, User, Key, Shield, FileCheck } from "lucide-react";
import { useRouter } from "next/navigation";

// Types for our wallet
type Identity = {
  did: string;
  created: string;
  profile?: string;
};

type Credential = {
  id: string;
  type: string[];
  issuer: string;
  issuanceDate: string;
  credentialSubject: any;
};

export default function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("wallet");
  const [identities, setIdentities] = useState<Identity[]>([]);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Check if we have any identities in local storage
    const storedIdentities = localStorage.getItem('identities');
    if (storedIdentities) {
      setIdentities(JSON.parse(storedIdentities));
    }
    
    // Check if we have any credentials in local storage
    const storedCredentials = localStorage.getItem('credentials');
    if (storedCredentials) {
      setCredentials(JSON.parse(storedCredentials));
    }
    
    setLoading(false);
  }, []);
  
  const handleCreateIdentity = () => {
    router.push('/wallet');
  };
  
  const handleDeleteCredential = (id: string) => {
    const updatedCredentials = credentials.filter(cred => cred.id !== id);
    setCredentials(updatedCredentials);
    localStorage.setItem('credentials', JSON.stringify(updatedCredentials));
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <Wallet className="h-8 w-8" />
          <h1 className="text-2xl font-bold">Polygon ID Wallet</h1>
        </div>
        <Button onClick={handleCreateIdentity}>
          {identities.length > 0 ? "Manage Wallet" : "Create Wallet"}
        </Button>
      </header>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="wallet">
              <User className="h-4 w-4 mr-2" /> Identities
            </TabsTrigger>
            <TabsTrigger value="credentials">
              <FileCheck className="h-4 w-4 mr-2" /> Credentials
            </TabsTrigger>
            <TabsTrigger value="proofs">
              <Shield className="h-4 w-4 mr-2" /> Proofs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="wallet" className="space-y-4">
            {identities.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <User className="h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-xl font-medium mb-2">No Identities Found</h3>
                  <p className="text-gray-500 mb-6 text-center max-w-md">
                    You haven't created any Polygon ID identities yet. Create your first identity to start using the wallet.
                  </p>
                  <Button onClick={handleCreateIdentity}>Create Identity</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {identities.map((identity) => (
                  <Card key={identity.did}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Identity
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
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
                        <div className="flex justify-between items-center">
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Active
                          </Badge>
                          <Button variant="outline" size="sm" onClick={handleCreateIdentity}>
                            Manage
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="credentials" className="space-y-4">
            {credentials.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileCheck className="h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-xl font-medium mb-2">No Credentials Found</h3>
                  <p className="text-gray-500 mb-6 text-center max-w-md">
                    You haven't received any verifiable credentials yet. Go to the wallet page to issue a credential.
                  </p>
                  <Button onClick={handleCreateIdentity}>Go to Wallet</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {credentials.map((credential) => (
                  <Card key={credential.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileCheck className="h-5 w-5" />
                        {credential.type[credential.type.length - 1]}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
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
                        <div className="flex justify-between items-center">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            Valid
                          </Badge>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => handleDeleteCredential(credential.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="proofs" className="space-y-4">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Shield className="h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-medium mb-2">Zero-Knowledge Proofs</h3>
                <p className="text-gray-500 mb-6 text-center max-w-md">
                  Generate and manage zero-knowledge proofs from your credentials without revealing sensitive information.
                </p>
                <Button onClick={handleCreateIdentity}>Go to Wallet</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      <footer className="mt-16 pt-8 border-t border-gray-200 text-center text-gray-500 text-sm">
        <p>Powered by Polygon ID - Privacy-Preserving Identity Management</p>
        <div className="flex justify-center gap-4 mt-4">
          <Link href="/wallet" className="hover:text-primary">
            Wallet
          </Link>
          <Link href="https://polygon.technology/polygon-id" target="_blank" className="hover:text-primary">
            Learn More
          </Link>
          <Link href="https://docs.privado.id" target="_blank" className="hover:text-primary">
            Documentation
          </Link>
        </div>
      </footer>
    </div>
  );
}
