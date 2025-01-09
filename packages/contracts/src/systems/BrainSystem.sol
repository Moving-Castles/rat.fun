// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { console } from "forge-std/console.sol";
import { System } from "@latticexyz/world/src/System.sol";
import { getUniqueEntity } from "@latticexyz/world-modules/src/modules/uniqueentity/getUniqueEntity.sol";
import { EntityType } from "../codegen/index.sol";
import { LibUtils } from "../libraries/Libraries.sol";
import { ENTITY_TYPE } from "../codegen/common.sol";
import { Brain, BrainData } from "../codegen/index.sol";
import { MAX_POINTS } from "../constants.sol";

contract BrainSystem is System {
    function createBrain(uint32 traitA, uint32 traitB, uint32 traitC, uint32 traitD) public returns (bytes32 playerEntity) {
        playerEntity = LibUtils.addressToEntityKey(_msgSender());
        EntityType.set(playerEntity, ENTITY_TYPE.PLAYER);

        require(traitA + traitB + traitC + traitD <= MAX_POINTS, "max points exceeded");

        // bytes32 brainEntity = getUniqueEntity();

        BrainData memory newBrain = BrainData(
            traitA,
            traitB,
            traitC,
            traitD
        );

        Brain.set(playerEntity, newBrain);
    }
}