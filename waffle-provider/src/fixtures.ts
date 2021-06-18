import {providers, Wallet} from 'ethers';
import {MockProvider} from './MockProvider';

export type Fixture<T> = (wallets: Wallet[], provider: MockProvider) => Promise<T>;
interface Snapshot<T> {
  fixture: Fixture<T>;
  data: T;
  id: string;
  provider: providers.Web3Provider;
  wallets: Wallet[];
}

export const loadFixture = createFixtureLoader();

export function createFixtureLoader(overrideWallets?: Wallet[], overrideProvider?: MockProvider) {
  const snapshots: Snapshot<any>[] = [];

  return async function load<T>(fixture: Fixture<T>): Promise<T> {
    const snapshot = snapshots.find((snapshot) => snapshot.fixture === fixture);
    if (snapshot) {
      // revert blockchain state
      await snapshot.provider.send('evm_revert', [snapshot.id]);

      // revert provider internal state (NOTE!!! This is fragile)
      // see: https://github.com/ethers-io/ethers.js/issues/1383 in order to replace with a better solution
      snapshot.provider._maxInternalBlockNumber = 0;

      snapshot.id = await snapshot.provider.send('evm_snapshot', []);
      return snapshot.data;
    } else {
      const provider = overrideProvider ?? new MockProvider();
      const wallets = overrideWallets ?? provider.getWallets();

      const data = await fixture(wallets, provider);
      const id = await provider.send('evm_snapshot', []);

      snapshots.push({fixture, data, id, provider, wallets});
      return data;
    }
  };
}
