// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
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
  ) external returns (uint256 amountOutFinal, uint256 amountInUniswap) {
    (amountInUniswap, , , ) = aerodromeQuoter.quoteExactInput(aerodromePath, amountIn);

    (amountOutFinal, ) = uniswapV4Quoter.quoteExactInputSingle(
      IV4Quoter.QuoteExactSingleParams({
        poolKey: uniswapPoolKey,
        zeroForOne: uniswapZeroForOne,
        exactAmount: uint128(amountInUniswap),
        hookData: ""
      })
    );
  }

  function quoteExactOut(
    uint128 amountOut,
    bytes memory aerodromePath,
    PoolKey memory uniswapPoolKey,
    bool uniswapZeroForOne
  ) external returns (uint256 amountInInitial, uint256 amountInUniswap) {
    (amountInUniswap, ) = uniswapV4Quoter.quoteExactOutputSingle(
      IV4Quoter.QuoteExactSingleParams({
        poolKey: uniswapPoolKey,
        zeroForOne: uniswapZeroForOne,
        exactAmount: amountOut,
        hookData: ""
      })
    );

    (amountInInitial, , , ) = aerodromeQuoter.quoteExactOutput(aerodromePath, amountInUniswap);
  }

  function swapExactInEth(
    bytes calldata aerodromePath,
    PoolKey memory uniswapPoolKey,
    bool uniswapZeroForOne,
    uint256 deadline
  ) external payable {
    uint256 amountIn = msg.value;
    weth.deposit{ value: msg.value }();
    // Approve aerodrome router to spend tokens
    IERC20(address(weth)).approve(address(aerodromeRouter), amountIn);

    _swapExactIn(amountIn, aerodromePath, uniswapPoolKey, uniswapZeroForOne, deadline);
  }

  function swapExactInToken(
    uint256 amountIn,
    bytes calldata aerodromePath,
    PoolKey memory uniswapPoolKey,
    bool uniswapZeroForOne,
    IPermit2.PermitSingle calldata permit,
    bytes calldata permitSignature
  ) public {
    // Permit and transfer tokens from sender to this contract
    permit2.permit(msg.sender, permit, permitSignature);
    permit2.transferFrom(msg.sender, address(this), uint160(amountIn), permit.details.token);
    // Approve aerodrome router to spend tokens
    IERC20(permit.details.token).approve(address(aerodromeRouter), amountIn);

    _swapExactIn(amountIn, aerodromePath, uniswapPoolKey, uniswapZeroForOne, permit.details.expiration);
  }

  function _swapExactIn(
    uint256 amountIn,
    bytes calldata aerodromePath,
    PoolKey memory uniswapPoolKey,
    bool uniswapZeroForOne,
    uint256 deadline
  ) internal {
    uint128 amountOutAerodrome = _executeAerodromeRouterExactInput(aerodromePath, deadline, amountIn);

    _executeUniversalRouterV4SwapExactInputSingle(uniswapPoolKey, uniswapZeroForOne, amountOutAerodrome);
  }

  function _executeAerodromeRouterExactInput(
    bytes memory path,
    uint256 deadline,
    uint256 amountIn
  ) internal returns (uint128) {
    uint256 amountOut = aerodromeRouter.exactInput(
      IAerodromeSwapRouter.ExactInputParams({
        path: path,
        recipient: address(this),
        deadline: deadline,
        amountIn: amountIn,
        amountOutMinimum: 0
      })
    );
    return uint128(amountOut);
  }

  function _executeUniversalRouterV4SwapExactInputSingle(
    PoolKey memory poolKey,
    bool zeroForOne,
    uint128 amountIn
  ) internal {
    address fromCurrency = zeroForOne ? poolKey.currency0 : poolKey.currency1;
    address toCurrency = zeroForOne ? poolKey.currency1 : poolKey.currency0;

    // Approve universal router to spend tokens
    IERC20(fromCurrency).approve(address(permit2), amountIn);
    permit2.approve(fromCurrency, address(universalRouter), amountIn, uint48(block.timestamp));

    // 3 actions
    bytes memory actions = abi.encodePacked(
      bytes1(uint8(UniswapConstants.SWAP_EXACT_IN_SINGLE)),
      bytes1(uint8(UniswapConstants.SETTLE_ALL)),
      bytes1(uint8(UniswapConstants.TAKE_PORTION))
    );
    bytes[] memory params = new bytes[](3);
    // action 0 - SWAP_EXACT_IN_SINGLE
    params[0] = abi.encode(
      IUniversalRouter.ExactInputSingleParams({
        poolKey: poolKey,
        zeroForOne: zeroForOne,
        amountIn: amountIn,
        amountOutMinimum: 0,
        hookData: ""
      })
    );
    // action 1 - SETTLE_ALL
    params[1] = abi.encode(fromCurrency, type(uint256).max);
    // action 2 - TAKE_PORTION (10_000 bips = 100%)
    params[2] = abi.encode(toCurrency, msg.sender, 10_000);

    // 1 command
    bytes memory commands = abi.encodePacked(UniswapConstants.COMMAND_V4_SWAP);
    bytes[] memory inputs = new bytes[](1);
    // command 0 - V4_SWAP
    inputs[0] = abi.encode(actions, params);

    universalRouter.execute(commands, inputs);
  }
}
