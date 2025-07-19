// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";

contract VerifyScript is Script {
    function run() external {
        // Replace these with your deployed contract addresses
        address airdropContract = address(0x0); // Replace with your deployed AirdropContract address
        
        string memory airdropContractVerify = string(
            abi.encodePacked(
                "forge verify-contract --chain sepolia --compiler-version 0.8.24 ",
                vm.toString(airdropContract),
                " src/AirdropContract.sol:AirdropContract ",
                "--constructor-args ",
                vm.toString(abi.encode(address(0x907089fC3966f52dB4463c8295Ad9aE3B164D94c)))
            )
        );
        
        console.log("Run this command to verify AirdropContract:");
        console.log(airdropContractVerify);
    }
}
