// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { ERC20Burnable } from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

/*
 * Token distribution:
 * Slopamine ($RAT)
 * - - - - - - - - -
 * - Main sale: 64M
 * - Service: 9M
 * - Treasury: 9M
 * - Liquidity: 8M
 * - - - - - - - - -
 * - Total supply: 90M
 */

uint256 constant MAIN_SALE_AMOUNT = 64_000_000; // 64M
uint256 constant SERVICE_AMOUNT = 9_000_000; // 9M
uint256 constant TREASURY_AMOUNT = 9_000_000; // 9M
uint256 constant LIQUIDITY_AMOUNT = 8_000_000; // 8M

contract SlopERC20 is ERC20, ERC20Burnable {
  constructor(address mainSaleAddress, address serviceAddress, address treasuryAddress) ERC20("Slopamine", "RAT") {
    // Mint the total supply
    _mint(mainSaleAddress, MAIN_SALE_AMOUNT * 10 ** decimals());
    _mint(serviceAddress, SERVICE_AMOUNT * 10 ** decimals());
    _mint(treasuryAddress, TREASURY_AMOUNT * 10 ** decimals());
  }
}
