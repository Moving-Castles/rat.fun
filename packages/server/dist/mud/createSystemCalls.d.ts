import { ClientComponents } from "./createClientComponents";
import { SetupNetworkResult } from "./setupNetwork";
export type SystemCalls = ReturnType<typeof createSystemCalls>;
export declare function createSystemCalls({ worldContract, waitForTransaction }: SetupNetworkResult, { Counter }: ClientComponents): {
    increment: () => Promise<import("@latticexyz/recs").ComponentValue<import("@latticexyz/recs").Schema, unknown> | undefined>;
};
