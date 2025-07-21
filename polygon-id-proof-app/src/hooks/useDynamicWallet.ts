'use client';

import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { isEthereumWallet } from '@dynamic-labs/ethereum';
import { ethers } from 'ethers';
import { useEffect, useState, useCallback } from 'react';

export function useDynamicWallet() {
  const { primaryWallet, user } = useDynamicContext();
  const [balance, setBalance] = useState('0');
  const [signer, setSigner] = useState<ethers.Signer | null>(null);

  // Simple function to get balance
  const updateBalance = useCallback(async () => {
    if (!primaryWallet || !isEthereumWallet(primaryWallet)) {
      setBalance('0');
      return;
    }

    try {
      const provider = await primaryWallet.getPublicClient();
      const address = primaryWallet.address;
      if (provider && address) {
        const balanceWei = await provider.getBalance({ address: address as `0x${string}` });
        const balanceEther = ethers.formatEther(balanceWei.toString());
        setBalance(parseFloat(balanceEther).toFixed(4));
      }
    } catch (error) {
      console.error('Error getting balance:', error);
      setBalance('0');
    }
  }, [primaryWallet]);

  // Simple function to get signer
  const updateSigner = useCallback(async () => {
    if (!primaryWallet || !isEthereumWallet(primaryWallet)) {
      setSigner(null);
      return;
    }

    try {
      const walletClient = await primaryWallet.getWalletClient();
      
      if (walletClient) {
        const provider = new ethers.BrowserProvider(walletClient);
        const ethersSigner = await provider.getSigner();
        setSigner(ethersSigner);
      } else {
        setSigner(null);
      }
    } catch (error) {
      console.error('Error creating signer:', error);
      setSigner(null);
    }
  }, [primaryWallet]);

  // Update wallet info when wallet changes
  useEffect(() => {
    if (primaryWallet && isEthereumWallet(primaryWallet)) {
      updateBalance();
      updateSigner();
    } else {
      setBalance('0');
      setSigner(null);
    }
  }, [primaryWallet, updateBalance, updateSigner]);

  return {
    wallet: {
      isConnected: !!primaryWallet,
      account: primaryWallet?.address || null,
      balance,
      signer,
    },
    user,
    refreshWallet: () => {
      updateBalance();
      updateSigner();
    },
  };
}