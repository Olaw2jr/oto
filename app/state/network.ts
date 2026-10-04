import NetInfo, {useNetInfo} from '@react-native-community/netinfo';

// Offline only when NetInfo is sure; an unknown state counts as online.
export const useOnline = () => {
  const {isConnected, isInternetReachable} = useNetInfo();
  return isConnected !== false && isInternetReachable !== false;
};

export const retryConnection = () => NetInfo.refresh();
