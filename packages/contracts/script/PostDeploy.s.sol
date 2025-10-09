// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { Script } from "forge-std/Script.sol";
import { console } from "forge-std/console.sol";
import { ResourceIds } from "@latticexyz/store/src/codegen/tables/ResourceIds.sol";
import { StoreSwitch } from "@latticexyz/store/src/StoreSwitch.sol";
import { MockV3Aggregator } from "@chainlink/contracts/src/v0.8/shared/mocks/MockV3Aggregator.sol";

import { IWorld } from "../src/codegen/world/IWorld.sol";

import { ROOT_NAMESPACE_ID } from "@latticexyz/world/src/constants.sol";
import { NamespaceOwner } from "@latticexyz/world/src/codegen/tables/NamespaceOwner.sol";
import { worldRegistrationSystem } from "@latticexyz/world/src/codegen/experimental/systems/WorldRegistrationSystemLib.sol";

import { GameConfig } from "../src/codegen/index.sol";
import { devSystem, DevSystem } from "../src/codegen/systems/DevSystemLib.sol";

import { LibWorld, LibTrip } from "../src/libraries/Libraries.sol";

import { SlopERC20 } from "../src/external/SlopERC20.sol";
import { GamePool } from "../src/external/GamePool.sol";
import { MainSale } from "../src/external/MainSale.sol";
import { SalePlaceholder } from "../src/external/SalePlaceholder.sol";

contract PostDeploy is Script {
  function run(address worldAddress) external {
    IWorld world = IWorld(worldAddress);
    // Specify a store so that you can use tables directly in PostDeploy
    StoreSwitch.setStoreAddress(worldAddress);

    // Load the private key from the `PRIVATE_KEY` environment variable (in .env)
    uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
    vm.startBroadcast(deployerPrivateKey);

    // Conditionally deploy DevSystem for local/test chains
    if (block.chainid == 31337 || block.chainid == 84532) {
      bool systemExists = ResourceIds.getExists(devSystem.toResourceId());
      worldRegistrationSystem.registerSystem(devSystem.toResourceId(), new DevSystem(), true);
      // Register selectors if this is the first time deploying the system
      if (!systemExists) {
        worldRegistrationSystem.registerFunctionSelector(devSystem.toResourceId(), "giveCallerTokens()");
      }
    }

    // TODO replace placeholders with actual contract/wallet addresses
    address incomeRecipient = vm.addr(deployerPrivateKey);
    MainSale mainSale = new MainSale();
    address serviceAddress = address(new SalePlaceholder(world));
    address treasuryAddress = vm.addr(deployerPrivateKey);

    // Deploy ERC-20
    SlopERC20 erc20 = new SlopERC20(address(mainSale), serviceAddress, treasuryAddress);
    // Deploy GamePool
    GamePool gamePool = new GamePool(world, erc20);
    // Initialize MainSale
    address usdcAddress = _initMainSale(mainSale, incomeRecipient, address(erc20));

    // Root namespace owner is admin
    LibWorld.init(
      NamespaceOwner.get(ROOT_NAMESPACE_ID),
      address(erc20),
      address(gamePool),
      address(mainSale),
      serviceAddress,
      usdcAddress
    );
    vm.stopBroadcast();
  }

  function _initMainSale(MainSale mainSale, address incomeRecipient, address tokenForSale) internal returns (address) {
    (
      address usdEthPriceAggregator,
      address usdEurPriceAggregator,
      address usdUsdcPriceAggregator,
      address usdcAddress
    ) = _chainSpecificAddresses();

    uint256 eurTokenPrice = 0.018 * 1e18;
    mainSale.initialize({
      incomeRecipient: incomeRecipient,
      tokenForSale: tokenForSale,
      usdEthPriceAggregator: usdEthPriceAggregator,
      usdEurPriceAggregator: usdEurPriceAggregator,
      eurTokenPrice: eurTokenPrice
    });

    mainSale.setAcceptedERC20(usdcAddress, usdUsdcPriceAggregator);

    return usdcAddress;
  }

  function _chainSpecificAddresses()
    internal
    returns (
      address usdEthPriceAggregator,
      address usdEurPriceAggregator,
      address usdUsdcPriceAggregator,
      address usdcAddress
    )
  {
    if (block.chainid == 8453) {
      // Base Mainnet
      usdEthPriceAggregator = 0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70;
      usdEurPriceAggregator = 0xc91D87E81faB8f93699ECf7Ee9B44D11e1D53F0F;
      usdUsdcPriceAggregator = 0x7e860098F58bBFC8648a4311b374B1D669a2bc6B;
      usdcAddress = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
    } else if (block.chainid == 84532) {
      // Base Sepolia Testnet
      usdEthPriceAggregator = 0x4aDC67696bA383F43DD60A9e78F2C97Fbbfc7cb1;
      usdEurPriceAggregator = address(new MockV3Aggregator(8, 115613500));
      usdUsdcPriceAggregator = 0xd30e2101a97dcbAeBCBC04F14C3f624E67A35165;
      usdcAddress = 0x036CbD53842c5426634e7929541eC2318f3dCF7e;
    } else if (block.chainid == 31337) {
      // Anvil local
      usdEthPriceAggregator = address(new MockV3Aggregator(8, 255793049500));
      usdEurPriceAggregator = address(new MockV3Aggregator(8, 115613500));
      usdUsdcPriceAggregator = address(new MockV3Aggregator(8, 99988988));
      // For local usdc reuse the custom token, minting a bunch to the deployer
      address deployer = vm.addr(vm.envUint("PRIVATE_KEY"));
      usdcAddress = address(new SlopERC20(deployer, deployer, deployer));
    } else {
      revert("unsupported chainid");
    }
  }
}
