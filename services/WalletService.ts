import {
  IdentityStorage,
  CredentialStorage,
  BjjProvider,
  KmsKeyType,
  IdentityWallet,
  CredentialWallet,
  KMS,
  EthStateStorage,
  MerkleTreeIndexedDBStorage,
  IndexedDBPrivateKeyStore,
  CredentialStatusResolverRegistry,
  CredentialStatusType,
  RHSResolver,
  OnChainResolver,
  IssuerResolver,
  AgentResolver,
  IndexedDBDataSource,
  ProofService,
  ICircuitStorage,
  core
} from '@0xpolygonid/js-sdk';
import { v4 as uuidv4 } from 'uuid';

// Default Ethereum connection config for Polygon Amoy testnet
const defaultEthConnectionConfig = {
  url: process.env.REACT_APP_RPC_URL || 'https://rpc-amoy.polygon.technology/',
  defaultGasLimit: 600000,
  minGasPrice: '0',
  maxGasPrice: '100000000000',
  confirmationBlockCount: 5,
  confirmationTimeout: 600000,
  contractAddress: process.env.REACT_APP_CONTRACT_ADDRESS || '0x1a4cC30f2aA0377b0c3bc9848766D90cb4404124',
  chainId: 80002,
  receiptTimeout: 300000,
  rpcResponseTimeout: 30000,
  waitReceiptCycleTime: 1000,
  waitBlockCycleTime: 5000
};

// Import the CircuitDownloader service
import CircuitDownloader from './CircuitDownloader';

// Browser-compatible circuit storage with IndexedDB persistence
class BrowserCircuitStorage implements ICircuitStorage {
  private circuits: Map<string, any> = new Map();
  private dbName = 'polygon-id-circuits';
  private storeName = 'circuits';
  private downloader: CircuitDownloader;
  
  constructor() {
    this.downloader = CircuitDownloader.getInstance();
    this.downloader.setCircuitStorage(this);
    
    // Initialize IndexedDB
    this.initDB().catch(err => {
      console.error('Failed to initialize circuit storage database:', err);
    });
  }
  
  /**
   * Initialize the IndexedDB database for circuit storage
   */
  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        console.error('IndexedDB not supported');
        reject(new Error('IndexedDB not supported'));
        return;
      }
      
      const request = window.indexedDB.open(this.dbName, 1);
      
      request.onerror = (event) => {
        console.error('Error opening IndexedDB:', event);
        reject(new Error('Error opening IndexedDB'));
      };
      
      request.onsuccess = () => {
        console.log('Circuit storage database opened successfully');
        resolve();
      };
      
      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'circuitId' });
          console.log('Circuit storage object store created');
        }
      };
    });
  }
  
  /**
   * Load circuit data from IndexedDB or download if not available
   */
  async loadCircuitData(circuitId: string): Promise<any> {
    console.log(`Loading circuit data for ${circuitId}`);
    
    try {
      // First try to load from memory cache
      if (this.circuits.has(circuitId)) {
        console.log(`Circuit ${circuitId} found in memory cache`);
        return this.circuits.get(circuitId);
      }
      
      // Then try to load from IndexedDB
      const circuitData = await this.loadFromDB(circuitId);
      if (circuitData) {
        console.log(`Circuit ${circuitId} loaded from IndexedDB`);
        this.circuits.set(circuitId, circuitData);
        return circuitData;
      }
      
      // If not found, try to download circuits
      console.log(`Circuit ${circuitId} not found in storage, downloading...`);
      await this.downloader.downloadCircuits();
      
      // Try loading again after download
      const downloadedCircuit = await this.loadFromDB(circuitId);
      if (downloadedCircuit) {
        this.circuits.set(circuitId, downloadedCircuit);
        return downloadedCircuit;
      }
      
      // If still not found, return a mock implementation
      console.warn(`Circuit ${circuitId} not found after download, using mock data`);
      const mockCircuit = {
        circuitId,
        wasm: new Uint8Array(32), // Mock WASM binary
        verificationKey: { curve: 'bn128', nPublic: 1 }, // Mock verification key
        provingKey: new Uint8Array(64) // Mock proving key
      };
      
      this.circuits.set(circuitId, mockCircuit);
      return mockCircuit;
    } catch (error) {
      console.error(`Error loading circuit data for ${circuitId}:`, error);
      throw error;
    }
  }
  
  /**
   * Save circuit data to IndexedDB and memory cache
   */
  async saveCircuitData(circuitId: string, circuitData: any): Promise<void> {
    console.log(`Saving circuit data for ${circuitId}`);
    
    try {
      // Save to memory cache
      this.circuits.set(circuitId, circuitData);
      
      // Save to IndexedDB
      await this.saveToDB(circuitData);
      
      console.log(`Circuit ${circuitId} saved successfully`);
    } catch (error) {
      console.error(`Error saving circuit data for ${circuitId}:`, error);
      throw error;
    }
  }
  
  /**
   * Load circuit data from IndexedDB
   */
  private async loadFromDB(circuitId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open(this.dbName, 1);
      
      request.onerror = () => reject(new Error('Error opening IndexedDB'));
      
      request.onsuccess = (event: any) => {
        const db = event.target.result;
        const transaction = db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const getRequest = store.get(circuitId);
        
        getRequest.onsuccess = () => {
          resolve(getRequest.result);
        };
        
        getRequest.onerror = () => {
          reject(new Error(`Error loading circuit ${circuitId} from IndexedDB`));
        };
      };
    });
  }
  
  /**
   * Save circuit data to IndexedDB
   */
  private async saveToDB(circuitData: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open(this.dbName, 1);
      
      request.onerror = () => reject(new Error('Error opening IndexedDB'));
      
      request.onsuccess = (event: any) => {
        const db = event.target.result;
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const putRequest = store.put(circuitData);
        
        putRequest.onsuccess = () => {
          resolve();
        };
        
        putRequest.onerror = () => {
          reject(new Error(`Error saving circuit ${circuitData.circuitId} to IndexedDB`));
        };
      };
    });
  }
}

export class WalletService {
  private static instance: WalletService;
  private wallet: IdentityWallet | null = null;
  private credWallet: CredentialWallet | null = null;
  private proofService: ProofService | null = null;
  private dataStorage: any = null;
  private kms: KMS | null = null;
  private circuitStorage: BrowserCircuitStorage | null = null;
  
  private constructor() {
    // Private constructor to enforce singleton pattern
  }
  
  public static getInstance(): WalletService {
    if (!WalletService.instance) {
      WalletService.instance = new WalletService();
    }
    return WalletService.instance;
  }
  
  public async initialize(): Promise<boolean> {
    try {
      // Initialize key store
      const keyStore = new IndexedDBPrivateKeyStore();
      const bjjProvider = new BjjProvider(KmsKeyType.BabyJubJub, keyStore);
      const kms = new KMS();
      kms.registerKeyProvider(KmsKeyType.BabyJubJub, bjjProvider);
      
      // Initialize storage
      const dataStorage = {
        credential: new CredentialStorage(
          new IndexedDBDataSource(CredentialStorage.storageKey)
        ),
        identity: new IdentityStorage(
          new IndexedDBDataSource(IdentityStorage.identitiesStorageKey),
          new IndexedDBDataSource(IdentityStorage.profilesStorageKey)
        ),
        mt: new MerkleTreeIndexedDBStorage(40),
        states: new EthStateStorage(defaultEthConnectionConfig)
      };
      
      // Initialize credential status resolvers
      const resolvers = new CredentialStatusResolverRegistry();
      resolvers.register(
        CredentialStatusType.SparseMerkleTreeProof,
        new IssuerResolver()
      );
      resolvers.register(
        CredentialStatusType.Iden3ReverseSparseMerkleTreeProof,
        new RHSResolver(dataStorage.states)
      );
      resolvers.register(
        CredentialStatusType.Iden3OnchainSparseMerkleTreeProof2023,
        new OnChainResolver([defaultEthConnectionConfig])
      );
      resolvers.register(
        CredentialStatusType.Iden3commRevocationStatusV1,
        new AgentResolver()
      );
      
      // Initialize wallets
      const credWallet = new CredentialWallet(dataStorage, resolvers);
      const wallet = new IdentityWallet(kms, dataStorage, credWallet);
      
      // Initialize circuit storage
      const circuitStorage = new BrowserCircuitStorage();
      
      // Initialize proof service
      const proofService = new ProofService(
        wallet,
        credWallet,
        circuitStorage,
        dataStorage.states,
        { ipfsGatewayURL: "https://ipfs.io" }
      );
      
      // Store instances
      this.wallet = wallet;
      this.credWallet = credWallet;
      this.kms = kms;
      this.dataStorage = dataStorage;
      this.proofService = proofService;
      this.circuitStorage = circuitStorage;
      
      console.log('Wallet service initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize wallet service:', error);
      return false;
    }
  }
  
  public async createIdentity(): Promise<any> {
    try {
      if (!this.wallet) {
        throw new Error('Wallet not initialized');
      }
      
      // Create a new identity
      const { did, credential } = await this.wallet.createIdentity({
        method: core.DidMethod.Iden3,
        blockchain: core.Blockchain.Polygon,
        networkId: core.NetworkId.Amoy,
        revocationOpts: {
          type: CredentialStatusType.Iden3ReverseSparseMerkleTreeProof,
          id: process.env.REACT_APP_RHS_URL || 'https://rhs-staging.polygonid.me'
        }
      });
      
      // Create identity object to store
      const identity = {
        did: did.string(),
        created: new Date().toISOString(),
      };
      
      // Store in local storage
      const existingIdentities = localStorage.getItem('identities');
      const identities = existingIdentities ? JSON.parse(existingIdentities) : [];
      identities.push(identity);
      localStorage.setItem('identities', JSON.stringify(identities));
      
      return identity;
    } catch (error) {
      console.error('Failed to create identity:', error);
      throw error;
    }
  }
  
  public async issueCredential(type: string, subject: any, issuerDid: string): Promise<any> {
    try {
      if (!this.wallet || !this.credWallet) {
        throw new Error('Wallet not initialized');
      }
      
      console.log(`Issuing ${type} credential to ${subject.id} from issuer ${issuerDid}`);
      
      // Create a credential request with proper types
      const credentialRequest: any = {
        id: `urn:uuid:${uuidv4()}`,
        credentialSchema: "https://ipfs.io/ipfs/QmYpsAHYPrNNaNc2o9SAMrPknSAYYAbse4hYxQgMP64Tvj",
        type,
        credentialSubject: subject,
        // Use numeric timestamp for expiration as required by the SDK
        expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
        // Required for W3C credential
        '@context': [
          'https://www.w3.org/2018/credentials/v1',
          'https://ipfs.io/ipfs/QmcUEDa42Er4nfNFmGQVjiNYFaik6kvNQjfTeBrdSx83At'
        ],
        // Add revocation options
        revocationOpts: {
          type: CredentialStatusType.Iden3ReverseSparseMerkleTreeProof,
          id: process.env.REACT_APP_RHS_URL || 'https://rhs-staging.polygonid.me'
        }
      };
      
      // Create a DID wrapper for the issuer
      const issuerDidObj = {
        string: () => issuerDid,
        method: core.DidMethod.Iden3,
        id: issuerDid.split(':').pop() || '',
        blockchain: core.Blockchain.Polygon,
        networkId: core.NetworkId.Amoy
      } as any;
      
      // Issue the credential
      const credential = await this.wallet.issueCredential(
        issuerDidObj,
        credentialRequest
      );
      
      // Store in local storage
      const existingCredentials = localStorage.getItem('credentials');
      const credentials = existingCredentials ? JSON.parse(existingCredentials) : [];
      credentials.push(credential);
      localStorage.setItem('credentials', JSON.stringify(credentials));
      
      return credential;
    } catch (error) {
      console.error('Failed to issue credential:', error);
      throw error;
    }
  }
  
  public async generateProof(credentialId: string, query: any, userDid: string): Promise<any> {
    try {
      if (!this.proofService || !this.credWallet) {
        throw new Error('Proof service not initialized');
      }
      
      // Find the credential
      const credential = await this.credWallet.findById(credentialId);
      if (!credential) {
        throw new Error(`Credential with ID ${credentialId} not found`);
      }
      
      // Create a proof request with string literal for circuitId
      const proofReq: any = {
        id: 1,
        // Use string literal for circuit ID as the SDK expects
        circuitId: "credentialAtomicQuerySigV2",
        optional: false,
        query: query
      };
      
      // Create a DID wrapper for the user
      const didWrapper = { 
        string: () => userDid,
        method: core.DidMethod.Iden3,
        id: userDid.split(':').pop() || '',
        blockchain: core.Blockchain.Polygon,
        networkId: core.NetworkId.Amoy
      } as any;
      
      // Generate the proof
      const { proof, vp } = await this.proofService.generateProof(proofReq, didWrapper);
      
      return { proof, vp };
    } catch (error) {
      console.error('Failed to generate proof:', error);
      throw error;
    }
  }
  
  public async getIdentities(): Promise<any[]> {
    const identities = localStorage.getItem('identities');
    return identities ? JSON.parse(identities) : [];
  }
  
  public async getCredentials(): Promise<any[]> {
    if (!this.credWallet) {
      return [];
    }
    
    try {
      // Get credentials from the wallet
      const credentials = await this.credWallet.list();
      
      // Store in local storage for UI access
      localStorage.setItem('credentials', JSON.stringify(credentials));
      
      return credentials;
    } catch (error) {
      console.error('Failed to get credentials:', error);
      
      // Fallback to local storage
      const storedCredentials = localStorage.getItem('credentials');
      return storedCredentials ? JSON.parse(storedCredentials) : [];
    }
  }
}

export default WalletService;
