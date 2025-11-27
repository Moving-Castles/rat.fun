// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

library UniswapConstants {
  bytes1 constant COMMAND_V4_SWAP = 0x10;
  uint24 constant DYNAMIC_FEE_FLAG = 0x800000;

  // actions
  uint256 internal constant SWAP_EXACT_IN_SINGLE = 0x06;
  uint256 internal constant SWAP_EXACT_OUT_SINGLE = 0x08;
  uint256 internal constant SETTLE_ALL = 0x0c;
  uint256 internal constant TAKE_ALL = 0x0f;
}

struct PoolKey {
  address currency0;
  address currency1;
  uint24 fee;
  int24 tickSpacing;
  address hooks;
}

interface IUniversalRouter {
  struct ExactInputSingleParams {
    PoolKey poolKey;
    bool zeroForOne;
    uint128 amountIn;
    uint128 amountOutMinimum;
    bytes hookData;
  }

  function execute(bytes calldata commands, bytes[] calldata inputs) external payable;
}

interface IV4Quoter {
  struct QuoteExactSingleParams {
    PoolKey poolKey;
    bool zeroForOne;
    uint128 exactAmount;
    bytes hookData;
  }

  function quoteExactInputSingle(QuoteExactSingleParams memory params)
    external
    returns (uint256 amountOut, uint256 gasEstimate);

  function quoteExactOutputSingle(QuoteExactSingleParams memory params)
    external
    returns (uint256 amountIn, uint256 gasEstimate);
}