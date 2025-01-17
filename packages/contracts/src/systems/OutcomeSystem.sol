// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;
import { console } from "forge-std/console.sol";
import { GameConfig, Owner, Balance } from "../codegen/index.sol";
import { System } from "@latticexyz/world/src/System.sol";
import { LibRoom } from "../libraries/Libraries.sol";

contract OutcomeSystem is System {
    function reward(bytes32 ratId) public {
        require(_msgSender() == GameConfig.getAdminAddress(), "not allowed");
        bytes32 ratOwner = Owner.get(ratId); 
        uint256 currentBalance = Balance.get(ratOwner);
        Balance.set(ratOwner, currentBalance + 50);
    }

    function punish(bytes32 ratId) public {
        require(_msgSender() == GameConfig.getAdminAddress(), "not allowed");
        bytes32 ratOwner = Owner.get(ratId); 
        
        uint256 currentBalance = Balance.get(ratOwner);

        if(currentBalance < 50) {
            Balance.set(ratOwner, 0);
            return;
        }
        
        Balance.set(ratOwner, Balance.get(ratOwner) - 50);
    }
}
