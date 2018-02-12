let LendingBlockTokenEvent = artifacts.require('LendingBlockTokenEvent.sol');
let LendingBlockToken = artifacts.require('LendingBlockToken.sol');

let tokenEvent;
let token;
let dummyAccount = '0x1234567890123456789012345678901234567890';
let dummyAccount2 = '0x1234567890123456789012345678901234567891';
let initialWalletEth;

//account[0] is owner
//account[1] is wallet to collect funds
//account[2] to account[5] are pre round
//account[6] to account[9] are main round

contract('LendingBlockTokenEvent with token burn', (accounts) => {
  it('should complete a full token event with token burn', () => {
    return LendingBlockTokenEvent.deployed().then((instance) => {
      tokenEvent = instance;
      return tokenEvent.token.call();
    }).then((result) => {
      token = LendingBlockToken.at(result);
      return web3.eth.getBalance(accounts[1]);
    }).then((result) => {
      initialWalletEth = result.dividedBy('1e18').toString();
      return tokenEvent.sendTransaction({
        from: accounts[2],
        value: web3.toBigNumber(1).times('1e18')
      });
    }).then((result) => {
      assert.strictEqual(result.receipt.status, '0x00', 'fallback denied');
      return tokenEvent.joinPre(accounts[2], {
        from: accounts[2],
        value: web3.toBigNumber(1).times('1e18')
      });
    }).then((result) => {
      assert.strictEqual(result.receipt.status, '0x00', 'joinPre denied');
      return tokenEvent.joinMain(accounts[6], {
        from: accounts[6],
        value: web3.toBigNumber(1).times('1e18')
      });
    }).then((result) => {
      assert.strictEqual(result.receipt.status, '0x00', 'joinMain denied');
      return tokenEvent.setWhitelistedAddressPre([accounts[2], accounts[3]], true, {
        from: accounts[0]
      });
    }).then((result) => {
      assert.strictEqual(result.receipt.status, '0x01', 'setWhitelistedAddressPre allowed');
      return tokenEvent.setPre(
        1520262000,
        1520434800,
        web3.toBigNumber(1).times('1e18'),
        web3.toBigNumber(50).times('1e18'),
        30000, {
          from: accounts[0]
        });
    }).then((result) => {
      assert.strictEqual(result.receipt.status, '0x01', 'setPre allowed');
      return tokenEvent.startTimePre.call();
    }).then((result) => {
      assert.strictEqual(result.toString(), '1520262000', 'startTimePre');
      return tokenEvent.endTimePre.call();
    }).then((result) => {
      assert.strictEqual(result.toString(), '1520434800', 'endTimePre');
      return tokenEvent.minCapPre.call();
    }).then((result) => {
      assert.strictEqual(result.toString(), web3.toBigNumber(1).times('1e18').toString(), 'minCapPre');
      return tokenEvent.maxCapPre.call();
    }).then((result) => {
      assert.strictEqual(result.toString(), web3.toBigNumber(50).times('1e18').toString(), 'maxCapPre');
      return tokenEvent.ratePre.call();
    }).then((result) => {
      assert.strictEqual(result.toString(), '30000', 'ratePre');
      return token.transfer(tokenEvent.address, web3.toBigNumber('2100000').times('1e18'), {
        from: accounts[0]
      })
    }).then((result) => {
      assert.strictEqual(result.receipt.status, '0x01', 'transfer allowed');
      return token.balanceOf.call(tokenEvent.address);
    }).then((result) => {
      assert.strictEqual(result.toString(), web3.toBigNumber('2100000').times('1e18').toString(), 'transfer success');
      return tokenEvent.sendTransaction({
        from: accounts[2],
        value: web3.toBigNumber(1).times('1e18')
      });
    }).then((result) => {
      assert.strictEqual(result.receipt.status, '0x00', 'fallback denied');
      return tokenEvent.joinPre(accounts[2], {
        from: accounts[2],
        value: web3.toBigNumber(1).times('1e18')
      });
    }).then((result) => {
      assert.strictEqual(result.receipt.status, '0x00', 'now >= startTimePre');
      return tokenEvent.joinMain(accounts[6], {
        from: accounts[6],
        value: web3.toBigNumber(1).times('1e18')
      });
    }).then((result) => {
      assert.strictEqual(result.receipt.status, '0x00', 'joinMain denied');
      return web3.currentProvider.send({
        jsonrpc: '2.0',
        method: 'evm_increaseTime',
        params: [parseInt(100 + 1520262000 - web3.eth.getBlock('latest').timestamp)],
        id: 1
      });
    }).then((result) => {
      return tokenEvent.joinPre(accounts[2], {
        from: accounts[2],
        value: web3.toBigNumber(0.5).times('1e18')
      });
    }).then((result) => {
      assert.strictEqual(result.receipt.status, '0x00', 'msg.value >= minCapPre');
      return tokenEvent.joinPre(accounts[2], {
        from: accounts[4],
        value: web3.toBigNumber(1).times('1e18')
      });
    }).then((result) => {
      assert.strictEqual(result.receipt.status, '0x00', 'whitelistedAddressPre[msg.sender] == true');
      return tokenEvent.joinPre(accounts[2], {
        from: accounts[2],
        value: web3.toBigNumber(50.01).times('1e18')
      });
    }).then((result) => {
      assert.strictEqual(result.receipt.status, '0x00', 'contributedValue[msg.sender] <= maxCapPre');
      return tokenEvent.joinPre(accounts[2], {
        from: accounts[2],
        value: web3.toBigNumber(1).times('1e18')
      });
    }).then((result) => {
      assert.strictEqual(result.receipt.status, '0x01', 'joinPre allowed');
      assert.strictEqual(result.logs.length, 1, 'TokenPre log');
      assert.strictEqual(result.logs[0].address, tokenEvent.address, 'TokenPre event');
      assert.strictEqual(result.logs[0].event, 'TokenPre', 'TokenPre event');
      assert.strictEqual(result.logs[0].args.participant, accounts[2], 'TokenPre event');
      assert.strictEqual(result.logs[0].args.beneficiary, accounts[2], 'TokenPre event');
      assert.strictEqual(result.logs[0].args.value.toString(), web3.toBigNumber(1).times('1e18').toString(), 'TokenPre event');
      assert.strictEqual(result.logs[0].args.tokens.toString(), web3.toBigNumber(30000).times('1e18').toString(), 'TokenPre event');
      return tokenEvent.joinPre(accounts[2], {
        from: accounts[2],
        value: web3.toBigNumber(49.5).times('1e18')
      });
    }).then((result) => {
      assert.strictEqual(result.receipt.status, '0x00', 'contributedValue[msg.sender] <= maxCapPre');
      return tokenEvent.sendTransaction({
        from: accounts[2],
        value: web3.toBigNumber(48).times('1e18')
      });
    }).then((result) => {
      assert.strictEqual(result.receipt.status, '0x01', 'fallback allowed');
      assert.strictEqual(result.logs.length, 1, 'TokenPre log');
      assert.strictEqual(result.logs[0].address, tokenEvent.address, 'TokenPre event');
      assert.strictEqual(result.logs[0].event, 'TokenPre', 'TokenPre event');
      assert.strictEqual(result.logs[0].args.participant, accounts[2], 'TokenPre event');
      assert.strictEqual(result.logs[0].args.beneficiary, accounts[2], 'TokenPre event');
      assert.strictEqual(result.logs[0].args.value.toString(), web3.toBigNumber(48).times('1e18').toString(), 'TokenPre event');
      assert.strictEqual(result.logs[0].args.tokens.toString(), web3.toBigNumber(48).times(30000).times('1e18').toString(), 'TokenPre event');
      return tokenEvent.joinPre(dummyAccount, {
        from: accounts[2],
        value: web3.toBigNumber(1).times('1e18')
      });
    }).then((result) => {
      assert.strictEqual(result.receipt.status, '0x01', 'joinPre allowed');
      assert.strictEqual(result.logs.length, 1, 'TokenPre log');
      assert.strictEqual(result.logs[0].address, tokenEvent.address, 'TokenPre event');
      assert.strictEqual(result.logs[0].event, 'TokenPre', 'TokenPre event');
      assert.strictEqual(result.logs[0].args.participant, accounts[2], 'TokenPre event');
      assert.strictEqual(result.logs[0].args.beneficiary, dummyAccount, 'TokenPre event');
      assert.strictEqual(result.logs[0].args.value.toString(), web3.toBigNumber(1).times('1e18').toString(), 'TokenPre event');
      assert.strictEqual(result.logs[0].args.tokens.toString(), web3.toBigNumber(30000).times('1e18').toString(), 'TokenPre event');
      return token.balanceOf.call(accounts[2]);
    }).then((result) => {
      assert.strictEqual(result.toString(), web3.toBigNumber(49).times(30000).times('1e18').toString(), 'joinPre success');
      return token.balanceOf.call(dummyAccount);
    }).then((result) => {
      assert.strictEqual(result.toString(), web3.toBigNumber(1).times(30000).times('1e18').toString(), 'joinPre success');
      return tokenEvent.sendTransaction({
        from: accounts[3],
        value: web3.toBigNumber(20).times('1e18')
      });
    }).then((result) => {
      assert.strictEqual(result.receipt.status, '0x01', 'joinPre with fallback allowed');
      return token.balanceOf.call(accounts[3]);
    }).then((result) => {
      assert.strictEqual(result.toString(), web3.toBigNumber(20).times(30000).times('1e18').toString(), 'joinPre success');
      return tokenEvent.sendTransaction({
        from: accounts[3],
        value: web3.toBigNumber(2).times('1e18')
      });
    }).then((result) => {
      assert.strictEqual(result.receipt.status, '0x00', 'joinPre out of tokens');
      return token.balanceOf.call(tokenEvent.address);
    }).then((result) => {
      assert.strictEqual(result.toString(), '0', 'joinPre out of tokens');
      return tokenEvent.setPre(
        1520521200,
        1520607600,
        web3.toBigNumber(1).times('1e18'),
        web3.toBigNumber(50).times('1e18'),
        25000, {
          from: accounts[0]
        });
    }).then((result) => {
      assert.strictEqual(result.receipt.status, '0x01', 'setPre round 2 allowed');
      return token.transfer(tokenEvent.address, web3.toBigNumber('60000').times('1e18'), {
        from: accounts[0]
      })
    }).then((result) => {
      assert.strictEqual(result.receipt.status, '0x01', 'transfer allowed');
      return tokenEvent.setWhitelistedAddressPre([accounts[4], accounts[5]], true, {
        from: accounts[0]
      });
    }).then((result) => {
      assert.strictEqual(result.receipt.status, '0x01', 'setWhitelistedAddressPre allowed');
      return web3.currentProvider.send({
        jsonrpc: '2.0',
        method: 'evm_increaseTime',
        params: [parseInt(100 + 1520521200 - web3.eth.getBlock('latest').timestamp)],
        id: 1
      });
    }).then((result) => {
      return tokenEvent.sendTransaction({
        from: accounts[2],
        value: web3.toBigNumber(1).times('1e18')
      });
    }).then((result) => {
      assert.strictEqual(result.receipt.status, '0x00', 'contributedValue[msg.sender] <= maxCapPre from round 1');
      return tokenEvent.sendTransaction({
        from: accounts[4],
        value: web3.toBigNumber(2).times('1e18')
      });
    }).then((result) => {
      assert.strictEqual(result.receipt.status, '0x01', 'joinPre with fallback round 2 allowed');
      assert.strictEqual(result.logs.length, 1, 'TokenPre log');
      assert.strictEqual(result.logs[0].address, tokenEvent.address, 'TokenPre event');
      assert.strictEqual(result.logs[0].event, 'TokenPre', 'TokenPre event');
      assert.strictEqual(result.logs[0].args.participant, accounts[4], 'TokenPre event');
      assert.strictEqual(result.logs[0].args.beneficiary, accounts[4], 'TokenPre event');
      assert.strictEqual(result.logs[0].args.value.toString(), web3.toBigNumber(2).times('1e18').toString(), 'TokenPre event');
      assert.strictEqual(result.logs[0].args.tokens.toString(), web3.toBigNumber(2).times(25000).times('1e18').toString(), 'TokenPre event');
      return token.balanceOf.call(accounts[4]);
    }).then((result) => {
      assert.strictEqual(result.toString(), web3.toBigNumber(2).times(25000).times('1e18').toString(), 'joinPre round 2 success');
      return web3.eth.getBalance(accounts[1]);
    }).then((result) => {
      assert.strictEqual(result.toString(), web3.toBigNumber(initialWalletEth).plus(72).times('1e18').toString(), 'wallet funds');
      initialWalletEth = result.dividedBy('1e18').toString();
      return tokenEvent.weiTotal.call();
    }).then((result) => {
      assert.strictEqual(result.toString(), web3.toBigNumber(72).times('1e18').toString(), 'wallet funds');
      return tokenEvent.setWhitelistedAddressMain([accounts[6], accounts[7], accounts[8], accounts[9]], true, {
        from: accounts[0]
      });
    }).then((result) => {
      assert.strictEqual(result.receipt.status, '0x01', 'setWhitelistedAddressMain allowed');
      return token.transfer(tokenEvent.address, web3.toBigNumber('1000000').times('1e18'), {
        from: accounts[0]
      })
    }).then((result) => {
      assert.strictEqual(result.receipt.status, '0x01', 'transfer allowed');
      return tokenEvent.setMain(
        1521817200,
        1521900000,
        web3.toBigNumber(0.1).times('1e18'),
        web3.toBigNumber(5).times('1e18'),
        20000, {
          from: accounts[0]
        });
    }).then((result) => {
      assert.strictEqual(result.receipt.status, '0x01', 'setMain allowed');
      return tokenEvent.joinMain(accounts[6], {
        from: accounts[6],
        value: web3.toBigNumber(1).times('1e18')
      });
    }).then((result) => {
      assert.strictEqual(result.receipt.status, '0x00', 'joinMain denied');
      return web3.currentProvider.send({
        jsonrpc: '2.0',
        method: 'evm_increaseTime',
        params: [parseInt(100 + 1521817200 - web3.eth.getBlock('latest').timestamp)],
        id: 1
      });
    }).then((result) => {
      return tokenEvent.joinMain(accounts[6], {
        from: accounts[6],
        value: web3.toBigNumber(0.05).times('1e18')
      });
    }).then((result) => {
      assert.strictEqual(result.receipt.status, '0x00', 'msg.value >= minCapMain');
      return tokenEvent.joinMain(accounts[6], {
        from: accounts[4],
        value: web3.toBigNumber(0.3).times('1e18')
      });
    }).then((result) => {
      assert.strictEqual(result.receipt.status, '0x00', 'whitelistedAddressMain[msg.sender] == true');
      return tokenEvent.joinMain(accounts[6], {
        from: accounts[6],
        value: web3.toBigNumber(5.01).times('1e18')
      });
    }).then((result) => {
      assert.strictEqual(result.receipt.status, '0x00', 'contributedValue[msg.sender] <= maxCapMain');
      return tokenEvent.joinMain(accounts[6], {
        from: accounts[6],
        value: web3.toBigNumber(0.3).times('1e18')
      });
    }).then((result) => {
      assert.strictEqual(result.receipt.status, '0x01', 'joinMain allowed');
      assert.strictEqual(result.logs.length, 1, 'TokenMain log');
      assert.strictEqual(result.logs[0].address, tokenEvent.address, 'TokenMain event');
      assert.strictEqual(result.logs[0].event, 'TokenMain', 'TokenMain event');
      assert.strictEqual(result.logs[0].args.participant, accounts[6], 'TokenMain event');
      assert.strictEqual(result.logs[0].args.beneficiary, accounts[6], 'TokenMain event');
      assert.strictEqual(result.logs[0].args.value.toString(), web3.toBigNumber(0.3).times('1e18').toString(), 'TokenMain event');
      assert.strictEqual(result.logs[0].args.tokens.toString(), web3.toBigNumber(0.3).times(20000).times('1e18').toString(), 'TokenMain event');
      return tokenEvent.joinMain(accounts[6], {
        from: accounts[6],
        value: web3.toBigNumber(4.71).times('1e18')
      });
    }).then((result) => {
      assert.strictEqual(result.receipt.status, '0x00', 'contributedValue[msg.sender] <= maxCapMain');
      return tokenEvent.sendTransaction({
        from: accounts[6],
        value: web3.toBigNumber(0.7).times('1e18')
      });
    }).then((result) => {
      assert.strictEqual(result.receipt.status, '0x01', 'fallback allowed');
      assert.strictEqual(result.logs.length, 1, 'TokenMain log');
      assert.strictEqual(result.logs[0].address, tokenEvent.address, 'TokenMain event');
      assert.strictEqual(result.logs[0].event, 'TokenMain', 'TokenMain event');
      assert.strictEqual(result.logs[0].args.participant, accounts[6], 'TokenMain event');
      assert.strictEqual(result.logs[0].args.beneficiary, accounts[6], 'TokenMain event');
      assert.strictEqual(result.logs[0].args.value.toString(), web3.toBigNumber(0.7).times('1e18').toString(), 'TokenMain event');
      assert.strictEqual(result.logs[0].args.tokens.toString(), web3.toBigNumber(0.7).times(20000).times('1e18').toString(), 'TokenMain event');
      return tokenEvent.joinMain(dummyAccount2, {
        from: accounts[7],
        value: web3.toBigNumber(5).times('1e18')
      });
    }).then((result) => {
      assert.strictEqual(result.receipt.status, '0x01', 'joinMain allowed');
      assert.strictEqual(result.logs.length, 1, 'TokenMain log');
      assert.strictEqual(result.logs[0].address, tokenEvent.address, 'TokenMain event');
      assert.strictEqual(result.logs[0].event, 'TokenMain', 'TokenMain event');
      assert.strictEqual(result.logs[0].args.participant, accounts[7], 'TokenMain event');
      assert.strictEqual(result.logs[0].args.beneficiary, dummyAccount2, 'TokenMain event');
      assert.strictEqual(result.logs[0].args.value.toString(), web3.toBigNumber(5).times('1e18').toString(), 'TokenMain event');
      assert.strictEqual(result.logs[0].args.tokens.toString(), web3.toBigNumber(5).times(20000).times('1e18').toString(), 'TokenMain event');
      return token.balanceOf.call(accounts[6]);
    }).then((result) => {
      assert.strictEqual(result.toString(), web3.toBigNumber(1).times(20000).times('1e18').toString(), 'joinMain success');
      return token.balanceOf.call(dummyAccount2);
    }).then((result) => {
      assert.strictEqual(result.toString(), web3.toBigNumber(5).times(20000).times('1e18').toString(), 'joinMain success');
      return tokenEvent.sendTransaction({
        from: accounts[8],
        value: web3.toBigNumber(3).times('1e18')
      });
    }).then((result) => {
      assert.strictEqual(result.receipt.status, '0x01', 'joinMain with fallback allowed');
      return token.balanceOf.call(accounts[8]);
    }).then((result) => {
      assert.strictEqual(result.toString(), web3.toBigNumber(3).times(20000).times('1e18').toString(), 'joinMain success');
      return tokenEvent.setMain(
        1521903600,
        1521990000,
        web3.toBigNumber(0.1).times('1e18'),
        web3.toBigNumber(20).times('1e18'),
        20000, {
          from: accounts[0]
        });
    }).then((result) => {
      assert.strictEqual(result.receipt.status, '0x01', 'setMain round 2 allowed');
      return web3.currentProvider.send({
        jsonrpc: '2.0',
        method: 'evm_increaseTime',
        params: [parseInt(100 + 1521903600 - web3.eth.getBlock('latest').timestamp)],
        id: 1
      });
    }).then((result) => {
      return tokenEvent.sendTransaction({
        from: accounts[6],
        value: web3.toBigNumber(20).times('1e18')
      });
    }).then((result) => {
      assert.strictEqual(result.receipt.status, '0x00', 'contributedValue[msg.sender] <= maxCapMain');
      return tokenEvent.sendTransaction({
        from: accounts[6],
        value: web3.toBigNumber(19).times('1e18')
      });
    }).then((result) => {
      assert.strictEqual(result.receipt.status, '0x01', 'joinMain with fallback round 2 allowed');
      assert.strictEqual(result.logs.length, 1, 'TokenMain log');
      assert.strictEqual(result.logs[0].address, tokenEvent.address, 'TokenMain event');
      assert.strictEqual(result.logs[0].event, 'TokenMain', 'TokenMain event');
      assert.strictEqual(result.logs[0].args.participant, accounts[6], 'TokenMain event');
      assert.strictEqual(result.logs[0].args.beneficiary, accounts[6], 'TokenMain event');
      assert.strictEqual(result.logs[0].args.value.toString(), web3.toBigNumber(19).times('1e18').toString(), 'TokenMain event');
      assert.strictEqual(result.logs[0].args.tokens.toString(), web3.toBigNumber(19).times(20000).times('1e18').toString(), 'TokenMain event');
      return tokenEvent.sendTransaction({
        from: accounts[7],
        value: web3.toBigNumber(15).times('1e18')
      });
    }).then((result) => {
      assert.strictEqual(result.receipt.status, '0x01', 'joinMain with fallback round 2 allowed');
      return tokenEvent.sendTransaction({
        from: accounts[8],
        value: web3.toBigNumber(2).times('1e18')
      });
    }).then((result) => {
      assert.strictEqual(result.receipt.status, '0x01', 'joinMain with fallback round 2 allowed');
      return token.balanceOf.call(accounts[6]);
    }).then((result) => {
      assert.strictEqual(result.toString(), web3.toBigNumber(20).times(20000).times('1e18').toString(), 'joinMain round 2 success');
      return token.balanceOf.call(accounts[7]);
    }).then((result) => {
      assert.strictEqual(result.toString(), web3.toBigNumber(15).times(20000).times('1e18').toString(), 'joinMain round 2 success');
      return token.balanceOf.call(accounts[8]);
    }).then((result) => {
      assert.strictEqual(result.toString(), web3.toBigNumber(5).times(20000).times('1e18').toString(), 'joinMain round 2 success');
      return token.balanceOf.call(tokenEvent.address);
    }).then((result) => {
      assert.strictEqual(result.toString(), web3.toBigNumber(110000).times('1e18').toString(), 'joinMain round 2 leftover');
      return web3.eth.getBalance(accounts[1]);
    }).then((result) => {
      assert.strictEqual(result.toString(), web3.toBigNumber(initialWalletEth).plus(45).times('1e18').toString(), 'wallet funds');
      initialWalletEth = result.dividedBy('1e18').toString();
      return tokenEvent.endEvent({
        from: accounts[0]
      });
    }).then((result) => {
      assert.strictEqual(result.receipt.status, '0x00', 'now > endTimeMain');
      return web3.currentProvider.send({
        jsonrpc: '2.0',
        method: 'evm_increaseTime',
        params: [parseInt(100 + 1521990000 - web3.eth.getBlock('latest').timestamp)],
        id: 1
      });
    }).then((result) => {
      return tokenEvent.endEvent({
        from: accounts[0]
      });
    }).then((result) => {
      assert.strictEqual(result.receipt.status, '0x01', 'endEvent allowed');
      return token.balanceOf.call(tokenEvent.address);
    }).then((result) => {
      assert.strictEqual(result.toString(), '0', 'leftover burn');
      return token.totalSupply.call();
    }).then((result) => {
      assert.strictEqual(result.toString(), web3.toBigNumber('1e9').minus(110000).times('1e18').toString(), 'leftover burn success');
      return tokenEvent.eventEnded.call();
    }).then((result) => {
      assert.strictEqual(result, true, 'eventEnded');
    });
  });
});

contract('LendingBlockTokenEvent with no token burn', (accounts) => {
  it('should complete a full token event with no token burn', () => {
    return LendingBlockTokenEvent.deployed().then((instance) => {
      tokenEvent = instance;
      return tokenEvent.token.call();
    }).then((result) => {
      token = LendingBlockToken.at(result);
      return web3.eth.getBalance(accounts[1]);
    }).then((result) => {
      initialWalletEth = result.dividedBy('1e18').toString();
      return tokenEvent.setWhitelistedAddressPre([accounts[2], accounts[3]], true, {
        from: accounts[0]
      });
    }).then((result) => {
      assert.strictEqual(result.receipt.status, '0x01', 'setWhitelistedAddressPre allowed');
      return tokenEvent.setPre(
        1552143600,
        1552230000,
        web3.toBigNumber(1).times('1e18'),
        web3.toBigNumber(50).times('1e18'),
        30000, {
          from: accounts[0]
        });
    }).then((result) => {
      assert.strictEqual(result.receipt.status, '0x01', 'setPre allowed');
      return token.transfer(tokenEvent.address, web3.toBigNumber('1500000').times('1e18'), {
        from: accounts[0]
      })
    }).then((result) => {
      assert.strictEqual(result.receipt.status, '0x01', 'transfer allowed');
      return token.balanceOf.call(tokenEvent.address);
    }).then((result) => {
      assert.strictEqual(result.toString(), web3.toBigNumber('1500000').times('1e18').toString(), 'transfer success');
      return web3.currentProvider.send({
        jsonrpc: '2.0',
        method: 'evm_increaseTime',
        params: [parseInt(100 + 1552143600 - web3.eth.getBlock('latest').timestamp)],
        id: 1
      });
    }).then((result) => {
      return tokenEvent.sendTransaction({
        from: accounts[2],
        value: web3.toBigNumber(50).times('1e18')
      });
    }).then((result) => {
      assert.strictEqual(result.receipt.status, '0x01', 'fallback allowed');
      assert.strictEqual(result.logs.length, 1, 'TokenPre log');
      assert.strictEqual(result.logs[0].address, tokenEvent.address, 'TokenPre event');
      assert.strictEqual(result.logs[0].event, 'TokenPre', 'TokenPre event');
      assert.strictEqual(result.logs[0].args.participant, accounts[2], 'TokenPre event');
      assert.strictEqual(result.logs[0].args.beneficiary, accounts[2], 'TokenPre event');
      assert.strictEqual(result.logs[0].args.value.toString(), web3.toBigNumber(50).times('1e18').toString(), 'TokenPre event');
      assert.strictEqual(result.logs[0].args.tokens.toString(), web3.toBigNumber(50).times(30000).times('1e18').toString(), 'TokenPre event');
      return tokenEvent.setWhitelistedAddressMain([accounts[6], accounts[7], accounts[8], accounts[9]], true, {
        from: accounts[0]
      });
    }).then((result) => {
      assert.strictEqual(result.receipt.status, '0x01', 'setWhitelistedAddressMain allowed');
      return token.transfer(tokenEvent.address, web3.toBigNumber('20000').times('1e18'), {
        from: accounts[0]
      })
    }).then((result) => {
      assert.strictEqual(result.receipt.status, '0x01', 'transfer allowed');
      return tokenEvent.setMain(
        1552402800,
        1552489200,
        web3.toBigNumber(0.1).times('1e18'),
        web3.toBigNumber(5).times('1e18'),
        20000, {
          from: accounts[0]
        });
    }).then((result) => {
      assert.strictEqual(result.receipt.status, '0x01', 'setMain allowed');
      return web3.currentProvider.send({
        jsonrpc: '2.0',
        method: 'evm_increaseTime',
        params: [parseInt(100 + 1552402800 - web3.eth.getBlock('latest').timestamp)],
        id: 1
      });
    }).then((result) => {
      return tokenEvent.sendTransaction({
        from: accounts[6],
        value: web3.toBigNumber(1).times('1e18')
      });
    }).then((result) => {
      assert.strictEqual(result.receipt.status, '0x01', 'fallback allowed');
      assert.strictEqual(result.logs.length, 1, 'TokenMain log');
      assert.strictEqual(result.logs[0].address, tokenEvent.address, 'TokenMain event');
      assert.strictEqual(result.logs[0].event, 'TokenMain', 'TokenMain event');
      assert.strictEqual(result.logs[0].args.participant, accounts[6], 'TokenMain event');
      assert.strictEqual(result.logs[0].args.beneficiary, accounts[6], 'TokenMain event');
      assert.strictEqual(result.logs[0].args.value.toString(), web3.toBigNumber(1).times('1e18').toString(), 'TokenMain event');
      assert.strictEqual(result.logs[0].args.tokens.toString(), web3.toBigNumber(1).times(20000).times('1e18').toString(), 'TokenMain event');
      return web3.currentProvider.send({
        jsonrpc: '2.0',
        method: 'evm_increaseTime',
        params: [parseInt(100 + 1552489200 - web3.eth.getBlock('latest').timestamp)],
        id: 1
      });
    }).then((result) => {
      return token.balanceOf.call(tokenEvent.address);
    }).then((result) => {
      assert.strictEqual(result.toString(), '0', 'no leftover burn');
      return tokenEvent.endEvent({
        from: accounts[0]
      });
    }).then((result) => {
      assert.strictEqual(result.receipt.status, '0x01', 'endEvent allowed');
      return token.totalSupply.call();
    }).then((result) => {
      assert.strictEqual(result.toString(), web3.toBigNumber('1e9').times('1e18').toString(), 'leftover burn success');
      return tokenEvent.eventEnded.call();
    }).then((result) => {
      assert.strictEqual(result, true, 'eventEnded');
      return web3.eth.getBalance(accounts[1]);
    }).then((result) => {
      assert.strictEqual(result.toString(), web3.toBigNumber(initialWalletEth).plus(51).times('1e18').toString(), 'wallet funds');
      initialWalletEth = result.dividedBy('1e18').toString();
      return tokenEvent.weiTotal.call();
    }).then((result) => {
      assert.strictEqual(result.toString(), web3.toBigNumber(51).times('1e18').toString(), 'wallet funds');
    });
  });
});
