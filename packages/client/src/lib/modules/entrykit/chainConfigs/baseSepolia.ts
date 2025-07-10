import { baseSepolia as baseSepoliaConfig } from "viem/chains"

export const baseSepolia = {
  ...baseSepoliaConfig,
  rpcUrls: {
    default: {
      http: ["https://api.pimlico.io/v2/84532/rpc?apikey=pim_8gQqpbnmKF1njADAZmuHy5"],
      webSocket: ["wss://api.pimlico.io/v2/84532/rpc?apikey=pim_8gQqpbnmKF1njADAZmuHy5"]
    }
  }
}
