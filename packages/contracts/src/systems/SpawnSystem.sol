// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { console } from "forge-std/console.sol";
import { getUniqueEntity } from "@latticexyz/world-modules/src/modules/uniqueentity/getUniqueEntity.sol";
import { System } from "@latticexyz/world/src/System.sol";
import { EntityType, Currency, Health, Level, Owner, OwnedRat, Dead } from "../codegen/index.sol";
import { LibUtils, LibRandom } from "../libraries/Libraries.sol";
import { ENTITY_TYPE } from "../codegen/common.sol";

contract SpawnSystem is System {
    function spawn() public returns (bytes32 playerEntity) {
        playerEntity = LibUtils.addressToEntityKey(_msgSender());
        bytes32 ratEntity = getUniqueEntity();

        // Create player
        EntityType.set(playerEntity, ENTITY_TYPE.PLAYER);
        Currency.set(playerEntity, 0);
        OwnedRat.set(playerEntity, ratEntity);

        // Create rat
        EntityType.set(ratEntity, ENTITY_TYPE.RAT);
        Owner.set(ratEntity, playerEntity);
        Dead.set(ratEntity, false);

        // Set stats
        Health.set(ratEntity, 100);
        Level.set(ratEntity, 1);
    }
}