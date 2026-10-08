import NetInfo from '@react-native-community/netinfo';

import {NetInfoConnectivity} from '../../app/adapters/connectivity';
import {FakeConnectivity} from '../../app/connectivity';

const netInfo = NetInfo as jest.Mocked<typeof NetInfo>;

// Feeds a NetInfo state to the adapter's listener.
const emit = (state: object) => {
  const listener = netInfo.addEventListener.mock.calls.at(-1)![0];
  listener(state as any);
};

describe('NetInfoConnectivity', () => {
  beforeEach(() => jest.clearAllMocks());

  it('counts an unknown connection as online until NetInfo reports', () => {
    const connectivity = new NetInfoConnectivity();
    expect(connectivity.current()).toEqual({online: true, metered: false});
    connectivity.dispose();
  });

  it('is offline only when NetInfo is sure', () => {
    const connectivity = new NetInfoConnectivity();
    emit({type: 'wifi', isConnected: true, isInternetReachable: null});
    expect(connectivity.current().online).toBe(true);
    emit({type: 'wifi', isConnected: true, isInternetReachable: false});
    expect(connectivity.current().online).toBe(false);
    emit({type: 'none', isConnected: false, isInternetReachable: null});
    expect(connectivity.current().online).toBe(false);
    connectivity.dispose();
  });

  it('treats cellular and expensive connections as metered', () => {
    const connectivity = new NetInfoConnectivity();
    emit({type: 'cellular', isConnected: true, isInternetReachable: true});
    expect(connectivity.current()).toEqual({online: true, metered: true});
    emit({
      type: 'wifi',
      isConnected: true,
      isInternetReachable: true,
      details: {isConnectionExpensive: true},
    });
    expect(connectivity.current().metered).toBe(true);
    connectivity.dispose();
  });

  it('tells subscribers only when the state changes', () => {
    const connectivity = new NetInfoConnectivity();
    const listener = jest.fn();
    const unsubscribe = connectivity.subscribe(listener);
    emit({type: 'wifi', isConnected: true, isInternetReachable: true});
    expect(listener).not.toHaveBeenCalled();
    emit({type: 'none', isConnected: false, isInternetReachable: false});
    expect(listener).toHaveBeenCalledWith({online: false, metered: false});
    unsubscribe();
    emit({type: 'wifi', isConnected: true, isInternetReachable: true});
    expect(listener).toHaveBeenCalledTimes(1);
    connectivity.dispose();
  });

  it('asks NetInfo to check again and stops listening when disposed', async () => {
    const stop = jest.fn();
    netInfo.addEventListener.mockReturnValueOnce(stop);
    const connectivity = new NetInfoConnectivity();
    await connectivity.refresh();
    expect(netInfo.refresh).toHaveBeenCalled();
    connectivity.dispose();
    expect(stop).toHaveBeenCalled();
  });
});

describe('FakeConnectivity', () => {
  it('lets tests go offline and back', () => {
    const connectivity = new FakeConnectivity({online: false});
    const listener = jest.fn();
    connectivity.subscribe(listener);
    connectivity.set({online: true});
    expect(connectivity.current()).toEqual({online: true, metered: false});
    expect(listener).toHaveBeenCalledWith({online: true, metered: false});
  });
});
