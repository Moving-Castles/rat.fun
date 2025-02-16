// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { Owner, OwnedRat, Dead, Level, LevelUpCost, LevelList, Balance, Index } from "../codegen/index.sol";
import { System } from "@latticexyz/world/src/System.sol";
import { LibUtils, LibRat } from "../libraries/Libraries.sol";

contract RatSystem is System {
  /**
   * @notice Create a rat
   * @param _name The name of the rat
   * @return ratId The id of the new rat
   */
  function createRat(string calldata _name) public returns (bytes32 ratId) {
    bytes32 playerId = LibUtils.addressToEntityKey(_msgSender());

    bytes32 currentRat = OwnedRat.get(playerId);

    // A player can only have one rat at a time
    require(currentRat == bytes32(0) || Dead.get(currentRat), "already has rat");

    ratId = LibRat.createRat(_name);

    // Set ownership
    OwnedRat.set(playerId, ratId);
    Owner.set(ratId, playerId);
  }

  function levelUp() public {
    bytes32 playerId = LibUtils.addressToEntityKey(_msgSender());
    bytes32 ratId = OwnedRat.get(playerId);

    require(ratId != bytes32(0), "no rat");

    uint256 ratBalance = Balance.get(ratId);
    bytes32 ratLevel = Level.get(ratId);

    require(ratBalance >= LevelUpCost.get(ratLevel), "insufficient balance");

    Balance.set(ratId, ratBalance - LevelUpCost.get(ratLevel));

    uint256 currentLevelIndex = Index.get(Level.get(ratId));
    uint256 maxLevelIndex = LevelList.get().length - 1;
    uint256 nextLevelIndex = currentLevelIndex < maxLevelIndex ? currentLevelIndex + 1 : maxLevelIndex;

    Level.set(ratId, LevelList.get()[nextLevelIndex]);
    Level.set(playerId, LevelList.get()[nextLevelIndex]);
  }
}
