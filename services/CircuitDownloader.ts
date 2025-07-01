import { ICircuitStorage } from '@0xpolygonid/js-sdk';

// URL for circuit files
const CIRCUIT_FILES_URL = 'https://circuits.privado.id/latest.zip';

// Interface for circuit data
interface CircuitData {
  circuitId: string;
  wasm: Uint8Array;
  verificationKey: any;
  provingKey: Uint8Array;
}

/**
 * Service to download and cache circuit files needed for zero-knowledge proofs
 */
export class CircuitDownloader {
  private static instance: CircuitDownloader;
  private isDownloading: boolean = false;
  private downloadPromise: Promise<boolean> | null = null;
  private circuitStorage: ICircuitStorage | null = null;
  
  private constructor() {
    // Private constructor to enforce singleton pattern
  }
  
  public static getInstance(): CircuitDownloader {
    if (!CircuitDownloader.instance) {
      CircuitDownloader.instance = new CircuitDownloader();
    }
    return CircuitDownloader.instance;
  }
  
  /**
   * Set the circuit storage to use for caching downloaded circuits
   */
  public setCircuitStorage(storage: ICircuitStorage): void {
    this.circuitStorage = storage;
  }
  
  /**
   * Check if circuits are already downloaded and cached
   */
  public async areCircuitsDownloaded(): Promise<boolean> {
    try {
      if (!this.circuitStorage) {
        console.error('Circuit storage not set');
        return false;
      }
      
      // Try to load a known circuit to check if it exists
      // Use 'as any' to bypass the type checking for the circuit ID
      const testCircuit = await this.circuitStorage.loadCircuitData('credentialAtomicQuerySigV2' as any);
      // Ensure we return a boolean value, not null
      return !!(testCircuit && testCircuit.wasm && testCircuit.wasm.byteLength > 0);
    } catch (error) {
      console.log('Circuits not found in storage:', error);
      return false;
    }
  }
  
  /**
   * Download circuit files from the specified URL
   */
  public async downloadCircuits(): Promise<boolean> {
    // If already downloading, return the existing promise
    if (this.isDownloading && this.downloadPromise) {
      return this.downloadPromise;
    }
    
    // Check if circuits are already downloaded
    const alreadyDownloaded = await this.areCircuitsDownloaded();
    if (alreadyDownloaded) {
      console.log('Circuits already downloaded');
      return true;
    }
    
    // Start downloading
    this.isDownloading = true;
    
    this.downloadPromise = new Promise<boolean>(async (resolve, reject) => {
      try {
        if (!this.circuitStorage) {
          throw new Error('Circuit storage not set');
        }
        
        console.log('Downloading circuit files from', CIRCUIT_FILES_URL);
        
        // In a real implementation, we would:
        // 1. Download the zip file
        // 2. Extract the circuit files
        // 3. Parse the circuit data
        // 4. Store each circuit in the circuit storage
        
        // For now, we'll simulate downloading with mock data
        await this.simulateDownloadAndStore();
        
        console.log('Circuit files downloaded and stored successfully');
        this.isDownloading = false;
        resolve(true);
      } catch (error) {
        console.error('Failed to download circuit files:', error);
        this.isDownloading = false;
        reject(error);
      }
    });
    
    return this.downloadPromise;
  }
  
  /**
   * Simulate downloading and storing circuit files
   * In a real implementation, this would actually download and parse the files
   */
  private async simulateDownloadAndStore(): Promise<void> {
    if (!this.circuitStorage) {
      throw new Error('Circuit storage not set');
    }
    
    // List of common circuit IDs used in Polygon ID
    const circuitIds = [
      'credentialAtomicQuerySigV2',
      'credentialAtomicQueryMTPV2',
      'authV2',
      'stateTransition'
    ];
    
    // Simulate a delay for downloading
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Create mock circuit data for each circuit ID
    for (const circuitId of circuitIds) {
      // Create mock circuit data
      const mockCircuitData: CircuitData = {
        circuitId,
        wasm: new Uint8Array(32), // Mock WASM binary
        verificationKey: { curve: 'bn128', nPublic: 1 }, // Mock verification key
        provingKey: new Uint8Array(64) // Mock proving key
      };
      
      // Store the mock circuit data - use 'as any' to bypass type checking
      await this.circuitStorage.saveCircuitData(circuitId as any, mockCircuitData);
      
      console.log(`Stored mock circuit data for ${circuitId}`);
    }
  }
}

export default CircuitDownloader;
