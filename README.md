# regiojet-watchdog

## First run
Before first run you have to:
1. Copy data/config.js.default and rename to config.js.
2. Set path to SSL crt & key files (for local development you can leave the self signed certificates - default values)
3. Change port and https mode if needed
4. Configure VAPID public & private keys:
    - Copy file data/secrets.json.default, rename the file to secrets.json
    - Generate your VAPID keys and save them to the file

## Commands
- `npm install` - to install dependencies
- `npm run build` - to make production build of FE
- `npm run build:dev` - to make dev build with automatic rebuild (no webpage refresh)
- `npm run serve` - to serve backend only
- `npm run serve:dev` - to serve backend and frontend (good for local development)

## Troubleshooting

### `node_modules/sqlite3/lib/binding/...` not found
If you run the app's backend via PM2 (as a service), PM2 has to be run with root privileges.
This means you will have to install sqlite3 for root (with `sudo npm i sqlite3`) so node finds that package.
Otherwise you would get error that sqlite couldn't be found even thought you installed it.

