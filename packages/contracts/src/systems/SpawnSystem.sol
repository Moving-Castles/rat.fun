// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { console } from "forge-std/console.sol";
import { System } from "@latticexyz/world/src/System.sol";
import { EntityType } from "../codegen/index.sol";
import { LibUtils } from "../libraries/Libraries.sol";
import { ENTITY_TYPE } from "../codegen/common.sol";

contract SpawnSystem is System {
    function spawn() public returns (bytes32 playerEntity) {
        playerEntity = LibUtils.addressToEntityKey(_msgSender());
        EntityType.set(playerEntity, ENTITY_TYPE.PLAYER);
    }
}