// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.24;
import { BaseTest } from "./BaseTest.sol";
import "../src/codegen/index.sol";
import "../src/libraries/Libraries.sol";

import { ResourceId } from "@latticexyz/store/src/ResourceId.sol";
import { WorldResourceIdInstance } from "@latticexyz/world/src/WorldResourceId.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract DeployTest is BaseTest {
  using WorldResourceIdInstance for ResourceId;

  function testWorldExists() public {
    uint256 codeSize;
    address addr = worldAddress;
    assembly {
      codeSize := extcodesize(addr)
    }
    assertTrue(codeSize > 0);
  }

  function testERC20Supply() public {
    IERC20 erc20 = IERC20(ExternalAddressesConfig.getErc20Address());
    assertEq(erc20.totalSupply(), 53_450_000 * 1e18);
  }
}
