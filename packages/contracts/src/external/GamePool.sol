// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { StoreSwitch } from "@latticexyz/store/src/StoreSwitch.sol";

import { IBaseWorld } from "@latticexyz/world/src/codegen/interfaces/IBaseWorld.sol";
import { ResourceAccess } from "@latticexyz/world/src/codegen/tables/ResourceAccess.sol";
import { WorldResourceIdLib } from "@latticexyz/world/src/WorldResourceId.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @dev The pool contract is tied to a world, but it is not a system:
 * - it can't be registered as a system
 * - it is stateful
 * - it can't be upgraded
 * - it uses only the world specified in the constructor for table reads
 */
contract GamePool {
  IERC20 internal immutable erc20;

  constructor(IBaseWorld _world, IERC20 _erc20) {
    StoreSwitch.setStoreAddress(address(_world));
    erc20 = _erc20;
  }

  modifier onlyNamespace(bytes14 namespace) {
    if (!ResourceAccess.get(WorldResourceIdLib.encodeNamespace(namespace), msg.sender)) {
      revert("no namespace access");
    }

    _;
  }

  /**
   * Deposit tokens to the pool from the specified address.
   * Requires the caller to have "ratfun" namespace access.
   * This function allows ERC-20 approval to be granted to the pool contract only, rather than systems that use it.
   * (it is dangerous to approve a system, since it can be registered on another world and used by anyone)
   * @param from address to deposit tokens from.
   * @param amount amount of tokens to deposit.
   */
  function depositTokens(address from, uint256 amount) external onlyNamespace("ratfun") {
    require(amount > 0, "invalid amount");
    // ERC-20 will ensure that addresses are non-zero, pool has approval, and `from` has sufficient balance for the transfer
    erc20.transferFrom(from, address(this), amount);
  }

  /**
   * Withdraw tokens from the pool to the specified address.
   * Requires the caller to have "ratfun" namespace access.
   * @param to address to withdraw tokens to.
   * @param amount amount of tokens to withdraw.
   */
  function withdrawTokens(address to, uint256 amount) external onlyNamespace("ratfun") {
    require(amount > 0, "invalid amount");
    // ERC-20 will ensure that `to` is non-zero, and the pool has sufficient balance for the transfer
    erc20.transfer(to, amount);
  }
}
