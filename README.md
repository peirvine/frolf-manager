# Disc Golf Manager
[discgolfmanager.com](https://discgolfmanager.com)


[![Deploy to Firebase Hosting on merge](https://github.com/peirvine/frolf-manager/actions/workflows/firebase-hosting-merge.yml/badge.svg)](https://github.com/peirvine/frolf-manager/actions/workflows/firebase-hosting-merge.yml)
## Authors

- Peter Irvine - [@peirvine](https://www.github.com/peirvine)


## Contributing

Contributions are always welcome!

See [contributing.md](https://github.com/peirvine/frolf-manager/blob/main/CONTRIBUTING.md) for ways to get started.

Please do not push code that you have not tested locally ([@Gregory-Ledray](https://github.com/Gregory-Ledray) I'm looking at you.)

## Installation
 
Install Firebase with npm

```bash
  npm install firebase
```
    
## Run Locally

Clone the project

```bash
  // DO NOT FORK
  git clone git@github.com:peirvine/frolf-manager.git
```

Go to the project directory

```bash
  cd frolf-manager
```

Install dependencies

```bash
  npm i
```

Start the server

```bash
  npm run start
```
*Be careful, currently local hits prod data*

## Enulators
Firebase has emulators, they aren't currently working but they will be soon.

## Local development with Firebase emulators

`npm start` automatically points the app at the local Firebase emulators (Auth, Firestore, Realtime Database) instead of production. App Check is disabled in this mode.

1. In one terminal: `npm run emulators` (needs `firebase-tools`; data is saved to `./emulator-data` on exit and re-imported on next start).
2. In another: `npm start`. Emulator UI is at http://localhost:4000.
3. To seed with a copy of production data, export the Realtime Database JSON from the Firebase console and import it via the Emulator UI (or place it in `emulator-data/database_export/`).

Set `REACT_APP_USE_EMULATOR=false` to run `npm start` against the real backend.
