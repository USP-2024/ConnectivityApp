// EXPERIMENT 8 - Connectivity-Based Cross-Platform App (React Native / Expo)
//
// What this screen does (matches Part 5 of the experiment):
//  Step 2 -> reads the initial network state with NetInfo.fetch()
//  Step 3 -> subscribes to live changes with NetInfo.addEventListener()
//            and unsubscribes when the screen unmounts
//  Step 4 -> green/red indicator, type label, reachability line, vibration + pulse on change
//  Step 5 -> manual "Refresh" button that fetches a fresh snapshot

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  Vibration,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import NetInfo from '@react-native-community/netinfo';

const COLORS = {
  online: '#1F9D6B',
  offline: '#D64545',
  unknown: '#8A94A0',
  background: '#F2F4F3',
  text: '#16201B',
  muted: '#5C6862',
};

// Turn NetInfo's "type" value into a readable label.
const TYPE_LABELS = {
  wifi: 'Wi-Fi',
  cellular: 'Cellular',
  ethernet: 'Ethernet',
  bluetooth: 'Bluetooth',
  vpn: 'VPN',
  wimax: 'WiMAX',
  other: 'Other',
  unknown: 'Unknown',
  none: 'No Connection',
};

// Convert a raw NetInfo state object into the three values we keep in React state.
function toStatus(state) {
  return {
    type: state.type,
    isConnected: state.isConnected === true,
    // isInternetReachable can be null while Android/iOS is still probing.
    isInternetReachable: state.isInternetReachable,
  };
}

export default function App() {
  // Step 2 - initial state values (connection type, connected flag, reachable flag).
  const [status, setStatus] = useState({
    type: 'unknown',
    isConnected: false,
    isInternetReachable: null,
  });
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const pulse = useRef(new Animated.Value(1)).current;
  const previousConnected = useRef(null);

  // Short pulse animation used when the state changes.
  const playPulse = useCallback(() => {
    pulse.setValue(0.88);
    Animated.spring(pulse, {
      toValue: 1,
      friction: 3,
      tension: 120,
      useNativeDriver: true,
    }).start();
  }, [pulse]);

  // Single place where new network info is applied to the screen.
  const applyState = useCallback(
    (state) => {
      const next = toStatus(state);
      setStatus(next);
      setLastUpdated(new Date());

      // Step 4 - cue only when online/offline actually flips (not on first load).
      if (
        previousConnected.current !== null &&
        previousConnected.current !== next.isConnected
      ) {
        playPulse();
        if (Platform.OS !== 'web') Vibration.vibrate(next.isConnected ? 60 : [0, 80, 60, 80]);
      }
      previousConnected.current = next.isConnected;
    },
    [playPulse]
  );

  useEffect(() => {
    // Step 2 - one-time snapshot when the screen first loads.
    NetInfo.fetch().then(applyState);

    // Step 3 - live listener. Fires every time connectivity changes.
    const unsubscribe = NetInfo.addEventListener(applyState);

    // Step 3 (cleanup) - remove the listener when the screen closes.
    return () => unsubscribe();
  }, [applyState]);

  // Step 5 - manual refresh.
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // refresh() forces NetInfo to re-check reachability instead of using its cache.
      const state = await NetInfo.refresh();
      applyState(state);
    } finally {
      setRefreshing(false);
    }
  }, [applyState]);

  const { type, isConnected, isInternetReachable } = status;
  const color = isConnected ? COLORS.online : COLORS.offline;

  const typeLabel = isConnected ? TYPE_LABELS[type] ?? 'Connected' : 'No Connection';

  let reachabilityText = 'Checking internet access...';
  if (!isConnected) {
    reachabilityText = 'Internet is not reachable';
  } else if (isInternetReachable === true) {
    reachabilityText = 'Internet is reachable';
  } else if (isInternetReachable === false) {
    reachabilityText = 'Connected to a network, but no internet access';
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.title}>Connectivity Status</Text>
        <Text style={styles.subtitle}>Updates automatically when your network changes</Text>
      </View>

      <View style={styles.center}>
        {/* Large status indicator: green = online, red = offline */}
        <Animated.View
          style={[
            styles.indicator,
            { backgroundColor: color, transform: [{ scale: pulse }] },
          ]}
        >
          <Text style={styles.indicatorText}>{isConnected ? 'ONLINE' : 'OFFLINE'}</Text>
        </Animated.View>

        {/* Connection type */}
        <Text style={styles.typeLabel}>{typeLabel}</Text>

        {/* Internet reachability */}
        <Text
          style={[
            styles.reachability,
            isConnected && isInternetReachable === false && { color: COLORS.offline },
          ]}
        >
          {reachabilityText}
        </Text>

        {lastUpdated && (
          <Text style={styles.updated}>Last updated {lastUpdated.toLocaleTimeString()}</Text>
        )}
      </View>

      <View style={styles.footer}>
        <Pressable
          onPress={onRefresh}
          disabled={refreshing}
          style={({ pressed }) => [
            styles.button,
            pressed && { opacity: 0.8 },
            refreshing && { opacity: 0.6 },
          ]}
        >
          <Text style={styles.buttonText}>{refreshing ? 'Checking...' : 'Refresh'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'android' ? 32 : 0,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 15,
    color: COLORS.muted,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  indicator: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  indicatorText: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  typeLabel: {
    marginTop: 32,
    fontSize: 26,
    fontWeight: '600',
    color: COLORS.text,
  },
  reachability: {
    marginTop: 8,
    fontSize: 16,
    color: COLORS.muted,
    textAlign: 'center',
  },
  updated: {
    marginTop: 18,
    fontSize: 13,
    color: COLORS.unknown,
  },
  footer: {
    padding: 24,
  },
  button: {
    backgroundColor: COLORS.text,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
});
