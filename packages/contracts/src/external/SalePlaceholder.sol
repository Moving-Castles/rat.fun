// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { StoreSwitch } from "@latticexyz/store/src/StoreSwitch.sol";

import { IBaseWorld } from "@latticexyz/world/src/codegen/interfaces/IBaseWorld.sol";
import { ResourceAccess } from "@latticexyz/world/src/codegen/tables/ResourceAccess.sol";
import { WorldResourceIdLib } from "@latticexyz/world/src/WorldResourceId.sol";
import { SlopERC20 } from "./SlopERC20.sol";

// TODO useful for distributing tokens for playtests, remove in production
contract SalePlaceholder {
  constructor(IBaseWorld _world) {
    StoreSwitch.setStoreAddress(address(_world));
  }

  modifier onlyNamespace(bytes14 namespace) {
    if (!ResourceAccess.get(WorldResourceIdLib.encodeNamespace(namespace), msg.sender)) {
      revert("no namespace access");
    }

    _;
  }

  function transferStartingTokens(SlopERC20 erc20, address to) external onlyNamespace("ratfun") {
    erc20.transfer(to, 2000 * 10 ** erc20.decimals());
  }
}
