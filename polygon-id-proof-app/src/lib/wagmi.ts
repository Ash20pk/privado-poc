'use client';

import { http, createConfig } from 'wagmi';
import { polygon, polygonAmoy, sepolia } from 'wagmi/chains';

export const wagmiConfig = createConfig({
  chains: [polygonAmoy, polygon, sepolia],
  multiInjectedProviderDiscovery: false,
  transports: {
    [polygonAmoy.id]: http('https://polygon-amoy-bor-rpc.publicnode.com'),
    [polygon.id]: http(),
    [sepolia.id]: http(),
  },
});

export { polygonAmoy, polygon, sepolia };