import {expect} from 'chai';
import {ContractFactory} from 'ethers';
import {MockProvider} from '../src/MockProvider';
import {deployToken} from './BasicToken';
import {CALLER_ABI, CALLER_BYTECODE, CALLED_ABI, CALLED_BYTECODE} from './Caller';

describe('INTEGRATION: MockProvider.getCallHistory()', () => {
  it('records blockchain calls', async () => {
    const provider = new MockProvider();
    const [sender, recipient] = provider.getWallets();

    const contract = await deployToken(sender, 10_000);

    await contract.transfer(recipient.address, 3_141);
    await contract.balanceOf(recipient.address);

    const history = provider.getCallHistory();

    expect(history).to.deep.include.members([
      {
        address: undefined,
        data: contract.deployTransaction.data
      },
      {
        address: contract.address,
        data: contract.interface.functions.transfer.encode([recipient.address, 3_141])
      },
      {
        address: contract.address,
        data: contract.interface.functions.balanceOf.encode([recipient.address])
      }
    ]);
  });

  it('can be cleared', async () => {
    const provider = new MockProvider();
    const [sender, recipient] = provider.getWallets();

    const contract = await deployToken(sender, 10_000);
    await contract.transfer(recipient.address, 3_141);

    provider.clearCallHistory();

    await contract.balanceOf(recipient.address);

    const history = provider.getCallHistory();

    expect(history).to.not.deep.include({
      address: undefined,
      data: contract.deployTransaction.data
    });
    expect(history).to.not.deep.include({
      address: contract.address,
      data: contract.interface.functions.transfer.encode([recipient.address, 3_141])
    });
    expect(history).to.deep.include({
      address: contract.address,
      data: contract.interface.functions.balanceOf.encode([recipient.address])
    });
  });

  it('records indirect calls', async () => {
    const provider = new MockProvider();
    const [wallet] = provider.getWallets();

    const callerFactory = new ContractFactory(CALLER_ABI, CALLER_BYTECODE, wallet);
    const caller = await callerFactory.deploy();

    const calledFactory = new ContractFactory(CALLED_ABI, CALLED_BYTECODE, wallet);
    const called = await calledFactory.deploy();

    await caller.callOther(called.address);

    expect(provider.getCallHistory()).to.deep.include({
      address: called.address,
      data: called.interface.functions.foo.encode([1, 2])
    });
  });

  it('records failing calls', async () => {
    const provider = new MockProvider();
    const [wallet] = provider.getWallets();

    const token = await deployToken(wallet, 10);

    provider.clearCallHistory();
    try {
      await token.transfer(wallet.address, 20);
    } catch {}

    expect(provider.getCallHistory()).to.deep.include({
      address: token.address,
      data: token.interface.functions.transfer.encode([wallet.address, 20])
    });
  });
});
