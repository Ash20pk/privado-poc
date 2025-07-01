import { useState, useEffect, useCallback } from 'react';
import WalletService from '@/services/WalletService';

export function useWallet() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [identities, setIdentities] = useState<any[]>([]);
  const [credentials, setCredentials] = useState<any[]>([]);

  // Initialize the wallet service
  useEffect(() => {
    const initWallet = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Get wallet service instance
        const walletService = WalletService.getInstance();
        
        // Initialize the wallet
        const initialized = await walletService.initialize();
        setIsInitialized(initialized);
        
        if (initialized) {
          // Load identities and credentials
          const storedIdentities = await walletService.getIdentities();
          setIdentities(storedIdentities);
          
          const storedCredentials = await walletService.getCredentials();
          setCredentials(storedCredentials);
        }
      } catch (err) {
        console.error('Failed to initialize wallet:', err);
        setError('Failed to initialize wallet. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    // Only run in browser environment
    if (typeof window !== 'undefined') {
      initWallet();
    }
  }, []);
  
  // Create a new identity
  const createIdentity = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const walletService = WalletService.getInstance();
      const identity = await walletService.createIdentity();
      
      // Update identities state
      setIdentities(prev => [...prev, identity]);
      
      return identity;
    } catch (err: any) {
      console.error('Failed to create identity:', err);
      setError(err.message || 'Failed to create identity');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Issue a credential
  const issueCredential = useCallback(async (type: string, subject: any, issuerDid: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const walletService = WalletService.getInstance();
      const credential = await walletService.issueCredential(type, subject, issuerDid);
      
      // Update credentials state
      setCredentials(prev => [...prev, credential]);
      
      return credential;
    } catch (err: any) {
      console.error('Failed to issue credential:', err);
      setError(err.message || 'Failed to issue credential');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Generate a proof
  const generateProof = useCallback(async (credentialId: string, query: any, userDid: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const walletService = WalletService.getInstance();
      const proof = await walletService.generateProof(credentialId, query, userDid);
      
      return proof;
    } catch (err: any) {
      console.error('Failed to generate proof:', err);
      setError(err.message || 'Failed to generate proof');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Refresh identities and credentials
  const refreshWallet = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const walletService = WalletService.getInstance();
      
      // Refresh identities
      const storedIdentities = await walletService.getIdentities();
      setIdentities(storedIdentities);
      
      // Refresh credentials
      const storedCredentials = await walletService.getCredentials();
      setCredentials(storedCredentials);
    } catch (err: any) {
      console.error('Failed to refresh wallet:', err);
      setError(err.message || 'Failed to refresh wallet');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isInitialized,
    isLoading,
    error,
    identities,
    credentials,
    createIdentity,
    issueCredential,
    generateProof,
    refreshWallet
  };
}

export default useWallet;
