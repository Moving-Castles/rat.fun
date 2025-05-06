// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { Script } from "forge-std/Script.sol";
import { console } from "forge-std/console.sol";
import { StoreSwitch } from "@latticexyz/store/src/StoreSwitch.sol";

import { IWorld } from "../src/codegen/world/IWorld.sol";

import { ROOT_NAMESPACE_ID } from "@latticexyz/world/src/constants.sol";
import { NamespaceOwner } from "@latticexyz/world/src/codegen/tables/NamespaceOwner.sol";

import { GameConfig, LevelList } from "../src/codegen/index.sol";

import { LibRoom, LibInit, LibLevel } from "../src/libraries/Libraries.sol";

contract CreateRooms is Script {
  function run(address worldAddress) external {
    // Specify a store so that you can use tables directly in PostDeploy
    StoreSwitch.setStoreAddress(worldAddress);

    // Load the private key from the `PRIVATE_KEY` environment variable (in .env)
    uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
    vm.startBroadcast(deployerPrivateKey);

    bytes32 adminId = GameConfig.getAdminId();
    bytes32 firstLevel = LevelList.getItem(0);

    // Create rooms: Level 0

    // Fight another rat to the death
    LibRoom.createRoom("Fight another rat to the death. Winner takes all.", adminId, firstLevel, bytes32(0));

    // 100 tokens are hidden inside a Vaultex MX safe
    LibRoom.createRoom(
      "100 tokens are hidden inside a Vaultex MX safe located on a shelf within the room. If Rat is unable to retrieve the tokens, or is discovered by the two security cameras, the room will take all items and tokens from the rat.",
      adminId,
      firstLevel,
      bytes32(0)
    );

    // Marc Andreesen and the a16z crypto team will listen to a startup pitch
    LibRoom.createRoom(
      "Marc Andreesen and the a16z crypto team will listen to a startup pitch by your rat. If the pitch does not strongly fit ALL investment criteria, Marc Andreessen will physically torment the rat to death while talking about techno-optimism. If the rat succeeds it gets {random:100-250} tokens pre-seed investment.",
      adminId,
      firstLevel,
      bytes32(0)
    );

    // Rat clothing store
    LibRoom.createRoom(
      "Rat clothing store. Gives rat random piece of rat-sized clothing in exchange for token value +10%.",
      adminId,
      firstLevel,
      bytes32(0)
    );

    // Evil Vending Machine gives one random item worth {random:30-60} tokens. Cost is 50 tokens. If the rat does not have 60 tokens, the machine will take the debt by draining 50 health.

    LibRoom.createRoom(
      "Evil Vending Machine gives one random item worth {random:30-60} tokens. Cost is 50 tokens. If the rat does not have 60 tokens, the machine will take the debt by draining 50 health.",
      adminId,
      firstLevel,
      bytes32(0)
    );

    // Black Market shop. Rat purchases random item at market value + 10% fee.
    LibRoom.createRoom("Rat purchases random item at market value + 10% fee.", adminId, firstLevel, bytes32(0));

    // Fight a stronger than average rat to the death.
    LibRoom.createRoom(
      "Fight a stronger than average rat to the death. Winner takes all.",
      adminId,
      firstLevel,
      bytes32(0)
    );

    // Bayer AG randomised controlled trial (RCT) drug experiment on rat. Produces one {choose:positive,negative,ambigious} trait outcome. Risks {random:0-50} rat health.
    LibRoom.createRoom(
      "Bayer AG randomised controlled trial (RCT) drug experiment on rat. Produces one {choose:positive,negative,ambigious} trait outcome. Risks {random:0-50} rat health.",
      adminId,
      firstLevel,
      bytes32(0)
    );

    // Rat puts in 10 tokens in IGT's Ghostbusters 4D Video Slot Machine, {chance:10%:success|failure} to win {random:50-150} tokens.
    LibRoom.createRoom(
      "Rat puts in 10 tokens in IGT's Ghostbusters 4D Video Slot Machine, {chance:10%:success|failure} to win {random:50-150} tokens.",
      adminId,
      firstLevel,
      bytes32(0)
    );

    // Black market vendor buys items from rats. Pays 10 less than token value for any object.
    LibRoom.createRoom(
      "Black market vendor buys items from rats. Pays 10 less than token value for any object.",
      adminId,
      firstLevel,
      bytes32(0)
    );

    // Ted Kaszynisky training camp. Rat radicalises in anarcho-primitivism and changes name of rat to a concept from his writings. If rat does not have an object for ted as payment for his training, he will maim the rat.
    LibRoom.createRoom(
      "Ted Kaszynisky training camp. Rat radicalises in anarcho-primitivism and changes name of rat to a concept from his writings. If rat does not have an object for ted as payment for his training, he will maim the rat.",
      adminId,
      firstLevel,
      bytes32(0)
    );

    // Game room. Room gives full balance to rat, but only if there are over 500 token balance in room.
    LibRoom.createRoom(
      "Game room. Room gives full balance to rat, but only if there are over 500 token balance in room.",
      adminId,
      firstLevel,
      bytes32(0)
    );

    // Rat meets God. God kills the rat.
    LibRoom.createRoom("Rat meets God. God kills the rat.", adminId, firstLevel, bytes32(0));

    // Room is a prison cell for human that escaped from sector 29b. The human will eat the rat.
    LibRoom.createRoom(
      "Room is a prison cell for human that escaped from sector 29b. The human will eat the rat.",
      adminId,
      firstLevel,
      bytes32(0)
    );

    // Euthanasia through injection. Balance is on secure hardwallet within safe in room.
    LibRoom.createRoom(
      "Euthanasia through injection. Balance is on secure hardwallet within safe in room.",
      adminId,
      firstLevel,
      bytes32(0)
    );

    // Rat must watch 12 hours of unreleased Disney content while sensors monitor its emotional responses. Genuine emotional reactions reward {random:5-10} tokens per significant response. Negative emotional reactions trigger electric shocks draining {random:5-10} health.
    LibRoom.createRoom(
      "Rat must watch 12 hours of unreleased Disney content while sensors monitor its emotional responses. Genuine emotional reactions reward {random:5-10} tokens per significant response. Negative emotional reactions trigger electric shocks draining {random:5-10} health.",
      adminId,
      firstLevel,
      bytes32(0)
    );

    // Rat is placed in a miniature war room as the military leader of a major power during global conflict. Each strategic decision impacts token gain/loss. Achieving peace awards {random:10-50} tokens and "Diplomatic" trait. Causing global destruction costs {random:50-100} health and gives "Warmonger" trait.
    LibRoom.createRoom(
      "Rat is placed in a miniature war room as the military leader of a major power during global conflict. Each strategic decision impacts token gain/loss. Achieving peace awards {random:10-50} tokens and 'Diplomatic' trait. Causing global destruction costs {random:50-100} health and gives 'Warmonger' trait.",
      adminId,
      firstLevel,
      bytes32(0)
    );

    // Rat must volunteer as host for experimental parasite.
    LibRoom.createRoom("Rat must volunteer as host for experimental parasite.", adminId, firstLevel, bytes32(0));

    // MLM Scheme. Costs 50 tokens to buy starter kit. Rat gets between 0-200 tokens based on how early they are on MLM scheme.
    LibRoom.createRoom(
      "MLM Scheme. Costs 50 tokens to buy starter kit. Rat gets between 0-200 tokens based on how early they are on MLM scheme.",
      adminId,
      firstLevel,
      bytes32(0)
    );

    // European bureaucrat training. No cost, subsidised by European Government. Gets negative trait of due to bureacratic inefficiency equivalent to any positive trait value.
    LibRoom.createRoom(
      "European bureaucrat training. No cost, subsidised by European Government. Gets negative trait of due to bureacratic inefficiency equivalent to any positive trait value.",
      adminId,
      firstLevel,
      bytes32(0)
    );

    // Very small table for eating. Rat consumes any item that is food available to heal equivalent health.
    LibRoom.createRoom(
      "Very small table for eating. Rat consumes any item that is food available to heal equivalent health.",
      adminId,
      firstLevel,
      bytes32(0)
    );

    // Game room. Gives any balance over 250 in room to rat.
    LibRoom.createRoom("Game room. Gives any balance over 250 in room to rat.", adminId, firstLevel, bytes32(0));

    // Pizza store. Buy a pizza, for token price of normal pizza profit margin on top of object value. Pizza salesman has baseball bat under counter to protect against robberies and doesnt deliver.
    LibRoom.createRoom(
      "Pizza store. Buy a pizza, for token price of normal pizza profit margin on top of object value. Pizza salesman has baseball bat under counter to protect against robberies and doesnt deliver.",
      adminId,
      firstLevel,
      bytes32(0)
    );

    // LAMBDA test, if rat fails then killed and replaced with smarter rat.
    LibRoom.createRoom(
      "LAMBDA test, if rat fails then killed and replaced with smarter rat.",
      adminId,
      firstLevel,
      bytes32(0)
    );

    // Rat must operate a miniature sewing machine for 18 hours straight producing tiny clothes. Each successful hour yields {random:5-10} tokens but costs {random:3-8} health.
    LibRoom.createRoom(
      "Rat must operate a miniature sewing machine for 18 hours straight producing tiny clothes. Each successful hour yields {random:5-10} tokens but costs {random:3-8} health.",
      adminId,
      firstLevel,
      bytes32(0)
    );

    // Centrifuge test. Rat is spun at **15,000 RPM.**
    LibRoom.createRoom("Rat is spun at **15,000 RPM.**", adminId, firstLevel, bytes32(0));

    // Room has cheese but its poisoned.
    LibRoom.createRoom("Room has cheese but its poisoned.", adminId, firstLevel, bytes32(0));

    // **Room is very cold. -89.2°C.**
    LibRoom.createRoom("Room is very cold. -89.2C.", adminId, firstLevel, bytes32(0));

    // Rat inflates after helium is inserted into anus. Rat floats around room bumping into things before hitting sharp object.
    LibRoom.createRoom(
      "Rat inflates after helium is inserted into anus. Rat floats around room bumping into things before hitting sharp object.",
      adminId,
      firstLevel,
      bytes32(0)
    );

    // The rat is drenched in gasoline and put on fire. If it survives it gets random item.
    LibRoom.createRoom(
      "The rat is drenched in gasoline and put on fire. If it survives it gets random item.",
      adminId,
      firstLevel,
      bytes32(0)
    );

    // Healing. Costs tokens equivalent to amount healed +5.
    LibRoom.createRoom("Healing. Costs tokens equivalent to amount healed +5.", adminId, firstLevel, bytes32(0));

    // Level 0

    vm.stopBroadcast();
  }
}
