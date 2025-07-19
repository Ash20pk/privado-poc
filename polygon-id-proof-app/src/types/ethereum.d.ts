// Type definition for window.ethereum (MetaMask provider)
declare global {
  interface Window {
    ethereum?: unknown; // In ethers v6, we can use unknown for the provider type
  }
}

export {};
