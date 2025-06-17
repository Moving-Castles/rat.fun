// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { ERC20Burnable } from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

// TODO ensure these amounts are all that should ever be minted, the contract isn't upgradeable and has no public mint
uint256 constant MAIN_SALE_AMOUNT = 53_000_000;
uint256 constant SERVICE_AMOUNT = 100_000;
uint256 constant TREASURY_AMOUNT = 100_000;

contract SlopERC20 is ERC20, ERC20Burnable {
  constructor(address mainSaleAddress, address serviceAddress, address treasuryAddress) ERC20("Slop", "SLOP") {
    // Mint the total supply
    _mint(mainSaleAddress, MAIN_SALE_AMOUNT * 10 ** decimals());
    _mint(serviceAddress, SERVICE_AMOUNT * 10 ** decimals());
    _mint(treasuryAddress, TREASURY_AMOUNT * 10 ** decimals());
  }
}
