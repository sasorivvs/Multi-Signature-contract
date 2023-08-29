// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;


contract Multisig{
    mapping(address => bool) public owners;
    address[] public ownersForConfirmations;
    uint public required;
    uint public transactionsCount;

    struct Transaction{
        address to;
        uint amount;
        bool executed;
    }

    mapping(uint => Transaction) public transactions;
    mapping(uint => mapping(address => bool)) public confirmations;

    event Submited(uint txId,address initiator, address to, uint amount);
    event Confirmed(uint txId, address owner);
    event Executed(uint txId, address to, uint amount, uint timestamp);


    constructor(address[] memory _owners, uint _required){
        require(_owners.length>=_required && _required > 0);
        for(uint i = 0; i<_owners.length;i++){
            if(!owners[_owners[i]]){
               owners[_owners[i]] = true; 
            }
        }
        ownersForConfirmations = _owners;
        required = _required;
    }

    function isOwner(address _owner) internal view returns(bool){

        return owners[_owner];
    }


    function addTransaction(address _to, uint _amount) internal returns(uint){
        require(isOwner(msg.sender),"Not An Owner");
        uint txId = transactionsCount;

        transactions[txId] = Transaction(_to,_amount, false);
        transactionsCount++;
        emit Submited(txId,msg.sender,_to,_amount);
        return(txId);

    }    

    function getConfirmationsCount(uint _txId) internal view returns(uint){
        uint confirmationsCount;
        for(uint i = 0; i<ownersForConfirmations.length; i++){
            if(confirmations[_txId][ownersForConfirmations[i]]){
                confirmationsCount++;
            }
        }
        return confirmationsCount;
    }

    function isConfirmed(uint _transactionId) public view returns(bool){
        if(required <= getConfirmationsCount( _transactionId)){
            return true;
        }

        return false;
    }

    function isExecuted(uint _txId) internal view returns(bool){
        return transactions[_txId].executed;
    }

    function executeTransaction(uint _txId) internal{
        require(isConfirmed(_txId), "Not Confirmed");
        require(!isExecuted(_txId), "Already Executed");

        Transaction memory _tx = transactions[_txId];
        transactions[_txId].executed = true;
        emit Executed(_txId, _tx.to, _tx.amount,block.timestamp);

        (bool s,) = _tx.to.call{value: _tx.amount}("");
        require(s, "Call Error");

        
    }


    function submitTransaction(address _to, uint _amount) public {
        require(isOwner(msg.sender),"Not An Owner");

        uint _txId = addTransaction(_to,_amount);
        confirmTransaction(_txId);
    }

    function confirmTransaction(uint _txId) public {
        require(isOwner(msg.sender),"Not An Owner");
        confirmations[_txId][msg.sender] = true;
        emit Confirmed(_txId, msg.sender);
        if(isConfirmed(_txId)){
            executeTransaction(_txId);

        }
    }


    receive() payable external{}




}