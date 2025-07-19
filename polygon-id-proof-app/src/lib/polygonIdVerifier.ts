import { auth, resolver, protocol } from '@iden3/js-iden3-auth';
import path from 'path';

/**
 * Initialize the Polygon ID verifier
 * This follows the pattern from the Polygon ID tutorial example
 */
export async function initializeVerifier() {
  try {
    console.log('🔧 Setting up state resolvers...');
    
    // Set up resolvers for different networks with proper error handling
    const polygonAmoyResolver = new resolver.EthStateResolver(
      "https://polygon-amoy.publicnode.com",
      "0x1a4cC30f2aA0377b0c3bc9848766D90cb4404124"
    );
    
    const privadoMainResolver = new resolver.EthStateResolver(
      "https://rpc-mainnet.privado.id",
      "0x3C9acB2205Aa72A05F6D77d708b5Cf85FCa3a896"
    );
    
    // Create the resolvers object with proper typing
    const resolvers: { [key: string]: resolver.IStateResolver } = {
      "polygon:amoy": polygonAmoyResolver,
      "privado:main": privadoMainResolver
    };
    
    console.log('✅ State resolvers initialized successfully');
    
    // Get the path to the circuits directory from the public folder
    const circuitsDir = path.join(process.cwd(), 'public', 'circuits');
    console.log('📁 Circuits directory:', circuitsDir);
    
    // Create and return the verifier with more explicit options
    console.log('🔧 Creating verifier instance...');
    const verifierOpts = {
      stateResolver: resolvers,
      circuitsDir: circuitsDir,
      ipfsGatewayURL: 'https://ipfs.io',
    };
    
    const verifier = await auth.Verifier.newVerifier(verifierOpts);
    console.log('✅ Verifier created successfully');
    
    return verifier;
  } catch (error) {
    console.error('❌ Error initializing verifier:', error);
    throw error;
  }
}
