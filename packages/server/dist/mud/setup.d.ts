import { createClientComponents } from "./createClientComponents";
import { createSystemCalls } from "./createSystemCalls";
import { setupNetwork } from "./setupNetwork";
export type SetupResult = Awaited<ReturnType<typeof setup>>;
export declare function setup(): Promise<{
    network: ReturnType<typeof setupNetwork>;
    components: ReturnType<typeof createClientComponents>;
    systemCalls: ReturnType<typeof createSystemCalls>;
}>;
