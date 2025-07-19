import { ICircuitStorage, CircuitData } from '@0xpolygonid/js-sdk';

export class BrowserCircuitStorage implements ICircuitStorage {
  private basePath: string;

  constructor(basePath: string = '/circuits') {
    this.basePath = basePath;
  }

  async loadCircuitData(circuitId: string): Promise<CircuitData> {
    try {
      console.log(`Loading circuit data for: ${circuitId}`);
      
      // Load circuit files from public directory via HTTP
      const [wasmResponse, zkeyResponse, vkeyResponse] = await Promise.all([
        fetch(`${this.basePath}/${circuitId}/circuit.wasm`),
        fetch(`${this.basePath}/${circuitId}/circuit_final.zkey`),
        fetch(`${this.basePath}/${circuitId}/verification_key.json`)
      ]);

      if (!wasmResponse.ok || !zkeyResponse.ok || !vkeyResponse.ok) {
        throw new Error(`Failed to load circuit files for ${circuitId}`);
      }

      const [wasmArrayBuffer, zkeyArrayBuffer, vkeyText] = await Promise.all([
        wasmResponse.arrayBuffer(),
        zkeyResponse.arrayBuffer(),
        vkeyResponse.text()
      ]);

      const circuitData: CircuitData = {
        circuitId,
        wasm: new Uint8Array(wasmArrayBuffer),
        provingKey: new Uint8Array(zkeyArrayBuffer),
        verificationKey: JSON.parse(vkeyText)
      };

      console.log(`✅ Successfully loaded circuit data for ${circuitId}`);
      return circuitData;
    } catch (error) {
      console.error(`❌ Failed to load circuit data for ${circuitId}:`, error);
      throw error;
    }
  }

  async saveCircuitData(circuitId: string): Promise<void> {
    // Browser storage is read-only, this is a no-op
    console.log(`saveCircuitData called for ${circuitId} (no-op in browser)`);
  }
}