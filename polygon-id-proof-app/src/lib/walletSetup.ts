import { proving } from '@iden3/js-jwz';
import {
  BjjProvider,
  CredentialStorage,
  CredentialWallet,
  defaultEthConnectionConfig,
  EthStateStorage,
  ICredentialWallet,
  IDataStorage,
  Identity,
  IdentityStorage,
  IdentityWallet,
  IIdentityWallet,
  InMemoryDataSource,
  InMemoryMerkleTreeStorage,
  InMemoryPrivateKeyStore,
  KMS,
  KmsKeyType,
  Profile,
  W3CCredential,
  EthConnectionConfig,
  CircuitData,
  IStateStorage,
  ProofService,
  ICircuitStorage,
  CredentialStatusType,
  CredentialStatusResolverRegistry,
  IssuerResolver,
  RHSResolver,
  OnChainResolver,
  AuthDataPrepareFunc,
  StateVerificationFunc,
  DataPrepareHandlerFunc,
  VerificationHandlerFunc,
  IPackageManager,
  VerificationParams,
  ProvingParams,
  ZKPPacker,
  PlainPacker,
  PackageManager,
  AgentResolver,
  FSCircuitStorage,
  AbstractPrivateKeyStore,
  CredentialStatusPublisherRegistry,
  Iden3SmtRhsCredentialStatusPublisher
} from '@0xpolygonid/js-sdk';
import { BrowserCircuitStorage } from './browserCircuitStorage';

// Only import path and dotenv in Node.js environment
let path: { join: (base: string, ...paths: string[]) => string } | null = null;
if (typeof window === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  path = require('path');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const dotenv: { config: () => void } = require('dotenv');
  dotenv.config();
}
// MongoDB imports commented out for Next.js compatibility
// import { MongoDataSourceFactory, MerkleTreeMongodDBStorage } from '@0xpolygonid/mongo-storage';
// import { MongoMemoryServer } from 'mongodb-memory-server';
// import { MongoClient, Db } from 'mongodb';

export type NetworkConfig = {
  contractAddress: string;
  rpcUrl: string;
  chainId: number;
};

function getCircuitsFolder(): string {
  return process.env.CIRCUITS_PATH || '../../public/circuits';
}

export function initInMemoryDataStorage({
  contractAddress,
  rpcUrl,
  chainId
}: NetworkConfig): IDataStorage {
  const conf: EthConnectionConfig = {
    ...defaultEthConnectionConfig,
    contractAddress,
    url: rpcUrl,
    chainId
  };

  // Configure gas parameters for better MetaMask compatibility
  // These are reasonable defaults for Polygon Amoy testnet
  if (typeof window !== 'undefined') {
    // Browser environment - configure for MetaMask
    conf.maxPriorityFeePerGas = '2000000000'; // 2 gwei
    conf.maxFeePerGas = '50000000000'; // 50 gwei
  } else {
    // Server environment - can use higher gas for faster confirmation
    conf.maxPriorityFeePerGas = '5000000000'; // 5 gwei
    conf.maxFeePerGas = '100000000000'; // 100 gwei
  }

  const dataStorage = {
    credential: new CredentialStorage(new InMemoryDataSource<W3CCredential>()),
    identity: new IdentityStorage(
      new InMemoryDataSource<Identity>(),
      new InMemoryDataSource<Profile>()
    ),
    mt: new InMemoryMerkleTreeStorage(40),

    states: new EthStateStorage(conf)
  };

  return dataStorage;
}

// MongoDB storage function commented out for Next.js compatibility
// export async function initMongoDataStorage({
//   rpcUrl,
//   contractAddress,
//   chainId
// }: NetworkConfig): Promise<IDataStorage> {
//   let url = mongoDbConnection;
//   if (!url) {
//     const mongodb = await MongoMemoryServer.create();
//     url = mongodb.getUri();
//   }
//   const client = new MongoClient(url);
//   await client.connect();
//   const db: Db = client.db('mongodb-sdk-example');

//   const conf: EthConnectionConfig = {
//     ...defaultEthConnectionConfig,
//     chainId,
//     contractAddress,
//     url: rpcUrl
//   };

//   const dataStorage = {
//     credential: new CredentialStorage(
//       await MongoDataSourceFactory<W3CCredential>(db, 'credentials')
//     ),
//     identity: new IdentityStorage(
//       await MongoDataSourceFactory<Identity>(db, 'identity'),
//       await MongoDataSourceFactory<Profile>(db, 'profile')
//     ),
//     mt: await MerkleTreeMongodDBStorage.setup(db, 40),
//     states: new EthStateStorage(conf)
//   };

//   return dataStorage as unknown as IDataStorage;
// }

export async function initIdentityWallet(
  dataStorage: IDataStorage,
  credentialWallet: ICredentialWallet,
  keyStore: AbstractPrivateKeyStore
): Promise<IIdentityWallet> {
  const bjjProvider = new BjjProvider(KmsKeyType.BabyJubJub, keyStore);
  const kms = new KMS();
  kms.registerKeyProvider(KmsKeyType.BabyJubJub, bjjProvider);

  const credentialStatusPublisherRegistry = new CredentialStatusPublisherRegistry();
  credentialStatusPublisherRegistry.register(
    CredentialStatusType.Iden3ReverseSparseMerkleTreeProof,
    new Iden3SmtRhsCredentialStatusPublisher()
  );

  return new IdentityWallet(kms, dataStorage, credentialWallet, {
    credentialStatusPublisherRegistry
  });
}

export async function initInMemoryDataStorageAndWallets(config: NetworkConfig) {
  const dataStorage = initInMemoryDataStorage(config);
  const credentialWallet = await initCredentialWallet(dataStorage);
  const memoryKeyStore = new InMemoryPrivateKeyStore();

  const identityWallet = await initIdentityWallet(dataStorage, credentialWallet, memoryKeyStore);

  return {
    dataStorage,
    credentialWallet,
    identityWallet
  };
}

// MongoDB wallets function commented out for Next.js compatibility
// export async function initMongoDataStorageAndWallets(config: NetworkConfig) {
//   const dataStorage = await initMongoDataStorage(config);
//   const credentialWallet = await initCredentialWallet(dataStorage);
//   const memoryKeyStore = new InMemoryPrivateKeyStore();

//   const identityWallet = await initIdentityWallet(dataStorage, credentialWallet, memoryKeyStore);

//   return {
//     dataStorage,
//     credentialWallet,
//     identityWallet
//   };
// }

export async function initCredentialWallet(dataStorage: IDataStorage): Promise<CredentialWallet> {
  const resolvers = new CredentialStatusResolverRegistry();
  resolvers.register(CredentialStatusType.SparseMerkleTreeProof, new IssuerResolver());
  resolvers.register(
    CredentialStatusType.Iden3ReverseSparseMerkleTreeProof,
    new RHSResolver(dataStorage.states)
  );
  resolvers.register(
    CredentialStatusType.Iden3OnchainSparseMerkleTreeProof2023,
    new OnChainResolver([defaultEthConnectionConfig])
  );
  resolvers.register(CredentialStatusType.Iden3commRevocationStatusV1, new AgentResolver());

  return new CredentialWallet(dataStorage, resolvers);
}

export async function initCircuitStorage(): Promise<ICircuitStorage> {
  // Check if we're in browser environment
  if (typeof window !== 'undefined') {
    console.log('Browser environment detected, using BrowserCircuitStorage');
    return new BrowserCircuitStorage('/circuits');
  }
  
  // Server environment - use filesystem storage
  if (!path) {
    throw new Error('Path module not available in server environment');
  }
  
  const circuitsFolder = getCircuitsFolder();
  const circuitPath = circuitsFolder.startsWith('./') 
    ? path.join(process.cwd(), circuitsFolder)
    : circuitsFolder;
  console.log('Server environment, circuit storage path:', circuitPath);
  return new FSCircuitStorage({
    dirname: circuitPath
  });
}
export async function initProofService(
  identityWallet: IIdentityWallet,
  credentialWallet: ICredentialWallet,
  stateStorage: IStateStorage,
  circuitStorage: ICircuitStorage
): Promise<ProofService> {
  return new ProofService(identityWallet, credentialWallet, circuitStorage, stateStorage, {
    ipfsGatewayURL: 'https://ipfs.io'
  });
}

export async function initPackageManager(
  circuitData: CircuitData,
  prepareFn: AuthDataPrepareFunc,
  stateVerificationFn: StateVerificationFunc
): Promise<IPackageManager> {
  const authInputsHandler = new DataPrepareHandlerFunc(prepareFn);

  const verificationFn = new VerificationHandlerFunc(stateVerificationFn);
  const mapKey = proving.provingMethodGroth16AuthV2Instance.methodAlg.toString();
  const verificationParamMap: Map<string, VerificationParams> = new Map([
    [
      mapKey,
      {
        key: circuitData.verificationKey!,
        verificationFn
      }
    ]
  ]);

  const provingParamMap: Map<string, ProvingParams> = new Map();
  provingParamMap.set(mapKey, {
    dataPreparer: authInputsHandler,
    provingKey: circuitData.provingKey!,
    wasm: circuitData.wasm!
  });

  const mgr: IPackageManager = new PackageManager();
  const packer = new ZKPPacker(provingParamMap, verificationParamMap);
  const plainPacker = new PlainPacker();
  mgr.registerPackers([packer, plainPacker]);

  return mgr;
}
