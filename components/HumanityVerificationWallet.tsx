import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Loader2, 
  User, 
  Shield, 
  Plus, 
  Eye, 
  Send, 
  FileCheck, 
  ShieldCheck,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

// Import our wallet hook
import { useWallet } from '@/hooks/useWallet';

// Import Polygon ID SDK types
import {
  core,
  CredentialStatusType,
  CircuitId,
  ZeroKnowledgeProofRequest
} from '@0xpolygonid/js-sdk';

// TypeScript interfaces
interface UserIdentity {
  did: string;
  authCredential: any;
  created: string;
}

interface IssuerIdentity {
  did: string;
  authCredential: any;
  created: string;
}

interface HumanityCredential {
  id: string;
  type: string[];
  issuer: string;
  issuanceDate: string;
  credentialSubject: {
    id: string;
    isHuman: boolean;
    verificationType: string;
    verificationLevel: string;
    biometricHash?: string;
  };
  isHuman: boolean;
  verificationType: string;
  verificationLevel: string;
}

interface Proof {
  id: string;
  credentialId: string;
  proofType: string;
  circuitId: string;
  proof: any;
  publicSignals: any;
  generated: string;
  verified: boolean;
}

interface HumanityVerificationForm {
  verificationType: string;
  documentType: string;
  isHuman: boolean;
  verificationLevel: string;
  biometricHash: string;
  documentNumber: string;
}

const HumanityVerificationWallet: React.FC = () => {
  
  // Use our wallet hook
  const {
    isInitialized,
    isLoading: walletLoading,
    error: walletError,
    identities,
    credentials,
    createIdentity,
    issueCredential,
    generateProof,
    refreshWallet
  } = useWallet();
  
  // UI state
  const [activeTab, setActiveTab] = useState<string>('identity');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Local state to sync with wallet hook
  const [userIdentity, setUserIdentity] = useState<UserIdentity | null>(null);
  const [issuerIdentity, setIssuerIdentity] = useState<IssuerIdentity | null>(null);
  const [humanityCredentials, setHumanityCredentials] = useState<HumanityCredential[]>([]);
  const [localProofs, setLocalProofs] = useState<Proof[]>([]);
  
  // Form state
  const [humanityVerificationForm, setHumanityVerificationForm] = useState<HumanityVerificationForm>({
    verificationType: 'biometric', 
    documentType: 'passport', 
    isHuman: true,
    verificationLevel: 'high', 
    biometricHash: '',
    documentNumber: ''
  });

  // Update component state based on the wallet hook
  useEffect(() => {
    if (isInitialized && identities && identities.length > 0) {
      // Find user identity (first identity)
      const firstIdentity = identities[0];
      if (firstIdentity) {
        setUserIdentity({
          did: firstIdentity.did,
          authCredential: firstIdentity.credential,
          created: new Date().toISOString()
        });
      }
      
      // Find issuer identity (second identity)
      const secondIdentity = identities[1];
      if (secondIdentity) {
        setIssuerIdentity({
          did: secondIdentity.did,
          authCredential: secondIdentity.credential,
          created: new Date().toISOString()
        });
      }
    }
  }, [isInitialized, identities]);

  // Update credentials when wallet credentials change
  useEffect(() => {
    if (credentials && credentials.length > 0) {
      // Filter for humanity credentials
      const humanityCredsList = credentials.filter(cred => 
        cred.type && cred.type.includes('HumanityCredential')
      ).map(cred => ({
        id: cred.id,
        type: cred.type,
        issuer: cred.issuer,
        issuanceDate: cred.issuanceDate,
        credentialSubject: cred.credentialSubject,
        isHuman: cred.credentialSubject.isHuman,
        verificationType: cred.credentialSubject.verificationType,
        verificationLevel: cred.credentialSubject.verificationLevel
      }));
      
      setHumanityCredentials(humanityCredsList);
    }
  }, [credentials]);

  // Initialize wallet when component mounts
  useEffect(() => {
    if (!isInitialized && !walletLoading && !walletError) {
      refreshWallet();
    }
  }, [isInitialized, walletLoading, walletError, refreshWallet]);

  const createUserIdentity = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      // Create a new identity using the wallet hook
      const identity = await createIdentity();
      
      if (!identity) {
        throw new Error("Failed to create identity");
      }
      
      // Store the identity in local state
      const newIdentity = {
        did: identity.did,
        authCredential: identity.credential,
        created: new Date().toISOString()
      };
      
      setUserIdentity(newIdentity);
      setSuccess(`User identity created: ${identity.did}`);
      
      return newIdentity;
    } catch (err: any) {
      console.error('Failed to create user identity:', err);
      setError(err.message || 'Failed to create user identity');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const createIssuerIdentity = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      // Create a new identity using the wallet hook
      const identity = await createIdentity();
      
      if (!identity) {
        throw new Error("Failed to create issuer identity");
      }
      
      // Store the identity in local state
      const newIdentity = {
        did: identity.did,
        authCredential: identity.credential,
        created: new Date().toISOString()
      };
      
      setIssuerIdentity(newIdentity);
      setSuccess(`Issuer identity created: ${identity.did}`);
      
      return newIdentity;
    } catch (err: any) {
      console.error('Failed to create issuer identity:', err);
      setError(err.message || 'Failed to create issuer identity');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const issueHumanityCredential = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      if (!userIdentity || !issuerIdentity) {
        throw new Error('Both user and issuer identities must be created first');
      }

      // Prepare the credential subject data
      const credentialSubject = {
        id: userIdentity.did,
        isHuman: humanityVerificationForm.isHuman,
        verificationType: humanityVerificationForm.verificationType,
        verificationLevel: humanityVerificationForm.verificationLevel,
        documentType: humanityVerificationForm.documentType,
        biometricHash: humanityVerificationForm.biometricHash || `bio_${Math.random().toString(36).substring(2, 16)}`,
        documentNumber: humanityVerificationForm.documentNumber || `doc_${Math.random().toString(36).substring(2, 12)}`,
        verificationTimestamp: Math.floor(Date.now() / 1000)
      };

      // Issue the credential using the wallet hook
      const credential = await issueCredential(
        "HumanityVerification", 
        credentialSubject,
        issuerIdentity.did
      );

      if (!credential) {
        throw new Error('Failed to issue credential');
      }

      // Convert the credential to our app's format
      const newCredential: HumanityCredential = {
        id: credential.id,
        type: credential.type,
        issuer: credential.issuer,
        issuanceDate: credential.issuanceDate || new Date().toISOString(),
        credentialSubject: credential.credentialSubject,
        isHuman: Boolean(credential.credentialSubject.isHuman),
        verificationType: String(credential.credentialSubject.verificationType),
        verificationLevel: String(credential.credentialSubject.verificationLevel)
      };

      // Update local state
      setHumanityCredentials(prev => [...prev, newCredential]);
      setSuccess('Humanity verification credential issued successfully!');
      
      return newCredential;
    } catch (err: any) {
      console.error('Credential issuance error:', err);
      setError(err.message || 'Failed to issue credential');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const generateHumanityProof = async (credential: HumanityCredential) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      if (!userIdentity) {
        throw new Error("User identity is not initialized");
      }

      // Create a query for the proof generation
      const query = {
        allowedIssuers: ["*"],
        type: "HumanityVerification",
        context: "https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json-ld/kyc-v3.json-ld",
        credentialSubject: {
          isHuman: {
            $eq: true // Prove that the user is human
          },
          verificationLevel: {
            $in: ["medium", "high"] // Require medium or high verification
          }
        }
      };
      
      console.log('Generating proof with query:', JSON.stringify(query));
      console.log('User DID:', userIdentity.did);
      console.log('Credential ID:', credential.id);
      
      // Use the generateProof method from our wallet hook
      const result = await generateProof(
        credential.id,
        query,
        userIdentity.did
      );

      if (!result) {
        throw new Error('Failed to generate proof');
      }

      console.log('Generated proof result:', result);

      // Create a new proof object to store in state
      const newProof: Proof = {
        id: `proof_${Date.now()}`,
        credentialId: credential.id,
        proofType: 'HumanityVerification',
        circuitId: 'credentialAtomicQuerySigV2', // Standard circuit ID for signature-based verification
        proof: result.proof,
        publicSignals: result.vp, // Store the verifiable presentation
        generated: new Date().toISOString(),
        verified: false // Will be verified by a verifier
      };

      setLocalProofs((prev: Proof[]) => [...prev, newProof]);
      setSuccess('Humanity proof generated successfully! This proves you are human without revealing personal details.');
      
      return newProof;
    } catch (err: any) {
      console.error('Proof generation error:', err);
      setError(err.message || 'Failed to generate proof');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (field: string, value: string | boolean) => {
    setHumanityVerificationForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <User className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Humanity Verification Wallet</h1>
              <p className="text-gray-600">Prove you're human with zero-knowledge proofs for sybil-resistant airdrops</p>
            </div>
            <div className="ml-auto">
              <Badge variant={isInitialized ? "default" : "secondary"}>
                {isInitialized ? "Initialized" : "Not Initialized"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <div className="text-red-800">{error}</div>
          </Alert>
        )}
        
        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <div className="text-green-800">{success}</div>
          </Alert>
        )}

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="identity">Identity Setup</TabsTrigger>
            <TabsTrigger value="credentials">Humanity Credentials</TabsTrigger>
            <TabsTrigger value="proofs">Zero-Knowledge Proofs</TabsTrigger>
            <TabsTrigger value="airdrop">Airdrop Claims</TabsTrigger>
          </TabsList>

          {/* Identity Setup Tab */}
          <TabsContent value="identity">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <User className="w-5 h-5" />
                    User Identity
                  </h3>
                </CardHeader>
                <CardContent>
                  {userIdentity ? (
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium">DID</Label>
                        <p className="text-sm text-gray-600 break-all">{userIdentity.did}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Created</Label>
                        <p className="text-sm text-gray-600">{new Date(userIdentity.created).toLocaleString()}</p>
                      </div>
                      <Badge variant="default">Active</Badge>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-gray-500 mb-4">No user identity created</p>
                      <Button 
                        onClick={createUserIdentity} 
                        disabled={loading || !isInitialized}
                        className="w-full"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create User Identity
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Issuer Identity
                  </h3>
                </CardHeader>
                <CardContent>
                  {issuerIdentity ? (
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium">DID</Label>
                        <p className="text-sm text-gray-600 break-all">{issuerIdentity.did}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Created</Label>
                        <p className="text-sm text-gray-600">{new Date(issuerIdentity.created).toLocaleString()}</p>
                      </div>
                      <Badge variant="default">Active</Badge>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-gray-500 mb-4">No issuer identity created</p>
                      <Button 
                        onClick={createIssuerIdentity} 
                        disabled={loading || !isInitialized}
                        className="w-full"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Issuer Identity
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Credentials Tab */}
          <TabsContent value="credentials">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <h3 className="text-xl font-semibold">Issue Humanity Credential</h3>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="verificationType">Verification Type</Label>
                    <Select 
                      value={humanityVerificationForm.verificationType}
                      onValueChange={(value) => handleFormChange('verificationType', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="biometric">Biometric Scan</SelectItem>
                        <SelectItem value="government_id">Government ID</SelectItem>
                        <SelectItem value="social_verification">Social Verification</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="documentType">Document Type</Label>
                    <Select 
                      value={humanityVerificationForm.documentType}
                      onValueChange={(value) => handleFormChange('documentType', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="passport">Passport</SelectItem>
                        <SelectItem value="drivers_license">Driver's License</SelectItem>
                        <SelectItem value="national_id">National ID</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="verificationLevel">Verification Level</Label>
                    <Select 
                      value={humanityVerificationForm.verificationLevel}
                      onValueChange={(value) => handleFormChange('verificationLevel', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low (Basic)</SelectItem>
                        <SelectItem value="medium">Medium (Standard)</SelectItem>
                        <SelectItem value="high">High (Premium)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="biometricHash">Biometric Hash (Optional)</Label>
                    <Input 
                      id="biometricHash"
                      placeholder="Auto-generated if empty"
                      value={humanityVerificationForm.biometricHash}
                      onChange={(e) => handleFormChange('biometricHash', e.target.value)}
                    />
                  </div>

                  <Button 
                    onClick={issueHumanityCredential}
                    disabled={loading || !userIdentity || !issuerIdentity}
                    className="w-full"
                  >
                    <FileCheck className="w-4 h-4 mr-2" />
                    Issue Humanity Credential
                  </Button>
                </CardContent>
              </Card>

              {humanityCredentials.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Issued Credentials</h4>
                  <div className="space-y-3">
                    {humanityCredentials.map((cred, idx) => (
                      <div key={idx} className="border rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <Badge variant="outline">{cred.verificationType}</Badge>
                          <span className="text-xs text-gray-500">{new Date(cred.issuanceDate).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm mt-1 truncate">{cred.id}</p>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="mt-2"
                          onClick={() => generateHumanityProof(cred)}
                        >
                          <ShieldCheck className="w-3 h-3 mr-1" />
                          Generate Proof
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Proofs Tab */}
          <TabsContent value="proofs">
            <Card>
              <CardHeader>
                <h3 className="text-xl font-semibold">Generated Humanity Proofs</h3>
                <p className="text-gray-600">Zero-knowledge proofs that verify your humanity without revealing personal data</p>
              </CardHeader>
              <CardContent>
                {localProofs.length > 0 ? (
                  <div className="space-y-4">
                    {localProofs.map((proof: Proof, index: number) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">Proof #{index + 1}</h4>
                          <Badge variant="outline">{proof.proofType}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <Label className="font-medium">Circuit</Label>
                            <p className="text-gray-600">{proof.circuitId}</p>
                          </div>
                          <div>
                            <Label className="font-medium">Generated</Label>
                            <p className="text-gray-600">{new Date(proof.generated).toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="mt-3">
                          <Label className="font-medium">Proof Hash</Label>
                          <p className="text-xs text-gray-600 break-all font-mono bg-gray-50 p-2 rounded mt-1">
                            {JSON.stringify(proof.proof).slice(0, 100)}...
                          </p>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4 mr-1" />
                            View Details
                          </Button>
                          <Button size="sm">
                            <Send className="w-4 h-4 mr-1" />
                            Use for Airdrop
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No proofs generated yet</p>
                    <p className="text-sm text-gray-400">Issue a credential first, then generate a proof</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Airdrop Claims Tab */}
          <TabsContent value="airdrop">
            <Card>
              <CardHeader>
                <h3 className="text-xl font-semibold">Airdrop Claims</h3>
                <p className="text-gray-600">Use your humanity proofs to claim sybil-resistant airdrops</p>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Airdrop integration coming soon</p>
                  <p className="text-sm text-gray-400">Generate humanity proofs to be ready for airdrop claims</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default HumanityVerificationWallet;