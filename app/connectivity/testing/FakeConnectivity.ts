import type {Connectivity, ConnectivityState} from '../Connectivity';

export class FakeConnectivity implements Connectivity {
  private state: ConnectivityState;
  private readonly listeners = new Set<(state: ConnectivityState) => void>();

  constructor(initial: Partial<ConnectivityState> = {}) {
    this.state = {online: true, metered: false, ...initial};
  }

  current(): ConnectivityState {
    return this.state;
  }

  subscribe(listener: (state: ConnectivityState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async refresh(): Promise<void> {}

  set(next: Partial<ConnectivityState>): void {
    this.state = {...this.state, ...next};
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}
