// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { Owner, OwnedRat, Dead } from "../codegen/index.sol";
import { System } from "@latticexyz/world/src/System.sol";
import { LibUtils, LibRat } from "../libraries/Libraries.sol";

contract RatSystem is System {
  /**
   * @notice Create a rat
   * @return ratId The id of the new rat
   */
  function createRat() public returns (bytes32 ratId) {
    bytes32 playerId = LibUtils.addressToEntityKey(_msgSender());

    bytes32 currentRat = OwnedRat.get(playerId);

    // A player can only have one rat at a time
    require(currentRat == bytes32(0) || Dead.get(currentRat), "already has rat");

    ratId = LibRat.createRat();

    // Set ownership
    OwnedRat.set(playerId, ratId);
    Owner.set(ratId, playerId);
  }
}
