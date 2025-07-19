'use client';

import { Shield, QrCode, Zap } from 'lucide-react';
import { DynamicWidget } from '@dynamic-labs/sdk-react-core';
import { useWagmiWallet } from '@/hooks/useWagmiWallet';
import Link from 'next/link';

export function Header() {
  const { wallet } = useWagmiWallet();

  return (
    <header className="border-b border-black/10 bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex items-center justify-center w-10 h-10 bg-black rounded-lg hover-glow transition-all">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gradient">SybilGuard</h1>
              <p className="text-xs text-gray-500">Sybil-Resistant Airdrops</p>
            </div>
          </Link>
          
          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              href="/" 
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-black/5 transition-all hover-glow"
            >
              <Zap className="w-4 h-4" />
              <span className="text-sm font-medium">Proof Generator</span>
            </Link>
            <Link 
              href="/universal-link" 
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-black/5 transition-all hover-glow"
            >
              <QrCode className="w-4 h-4" />
              <span className="text-sm font-medium">Universal Links</span>
            </Link>
          </nav>
          
          {/* Wallet Connection */}
          <div className="flex items-center">
            {wallet.account ? (
              <div className="flex items-center gap-2 p-2 monochrome-card rounded-xl hover-scale transition-all">
                <div className="text-right mr-1">
                  <p className="text-sm font-medium">
                    {wallet.account.substring(0, 6)}...{wallet.account.substring(38)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {wallet.balance} POL
                  </p>
                </div>
                <DynamicWidget />
              </div>
            ) : (
              <div className="hover-glow transition-all">
                <DynamicWidget />
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
