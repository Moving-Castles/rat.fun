// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.24;
import { console } from "forge-std/console.sol";
import { BaseTest } from "../BaseTest.sol";
import "../../src/codegen/index.sol";
import "../../src/libraries/Libraries.sol";
import { ENTITY_TYPE } from "../../src/codegen/common.sol";

contract RatSystemTest is BaseTest {
  function testCreateRat() public {
    setUp();

    vm.startPrank(alice);

    bytes32 playerId = world.ratroom__spawn("alice");

    startGasReport("Create rat");
    bytes32 ratId = world.ratroom__createRat("roger");
    endGasReport();

    vm.stopPrank();

    assertEq(OwnedRat.get(playerId), ratId);

    // Check rat
    assertEq(uint8(EntityType.get(ratId)), uint8(ENTITY_TYPE.RAT));
    assertEq(Index.get(ratId), 1);
    assertEq(Level.get(ratId), LevelList.get()[0]);
    assertEq(Balance.get(ratId), 0);
    assertEq(Owner.get(ratId), playerId);
    assertEq(Dead.get(ratId), false);
    assertEq(Health.get(ratId), 100);
  }

  function testRevertAlreadyHasRat() public {
    setUp();

    vm.startPrank(alice);
    world.ratroom__spawn("alice");

    world.ratroom__createRat("roger");

    vm.expectRevert("already has rat");
    world.ratroom__createRat("roger");

    vm.stopPrank();
  }
}
