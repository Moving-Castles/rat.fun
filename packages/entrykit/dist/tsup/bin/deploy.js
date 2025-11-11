import 'dotenv/config';
import { isHex, createClient, http, size, concatHex, encodeAbiParameters, parseAbiParameters, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { getRpcUrl } from '@latticexyz/common/foundry';
import { ensureDeployer, getContractAddress, ensureContractsDeployed, waitForTransactions } from '@latticexyz/common/internal';
import entryPointArtifact from '@account-abstraction/contracts/artifacts/EntryPoint.json';
import simpleAccountFactoryArtifact from '@account-abstraction/contracts/artifacts/SimpleAccountFactory.json';
import localPaymasterArtifact from '@latticexyz/paymaster/out/GenerousPaymaster.sol/GenerousPaymaster.json';
import { getChainId } from 'viem/actions';
import { writeContract } from '@latticexyz/common';
import { entryPoint07Address } from 'viem/account-abstraction';

// src/bin/deploy.ts
var privateKey = process.env.PRIVATE_KEY;
if (!isHex(privateKey)) {
  throw new Error(
    `Missing \`PRIVATE_KEY\` environment variable. If you're using Anvil, run

  echo "PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" > .env

to use a prefunded Anvil account.`
  );
}
var account = privateKeyToAccount(privateKey);
var rpcUrl = await getRpcUrl();
var client = createClient({ account, transport: http(rpcUrl) });
var chainId = await getChainId(client);
console.log("Deploying to chain", chainId, "from", account.address, "via", rpcUrl);
var deployerAddress = await ensureDeployer(client);
var entryPointSalt = "0x90d8084deab30c2a37c45e8d47f49f2f7965183cb6990a98943ef94940681de3";
var entryPointAddress = getContractAddress({
  deployerAddress,
  bytecode: entryPointArtifact.bytecode,
  salt: entryPointSalt
});
if (entryPointAddress !== entryPoint07Address) {
  throw new Error(
    `Unexpected EntryPoint v0.7 address

  Expected: ${entryPoint07Address}
Actual: ${entryPointAddress}`
  );
}
await ensureContractsDeployed({
  client,
  deployerAddress,
  contracts: [
    {
      bytecode: entryPointArtifact.bytecode,
      salt: entryPointSalt,
      deployedBytecodeSize: size(entryPointArtifact.deployedBytecode),
      debugLabel: "EntryPoint v0.7"
    }
  ]
});
await ensureContractsDeployed({
  client,
  deployerAddress,
  contracts: [
    {
      bytecode: concatHex([
        simpleAccountFactoryArtifact.bytecode,
        encodeAbiParameters(parseAbiParameters("address"), [entryPointAddress])
      ]),
      deployedBytecodeSize: size(simpleAccountFactoryArtifact.deployedBytecode),
      debugLabel: "SimpleAccountFactory"
    }
  ]
});
if (chainId === 31337) {
  const localPaymasterBytecode = concatHex([
    localPaymasterArtifact.bytecode.object,
    encodeAbiParameters(parseAbiParameters("address"), [entryPointAddress])
  ]);
  const localPaymasterAddress = getContractAddress({
    deployerAddress,
    bytecode: localPaymasterBytecode
  });
  await ensureContractsDeployed({
    client,
    deployerAddress,
    contracts: [
      {
        bytecode: localPaymasterBytecode,
        deployedBytecodeSize: size(localPaymasterArtifact.deployedBytecode.object),
        debugLabel: "GenerousPaymaster"
      }
    ]
  });
  const tx = await writeContract(client, {
    chain: null,
    address: entryPointAddress,
    abi: [
      {
        inputs: [{ name: "account", type: "address" }],
        name: "depositTo",
        outputs: [],
        stateMutability: "payable",
        type: "function"
      }
    ],
    functionName: "depositTo",
    args: [localPaymasterAddress],
    value: parseEther("100")
  });
  await waitForTransactions({ client, hashes: [tx] });
  console.log("\nFunded local paymaster at:", localPaymasterAddress, "\n");
}
console.log("\nEntryKit contracts are ready!\n");
process.exit(0);
//# sourceMappingURL=deploy.js.map
//# sourceMappingURL=deploy.js.map