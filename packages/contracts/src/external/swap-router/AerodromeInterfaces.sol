// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

interface IAerodromeSwapRouter {
  struct ExactInputParams {
    bytes path;
    address recipient;
    uint256 deadline;
    uint256 amountIn;
    uint256 amountOutMinimum;
  }

  function exactInput(ExactInputParams calldata params) external payable returns (uint256 amountOut);
}

interface IAerodromeQuoter {
  function quoteExactInput(bytes memory path, uint256 amountIn)
    external
    returns (
      uint256 amountOut,
      uint160[] memory sqrtPriceX96AfterList,
      uint32[] memory initializedTicksCrossedList,
      uint256 gasEstimate
    );

  function quoteExactOutput(bytes memory path, uint256 amountOut)
    external
    returns (
      uint256 amountIn,
      uint160[] memory sqrtPriceX96AfterList,
      uint32[] memory initializedTicksCrossedList,
      uint256 gasEstimate
    );
}