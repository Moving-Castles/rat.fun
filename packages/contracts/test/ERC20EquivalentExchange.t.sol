// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { BaseTest } from "./BaseTest.sol";

import { IERC20Errors } from "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { FakeRatERC20 } from "../src/external/FakeRatERC20.sol";
import { ERC20EquivalentExchange } from "../src/external/ERC20EquivalentExchange.sol";

contract ERC20EquivalentExchangeTest is BaseTest {
  ERC20 erc20From;
  ERC20 erc20To;
  ERC20EquivalentExchange exchange;

  uint256 decimals;
  uint256 initialTokenBalance;

  function setUp() public override {
    super.setUp();

    erc20From = new FakeRatERC20(address(this));
    erc20To = new FakeRatERC20(address(this));
    exchange = new ERC20EquivalentExchange(eve, address(erc20From), address(erc20To));

    decimals = erc20From.decimals();

    initialTokenBalance = 100_000 * 10 ** decimals;
    erc20From.transfer(alice, initialTokenBalance);
    erc20To.transfer(address(exchange), initialTokenBalance);
  }

  // Only admin can withdraw
  function testRevertNotAllowed() public {
    vm.prank(alice);
    vm.expectRevert("not allowed");
    exchange.withdraw(1);

    vm.prank(bob);
    vm.expectRevert("not allowed");
    exchange.withdraw(1);
  }

  function testWithdraw() public {
    assertEq(erc20To.balanceOf(eve), 0);
    assertEq(erc20To.balanceOf(address(exchange)), initialTokenBalance);

    vm.prank(eve);
    exchange.withdraw(initialTokenBalance);

    assertEq(erc20To.balanceOf(eve), initialTokenBalance);
    assertEq(erc20To.balanceOf(address(exchange)), 0);

    vm.prank(eve);
    vm.expectRevert(abi.encodeWithSelector(IERC20Errors.ERC20InsufficientBalance.selector, exchange, 0, 1));
    exchange.withdraw(1);
  }

  function testRevertNotApproved() public {
    vm.prank(alice);
    vm.expectRevert(abi.encodeWithSelector(IERC20Errors.ERC20InsufficientAllowance.selector, exchange, 0, 1));
    exchange.exchange(1);
  }

  function testRevertInsufficientFromBalance() public {
    assertEq(erc20From.balanceOf(alice), initialTokenBalance);

    vm.startPrank(alice);
    erc20From.approve(address(exchange), type(uint256).max);
    exchange.exchange(initialTokenBalance);

    vm.expectRevert(abi.encodeWithSelector(IERC20Errors.ERC20InsufficientBalance.selector, alice, 0, 1));
    exchange.exchange(1);
    vm.stopPrank();

    assertEq(erc20From.balanceOf(alice), 0);
    assertEq(erc20To.balanceOf(alice), initialTokenBalance);
  }

  function testRevertInsufficientToBalance() public {
    vm.prank(address(exchange));
    erc20To.transfer(eve, initialTokenBalance);

    vm.startPrank(alice);
    erc20From.approve(address(exchange), type(uint256).max);
    vm.expectRevert(abi.encodeWithSelector(IERC20Errors.ERC20InsufficientBalance.selector, exchange, 0, 1));
    exchange.exchange(1);
    vm.stopPrank();
  }

  function testExchange() public {
    assertEq(erc20From.balanceOf(alice), initialTokenBalance);
    assertEq(erc20To.balanceOf(alice), 0);

    vm.startPrank(alice);
    erc20From.approve(address(exchange), initialTokenBalance);
    exchange.exchange(initialTokenBalance);
    vm.stopPrank();

    assertEq(erc20From.balanceOf(alice), 0);
    assertEq(erc20To.balanceOf(alice), initialTokenBalance);
  }
}
