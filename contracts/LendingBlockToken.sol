pragma solidity 0.4.19;


import 'zeppelin-solidity/contracts/ownership/Ownable.sol';
import 'zeppelin-solidity/contracts/token/BurnableToken.sol';
import 'zeppelin-solidity/contracts/token/StandardToken.sol';

/**
* @title LendingBlockToken
* @dev LND or LendingBlock Token
* Max supply of 1 billion
* 18 decimals
* not transferable before end of token generation event
* transferable time can be set
*/
contract LendingBlockToken is StandardToken, BurnableToken, Ownable {
	string public constant name = "Lendingblock";
	string public constant symbol = "LND";
	uint8 public constant decimals = 18;
	uint256 public transferableTime = 1546300800;// 1/1/2019
	address public tokenEventAddress;

	/**
	* @dev before transferableTime, only the token event contract and owner
	* can transfer tokens
	*/
	modifier afterTransferableTime() {
		if (now <= transferableTime) {
			require(msg.sender == tokenEventAddress || msg.sender == owner);
		}
		_;
	}

	/**
	* @dev constructor to initiate values
	* msg.sender is the token event contract
	* supply is 1 billion
	* @param _owner address that has can transfer tokens and access to change transferableTime
	*/
	function LendingBlockToken(address _owner) public {
		tokenEventAddress = msg.sender;
		owner = _owner;
		totalSupply = 1e9 * 1e18;
		balances[_owner] = totalSupply;
		Transfer(address(0), _owner, totalSupply);
	}

	/**
	* @dev transferableTime restrictions on the parent function
	* @param _to address that will receive tokens
	* @param _value amount of tokens to transfer
	* @return boolean that indicates if the operation was successful
	*/
	function transfer(address _to, uint256 _value)
		public
		afterTransferableTime
		returns (bool)
	{
		return super.transfer(_to, _value);
	}

	/**
	* @dev transferableTime restrictions on the parent function
	* @param _from address that is approving the tokens
	* @param _to address that will receive approval for the tokens
	* @param _value amount of tokens to approve
	* @return boolean that indicates if the operation was successful
	*/
	function transferFrom(address _from, address _to, uint256 _value)
		public
		afterTransferableTime
		returns (bool)
	{
		return super.transferFrom(_from, _to, _value);
	}

	/**
	* @dev set transferableTime
	* transferableTime can only be set earlier, not later
	* once tokens are transferable, it cannot be paused
	* @param _transferableTime epoch time for transferableTime
	*/
	function setTransferableTime(uint256 _transferableTime)
		external
		onlyOwner
	{
		require(_transferableTime < transferableTime);
		transferableTime = _transferableTime;
	}
}
