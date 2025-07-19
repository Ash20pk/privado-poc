'use client';

import { http, createConfig } from 'wagmi';
import { polygon, polygonAmoy } from 'wagmi/chains';

export const wagmiConfig = createConfig({
  chains: [polygonAmoy, polygon],
  multiInjectedProviderDiscovery: false,
  transports: {
    [polygonAmoy.id]: http('https://polygon-amoy-bor-rpc.publicnode.com'),
    [polygon.id]: http(),
  },
});

export { polygonAmoy, polygon };