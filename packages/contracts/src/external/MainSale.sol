// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { StoreCore } from "@latticexyz/store/src/StoreCore.sol";

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { AggregatorV3Interface } from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

import { AcceptedERC20, AcceptedERC20Data, Config, ConfigData, MutableConfig, MutableConfigData, TransactionLimits, TransactionLimitsData, TransactionTotals, TransactionTotalsData, WalletEurSpent } from "./codegen/index.sol";

contract MainSale {
  /**
   * @param buyer address of the buyer
   * @param tokensBought amount of tokens purchased (18 decimals)
   * @param price EUR/tokenForSale price (18 decimals, same expected format as data feed results)
   * @param countryCode ISO 3166-1 alpha-2 two-letter country code
   * @param timestamp unix timestamp of the purchase
   */
  event Receipt(
    address indexed buyer,
    uint256 tokensBought,
    uint256 indexed price,
    string indexed countryCode,
    uint256 timestamp
  );

  uint8 internal constant REFERENCE_DECIMALS = 18;
  uint256 internal constant REFERENCE_MULTIPLIER = 10 ** uint256(REFERENCE_DECIMALS);

  constructor() {
    StoreCore.initialize();
    StoreCore.registerInternalTables();

    AcceptedERC20.register();
    Config.register();
    MutableConfig.register();
    TransactionLimits.register();
    TransactionTotals.register();
    WalletEurSpent.register();

    Config._setAdmin(msg.sender);
  }

  modifier onlyAdmin() {
    require(Config._getAdmin() == msg.sender, "not admin");
    _;
  }

  /************************************************************************
   *
   *    CONFIG FUNCTIONS
   *
   ************************************************************************/

  /**
   * @dev Initialize the sale contract, this can only be called once.
   * @param incomeRecipient address that will receive the proceeds from the sale
   * @param tokenForSale address of the token that is being sold
   * @param usdEthPriceAggregator USD/ETH price chainlink data feed aggregator address
   * @param usdEurPriceAggregator USD/EUR price chainlink data feed aggregator address
   * @param eurTokenPrice tokenForSale/EUR price (1e18 decimals)
   */
  function initialize(
    address incomeRecipient,
    address tokenForSale,
    address usdEthPriceAggregator,
    address usdEurPriceAggregator,
    uint256 eurTokenPrice
  ) external onlyAdmin {
    require(!Config._getInitialized(), "already initialized");

    // Initialize the primary configuration - it cannot be changed later
    require(tokenForSale != address(0), "invalid token for sale");
    require(incomeRecipient != address(0), "invalid income recipient");
    Config._setInitialized(true);
    Config._setTokenForSale(tokenForSale);
    Config._setIncomeRecipient(incomeRecipient);

    // The decimals of token for sale must match the reference decimals
    require(ERC20(tokenForSale).decimals() == REFERENCE_DECIMALS, "token for sale decimals mismatch");

    // Hardcoded spending limits
    TransactionLimits._set(
      TransactionLimitsData({
        // 950 eur
        walletEurSpendLimit: 950 * REFERENCE_MULTIPLIER,
        // 950_000 eur
        totalEurSpendLimit: 950_000 * REFERENCE_MULTIPLIER
      })
    );

    // Set the pricing and pause configuration - it can be changed during the sale
    MutableConfig._set(
      MutableConfigData({
        paused: true,
        usdEthPriceAggregator: usdEthPriceAggregator,
        usdEurPriceAggregator: usdEurPriceAggregator,
        eurTokenPrice: eurTokenPrice
      })
    );
  }

  /**
   * @dev Set an ERC-20 token to be accepted by `buyWithERC20`.
   * @param erc20 address of the ERC-20 token
   * @param usdERC20PriceAggregator USD/ERC20 price chainlink data feed aggregator address
   */
  function setAcceptedERC20(address erc20, address usdERC20PriceAggregator) external onlyAdmin {
    require(erc20 != address(0), "invalid erc20");
    require(usdERC20PriceAggregator != address(0), "invalid usd price aggregator");

    // Register the accepted ERC-20 token with its USD price aggregator
    AcceptedERC20._set(erc20, AcceptedERC20Data({ usdERC20PriceAggregator: usdERC20PriceAggregator }));
  }

  function updatePriceConfig(
    address usdEthPriceAggregator,
    address usdEurPriceAggregator,
    uint256 eurTokenPrice
  ) external onlyAdmin {
    MutableConfig._setUsdEthPriceAggregator(usdEthPriceAggregator);
    MutableConfig._setUsdEurPriceAggregator(usdEurPriceAggregator);
    MutableConfig._setEurTokenPrice(eurTokenPrice);
  }

  function pauseSale() external onlyAdmin {
    MutableConfig._setPaused(true);
  }

  function unpauseSale() external onlyAdmin {
    MutableConfig._setPaused(false);
  }

  /************************************************************************
   *
   *    BUY FUNCTIONS
   *
   ************************************************************************/

  function buyWithERC20(IERC20 erc20, uint256 purchaseTokenAmount, string memory countryCode) external {
    // ERC-20 used for payment must be accepted
    AcceptedERC20Data memory erc20Config = AcceptedERC20._get(address(erc20));
    require(erc20Config.usdERC20PriceAggregator != address(0), "provided erc20 is not accepted");

    // Get the token and eur amounts spent for the purchase
    (uint256 spendEurAmount, uint256 erc20Amount) = _getAmounts(
      erc20Config.usdERC20PriceAggregator,
      purchaseTokenAmount
    );
    // Validate configuration and amounts
    _checkState(msg.sender, purchaseTokenAmount, spendEurAmount);

    // Check payment token balance
    require(erc20.balanceOf(msg.sender) >= erc20Amount, "not enough tokens available for purchase");

    // Update internal state (before external interactions)
    _effectsBeforePurchase(msg.sender, purchaseTokenAmount, spendEurAmount);

    // Receive the payment
    erc20.transferFrom(msg.sender, Config._getIncomeRecipient(), erc20Amount);

    // Send the purchased tokens
    _finalizePurchase(msg.sender, purchaseTokenAmount, countryCode);
  }

  function buyWithEth(uint256 purchaseTokenAmount, string memory countryCode) external payable {
    // Get the token and eur amounts spent for the purchase
    (uint256 spendEurAmount, uint256 ethAmount) = _getAmounts(
      MutableConfig._getUsdEthPriceAggregator(),
      purchaseTokenAmount
    );
    // Validate configuration and amounts
    _checkState(msg.sender, purchaseTokenAmount, spendEurAmount);

    // Check payment token balance
    require(msg.value >= ethAmount, "not enough eth sent for purchase");

    // Update internal state (before external interactions)
    _effectsBeforePurchase(msg.sender, purchaseTokenAmount, spendEurAmount);

    // Receive the payment
    payable(Config._getIncomeRecipient()).transfer(msg.value);

    // Send the purchased tokens
    _finalizePurchase(msg.sender, purchaseTokenAmount, countryCode);

    // Try to return excess eth if it's a meaningful amount
    uint256 excessEth = msg.value - ethAmount;
    if (excessEth > 10_000 gwei) {
      // TODO consider using `transfer`, which throws on failure (adjust tests accordingly)
      payable(msg.sender).send(excessEth);
    }
  }

  /**
   * @dev Update totals, which are used in checks - this should be called before external interactions
   * @param buyer address of the buyer
   * @param purchaseTokenAmount amount of tokens to purchase
   * @param spendEurAmount amount of eur to spend on the purchase
   */
  function _effectsBeforePurchase(address buyer, uint256 purchaseTokenAmount, uint256 spendEurAmount) internal {
    // Update total amounts
    TransactionTotals._setTokensSold(TransactionTotals._getTokensSold() + purchaseTokenAmount);
    TransactionTotals._setEurReceived(TransactionTotals._getEurReceived() + spendEurAmount);
    // Update wallet amount
    WalletEurSpent._set(buyer, WalletEurSpent._get(buyer) + spendEurAmount);
  }

  /**
   * @dev Send the purchased tokens to buyer, emit a receipt event.
   * @param buyer address of the buyer
   * @param purchaseTokenAmount amount of tokens to purchase
   * @param countryCode ISO 3166-1 alpha-2 two-letter country code
   */
  function _finalizePurchase(address buyer, uint256 purchaseTokenAmount, string memory countryCode) internal {
    // Note that the country code is not validated, it is provided by the buyer and only used in the receipt
    require(bytes(countryCode).length == 2, "invalid country code");

    // Transfer the purchased tokens to the buyer
    IERC20 tokenForSale = IERC20(Config._getTokenForSale());
    tokenForSale.transfer(buyer, purchaseTokenAmount);

    // Emit a receipt event
    emit Receipt(buyer, purchaseTokenAmount, MutableConfig._getEurTokenPrice(), countryCode, block.timestamp);
  }

  receive() external payable {
    // Prevent accidental eth transfers to the contract outside of the dedicated `buyWithEth` function
    revert("send eth to dedicated buy function");
  }

  /************************************************************************
   *
   *    VIEW FUNCTIONS
   *
   ************************************************************************/

  /**
   * @dev Validate the sale configurations, the allowed sale limits, and that there are enough tokens to sell.
   * @param buyer address of the buyer
   * @param purchaseTokenAmount amount of tokens to purchase
   * @param spendEurAmount amount of eur to spend on the purchase
   */
  function _checkState(address buyer, uint256 purchaseTokenAmount, uint256 spendEurAmount) internal view {
    MutableConfigData memory mutableConfig = MutableConfig._get();

    // Validate config
    require(Config._getInitialized(), "sale not initialized");
    require(!mutableConfig.paused, "sale paused");
    require(mutableConfig.usdEthPriceAggregator != address(0), "usd/eth price aggregator not set");
    require(mutableConfig.usdEurPriceAggregator != address(0), "usd/eur price aggregator not set");
    require(mutableConfig.eurTokenPrice > 1e8, "token price not set or too low");

    // The sale contract must have enough tokens to sell
    uint256 tokensAvailable = IERC20(Config._getTokenForSale()).balanceOf(address(this));
    require(tokensAvailable >= purchaseTokenAmount, "not enough tokens available for sale");

    // Check individual purchase limit
    TransactionLimitsData memory limits = TransactionLimits._get();
    require(
      WalletEurSpent._get(buyer) + spendEurAmount <= limits.walletEurSpendLimit,
      "wallet euro spend limit exceeded"
    );

    // Check total purchase limit
    require(
      TransactionTotals._getEurReceived() + spendEurAmount <= limits.totalEurSpendLimit,
      "total euro spend limit exceeded"
    );
  }

  /**
   * @dev Get the aggregator's latest amount and scale it to reference decimals.
   * See chainlink docs for data feeds.
   * @param aggregator chainlink data feed aggregator address
   */
  function _getScaledAmount(address aggregator) internal view returns (int256) {
    (, int256 amount, , , ) = AggregatorV3Interface(aggregator).latestRoundData();
    uint8 feedDecimals = AggregatorV3Interface(aggregator).decimals();

    if (feedDecimals < REFERENCE_DECIMALS) {
      return amount * int256(10 ** uint256(REFERENCE_DECIMALS - feedDecimals));
    } else if (feedDecimals > REFERENCE_DECIMALS) {
      return amount / int256(10 ** uint256(feedDecimals - REFERENCE_DECIMALS));
    }
    return amount;
  }

  /**
   * @dev Using two price feeds (USD/A and USD/B) receive the price A/B in reference decimals.
   * The result is converted to uint256, since prices are expected to always be positive.
   * @param usdAPriceAggregator chainlink data (price in USD, e.g. USD/EUR) feed aggregator address
   * @param usdBPriceAggregator chainlink data (price in USD, e.g. USD/ETH) feed aggregator address
   * @return price resulting A/B price (e.g. EUR/ETH)
   */
  function _convertViaUsd(address usdAPriceAggregator, address usdBPriceAggregator) internal view returns (uint256) {
    int256 usdAPrice = _getScaledAmount(usdAPriceAggregator);
    int256 usdBPrice = _getScaledAmount(usdBPriceAggregator);

    int256 abPrice = (usdBPrice * int256(REFERENCE_MULTIPLIER)) / usdAPrice;

    require(abPrice > 0, "currency conversion price must be positive");
    return uint256(abPrice);
  }

  /**
   * @dev Get the currency and eur amounts that must be spent for the purchase of the given token amount.
   * @param usdCurrencyPriceAggregator chainlink data feed aggregator address for the currency price used to purchase tokens
   * @param tokenAmount amount of tokens to purchase
   * @return eurAmount amount of eur to spend on the purchase
   * @return currencyAmount amount of currency to spend on the purchase
   */
  function _getAmounts(
    address usdCurrencyPriceAggregator,
    uint256 tokenAmount
  ) internal view returns (uint256 eurAmount, uint256 currencyAmount) {
    uint256 currencyEurPrice = _convertViaUsd(usdCurrencyPriceAggregator, MutableConfig._getUsdEurPriceAggregator());

    eurAmount = (tokenAmount * MutableConfig._getEurTokenPrice()) / REFERENCE_MULTIPLIER;
    currencyAmount = (eurAmount * currencyEurPrice) / REFERENCE_MULTIPLIER;
  }
}
