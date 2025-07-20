// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {KRNL, KrnlPayload, KernelParameter, KernelResponse} from "./KRNL.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract AirdropContract is KRNL {
    // State variables
    address public contractOwner;
    IERC20 public token;
    uint256 public airdropAmount;
    mapping(address => bool) public hasClaimed;

    struct Response {
        string message;
    }
    
    // Events
    event AirdropClaimed(address recipient, uint256 amount);
    event TokensWithdrawn(address to, uint256 amount);
    event TokenAddressSet(address tokenAddress);
    event AirdropAmountSet(uint256 airdropAmount);
    event testEvent(string message);
    
    // Modifiers
    modifier onlyContractOwner() {
        require(msg.sender == contractOwner, "Not the owner");
        _;
    }
    
    // Constructor sets the token authority public key, owner, token address and airdrop amount
    constructor(address _tokenAuthorityPublicKey) KRNL(_tokenAuthorityPublicKey) {
        contractOwner = msg.sender;
    }
    
    function _claimAirdrop(address airdropAddress) internal {
        require(!hasClaimed[airdropAddress], "Already claimed");
        require(token.balanceOf(address(this)) >= airdropAmount, "Insufficient token balance");
        
        hasClaimed[airdropAddress] = true;
        require(token.transfer(airdropAddress, airdropAmount), "Transfer failed");
        
        emit AirdropClaimed(airdropAddress, airdropAmount);
    }

    function submitRequest(
        KrnlPayload memory krnlPayload,
        address airdropAddress
    )
        external
        onlyAuthorized(krnlPayload, abi.encode(airdropAddress))
    {
        // Decode response from kernel
        KernelResponse[] memory kernelResponses = abi.decode(krnlPayload.kernelResponses, (KernelResponse[]));
        Response memory response;
        for (uint i; i < kernelResponses.length; i++) {
            if (kernelResponses[i].kernelId == 1686) {
                response = abi.decode(kernelResponses[i].result, (Response));
            }
        }
        emit testEvent(response.message);
        _claimAirdrop(airdropAddress);
    }
    
    // Withdraw function - allows owner to withdraw tokens from the contract
    function withdraw(uint256 amount) external onlyContractOwner {
        require(token.balanceOf(address(this)) >= amount, "Insufficient token balance");
        require(token.transfer(contractOwner, amount), "Transfer failed");
        
        emit TokensWithdrawn(contractOwner, amount);
    }
    
    // Function to update the airdrop amount
    function setAirdropAmount(uint256 _newAmount) external onlyContractOwner {
        airdropAmount = _newAmount;
        emit AirdropAmountSet(_newAmount);
    }

    function setTokenAddress(address _tokenAddress) external onlyContractOwner {
        token = IERC20(_tokenAddress);
        emit TokenAddressSet(_tokenAddress);
    }

    function getAirdropAmount() external view returns (uint256) {
        return airdropAmount;
    }

    function getHasClaimed(address airdropAddress) external view returns (bool) {
        return hasClaimed[airdropAddress];
    }

    function getContractOwner() external view returns (address) {
        return contractOwner;
    }
}
