// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { console } from "forge-std/console.sol";
import { GameConfig, Owner, Currency } from "../codegen/index.sol";
import { System } from "@latticexyz/world/src/System.sol";
import { LibRoom } from "../libraries/Libraries.sol";

contract OutcomeSystem is System {
    function reward(bytes32 ratId) public {
        require(_msgSender() == GameConfig.getAdminAddress(), "not allowed");
        bytes32 ratOwner = Owner.get(ratId); 
        uint256 currentBalance = Currency.get(ratOwner);
        Currency.set(ratOwner, currentBalance + 50);
    }

    function punish(bytes32 ratId) public {
        require(_msgSender() == GameConfig.getAdminAddress(), "not allowed");
        bytes32 ratOwner = Owner.get(ratId); 
        
        uint256 currentBalance = Currency.get(ratOwner);

        if(currentBalance < 50) {
            Currency.set(ratOwner, 0);
            return;
        }
        
        Currency.set(ratOwner, Currency.get(ratOwner) - 50);
    }
}
