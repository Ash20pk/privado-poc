// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {AirdropContract} from "../src/AirdropContract.sol";
import {AirdropToken} from "../src/AirdropToken.sol";

contract ConfigureAirdropScript is Script {
    function run() external {
        // Get private key from environment variable
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // Replace with your deployed contract addresses
        address airdropContractAddress = address(0x8f8B8478D49dBAc45167777D78fc6962955342E4); // Replace with your deployed AirdropContract address
        address tokenAddress = address(0xC991c1C3Bb38071034468B87AfbFb5843C9FC47A); // Replace with your deployed token address, or leave as 0x0 to deploy a new one
        
        // Set the airdrop amount (100 tokens with 18 decimals)
        uint256 airdropAmount = 100 * 10**18;
        
        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);
        
        // If token address is not provided, deploy a new token
        AirdropToken token;
        if (tokenAddress == address(0x0)) {
            // Deploy a new token
            token = new AirdropToken(msg.sender);
            tokenAddress = address(token);
            console2.log("New AirdropToken deployed at:", tokenAddress);
        } else {
            // Use existing token
            token = AirdropToken(tokenAddress);
            console2.log("Using existing token at:", tokenAddress);
        }
        
        // Get the AirdropContract instance
        AirdropContract airdropContract = AirdropContract(airdropContractAddress);
        
        // Configure the AirdropContract
        airdropContract.setTokenAddress(tokenAddress);
        console2.log("Token address set in AirdropContract");
        
        airdropContract.setAirdropAmount(airdropAmount);
        console2.log("Airdrop amount set to:", airdropAmount);
        
        // Mint 1000 tokens to the airdrop contract
        token.mint(airdropContractAddress, 1000 * 10**18);
        console2.log("Minted 1000 tokens to AirdropContract");
        
        // Stop broadcasting transactions
        vm.stopBroadcast();
        
        // Print summary
        console2.log("Configuration complete!");
        console2.log("AirdropContract:", airdropContractAddress);
        console2.log("Token:", tokenAddress);
        console2.log("Airdrop amount per user:", airdropAmount);
    }
}
