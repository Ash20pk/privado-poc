'use client';

import { DynamicContextProvider } from '@dynamic-labs/sdk-react-core';
import { EthereumWalletConnectors } from '@dynamic-labs/ethereum';
import { DynamicWagmiConnector } from '@dynamic-labs/wagmi-connector';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wagmiConfig } from '@/lib/wagmi';

const queryClient = new QueryClient();

export function DynamicProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const environmentId = process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID;
  
  if (!environmentId) {
    console.error('NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID is not set');
    return <div>Dynamic Environment ID not configured</div>;
  }

  return (
    <DynamicContextProvider
    settings={{
      environmentId,
      walletConnectors: [EthereumWalletConnectors],
      events: {
        onAuthSuccess: (args: any) => {
          console.log('✅ Wallet connected successfully:', args);
        },
        onLogout: (args: any) => {
          console.log('🔌 Wallet disconnected:', args);
        }
      }
    }}
    >
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <DynamicWagmiConnector>
            {children}
          </DynamicWagmiConnector>
        </QueryClientProvider>
      </WagmiProvider>
    </DynamicContextProvider>
  );
}