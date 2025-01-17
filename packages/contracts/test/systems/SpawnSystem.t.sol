// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.24;
import { console } from "forge-std/console.sol";
import { BaseTest } from "../BaseTest.sol";
import "../../src/codegen/index.sol";
import "../../src/libraries/Libraries.sol";
import { ENTITY_TYPE } from "../../src/codegen/common.sol";

contract SpawnSystemTest is BaseTest {
  function testSpawn() public {
    setUp();

    vm.startPrank(alice);

    startGasReport("Spawn");
    bytes32 playerEntity = world.ratroom__spawn();
    endGasReport();

    vm.stopPrank();

    // Check player
    assertEq(Balance.get(playerEntity), 1000);
    assertEq(uint8(EntityType.get(playerEntity)), uint8(ENTITY_TYPE.PLAYER));

    bytes32 ratEntity = OwnedRat.get(playerEntity);

    // Check rat
    assertEq(uint8(EntityType.get(ratEntity)), uint8(ENTITY_TYPE.RAT));
    assertEq(Owner.get(ratEntity), playerEntity);
    assertEq(Dead.get(ratEntity), false);
    
    // Rat stats
    assertEq(Health.get(ratEntity), 100);
    assertEq(Level.get(ratEntity), 1);
  }
}
