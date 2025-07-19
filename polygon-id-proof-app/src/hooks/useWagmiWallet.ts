'use client';

import { useAccount, useBalance, useWalletClient } from 'wagmi';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import { polygonAmoy } from '@/lib/wagmi';

export function useWagmiWallet() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { data: balance } = useBalance({
    address,
    chainId: polygonAmoy.id,
  });
  const { user } = useDynamicContext();
  const [signer, setSigner] = useState<ethers.Signer | null>(null);

  // Create ethers signer from wagmi wallet client
  useEffect(() => {
    const createSigner = async () => {
      if (!walletClient || !isConnected) {
        setSigner(null);
        return;
      }

      try {
        console.log('Creating ethers signer from wagmi wallet client...');
        const provider = new ethers.BrowserProvider(walletClient);
        const ethersSigner = await provider.getSigner();
        setSigner(ethersSigner);
        console.log('✅ Ethers signer created successfully');
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
      console.log('Refreshing wallet connection...');
      const provider = new ethers.BrowserProvider(walletClient);
      const ethersSigner = await provider.getSigner();
      setSigner(ethersSigner);
      console.log('✅ Wallet refreshed successfully');
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