// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { console } from "forge-std/console.sol";
import { GameConfig, Trait, Health, Level, Dead } from "../codegen/index.sol";
import { System } from "@latticexyz/world/src/System.sol";
import { LibRoom, LibUtils } from "../libraries/Libraries.sol";

contract RatSystem is System {
  function addTrait(bytes32 ratId, string memory newTrait) public {
    require(_msgSender() == GameConfig.getAdminAddress(), "not allowed");
    string memory currentTrait = Trait.get(ratId);
    string memory updatedTrait = string(abi.encodePacked(currentTrait, ", ", newTrait));
    Trait.set(ratId, updatedTrait);
  }

  function changeStat(bytes32 ratId, string memory statName, uint256 change, bool negative) public {
    require(_msgSender() == GameConfig.getAdminAddress(), "not allowed");

    if(LibUtils.stringEq(statName, "health")) {
      if(negative) {
        Health.set(ratId, LibUtils.safeSubtract(Health.get(ratId), change));
        if(Health.get(ratId) == 0) {
          Dead.set(ratId, true);
        }
      } else {
        Health.set(ratId, Health.get(ratId) + change);
      }
    } else if(LibUtils.stringEq(statName, "level")) {
      if(negative) {
        Level.set(ratId, LibUtils.safeSubtract(Level.get(ratId), change));
      } else {
        Level.set(ratId, Level.get(ratId) + change);
      }
    } else {
      console.log("invalid stat name");
    }
  }
}
