import NetInfo, {type NetInfoState} from '@react-native-community/netinfo';

import type {Connectivity, ConnectivityState} from '../../connectivity';

const toState = (info: NetInfoState): ConnectivityState => ({
  online: info.isConnected !== false && info.isInternetReachable !== false,
  metered:
    info.type === 'cellular' ||
    Boolean(
      (info.details as {isConnectionExpensive?: boolean} | null)
        ?.isConnectionExpensive,
    ),
});

// Connectivity from NetInfo. Until NetInfo reports, oto assumes it is online.
export class NetInfoConnectivity implements Connectivity {
  private state: ConnectivityState = {online: true, metered: false};
  private readonly listeners = new Set<(state: ConnectivityState) => void>();
  private readonly stop: () => void;

  constructor() {
    this.stop = NetInfo.addEventListener(info => this.update(toState(info)));
  }

  current(): ConnectivityState {
    return this.state;
  }

  subscribe(listener: (state: ConnectivityState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async refresh(): Promise<void> {
    this.update(toState(await NetInfo.refresh()));
  }

  dispose(): void {
    this.stop();
    this.listeners.clear();
  }

  private update(next: ConnectivityState): void {
    if (
      next.online === this.state.online &&
      next.metered === this.state.metered
    ) {
      return;
    }
    this.state = next;
    for (const listener of this.listeners) {
      listener(next);
    }
  }
}
