// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { ERC20Burnable } from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract ERC20EquivalentExchange {
  // Admin is allowed to withdraw any `toToken`
  address public immutable adminAddress;
  // Token being burnt from the user's balance
  ERC20Burnable public immutable fromToken;
  // Token being sent from the exchange contract to the user
  IERC20 public immutable toToken;

  constructor(address _adminAddress, address _fromToken, address _toToken) {
    adminAddress = _adminAddress;
    fromToken = ERC20Burnable(_fromToken);
    toToken = IERC20(_toToken);
  }

  function exchange(uint256 amount) external {
    fromToken.burnFrom(msg.sender, amount);
    toToken.transfer(msg.sender, amount);
  }

  function withdraw(uint256 amount) external {
    require(msg.sender == adminAddress, "not allowed");
    toToken.transfer(adminAddress, amount);
  }
}
