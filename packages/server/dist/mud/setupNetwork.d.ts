import { createPublicClient, createWalletClient, getContract } from "viem";
import { encodeEntity, syncToRecs } from "@latticexyz/store-sync/recs";
import { world } from "./world";
import { ContractWrite } from "@latticexyz/common";
export type SetupNetworkResult = Awaited<ReturnType<typeof setupNetwork>>;
import { Observable } from "rxjs";
export declare function setupNetwork(): Promise<{
    world: typeof world;
    components: ReturnType<typeof syncToRecs>["components"];
    playerEntity: ReturnType<typeof encodeEntity>;
    publicClient: ReturnType<typeof createPublicClient>;
    walletClient: ReturnType<typeof createWalletClient>;
    latestBlock$: Observable<any>;
    storedBlockLogs$: Observable<any>;
    waitForTransaction: ReturnType<typeof syncToRecs>["waitForTransaction"];
    worldContract: ReturnType<typeof getContract>;
    write$: Observable<ContractWrite>;
}>;
