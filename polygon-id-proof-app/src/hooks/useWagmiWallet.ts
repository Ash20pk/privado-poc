'use client';

import { useAccount, useBalance, useWalletClient, useSwitchChain } from 'wagmi';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import { sepolia } from '@/lib/wagmi';

export function useWagmiWallet() {
  const { address, isConnected, chainId } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { data: balance } = useBalance({
    address,
    chainId: sepolia.id,
  });
  const { user } = useDynamicContext();
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const { switchChain } = useSwitchChain();

  // Switch to Sepolia when connected
  useEffect(() => {
    if (isConnected && chainId !== sepolia.id) {
      console.log('Switching to Sepolia network...');
      switchChain({ chainId: sepolia.id });
    }
  }, [isConnected, chainId, switchChain]);

  // Create ethers signer from wagmi wallet client
  useEffect(() => {
    const createSigner = async () => {
      if (!walletClient || !isConnected) {
        setSigner(null);
        return;
      }

      try {
        const provider = new ethers.BrowserProvider(walletClient);
        const ethersSigner = await provider.getSigner();
        setSigner(ethersSigner);
      } catch (error) {
        console.error('Error creating ethers signer:', error);
        setSigner(null);
      }
    };

    createSigner();
  }, [walletClient, isConnected]);

  const refreshWallet = async () => {
    if (!walletClient || !isConnected) {
      setSigner(null);
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(walletClient);
      const ethersSigner = await provider.getSigner();
      setSigner(ethersSigner);
    } catch (error) {
      console.error('Error refreshing wallet:', error);
      setSigner(null);
    }
  };

  return {
    wallet: {
      isConnected,
      account: address || null,
      balance: balance ? parseFloat(ethers.formatEther(balance.value)).toFixed(4) : '0',
      signer,
    },
    user,
    refreshWallet,
  };
}