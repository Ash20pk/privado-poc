// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {AirdropContract} from "../src/AirdropContract.sol";

contract DeployScript is Script {
    function run() external {
        // Get private key from environment variable
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);
        
        AirdropContract airdropContract = new AirdropContract(address(0x907089fC3966f52dB4463c8295Ad9aE3B164D94c));
        
        // Stop broadcasting transactions
        vm.stopBroadcast();
        
        // Log the deployed contract address
        console.log("AirdropContract deployed at:", address(airdropContract));
    }
}
