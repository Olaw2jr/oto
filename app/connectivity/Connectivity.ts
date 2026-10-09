export type ConnectivityState = {
  // False only when the device is sure it can't reach the internet.
  online: boolean;
  // Cellular or a connection the OS marks as expensive.
  metered: boolean;
};

// The app's single view of the network, so screens, sync and downloads agree
// on whether oto is online without each reading the platform API.
export interface Connectivity {
  current(): ConnectivityState;
  subscribe(listener: (state: ConnectivityState) => void): () => void;
  // Asks the platform to check again, e.g. from a Try again button.
  refresh(): Promise<void>;
}
