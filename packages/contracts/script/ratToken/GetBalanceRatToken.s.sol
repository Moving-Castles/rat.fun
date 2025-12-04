// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Script } from "forge-std/Script.sol";
import { console } from "forge-std/console.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract GetBalanceRatToken is Script {
  address constant RAT_TOKEN = 0xf2DD384662411A21259ab17038574289091F2D41;

  function run(address account) external view {
    uint256 balance = IERC20(RAT_TOKEN).balanceOf(account);
    console.log("RAT balance for", account);
    console.log("Balance:", balance);
    console.log("Balance (formatted):", balance / 1e18, "RAT");
  }
}
