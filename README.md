# ConnectivityApp – Experiment 8 (React Native + Expo)

Detects whether the device is online/offline, shows the connection type
(Wi-Fi / Cellular / ...), shows internet reachability, updates automatically
when the network changes, and has a manual Refresh button.

## Run it

1. Install Node.js LTS from https://nodejs.org  (check: `node -v` and `npm -v`)
2. Open a terminal in this folder and run:

       npm install
       npx expo start

3. Open the app:
   - Physical phone: install **Expo Go**, scan the QR code shown in the terminal
     (phone and computer must be on the same Wi-Fi).
   - Android emulator: start it in Android Studio, then press `a` in the terminal.
   - iOS simulator (Mac only): press `i` in the terminal.

## Test it
- Toggle Wi-Fi or Airplane Mode -> the circle turns green/red automatically.
- Press **Refresh** -> status is re-checked on demand.

## Files
- `App.js`        the connectivity screen (all the logic)
- `package.json`  dependencies (includes @react-native-community/netinfo)
- `app.json`      app name, icon, permissions
- `index.js`      entry point
- `assets/`       icons
