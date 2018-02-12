var LendingBlockTokenEvent = artifacts.require("./LendingBlockTokenEvent.sol");

module.exports = function(deployer) {
  deployer.deploy(LendingBlockTokenEvent, web3.eth.accounts[1]);
};
