// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { BaseTest } from "./BaseTest.sol";
import "../src/codegen/index.sol";
import "../src/libraries/Libraries.sol";

import { System } from "@latticexyz/world/src/System.sol";
import { ResourceId, WorldResourceIdLib } from "@latticexyz/world/src/WorldResourceId.sol";
import { RESOURCE_SYSTEM } from "@latticexyz/world/src/worldResourceTypes.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IERC20Errors } from "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";
import { GamePool } from "../src/external/GamePool.sol";

contract InteractionSystem is System {
  function depositTokens(address from, uint256 amount) public {
    GamePool gamePool = GamePool(ExternalAddressesConfig.getGamePoolAddress());
    gamePool.depositTokens(from, amount);
  }

  function withdrawTokens(address to, uint256 amount) public {
    GamePool gamePool = GamePool(ExternalAddressesConfig.getGamePoolAddress());
    gamePool.withdrawTokens(to, amount);
  }
}

contract GamePoolTest is BaseTest {
  IERC20 erc20;
  GamePool gamePool;

  ResourceId systemIdGood;
  ResourceId systemIdBad;

  function setUp() public override {
    super.setUp();

    erc20 = IERC20(ExternalAddressesConfig.getErc20Address());
    gamePool = GamePool(ExternalAddressesConfig.getGamePoolAddress());

    // Transfer some tokes from the service address to the game pool
    prankAdmin();
    erc20.transfer(address(gamePool), 1000 * 1e18);

    // Register a withdrawal system in the namespace with GamePool access
    systemIdGood = WorldResourceIdLib.encode(RESOURCE_SYSTEM, "ratroom", "InteractionSyste");
    world.registerSystem(systemIdGood, new InteractionSystem(), true);
    // And a namespace without access
    world.registerNamespace(WorldResourceIdLib.encodeNamespace("testnamespace"));
    systemIdBad = WorldResourceIdLib.encode(RESOURCE_SYSTEM, "testnamespace", "InteractionSyste");
    world.registerSystem(systemIdBad, new InteractionSystem(), true);

    vm.stopPrank();
  }

  function _callDepositTokens(ResourceId systemId, address from, uint256 amount) internal {
    world.call(systemId, abi.encodeCall(InteractionSystem.depositTokens, (from, amount)));
  }

  function _callWithdrawTokens(ResourceId systemId, address to, uint256 amount) internal {
    world.call(systemId, abi.encodeCall(InteractionSystem.withdrawTokens, (to, amount)));
  }

  function testGamePoolAccess() public {
    vm.prank(alice);
    vm.expectRevert("no namespace access");
    gamePool.withdrawTokens(alice, 100 * 1e18);

    vm.prank(alice);
    vm.expectRevert("no namespace access");
    gamePool.depositTokens(alice, 100 * 1e18);

    vm.expectRevert("no namespace access");
    _callWithdrawTokens(systemIdBad, alice, 100 * 1e18);

    vm.expectRevert("no namespace access");
    _callDepositTokens(systemIdBad, alice, 100 * 1e18);

    vm.prank(address(world));
    vm.expectRevert("no namespace access");
    gamePool.withdrawTokens(alice, 100 * 1e18);

    vm.prank(address(world));
    vm.expectRevert("no namespace access");
    gamePool.depositTokens(alice, 100 * 1e18);

    prankAdmin();
    gamePool.withdrawTokens(alice, 100 * 1e18);
    assertEq(erc20.balanceOf(alice), 100 * 1e18);
    assertEq(erc20.balanceOf(address(gamePool)), 900 * 1e18);
    vm.stopPrank();

    _callWithdrawTokens(systemIdGood, alice, 100 * 1e18);
    assertEq(erc20.balanceOf(alice), 200 * 1e18);
    assertEq(erc20.balanceOf(address(gamePool)), 800 * 1e18);

    vm.expectRevert(abi.encodeWithSelector(IERC20Errors.ERC20InsufficientAllowance.selector, gamePool, 0, 100 * 1e18));
    _callDepositTokens(systemIdGood, alice, 100 * 1e18);

    vm.prank(alice);
    erc20.approve(address(gamePool), 100 * 1e18);
    _callDepositTokens(systemIdGood, alice, 100 * 1e18);
    assertEq(erc20.balanceOf(alice), 100 * 1e18);
    assertEq(erc20.balanceOf(address(gamePool)), 900 * 1e18);
  }

  function testRevertInvalidAmount() public {
    vm.expectRevert("invalid amount");
    _callWithdrawTokens(systemIdGood, alice, 0);

    vm.expectRevert("invalid amount");
    _callDepositTokens(systemIdGood, alice, 0);
  }
}
