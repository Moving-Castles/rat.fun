import type {
  Transport,
  Chain,
  Account,
  Hex,
  WalletActions,
  Client
} from "viem";
import { getAction } from "viem/utils";
import { writeContract as viem_writeContract } from "viem/actions";

import { callFrom as mud_callFrom } from "@latticexyz/world/internal"

type SystemFunction = { systemId: Hex; systemFunctionSelector: Hex };

type CallFromParameters = {
  worldAddress: Hex;
  delegatorAddress: Hex;
  worldFunctionToSystemFunction?: (worldFunctionSelector: Hex) => Promise<SystemFunction>;
  publicClient?: Client;
};

// Different from MUD's callFrom only in that it reconginizes `callWithSignatureAlt` as well as `callWithSignature`
export function callFromWithAlt(
  params: CallFromParameters,
): <chain extends Chain, account extends Account | undefined>(
  client: Client<Transport, chain, account>,
) => Pick<WalletActions<chain, account>, "writeContract"> {
  return (client) => ({
    async writeContract(writeArgs) {
      const _writeContract = getAction(client, viem_writeContract, "writeContract");

      // Skip for alternative callWithSignature
      if (writeArgs.functionName === "callWithSignatureAlt") {
        return _writeContract(writeArgs);
      }

      // Fall back to MUD's callFrom for other functions
      return mud_callFrom(params)(client).writeContract(writeArgs);
    },
  });
}
