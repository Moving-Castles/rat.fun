// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { System } from "@latticexyz/world/src/System.sol";
import { EntityType, Name, CreationBlock, GameConfig, ExternalAddressesConfig, VisitedLevels, LevelList } from "../codegen/index.sol";
import { LibUtils, LibWorld } from "../libraries/Libraries.sol";
import { SalePlaceholder } from "../external/SalePlaceholder.sol";
import { ENTITY_TYPE } from "../codegen/common.sol";

contract PlayerSystem is System {
  /**
   * @notice Spawn player
   * @param _name The name of the player
   * @return playerId The id of the player
   */
  function spawn(string memory _name) public returns (bytes32 playerId) {
    playerId = LibUtils.addressToEntityKey(_msgSender());
    require(EntityType.get(playerId) == ENTITY_TYPE.NONE, "already spawned");

    EntityType.set(playerId, ENTITY_TYPE.PLAYER);
    Name.set(playerId, _name);
    CreationBlock.set(playerId, block.number);
    // Set first level as visited
    VisitedLevels.push(playerId, LevelList.getItem(0));

    // TODO useful for distributing tokens for playtests, remove in production
    if (LibWorld.erc20().balanceOf(_msgSender()) == 0) {
      SalePlaceholder(ExternalAddressesConfig.getServiceAddress()).transferStartingTokens(
        LibWorld.erc20(),
        _msgSender()
      );
    }
  }

  function balanceOf(bytes32 playerId) external view returns (uint256) {
    return LibWorld.erc20().balanceOf(LibUtils.entityKeyToAddress(playerId));
  }
}
