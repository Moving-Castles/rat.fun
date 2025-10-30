// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { ERC20Burnable } from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

// Free-to-mint token with an unlimited supply for use in a testnet auction as the numeraire
// (the real numeraire would be EURC, which is replaced by this to easily buy out the whole auction on testnet)
contract TestNumeraireToken is ERC20, ERC20Burnable {
  constructor() ERC20("TEST_NUMERAIRE_6_DECIMALS", "TEST") {}

  function decimals() public view virtual override returns (uint8) {
    return 6;
  }

  // Give an address tokens; no more than 1e12 to avoid overflow
  function getTokens(address receiver, uint256 amount) public virtual {
    if (amount > 1e12) {
      revert("requested too many tokens");
    }
    _mint(receiver, amount * 10 ** decimals());
  }
}
