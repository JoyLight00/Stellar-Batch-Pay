import { Horizon } from "stellar-sdk";

export type Network = "testnet" | "mainnet";

const HORIZON_URLS: Record<Network, string> = {
  testnet: "https://horizon-testnet.stellar.org",
  mainnet: "https://horizon.stellar.org",
};

class HorizonService {
  private server: Horizon.Server | null = null;
  private currentNetwork: Network | null = null;

  getServer(network: Network): Horizon.Server {
    if (this.server && this.currentNetwork === network) {
      return this.server;
    }
    this.server = new Horizon.Server(HORIZON_URLS[network]);
    this.currentNetwork = network;
    return this.server;
  }

  reset(): void {
    this.server = null;
    this.currentNetwork = null;
  }
}

export const horizonService = new HorizonService();
