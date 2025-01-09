// SPDX-License-Identifier: MIT
import { console } from "forge-std/console.sol";

pragma solidity >=0.8.24;

library LibRandom {
    /**
     * @notice simple rng calculation
     * @dev     complexity needs to be increased in prod
     * @param   r1  first source of randomness
     * @param   r2  second source of randomness
     * @return  r  random value
     */
    function random(uint256 r1, uint256 r2) internal view returns (uint256 r) {
        return uint256(keccak256(abi.encodePacked(r1, r2, block.prevrandao, blockhash(block.number - 1))));
    }

    function random2(address sender) public view returns (uint256 r) {
        // Add more variables to introduce more entropy
        r = uint256(
            keccak256(
                abi.encodePacked(
                    sender,
                    block.prevrandao,
                    block.timestamp,
                    block.coinbase, // Current block miner's address
                    gasleft()       // Remaining gas
                )
            )
        );
    }

    function random3() public view returns (uint256) {
        // Use block.prevrandao, msg.sender, and gasleft() for randomness
        uint256 randomNumber = uint256(keccak256(abi.encodePacked(
            block.prevrandao, // Base entropy
            msg.sender, // Different for each player
            gasleft() // Different for multiple calls in same block
        )));

        // Return a random number between 0 and max-1
        return randomNumber;
    }

    // Function that returns true with a probability of 1/x
    function oneIn(address sender, uint256 x) public view returns (bool) {
        require(x > 0, "x must be greater than 0");

        // Use random2 to generate a pseudo-random number
        uint256 randomNumber = random2(sender);

        console.log('randomNumer');
        console.log(randomNumber);
        console.log(randomNumber % x == 0);

        // Return true if the random number modulo x is 0 (probability of 1/x)
        return randomNumber % x == 0;
    }
}
