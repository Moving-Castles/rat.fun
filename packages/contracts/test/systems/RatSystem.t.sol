// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.24;
import { console } from "forge-std/console.sol";
import { BaseTest } from "../BaseTest.sol";
import "../../src/codegen/index.sol";
import "../../src/libraries/Libraries.sol";
import { ENTITY_TYPE } from "../../src/codegen/common.sol";

contract RatSystemTest is BaseTest {
    function testAddTrait() public {
        setUp();

        vm.startPrank(alice);
        world.ratroom__spawn();
        bytes32 ratId = world.ratroom__createRat();
        vm.stopPrank();

        prankAdmin();

        startGasReport("Add trait");
        bytes32 hungryTraitId = world.ratroom__addTrait(ratId, "hungry");
        endGasReport();
        
        vm.stopPrank();

        assertEq(uint8(EntityType.get(hungryTraitId)), uint8(ENTITY_TYPE.TRAIT));
        assertTrue(LibUtils.stringEq(Name.get(hungryTraitId), "hungry"));

        bytes32[] memory traits = Traits.get(ratId);
        assertEq(traits.length, 1);
        assertEq(traits[0], hungryTraitId);
    }

    function testRemoveTrait() public {
        setUp();

        vm.startPrank(alice);
        world.ratroom__spawn();
        bytes32 ratId = world.ratroom__createRat();
        vm.stopPrank();

        prankAdmin();

        bytes32 hungryTraitId = world.ratroom__addTrait(ratId, "hungry");

        assertEq(uint8(EntityType.get(hungryTraitId)), uint8(ENTITY_TYPE.TRAIT));
        assertTrue(LibUtils.stringEq(Name.get(hungryTraitId), "hungry"));

        startGasReport("Remove trait");
        world.ratroom__removeTrait(ratId, hungryTraitId);
        endGasReport();
        
        vm.stopPrank();

        assertEq(uint8(EntityType.get(hungryTraitId)), uint8(ENTITY_TYPE.NONE));
        assertTrue(LibUtils.stringEq(Name.get(hungryTraitId), ""));

        bytes32[] memory traits = Traits.get(ratId);
        assertEq(traits.length, 0);
    }

    function testChangeStat() public {
        setUp();

        vm.startPrank(alice);
        world.ratroom__spawn();
        bytes32 ratId = world.ratroom__createRat();
        vm.stopPrank();

        assertEq(Health.get(ratId), 100);

        prankAdmin();

        startGasReport("Change stat");
        world.ratroom__changeStat(ratId, "health", 10, false);
        endGasReport();

        vm.stopPrank();

        assertEq(Health.get(ratId), 110);

        prankAdmin();
        world.ratroom__changeStat(ratId, "health", 20, true);
        vm.stopPrank();

        assertEq(Health.get(ratId), 90);

        prankAdmin();
        world.ratroom__changeStat(ratId, "health", 200, true);
        vm.stopPrank();

        assertEq(Health.get(ratId), 0);
        assertTrue(Dead.get(ratId));
    }

    function testRevertNotAllowed() public {
        setUp();

        vm.startPrank(alice);
        world.ratroom__spawn();
        bytes32 ratId = world.ratroom__createRat();
        vm.stopPrank();

        vm.expectRevert("not allowed");
        world.ratroom__addTrait(ratId, "hungry");

        vm.expectRevert("not allowed");
        world.ratroom__removeTrait(ratId, bytes32(0));

        vm.expectRevert("not allowed");
        world.ratroom__changeStat(ratId, "health", 10, true);
    }

    function testAddItemToLoadOut() public {
        setUp();

        // Spawn player and create rat
        vm.startPrank(alice);
        bytes32 playerId = world.ratroom__spawn();
        bytes32 ratId = world.ratroom__createRat();
        vm.stopPrank();

        // As admin, give player item
        prankAdmin();
        bytes32 itemId = world.ratroom__addItemToInventory(playerId, "test item");
        vm.stopPrank();

        vm.startPrank(alice);

        // As player, add item to load out
        startGasReport("Add item to load out");
        world.ratroom__addItemToLoadOut(itemId);
        endGasReport();
        
        vm.stopPrank();

        // Check inventory
        bytes32[] memory inventory = Inventory.get(playerId);
        assertEq(inventory.length, 0);

        // Check load out
        bytes32[] memory loadOut = LoadOut.get(ratId);
        assertEq(loadOut.length, 1);
        assertEq(loadOut[0], itemId);
    }

    function testRemoveItemFromLoadOut() public {
        setUp();

        // Spawn player and create rat
        vm.startPrank(alice);
        bytes32 playerId = world.ratroom__spawn();
        bytes32 ratId = world.ratroom__createRat();
        vm.stopPrank();

        // As admin, give player item
        prankAdmin();
        bytes32 itemId = world.ratroom__addItemToInventory(playerId, "test item");
        vm.stopPrank();


        // As player, add item to load out then remove it
        vm.startPrank(alice);

        world.ratroom__addItemToLoadOut(itemId);

        startGasReport("Remove item from load out");
        world.ratroom__removeItemFromLoadOut(itemId);
        endGasReport();

        vm.stopPrank();

        // Check inventory
        bytes32[] memory inventory = Inventory.get(playerId);
        assertEq(inventory.length, 1);
        assertEq(inventory[0], itemId);

        // Check load out
        bytes32[] memory loadOut = LoadOut.get(ratId);
        assertEq(loadOut.length, 0);
    }

    function testClearLoadOut() public {
        setUp();

        // Spawn player and create rat
        vm.startPrank(alice);
        bytes32 playerId = world.ratroom__spawn();
        bytes32 ratId = world.ratroom__createRat();
        vm.stopPrank();

        // As admin, give player two item
        prankAdmin();
        bytes32 itemIdOne = world.ratroom__addItemToInventory(playerId, "test item");
        bytes32 itemIdTwo = world.ratroom__addItemToInventory(playerId, "anoter test item");
        vm.stopPrank();

        // As player, add the items to load out
        vm.startPrank(alice);
        world.ratroom__addItemToLoadOut(itemIdOne);
        world.ratroom__addItemToLoadOut(itemIdTwo);
        vm.stopPrank();

        // As admin, clear the load out
        prankAdmin();
        startGasReport("Clear load out");
        world.ratroom__clearLoadOut(ratId);
        endGasReport();

        // Check load out
        bytes32[] memory loadOut = LoadOut.get(ratId);
        assertEq(loadOut.length, 0);
    }

    // - - - - - - - - - -
    // TODO: test reverts
    // - - - - - - - - - -
}
