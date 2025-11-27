// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { IAerodromeSwapRouter, IAerodromeQuoter } from "./AerodromeInterfaces.sol";
import { IWETH, IPermit2 } from "./MiscInterfaces.sol";
import { UniswapConstants, PoolKey, IUniversalRouter, IV4Quoter } from "./UniswapInterfaces.sol";

contract RatRouter {
  IWETH public immutable weth;
  IPermit2 public immutable permit2;

  IUniversalRouter public immutable universalRouter;
  IAerodromeSwapRouter public immutable aerodromeRouter;

  IV4Quoter public immutable uniswapV4Quoter;
  IAerodromeQuoter public immutable aerodromeQuoter;

  constructor(
    address _weth,
    address _permit2,
    address _universalRouter,
    address _aerodromeRouter,
    address _uniswapV4Quoter,
    address _aerodromeQuoter
  ) {
    weth = IWETH(_weth);
    permit2 = IPermit2(_permit2);

    universalRouter = IUniversalRouter(_universalRouter);
    aerodromeRouter = IAerodromeSwapRouter(_aerodromeRouter);

    uniswapV4Quoter = IV4Quoter(_uniswapV4Quoter);
    aerodromeQuoter = IAerodromeQuoter(_aerodromeQuoter);
  }

  function quoteExactIn(
    uint256 amountIn,
    bytes memory aerodromePath,
    PoolKey memory uniswapPoolKey,
    bool uniswapZeroForOne
  ) external returns (uint256) {
    (uint256 amountOut1,,,) = aerodromeQuoter.quoteExactInput(aerodromePath, amountIn);

    (uint256 amountOut2,) = uniswapV4Quoter.quoteExactInputSingle(IV4Quoter.QuoteExactSingleParams({
      poolKey: uniswapPoolKey,
      zeroForOne: uniswapZeroForOne,
      exactAmount: uint128(amountOut1),
      hookData: ""
    }));

    return amountOut2;
  }

  function quoteExactOut(
    uint128 amountOut,
    bytes memory aerodromePath,
    PoolKey memory uniswapPoolKey,
    bool uniswapZeroForOne
  ) external returns (uint256) {
    (uint256 amountIn2,) = uniswapV4Quoter.quoteExactOutputSingle(IV4Quoter.QuoteExactSingleParams({
      poolKey: uniswapPoolKey,
      zeroForOne: uniswapZeroForOne,
      exactAmount: amountOut,
      hookData: ""
    }));

    (uint256 amountIn1,,,) = aerodromeQuoter.quoteExactOutput(aerodromePath, amountIn2);

    return amountIn1;
  }

  function swapExactIn(
    uint256 amountIn,
    bytes calldata aerodromePath,
    PoolKey memory uniswapPoolKey,
    bool uniswapZeroForOne,
    IPermit2.PermitTransferFrom calldata permit,
    bytes calldata permitSignature
  ) external {
    permit2.permitTransferFrom(
      permit,
      IPermit2.SignatureTransferDetails({
          to: address(this),
          requestedAmount: amountIn
      }),
      msg.sender,
      permitSignature
    );

    uint128 amountOutAerodrome = _executeAerodromeRouterExactInput(aerodromePath, permit.deadline, amountIn);

    _executeUniversalRouterV4SwapExactInputSingle(uniswapPoolKey, uniswapZeroForOne, amountOutAerodrome);
  }

  function _executeAerodromeRouterExactInput(bytes memory path, uint256 deadline, uint256 amountIn) internal returns (uint128) {
    uint256 amountOut = aerodromeRouter.exactInput(IAerodromeSwapRouter.ExactInputParams({
      path: path,
      recipient: address(this),
      deadline: deadline,
      amountIn: amountIn,
      amountOutMinimum: 0
    }));
    return uint128(amountOut);
  }

  function _executeUniversalRouterV4SwapExactInputSingle(
    PoolKey memory poolKey,
    bool zeroForOne,
    uint128 amountIn
  ) internal {
    // 3 actions
    bytes memory actions = abi.encodePacked(
      bytes1(uint8(UniswapConstants.SWAP_EXACT_IN_SINGLE)),
      bytes1(uint8(UniswapConstants.SETTLE_ALL)),
      bytes1(uint8(UniswapConstants.TAKE_ALL))
    );
    bytes[] memory params = new bytes[](3);
    // action 0 - SWAP_EXACT_IN_SINGLE
    params[0] = abi.encode(IUniversalRouter.ExactInputSingleParams({
      poolKey: poolKey,
      zeroForOne: zeroForOne,
      amountIn: amountIn,
      amountOutMinimum: 0,
      hookData: ""
    }));
    // action 1 - SETTLE_ALL
    params[1] = abi.encode(zeroForOne ? poolKey.currency0 : poolKey.currency1, type(uint256).max);
    // action 2 - TAKE_ALL
    params[2] = abi.encode(zeroForOne ? poolKey.currency1 : poolKey.currency0, 0);

    // 1 command
    bytes memory commands = abi.encodePacked(UniswapConstants.COMMAND_V4_SWAP);
    bytes[] memory inputs = new bytes[](1);
    // command 0 - V4_SWAP
    inputs[0] = abi.encode(actions, params);

    universalRouter.execute(commands, inputs);
  }
}
