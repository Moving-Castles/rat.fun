// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { console } from "forge-std/console.sol";
import { System } from "@latticexyz/world/src/System.sol";
import {
  GameConfig,
  ExternalAddressesConfig,
  LevelMinBalance,
  LevelMaxBalance,
  RoomCreationCost
} from "../codegen/index.sol";
import { SalePlaceholder } from "../external/SalePlaceholder.sol";
import { LibWorld } from "../libraries/Libraries.sol";

contract DevSystem is System {
  /**
   * @dev Modifier to restrict access to admin only
   */
  modifier onlyAdmin() {
    require(_msgSender() == GameConfig.getAdminAddress(), "not allowed");
    _;
  }

  /**
   * @dev Give the caller tokens. REMOVE IN PRODUCTION.
   */
  function giveCallerTokens() public {
    SalePlaceholder(ExternalAddressesConfig.getServiceAddress()).transferStartingTokens(LibWorld.erc20(), _msgSender());
  }

  function updateLevel(
    bytes32 _levelId,
    uint256 _levelMinBalance,
    uint256 _levelMaxBalance,
    uint256 _roomCreationCost
  ) public onlyAdmin {
    LevelMinBalance.set(_levelId, _levelMinBalance);
    LevelMaxBalance.set(_levelId, _levelMaxBalance);
    RoomCreationCost.set(_levelId, _roomCreationCost);
  }
}
