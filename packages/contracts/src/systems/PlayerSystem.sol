// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { console } from "forge-std/console.sol";
import { System } from "@latticexyz/world/src/System.sol";
import { EntityType, Balance, Name, CreationBlock, GameConfig } from "../codegen/index.sol";
import { LibUtils } from "../libraries/Libraries.sol";
import { ENTITY_TYPE } from "../codegen/common.sol";

contract PlayerSystem is System {
  /**
   * @notice Spawn player
   * @param _playerId The id of the player
   */
  function spawn(string memory _name) public returns (bytes32 _playerId) {
    _playerId = LibUtils.addressToEntityKey(_msgSender());
    require(EntityType.get(_playerId) == ENTITY_TYPE.NONE, "already spawned");

    EntityType.set(_playerId, ENTITY_TYPE.PLAYER);
    Name.set(_playerId, _name);
    Balance.set(_playerId, GameConfig.getStartingBalance());
    CreationBlock.set(_playerId, block.number);
  }
}
