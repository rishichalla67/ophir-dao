import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";

class ChainNavigator {
  constructor() {
    this.rpcEndpoints = {
      'migaloo-1': 'https://migaloo-rpc.polkachu.com/',
      // Add more chain IDs and their corresponding RPC endpoints here
    };
  }

  async queryContract(chainId, contractAddress, queryMsg) {
    const rpcEndpoint = this.rpcEndpoints[chainId];
    
    if (!rpcEndpoint) {
      throw new Error(`Unsupported chain ID: ${chainId}`);
    }

    try {
      const client = await CosmWasmClient.connect(rpcEndpoint);
      const response = await client.queryContractSmart(contractAddress, queryMsg);
      return response;
    } catch (error) {
      console.error('Error querying contract:', error);
      throw error;
    }
  }
}

export default new ChainNavigator();