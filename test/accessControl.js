let LendingBlockTokenEvent = artifacts.require('LendingBlockTokenEvent.sol');
let LendingBlockToken = artifacts.require('LendingBlockToken.sol');

let tokenEvent;
let token;
let dummyAccount = '0x1234567890123456789012345678901234567890';
let transferableTime = 1517443200;

//account[0] is owner
//account[1] is wallet to collect funds

contract('LendingBlockToken', (accounts) => {
  it('should deploy the contract and send the initial tokens', () => {
    return LendingBlockTokenEvent.deployed().then((instance) => {
      tokenEvent = instance;
      let transferEvent = web3.eth.getTransactionReceipt(web3.eth.getBlock('latest').transactions[0]);
      assert.strictEqual(transferEvent.logs[0].topics[0], '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', 'transfer event');
      assert.strictEqual(transferEvent.logs[0].topics[1], '0x0000000000000000000000000000000000000000000000000000000000000000', 'transfer from null');
      assert.strictEqual(transferEvent.logs[0].topics[2], '0x000000000000000000000000' + accounts[0].slice(2, 42), 'transfer to owner');
      assert.strictEqual(web3.toBigNumber(transferEvent.logs[0].data).toString(), web3.toBigNumber('1e9').times('1e18').toString(), 'transfer amount');
      return tokenEvent.token.call();
    }).then((result) => {
      token = LendingBlockToken.at(result);
    });
  });
  it('token should not allow non owner to setTransferableTime', () => {
    return token.setTransferableTime(transferableTime, {
      from: accounts[1]
    }).catch((error) => {
      assert.strictEqual(txFailed(error), true, 'setTransferableTime denied');
    }).then((result) => {
      assert.strictEqual(result, undefined, 'setTransferableTime denied');
    });
  });
  it('token should allow only owner to transfer', () => {
    return token.transfer(accounts[1], 1, {
      from: accounts[0]
    }).then((result) => {
      assert.strictEqual(result.receipt.status, '0x01', 'transfer allowed');
      assert.strictEqual(result.logs.length, 1, 'Transfer log');
      assert.strictEqual(result.logs[0].address, token.address, 'Transfer event');
      assert.strictEqual(result.logs[0].event, 'Transfer', 'Transfer event');
      assert.strictEqual(result.logs[0].args.from, accounts[0], 'Transfer event');
      assert.strictEqual(result.logs[0].args.to, accounts[1], 'Transfer event');
      assert.strictEqual(result.logs[0].args.value.toString(), '1', 'Transfer event');
      return token.balanceOf.call(accounts[1]);
    }).then((result) => {
      assert.strictEqual(result.toString(), '1', 'transfer success');
      return token.transfer(dummyAccount, 1, {
        from: accounts[1]
      });
    }).catch((error) => {
      assert.strictEqual(txFailed(error), true, 'transfer denied');
    }).then((result) => {
      assert.strictEqual(result, undefined, 'transfer denied');
    });
  });
  it('token should allow approve, increaseApproval, decreaseApproval but not transferFrom', () => {
    return token.approve(accounts[1], 50, {
      from: accounts[0]
    }).then((result) => {
      assert.strictEqual(result.receipt.status, '0x01', 'approve allowed');
      assert.strictEqual(result.logs.length, 1, 'Approval log');
      assert.strictEqual(result.logs[0].address, token.address, 'Approval event');
      assert.strictEqual(result.logs[0].event, 'Approval', 'Approval event');
      assert.strictEqual(result.logs[0].args.owner, accounts[0], 'Approval event');
      assert.strictEqual(result.logs[0].args.spender, accounts[1], 'Approval event');
      assert.strictEqual(result.logs[0].args.value.toString(), '50', 'Approval event');
      return token.allowance.call(accounts[0], accounts[1]);
    }).then((result) => {
      assert.strictEqual(result.toString(), '50', 'approve success');
      return token.increaseApproval(accounts[1], 60, {
        from: accounts[0]
      });
    }).then((result) => {
      assert.strictEqual(result.receipt.status, '0x01', 'increaseApproval allowed');
      assert.strictEqual(result.logs.length, 1, 'Approval log');
      assert.strictEqual(result.logs[0].address, token.address, 'Approval event');
      assert.strictEqual(result.logs[0].event, 'Approval', 'Approval event');
      assert.strictEqual(result.logs[0].args.owner, accounts[0], 'Approval event');
      assert.strictEqual(result.logs[0].args.spender, accounts[1], 'Approval event');
      assert.strictEqual(result.logs[0].args.value.toString(), '110', 'Approval event');
      return token.allowance.call(accounts[0], accounts[1]);
    }).then((result) => {
      assert.strictEqual(result.toString(), '110', 'approve success');
      return token.decreaseApproval(accounts[1], 10, {
        from: accounts[0]
      });
    }).then((result) => {
      assert.strictEqual(result.receipt.status, '0x01', 'decreaseApproval allowed');
      assert.strictEqual(result.logs.length, 1, 'Approval log');
      assert.strictEqual(result.logs[0].address, token.address, 'Approval event');
      assert.strictEqual(result.logs[0].event, 'Approval', 'Approval event');
      assert.strictEqual(result.logs[0].args.owner, accounts[0], 'Approval event');
      assert.strictEqual(result.logs[0].args.spender, accounts[1], 'Approval event');
      assert.strictEqual(result.logs[0].args.value.toString(), '100', 'Approval event');
      return token.allowance.call(accounts[0], accounts[1]);
    }).then((result) => {
      assert.strictEqual(result.toString(), '100', 'approve success');
      return token.transferFrom(accounts[0], accounts[1], 100, {
        from: accounts[1]
      });
    }).catch((error) => {
      assert.strictEqual(txFailed(error), true, 'transferFrom denied');
    }).then((result) => {
      assert.strictEqual(result, undefined, 'transferFrom denied');
    });
  });
  it('token should allow owner to setTransferableTime to an earlier time', () => {
    return token.setTransferableTime(transferableTime, {
      from: accounts[0]
    }).then((result) => {
      assert.strictEqual(result.receipt.status, '0x01', 'setTransferableTime allowed');
      return token.transferableTime.call();
    }).then((result) => {
      assert.strictEqual(result.toString(), transferableTime.toString(), 'setTransferableTime success');
      return token.setTransferableTime(transferableTime + 1, {
        from: accounts[0]
      });
    }).catch((error) => {
      assert.strictEqual(txFailed(error), true, 'new transferableTime must be earlier');
    }).then((result) => {
      assert.strictEqual(result, undefined, 'new transferableTime must be earlier');
    });
  });
  it('token should allow transfer and transferFrom after transferableTime', () => {
    return token.transfer(dummyAccount, 1, {
      from: accounts[1]
    }).then((result) => {
      assert.strictEqual(result.receipt.status, '0x01', 'transfer now allowed');
      return token.balanceOf.call(dummyAccount);
    }).then((result) => {
      assert.strictEqual(result.toString(), '1', 'transfer success');
      return token.transferFrom(accounts[0], accounts[1], 100, {
        from: accounts[1]
      });
    }).then((result) => {
      assert.strictEqual(result.receipt.status, '0x01', 'transferFrom now allowed');
      assert.strictEqual(result.logs.length, 1, 'Transfer log');
      assert.strictEqual(result.logs[0].address, token.address, 'Transfer event');
      assert.strictEqual(result.logs[0].event, 'Transfer', 'Transfer event');
      assert.strictEqual(result.logs[0].args.from, accounts[0], 'Transfer event');
      assert.strictEqual(result.logs[0].args.to, accounts[1], 'Transfer event');
      assert.strictEqual(result.logs[0].args.value.toString(), '100', 'Transfer event');
      return token.balanceOf.call(accounts[1]);
    }).then((result) => {
      assert.strictEqual(result.toString(), '100', 'transferFrom success');
    });
  });
  it('token should allow token burn', () => {
    return token.burn(110, {
      from: accounts[1]
    }).catch((error) => {
      assert.strictEqual(txFailed(error), true, 'you need enough tokens to burn them');
    }).then((result) => {
      assert.strictEqual(result, undefined, 'you need enough tokens to burn them');
      return token.burn(80, {
        from: accounts[1]
      });
    }).then((result) => {
      assert.strictEqual(result.receipt.status, '0x01', 'burn allowed');
      assert.strictEqual(result.logs.length, 1, 'Burn log');
      assert.strictEqual(result.logs[0].address, token.address, 'Burn event');
      assert.strictEqual(result.logs[0].event, 'Burn', 'Burn event');
      assert.strictEqual(result.logs[0].args.burner, accounts[1], 'Burn event');
      assert.strictEqual(result.logs[0].args.value.toString(), '80', 'Burn event');
      return token.balanceOf.call(accounts[1]);
    }).then((result) => {
      assert.strictEqual(result.toString(), '20', 'burn success');
      return token.totalSupply.call();
    }).then((result) => {
      assert.strictEqual(result.toString(), web3.toBigNumber('1e9').times('1e18').minus(80).toString(), 'burn success');
    });
  });
  it('token should allow only owner to transferOwnership', () => {
    return token.transferOwnership(dummyAccount, {
      from: accounts[1]
    }).catch((error) => {
      assert.strictEqual(txFailed(error), true, 'transferOwnership denied');
    }).then((result) => {
      assert.strictEqual(result, undefined, 'transferOwnership denied');
      return token.transferOwnership(dummyAccount, {
        from: accounts[0]
      });
    }).then((result) => {
      assert.strictEqual(result.receipt.status, '0x01', 'transferOwnership allowed');
      assert.strictEqual(result.logs.length, 1, 'OwnershipTransferred log');
      assert.strictEqual(result.logs[0].address, token.address, 'OwnershipTransferred event');
      assert.strictEqual(result.logs[0].event, 'OwnershipTransferred', 'OwnershipTransferred event');
      assert.strictEqual(result.logs[0].args.previousOwner, accounts[0], 'OwnershipTransferred event');
      assert.strictEqual(result.logs[0].args.newOwner, dummyAccount, 'OwnershipTransferred event');
      return token.owner.call();
    }).then((result) => {
      assert.strictEqual(result, dummyAccount, 'transferOwnership success');
    });
  });
});

contract('LendingBlockTokenEvent', (accounts) => {
  it('should deploy the contract and send the initial tokens', () => {
    return LendingBlockTokenEvent.deployed().then((instance) => {
      tokenEvent = instance;
      let transferEvent = web3.eth.getTransactionReceipt(web3.eth.getBlock('latest').transactions[0]);
      assert.strictEqual(transferEvent.logs[0].topics[0], '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', 'transfer event');
      assert.strictEqual(transferEvent.logs[0].topics[1], '0x0000000000000000000000000000000000000000000000000000000000000000', 'transfer from null');
      assert.strictEqual(transferEvent.logs[0].topics[2], '0x000000000000000000000000' + accounts[0].slice(2, 42), 'transfer to owner');
      assert.strictEqual(web3.toBigNumber(transferEvent.logs[0].data).toString(), web3.toBigNumber('1e9').times('1e18').toString(), 'transfer amount');
      return tokenEvent.token.call();
    }).then((result) => {
      token = LendingBlockToken.at(result);
    });
  });
  it('tokenEvent should not allow non owner to setPre', () => {
    return tokenEvent.setPre(
      1525132800,
      1525737600,
      web3.toBigNumber(10).times('1e18'),
      web3.toBigNumber(100).times('1e18'),
      30000, {
        from: accounts[1]
      }).catch((error) => {
      assert.strictEqual(txFailed(error), true, 'setPre denied');
    }).then((result) => {
      assert.strictEqual(result, undefined, 'setPre denied');
    });
  });
  it('tokenEvent should not allow setPre if not now < _startTimePre', () => {
    return tokenEvent.setPre(
      1518048000,
      1525737600,
      web3.toBigNumber(10).times('1e18'),
      web3.toBigNumber(100).times('1e18'),
      30000, {
        from: accounts[0]
      }).catch((error) => {
      assert.strictEqual(txFailed(error), true, 'now < _startTimePre');
    }).then((result) => {
      assert.strictEqual(result, undefined, 'now < _startTimePre');
    });
  });
  it('tokenEvent should not allow setPre if not _startTimePre < _endTimePre', () => {
    return tokenEvent.setPre(
      1525737600,
      1518048000,
      web3.toBigNumber(10).times('1e18'),
      web3.toBigNumber(100).times('1e18'),
      30000, {
        from: accounts[0]
      }).catch((error) => {
      assert.strictEqual(txFailed(error), true, '_startTimePre < _endTimePre');
    }).then((result) => {
      assert.strictEqual(result, undefined, '_startTimePre < _endTimePre');
    });
  });
  it('tokenEvent should not allow setPre if not _minCapPre <= _maxCapPre', () => {
    return tokenEvent.setPre(
      1525132800,
      1525737600,
      web3.toBigNumber(10).times('1e18'),
      web3.toBigNumber(9).times('1e18'),
      30000, {
        from: accounts[0]
      }).catch((error) => {
      assert.strictEqual(txFailed(error), true, '_minCapPre <= _maxCapPre');
    }).then((result) => {
      assert.strictEqual(result, undefined, '_minCapPre <= _maxCapPre');
    });
  });
  it('tokenEvent should allow only owner to setPre', () => {
    return tokenEvent.setPre(
      1525132800,
      1525737600,
      web3.toBigNumber(10).times('1e18'),
      web3.toBigNumber(100).times('1e18'),
      30000, {
        from: accounts[0]
      }).then((result) => {
      assert.strictEqual(result.receipt.status, '0x01', 'setPre allowed');
      assert.strictEqual(result.logs.length, 1, 'SetPre log');
      assert.strictEqual(result.logs[0].address, tokenEvent.address, 'SetPre event');
      assert.strictEqual(result.logs[0].event, 'SetPre', 'SetPre event');
      assert.strictEqual(result.logs[0].args.startTimePre.toString(), '1525132800', 'SetPre event');
      assert.strictEqual(result.logs[0].args.endTimePre.toString(), '1525737600', 'SetPre event');
      assert.strictEqual(result.logs[0].args.minCapPre.toString(), web3.toBigNumber(10).times('1e18').toString(), 'SetPre event');
      assert.strictEqual(result.logs[0].args.maxCapPre.toString(), web3.toBigNumber(100).times('1e18').toString(), 'SetPre event');
      assert.strictEqual(result.logs[0].args.ratePre.toString(), '30000', 'SetPre event');
      return tokenEvent.startTimePre.call();
    }).then((result) => {
      assert.strictEqual(result.toString(), '1525132800', 'startTimePre');
      return tokenEvent.endTimePre.call();
    }).then((result) => {
      assert.strictEqual(result.toString(), '1525737600', 'endTimePre');
      return tokenEvent.minCapPre.call();
    }).then((result) => {
      assert.strictEqual(result.toString(), web3.toBigNumber(10).times('1e18').toString(), 'minCapPre');
      return tokenEvent.maxCapPre.call();
    }).then((result) => {
      assert.strictEqual(result.toString(), web3.toBigNumber(100).times('1e18').toString(), 'maxCapPre');
      return tokenEvent.ratePre.call();
    }).then((result) => {
      assert.strictEqual(result.toString(), '30000', 'ratePre');
    });
  });
  it('tokenEvent should not allow endEvent if not endTimeMain > 0', () => {
    return tokenEvent.endEvent({
      from: accounts[0]
    }).catch((error) => {
      assert.strictEqual(txFailed(error), true, 'endTimeMain > 0');
    }).then((result) => {
      assert.strictEqual(result, undefined, 'endTimeMain > 0');
    });
  });
  it('tokenEvent should not allow non owner to setMain', () => {
    return tokenEvent.setMain(
      1526342400,
      1526947200,
      web3.toBigNumber(0.1).times('1e18'),
      web3.toBigNumber(10).times('1e18'),
      30000, {
        from: accounts[1]
      }).catch((error) => {
      assert.strictEqual(txFailed(error), true, 'setMain denied');
    }).then((result) => {
      assert.strictEqual(result, undefined, 'setMain denied');
    });
  });
  it('tokenEvent should not allow setMain if not now < _startTimeMain', () => {
    return tokenEvent.setMain(
      1518048000,
      1526947200,
      web3.toBigNumber(0.1).times('1e18'),
      web3.toBigNumber(10).times('1e18'),
      30000, {
        from: accounts[0]
      }).catch((error) => {
      assert.strictEqual(txFailed(error), true, 'now < _startTimeMain');
    }).then((result) => {
      assert.strictEqual(result, undefined, 'now < _startTimeMain');
    });
  });
  it('tokenEvent should not allow setMain if not _startTimeMain < _endTimeMain', () => {
    return tokenEvent.setMain(
      1526947200,
      1526342400,
      web3.toBigNumber(0.1).times('1e18'),
      web3.toBigNumber(10).times('1e18'),
      30000, {
        from: accounts[0]
      }).catch((error) => {
      assert.strictEqual(txFailed(error), true, '_startTimeMain < _endTimeMain');
    }).then((result) => {
      assert.strictEqual(result, undefined, '_startTimeMain < _endTimeMain');
    });
  });
  it('tokenEvent should not allow setMain if not _minCapMain <= _maxCapMain', () => {
    return tokenEvent.setMain(
      1526342400,
      1526947200,
      web3.toBigNumber(1.1).times('1e18'),
      web3.toBigNumber(1).times('1e18'),
      30000, {
        from: accounts[0]
      }).catch((error) => {
      assert.strictEqual(txFailed(error), true, '_minCapMain <= _maxCapMain');
    }).then((result) => {
      assert.strictEqual(result, undefined, '_minCapMain <= _maxCapMain');
    });
  });
  it('tokenEvent should not allow setMain if not _startTimeMain > endTimePre', () => {
    return tokenEvent.setMain(
      1525737500,
      1526947200,
      web3.toBigNumber(0.1).times('1e18'),
      web3.toBigNumber(10).times('1e18'),
      30000, {
        from: accounts[0]
      }).catch((error) => {
      assert.strictEqual(txFailed(error), true, '_startTimeMain > endTimePre');
    }).then((result) => {
      assert.strictEqual(result, undefined, '_startTimeMain > endTimePre');
    });
  });
  it('tokenEvent should allow only owner to setMain', () => {
    return tokenEvent.setMain(
      1526342400,
      1526947200,
      web3.toBigNumber(0.1).times('1e18'),
      web3.toBigNumber(10).times('1e18'),
      30000, {
        from: accounts[0]
      }).then((result) => {
      assert.strictEqual(result.receipt.status, '0x01', 'setMain allowed');
      assert.strictEqual(result.logs.length, 1, 'SetMain log');
      assert.strictEqual(result.logs[0].address, tokenEvent.address, 'SetMain event');
      assert.strictEqual(result.logs[0].event, 'SetMain', 'SetMain event');
      assert.strictEqual(result.logs[0].args.startTimeMain.toString(), '1526342400', 'SetMain event');
      assert.strictEqual(result.logs[0].args.endTimeMain.toString(), '1526947200', 'SetMain event');
      assert.strictEqual(result.logs[0].args.minCapMain.toString(), web3.toBigNumber(0.1).times('1e18').toString(), 'SetMain event');
      assert.strictEqual(result.logs[0].args.maxCapMain.toString(), web3.toBigNumber(10).times('1e18').toString(), 'SetMain event');
      assert.strictEqual(result.logs[0].args.rateMain.toString(), '30000', 'SetMain event');
      return tokenEvent.startTimeMain.call();
    }).then((result) => {
      assert.strictEqual(result.toString(), '1526342400', 'startTimeMain');
      return tokenEvent.endTimeMain.call();
    }).then((result) => {
      assert.strictEqual(result.toString(), '1526947200', 'endTimeMain');
      return tokenEvent.minCapMain.call();
    }).then((result) => {
      assert.strictEqual(result.toString(), web3.toBigNumber(0.1).times('1e18').toString(), 'minCapMain');
      return tokenEvent.maxCapMain.call();
    }).then((result) => {
      assert.strictEqual(result.toString(), web3.toBigNumber(10).times('1e18').toString(), 'maxCapMain');
      return tokenEvent.rateMain.call();
    }).then((result) => {
      assert.strictEqual(result.toString(), '30000', 'rateMain');
    });
  });
  it('tokenEvent should not allow non owner to setWhitelistedAddressPre', () => {
    return tokenEvent.setWhitelistedAddressPre([accounts[2], dummyAccount], true, {
      from: accounts[1]
    }).catch((error) => {
      assert.strictEqual(txFailed(error), true, 'setWhitelistedAddressPre denied');
    }).then((result) => {
      assert.strictEqual(result, undefined, 'setWhitelistedAddressPre denied');
    });
  });
  it('tokenEvent should allow only owner to setWhitelistedAddressPre', () => {
    return tokenEvent.setWhitelistedAddressPre([accounts[2], dummyAccount], true, {
      from: accounts[0]
    }).then((result) => {
      assert.strictEqual(result.receipt.status, '0x01', 'setWhitelistedAddressPre allowed');
      assert.strictEqual(result.logs.length, 2, 'WhitelistPre log');
      assert.strictEqual(result.logs[0].address, tokenEvent.address, 'WhitelistPre event');
      assert.strictEqual(result.logs[0].event, 'WhitelistPre', 'WhitelistPre event');
      assert.strictEqual(result.logs[0].args.whitelistedAddress, accounts[2], 'WhitelistPre event');
      assert.strictEqual(result.logs[0].args.whitelistedStatus, true, 'WhitelistPre event');
      assert.strictEqual(result.logs[1].address, tokenEvent.address, 'WhitelistPre event');
      assert.strictEqual(result.logs[1].event, 'WhitelistPre', 'WhitelistPre event');
      assert.strictEqual(result.logs[1].args.whitelistedAddress, dummyAccount, 'WhitelistPre event');
      assert.strictEqual(result.logs[1].args.whitelistedStatus, true, 'WhitelistPre event');
      return tokenEvent.whitelistedAddressPre.call(accounts[2]);
    }).then((result) => {
      assert.strictEqual(result, true, 'whitelisted');
      return tokenEvent.whitelistedAddressPre.call(dummyAccount);
    }).then((result) => {
      assert.strictEqual(result, true, 'whitelisted');
      return tokenEvent.setWhitelistedAddressPre([accounts[2], dummyAccount], false, {
        from: accounts[0]
      });
    }).then((result) => {
      assert.strictEqual(result.logs.length, 2, 'WhitelistPre log');
      assert.strictEqual(result.logs[0].address, tokenEvent.address, 'WhitelistPre event');
      assert.strictEqual(result.logs[0].event, 'WhitelistPre', 'WhitelistPre event');
      assert.strictEqual(result.logs[0].args.whitelistedAddress, accounts[2], 'WhitelistPre event');
      assert.strictEqual(result.logs[0].args.whitelistedStatus, false, 'WhitelistPre event');
      assert.strictEqual(result.logs[1].address, tokenEvent.address, 'WhitelistPre event');
      assert.strictEqual(result.logs[1].event, 'WhitelistPre', 'WhitelistPre event');
      assert.strictEqual(result.logs[1].args.whitelistedAddress, dummyAccount, 'WhitelistPre event');
      assert.strictEqual(result.logs[1].args.whitelistedStatus, false, 'WhitelistPre event');
      return tokenEvent.whitelistedAddressPre.call(accounts[2]);
    }).then((result) => {
      assert.strictEqual(result, false, 'whitelisted');
      return tokenEvent.whitelistedAddressPre.call(dummyAccount);
    }).then((result) => {
      assert.strictEqual(result, false, 'whitelisted');
    });
  });
  it('tokenEvent should not allow non owner to setWhitelistedAddressMain', () => {
    return tokenEvent.setWhitelistedAddressMain([accounts[2], dummyAccount], true, {
      from: accounts[1]
    }).catch((error) => {
      assert.strictEqual(txFailed(error), true, 'setWhitelistedAddressMain denied');
    }).then((result) => {
      assert.strictEqual(result, undefined, 'setWhitelistedAddressMain denied');
    });
  });
  it('tokenEvent should allow only owner to setWhitelistedAddressMain', () => {
    return tokenEvent.setWhitelistedAddressMain([accounts[2], dummyAccount], true, {
      from: accounts[0]
    }).then((result) => {
      assert.strictEqual(result.receipt.status, '0x01', 'setWhitelistedAddressMain allowed');
      assert.strictEqual(result.logs.length, 2, 'WhitelistMain log');
      assert.strictEqual(result.logs[0].address, tokenEvent.address, 'WhitelistMain event');
      assert.strictEqual(result.logs[0].event, 'WhitelistMain', 'WhitelistMain event');
      assert.strictEqual(result.logs[0].args.whitelistedAddress, accounts[2], 'WhitelistMain event');
      assert.strictEqual(result.logs[0].args.whitelistedStatus, true, 'WhitelistMain event');
      assert.strictEqual(result.logs[1].address, tokenEvent.address, 'WhitelistMain event');
      assert.strictEqual(result.logs[1].event, 'WhitelistMain', 'WhitelistMain event');
      assert.strictEqual(result.logs[1].args.whitelistedAddress, dummyAccount, 'WhitelistMain event');
      assert.strictEqual(result.logs[1].args.whitelistedStatus, true, 'WhitelistMain event');
      return tokenEvent.whitelistedAddressMain.call(accounts[2]);
    }).then((result) => {
      assert.strictEqual(result, true, 'whitelisted');
      return tokenEvent.whitelistedAddressMain.call(dummyAccount);
    }).then((result) => {
      assert.strictEqual(result, true, 'whitelisted');
      return tokenEvent.setWhitelistedAddressMain([accounts[2], dummyAccount], false, {
        from: accounts[0]
      });
    }).then((result) => {
      assert.strictEqual(result.logs.length, 2, 'WhitelistMain log');
      assert.strictEqual(result.logs[0].address, tokenEvent.address, 'WhitelistMain event');
      assert.strictEqual(result.logs[0].event, 'WhitelistMain', 'WhitelistMain event');
      assert.strictEqual(result.logs[0].args.whitelistedAddress, accounts[2], 'WhitelistMain event');
      assert.strictEqual(result.logs[0].args.whitelistedStatus, false, 'WhitelistMain event');
      assert.strictEqual(result.logs[1].address, tokenEvent.address, 'WhitelistMain event');
      assert.strictEqual(result.logs[1].event, 'WhitelistMain', 'WhitelistMain event');
      assert.strictEqual(result.logs[1].args.whitelistedAddress, dummyAccount, 'WhitelistMain event');
      assert.strictEqual(result.logs[1].args.whitelistedStatus, false, 'WhitelistMain event');
      return tokenEvent.whitelistedAddressMain.call(accounts[2]);
    }).then((result) => {
      assert.strictEqual(result, false, 'whitelisted');
      return tokenEvent.whitelistedAddressMain.call(dummyAccount);
    }).then((result) => {
      assert.strictEqual(result, false, 'whitelisted');
    });
  });
  it('tokenEvent should not allow endEvent if not now > endTimeMain', () => {
    return tokenEvent.endEvent({
      from: accounts[0]
    }).catch((error) => {
      assert.strictEqual(txFailed(error), true, 'now > endTimeMain');
    }).then((result) => {
      assert.strictEqual(result, undefined, 'now > endTimeMain');
      return web3.currentProvider.send({
        jsonrpc: '2.0',
        method: 'evm_increaseTime',
        params: [10000000],
        id: 1
      });
    });
  });
  it('tokenEvent should not allow non owner to endEvent', () => {
    return tokenEvent.endEvent({
      from: accounts[1]
    }).catch((error) => {
      assert.strictEqual(txFailed(error), true, 'endEvent denied');
    }).then((result) => {
      assert.strictEqual(result, undefined, 'endEvent denied');
    });
  });
  it('tokenEvent should allow only owner to endEvent', () => {
    return tokenEvent.endEvent({
      from: accounts[0]
    }).then((result) => {
      assert.strictEqual(result.receipt.status, '0x01', 'endEvent allowed');
      return tokenEvent.eventEnded.call();
    }).then((result) => {
      assert.strictEqual(result, true, 'eventEnded');
    });
  });
  it('tokenEvent should not allow setPre after eventEnded', () => {
    return tokenEvent.setPre(
      1525132800 + 11000000,
      1525737600 + 11000000,
      web3.toBigNumber(10).times('1e18'),
      web3.toBigNumber(100).times('1e18'),
      30000, {
        from: accounts[0]
      }).catch((error) => {
      assert.strictEqual(txFailed(error), true, 'setPre denied');
    }).then((result) => {
      assert.strictEqual(result, undefined, 'setPre denied');
    });
  });
  it('tokenEvent should not allow setMain after eventEnded', () => {
    return tokenEvent.setMain(
      1526342400 + 11000000,
      1526947200 + 11000000,
      web3.toBigNumber(0.1).times('1e18'),
      web3.toBigNumber(10).times('1e18'),
      30000, {
        from: accounts[0]
      }).catch((error) => {
      assert.strictEqual(txFailed(error), true, 'setMain denied');
    }).then((result) => {
      assert.strictEqual(result, undefined, 'setMain denied');
    });
  });
  it('tokenEvent should not allow setWhitelistedAddressPre after eventEnded', () => {
    return tokenEvent.setWhitelistedAddressPre([accounts[2], dummyAccount], true, {
      from: accounts[0]
    }).catch((error) => {
      assert.strictEqual(txFailed(error), true, 'setWhitelistedAddressPre denied');
    }).then((result) => {
      assert.strictEqual(result, undefined, 'setWhitelistedAddressPre denied');
    });
  });
  it('tokenEvent should not allow setWhitelistedAddressMain after eventEnded', () => {
    return tokenEvent.setWhitelistedAddressMain([accounts[2], dummyAccount], true, {
      from: accounts[0]
    }).catch((error) => {
      assert.strictEqual(txFailed(error), true, 'setWhitelistedAddressMain denied');
    }).then((result) => {
      assert.strictEqual(result, undefined, 'setWhitelistedAddressMain denied');
    });
  });
  it('tokenEvent should not allow endEvent after eventEnded', () => {
    return tokenEvent.endEvent({
      from: accounts[0]
    }).catch((error) => {
      assert.strictEqual(txFailed(error), true, 'endEvent denied');
    }).then((result) => {
      assert.strictEqual(result, undefined, 'endEvent denied');
    });
  });
  it('tokenEvent should not allow non owner to transferOwnership', () => {
    return tokenEvent.transferOwnership(dummyAccount, {
      from: accounts[1]
    }).catch((error) => {
      assert.strictEqual(txFailed(error), true, 'transferOwnership denied');
    }).then((result) => {
      assert.strictEqual(result, undefined, 'transferOwnership denied');
    });
  });
  it('tokenEvent should allow only owner to transferOwnership', () => {
    return tokenEvent.transferOwnership(dummyAccount, {
      from: accounts[0]
    }).then((result) => {
      assert.strictEqual(result.receipt.status, '0x01', 'transferOwnership allowed');
      assert.strictEqual(result.logs.length, 1, 'OwnershipTransferred log');
      assert.strictEqual(result.logs[0].address, tokenEvent.address, 'OwnershipTransferred event');
      assert.strictEqual(result.logs[0].event, 'OwnershipTransferred', 'OwnershipTransferred event');
      assert.strictEqual(result.logs[0].args.previousOwner, accounts[0], 'OwnershipTransferred event');
      assert.strictEqual(result.logs[0].args.newOwner, dummyAccount, 'OwnershipTransferred event');
      return tokenEvent.owner.call();
    }).then((result) => {
      assert.strictEqual(result, dummyAccount, 'transferOwnership success');
    });
  });
});

function txFailed(error) {
  if ('receipt' in error && 'status' in error.receipt && error.receipt.status === '0x00') {
    return true;
  } else if ('message' in error && error.message.includes('VM Exception while processing transaction')) {
    return true;
  }
  return false;
}
