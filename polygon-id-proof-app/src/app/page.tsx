import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle, ArrowRight, Zap, Lock, Globe, Award } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/Header";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      {/* Hero Section */}
      <section className="relative py-32 overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 animated-bg opacity-5"></div>
        
        {/* Floating elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-black/10 rounded-full blur-xl float-animation"></div>
        <div className="absolute bottom-20 right-10 w-24 h-24 bg-black/5 rounded-full blur-xl float-animation" style={{ animationDelay: '1s' }}></div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <Badge className="mb-6 bg-black/10 text-black border-black/20 backdrop-blur-sm hover-scale">
            ✨ Powered by Zero-Knowledge Proofs
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold mb-8 text-black glow-text">
            Fair Airdrops for Everyone
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
            Eliminate Sybil attacks and ensure legitimate participation in airdrops using 
            advanced zero-knowledge proof technology. Privacy-preserving, secure, and transparent.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button size="lg" className="text-lg px-8 py-4 bg-black hover:bg-black/90 text-white transition-all duration-300 hover-glow pulse-glow" asChild>
              <Link href="/app">
                Start Verification
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center p-6 glass-card rounded-2xl hover-scale">
              <div className="text-4xl font-bold mb-3 text-black">10,000+</div>
              <div className="text-muted-foreground font-medium">Verified Users</div>
            </div>
            <div className="text-center p-6 glass-card rounded-2xl hover-scale">
              <div className="text-4xl font-bold mb-3 text-black">99.9%</div>
              <div className="text-muted-foreground font-medium">Sybil Detection Rate</div>
            </div>
            <div className="text-center p-6 glass-card rounded-2xl hover-scale">
              <div className="text-4xl font-bold mb-3 text-black">$2M+</div>
              <div className="text-muted-foreground font-medium">Protected in Airdrops</div>
            </div>
            <div className="text-center p-6 glass-card rounded-2xl hover-scale">
              <div className="text-4xl font-bold mb-3 text-black">50+</div>
              <div className="text-muted-foreground font-medium">Partner Projects</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-black glow-text">
              Why Choose SybilGuard?
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Advanced technology meets user-friendly design to create the most secure airdrop platform.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-0 hover-glow hover-scale glass-card">
              <CardHeader className="p-8">
                <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mb-6 float-animation">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl mb-4">Zero-Knowledge Privacy</CardTitle>
                <CardDescription className="text-lg leading-relaxed">
                  Prove your uniqueness without revealing personal information. Your data stays private.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 hover-glow hover-scale glass-card">
              <CardHeader className="p-8">
                <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mb-6 float-animation" style={{ animationDelay: '0.5s' }}>
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl mb-4">Sybil-Resistant</CardTitle>
                <CardDescription className="text-lg leading-relaxed">
                  Advanced algorithms detect and prevent multiple account attacks, ensuring fair distribution.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 hover-glow hover-scale glass-card">
              <CardHeader className="p-8">
                <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mb-6 float-animation" style={{ animationDelay: '1s' }}>
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl mb-4">Instant Verification</CardTitle>
                <CardDescription className="text-lg leading-relaxed">
                  Fast proof generation and verification process. Get verified in minutes, not hours.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 hover-glow hover-scale glass-card">
              <CardHeader className="p-8">
                <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mb-6 float-animation" style={{ animationDelay: '1.5s' }}>
                  <Lock className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl mb-4">Secure by Design</CardTitle>
                <CardDescription className="text-lg leading-relaxed">
                  Built on battle-tested cryptographic primitives with security audits and formal verification.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 hover-glow hover-scale glass-card">
              <CardHeader className="p-8">
                <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mb-6 float-animation" style={{ animationDelay: '2s' }}>
                  <Globe className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl mb-4">Multi-Chain Support</CardTitle>
                <CardDescription className="text-lg leading-relaxed">
                  Works across multiple blockchains. Support for Ethereum, Polygon, and other major networks.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 hover-glow hover-scale glass-card">
              <CardHeader className="p-8">
                <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mb-6 float-animation" style={{ animationDelay: '2.5s' }}>
                  <Award className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl mb-4">Easy Integration</CardTitle>
                <CardDescription className="text-lg leading-relaxed">
                  Simple APIs and SDKs for project teams. Integrate SybilGuard into your airdrop in minutes.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-black/5"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-black glow-text">
              How It Works
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Simple three-step process to participate in sybil-resistant airdrops
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center glass-card hover-glow hover-scale">
              <CardHeader className="p-8">
                <div className="w-20 h-20 bg-black rounded-3xl flex items-center justify-center mx-auto mb-6 pulse-glow">
                  <span className="text-3xl font-bold text-white">1</span>
                </div>
                <CardTitle className="text-2xl mb-4">Connect & Verify</CardTitle>
                <CardDescription className="text-lg leading-relaxed">
                  Connect your wallet and complete identity verification using our privacy-preserving protocols.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center glass-card hover-glow hover-scale">
              <CardHeader className="p-8">
                <div className="w-20 h-20 bg-black rounded-3xl flex items-center justify-center mx-auto mb-6 pulse-glow" style={{ animationDelay: '0.5s' }}>
                  <span className="text-3xl font-bold text-white">2</span>
                </div>
                <CardTitle className="text-2xl mb-4">Generate Proof</CardTitle>
                <CardDescription className="text-lg leading-relaxed">
                  Create a zero-knowledge proof that demonstrates your uniqueness without revealing personal data.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center glass-card hover-glow hover-scale">
              <CardHeader className="p-8">
                <div className="w-20 h-20 bg-black rounded-3xl flex items-center justify-center mx-auto mb-6 pulse-glow" style={{ animationDelay: '1s' }}>
                  <span className="text-3xl font-bold text-white">3</span>
                </div>
                <CardTitle className="text-2xl mb-4">Claim Rewards</CardTitle>
                <CardDescription className="text-lg leading-relaxed">
                  Submit your proof to participate in airdrops and claim your tokens with confidence.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden bg-black">
        <div className="absolute inset-0 animated-bg-dark"></div>
        <div className="absolute inset-0 bg-black/20"></div>
        
        {/* Floating elements */}
        <div className="absolute top-20 left-20 w-40 h-40 bg-white/10 rounded-full blur-xl float-animation"></div>
        <div className="absolute bottom-20 right-20 w-32 h-32 bg-white/5 rounded-full blur-xl float-animation" style={{ animationDelay: '1s' }}></div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl md:text-6xl font-bold mb-8 text-white glow-text-dark">
              Ready to Get Started?
            </h2>
            <p className="text-xl md:text-2xl mb-12 text-white/90 leading-relaxed">
              Join thousands of users who are already participating in fair, sybil-resistant airdrops.
            </p>
            <Button size="lg" className="text-xl px-12 py-6 bg-black/20 backdrop-blur-sm border border-white/30 hover:bg-black/30 text-white hover-glow pulse-glow-dark" asChild>
              <Link href="/app">
                Launch SybilGuard App
                <ArrowRight className="ml-3 h-6 w-6" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-6 h-6 text-primary" />
                <span className="font-bold">SybilGuard</span>
              </div>
              <p className="text-sm text-muted-foreground">
                The most secure and private way to participate in airdrops using zero-knowledge proofs.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Features</a></li>
                <li><a href="#" className="hover:text-foreground">How It Works</a></li>
                <li><a href="#" className="hover:text-foreground">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground">Security</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Developers</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Documentation</a></li>
                <li><a href="#" className="hover:text-foreground">API Reference</a></li>
                <li><a href="#" className="hover:text-foreground">SDKs</a></li>
                <li><a href="#" className="hover:text-foreground">GitHub</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">About</a></li>
                <li><a href="#" className="hover:text-foreground">Blog</a></li>
                <li><a href="#" className="hover:text-foreground">Careers</a></li>
                <li><a href="#" className="hover:text-foreground">Contact</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 SybilGuard. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}