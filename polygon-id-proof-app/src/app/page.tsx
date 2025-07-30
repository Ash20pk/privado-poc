'use client';

import { useState } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle, Wallet, Gift, Sparkles, Users, Clock, Star, X, LogOut } from "lucide-react";
import { useDynamicWallet } from '@/hooks/useDynamicWallet';
import ExpressUniversalLink from "@/components/ExpressUniversalLink";
import Link from 'next/link';

export default function ProjectXAirdrop() {
  const { wallet } = useDynamicWallet();
  const dynamicContext = useDynamicContext();
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  
  // Connect wallet function using the correct Dynamic SDK method
  const connectWallet = () => {
    if (dynamicContext && dynamicContext.setShowAuthFlow) {
      dynamicContext.setShowAuthFlow(true);
    } else {
      console.error('Dynamic context or setShowAuthFlow not available');
    }
  };
  
  // Disconnect wallet function
  const disconnectWallet = () => {
    if (dynamicContext && dynamicContext.handleLogOut) {
      dynamicContext.handleLogOut();
    } else {
      console.error('Dynamic context or handleLogOut function not available');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Subtle gradient overlay for visual interest */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50 to-blue-50/30"></div>
      
      {/* Clean SaaS Header */}
      <header className="relative z-50 mt-8 mx-4 sm:mx-6 lg:mx-8">
        <div className="bg-white border border-gray-200 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-500">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <Link href="/">
                    <h1 className="font-bold text-xl billions-text-primary">Project X</h1>
                  </Link>
                </div>
              </div>
              
              {wallet.isConnected ? (
                <div className="flex items-center gap-3">
                  <button 
                    onClick={disconnectWallet}
                    className="billions-button text-white text-sm font-medium rounded-2xl px-3 py-2 transition-all duration-300 flex items-center gap-1"
                    style={{ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
                  >
                    <LogOut className="w-3 h-3" />
                    Disconnect
                  </button>
                </div>
              ) : (
                <div 
                  onClick={() => {
                    connectWallet();
                  }}
                  className="billions-button rounded-2xl px-4 py-2.5 shadow-xl cursor-pointer transition-all duration-300 flex items-center gap-2"
                >
                  <Wallet className="w-4 h-4" />
                  <span className="text-sm font-medium">Connect Wallet to Participate</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10">
        {!wallet.isConnected ? (
          /* Billions Brand Landing */
          <section className="py-20 px-4 sm:px-6 lg:px-8">
            <div className="container mx-auto max-w-4xl text-center">
              {/* Billions Hero Section */}
              <div className="space-y-10 mb-20">
                
                <div className="bg-white border border-gray-200 rounded-[2.5rem] p-12 shadow-xl hover:shadow-2xl transition-all duration-700">
                  <h1 className="text-6xl lg:text-8xl font-black leading-tight mb-6">
                    <span className="billions-text-primary">PROJECT X</span>
                    <span className="block text-5xl lg:text-7xl billions-accent mt-2">
                      AIRDROP
                    </span>
                  </h1>
                  
                  <p className="text-xl text-gray-700 max-w-2xl mx-auto leading-relaxed font-medium mb-4">
                    Join the future of DeFi. Connect your wallet to check eligibility 
                    and claim your exclusive PROJECT X tokens through zero-knowledge verification.
                  </p>
                </div>
              </div>

              {/* Clean CTA Section */}
              <div className="space-y-8">
                <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-700 flex flex-col items-center">
                  <Button 
                    onClick={() => {
                      connectWallet();
                    }}
                    size="lg" 
                    className="billions-bg-primary text-white font-bold py-6 px-12 rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 text-lg"
                  >
                    <Wallet className="w-6 h-6" style={{ color: "#fff" }} />
                    <span style={{ color: "#fff" }}>Connect Wallet to Check Eligibility</span>
                  </Button>
                  
                  <p className="text-sm text-gray-600 mt-4 font-medium">
                    Wallet connection required to participate in the airdrop
                  </p>
                </div>
              </div>

              {/* Clean Campaign Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
                <Card className="bg-white border border-gray-200 hover:shadow-xl transition-all duration-500 hover:scale-105 rounded-3xl shadow-lg">
                  <CardHeader className="text-center p-10">
                    <div className="w-20 h-20 billions-bg-primary rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg">
                      <Users className="w-10 h-10" style={{ color: "#fff" }} />
                    </div>
                    <CardTitle className="text-white text-4xl font-black">50,000+</CardTitle>
                    <CardDescription className="text-gray-600 font-semibold text-base mt-2">Eligible Participants</CardDescription>
                  </CardHeader>
                </Card>

                <Card className="bg-white border border-gray-200 hover:shadow-xl transition-all duration-500 hover:scale-105 rounded-3xl shadow-lg">
                  <CardHeader className="text-center p-10">
                    <div className="w-20 h-20 billions-bg-primary rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg">
                      <Gift className="w-10 h-10" style={{ color: "#fff" }} />
                    </div>
                    <CardTitle className="text-white text-4xl font-black">100</CardTitle>
                    <CardDescription className="text-gray-600 font-semibold text-base mt-2">PROJECT X Tokens</CardDescription>
                  </CardHeader>
                </Card>

                <Card className="bg-white border border-gray-200 hover:shadow-xl transition-all duration-500 hover:scale-105 rounded-3xl shadow-lg">
                  <CardHeader className="text-center p-10">
                    <div className="w-20 h-20 billions-bg-primary rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg">
                      <Clock className="w-10 h-10" style={{ color: "#fff" }} />
                    </div>
                    <CardTitle className="text-white text-4xl font-black">7 Days</CardTitle>
                    <CardDescription className="text-gray-600 font-semibold text-base mt-2">Campaign Duration</CardDescription>
                  </CardHeader>
                </Card>
              </div>
            </div>
          </section>
        ) : (
          /* Billions Eligibility Dashboard */
          <section className="py-16 px-4 sm:px-6 lg:px-8">
            <div className="container mx-auto max-w-3xl">
              {/* Clean Eligibility Status */}
              <Card className="bg-white border border-gray-200 mb-10 animate-in slide-in-from-bottom duration-700 rounded-[2.5rem] transition-all duration-700">
                <CardHeader className="text-center space-y-8 p-8 md:p-12">
                  
                  <div>
                    <h2 className="text-4xl md:text-5xl font-black billions-text-primary mb-4">You're Eligible!</h2>
                    <p className="text-gray-600 text-base md:text-lg font-medium">Congratulations! Your wallet qualifies for the PROJECT X airdrop</p>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-8 p-6 md:p-8">

                  {/* Glass User Details */}
                  <div className="bg-white/5 border border-white/20 rounded-3xl p-6 shadow-xl shadow-black/20" style={{ backdropFilter: 'blur(15px)', WebkitBackdropFilter: 'blur(15px)' }}>
                    <div className="space-y-6">
                      <div className="flex justify-between items-center py-4 border-b border-white/20">
                        <span className="text-white/80 font-semibold">Wallet Address</span>
                        <span className="text-white font-mono text-sm bg-white/10 px-3 py-1.5 rounded-xl border border-white/10" style={{ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}>{wallet.account?.slice(0, 6)}...{wallet.account?.slice(-4)}</span>
                      </div>
                      <div className="flex justify-between items-center py-4">
                        <span className="text-white/80 font-semibold">Allocation</span>
                        <span className="text-white font-bold">100 PROJECT X</span>
                      </div>
                    </div>
                  </div>

                  {/* Glass Claim Button */}
                  <Button 
                    onClick={() => setShowVerificationModal(true)}
                    size="lg" 
                    className="w-full billions-button text-white font-bold py-6 md:py-7 text-lg md:text-xl rounded-3xl transition-all duration-300 flex items-center justify-center gap-3"
                    style={{ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
                  >
                    <Gift className="w-6 h-6 md:w-7 md:h-7" />
                    <span>Claim Your Tokens</span>
                  </Button>
                </CardContent>
              </Card>

              {/* Glass How it Works */}
              <Card className="bg-white/5 border border-white/20 hover:bg-white/10 transition-all duration-700 hover:scale-[1.01] rounded-[2.5rem] shadow-2xl shadow-black/30" style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
                <CardHeader className="p-8">
                  <CardTitle className="text-white flex items-center gap-4">
                    <span className="text-2xl font-black">How Verification Works</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-0">
                  <div className="space-y-8">
                    <div className="flex gap-6">
                      <div className="w-12 h-12 bg-[#00ced1] rounded-3xl flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-extrabold text-white">1</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-white mb-2 text-lg">Generate Verification QR</h4>
                        <p className="text-white/70 font-medium">Create a unique QR code for your wallet</p>
                      </div>
                    </div>
                    <div className="flex gap-6">
                      <div className="w-12 h-12 bg-[#00ced1] rounded-3xl flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-extrabold text-white">2</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-white mb-2 text-lg">Scan with Privado ID</h4>
                        <p className="text-white/70 font-medium">Use your Privado ID wallet to provide zero-knowledge proof</p>
                      </div>
                    </div>
                    <div className="flex gap-6">
                      <div className="w-12 h-12 bg-[#00ced1] rounded-3xl flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-extrabold text-white">3</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-white mb-2 text-lg">Claim Tokens</h4>
                        <p className="text-white/70 font-medium">Receive your 100 PROJECT X tokens instantly</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        )}
      </main>

      {/* Glassmorphic Verification Modal */}
      {showVerificationModal && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-xl z-50 flex items-center justify-center p-4 animate-in fade-in duration-500"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowVerificationModal(false);
            }
          }}
        >
          <div className="billions-glass border border-white/20 rounded-[2.5rem] w-full max-w-lg mx-auto shadow-2xl shadow-black/40 animate-in slide-in-from-bottom duration-500 max-h-[90vh] flex flex-col">
            {/* Glass Modal Header */}
            <div className="flex items-center justify-between p-8 border-b border-white/20 flex-shrink-0">
              <div>
                <h3 className="text-2xl font-black text-white">Verify & Claim</h3>
                <p className="text-white/70 text-sm font-medium mt-1">Complete verification to claim your tokens</p>
              </div>
              <Button
                onClick={() => setShowVerificationModal(false)}
                size="sm"
                className="bg-gray-500/60 hover:bg-gray-600/60 text-white rounded-2xl p-2 transition-all duration-300 shadow-lg shadow-gray-500/30 flex items-center justify-center border border-white/20"
                style={{ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Glass Modal Content */}
            <div className="p-8 overflow-y-auto flex-1">
              <ExpressUniversalLink />
            </div>
          </div>
        </div>
      )}

      {/* Glass Footer */}
      <footer className="relative z-10 mt-20 mx-4 sm:mx-6 lg:mx-8 mb-8">
        <div className="bg-white/5 border border-white/20 rounded-3xl shadow-xl shadow-black/30 hover:bg-white/10 transition-all duration-700" style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
          <div className="px-8 py-10">
            <div className="text-center">
              <div className="flex items-center justify-center gap-4 mb-6">
                <span className="font-black text-2xl text-white">Project X </span>
              </div>
              <p className="text-white/70 text-base max-w-md mx-auto font-medium">
                Powered by zero-knowledge proof technology for maximum privacy and security.
              </p>
              <div className="mt-8 pt-8 border-t border-white/20 text-sm text-white/50">
                <p>&copy; 2024 Project X. Built with Billions Network x KRNL</p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}