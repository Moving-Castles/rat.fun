// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { BaseTest } from "./BaseTest.sol";
import "../src/codegen/index.sol";
import "../src/libraries/Libraries.sol";

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IERC20Errors } from "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";
import { MainSale } from "../src/external/MainSale.sol";

contract MainSaleTest is BaseTest {
  IERC20 erc20;
  IERC20 usdc;
  MainSale mainSale;

  function setUp() public override {
    super.setUp();

    erc20 = IERC20(ExternalAddressesConfig.getErc20Address());
    usdc = IERC20(ExternalAddressesConfig.getUsdcAddress());
    mainSale = MainSale(payable(ExternalAddressesConfig.getMainSaleAddress()));

    prankAdmin();
    mainSale.unpauseSale();
    vm.stopPrank();
  }

  function testBuyWithEth() public {
    vm.deal(alice, 0.1 ether);

    vm.startPrank(alice);

    uint256 initialEthBalance = alice.balance;

    mainSale.buyWithEth{ value: 0.1 ether }(12287 * 1e18, "DE");

    assertEq(erc20.balanceOf(alice), 12287 * 1e18);
    assertEq(alice.balance, initialEthBalance - 0.1 ether);

    vm.stopPrank();
  }

  function testBuyWithUsdc() public {
    prankAdmin();
    usdc.transfer(alice, 1045 * 1e18);
    vm.stopPrank();

    vm.startPrank(alice);

    usdc.approve(ExternalAddressesConfig.getMainSaleAddress(), 1050 * 1e18);
    mainSale.buyWithERC20(usdc, 50_000 * 1e18, "DE");

    assertEq(erc20.balanceOf(alice), 50_000 * 1e18);
    // 50000 tokens cost 900 euros, or about 1041 usd, using local exchange rate (1.156135)
    assertGt(usdc.balanceOf(alice), 0.1 * 1e18);
    assertLt(usdc.balanceOf(alice), 5 * 1e18);

    vm.stopPrank();
  }
}
