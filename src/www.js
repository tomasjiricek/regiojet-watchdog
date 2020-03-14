const argv = require('argv');
const colors = require('colors/safe');
const fs = require('fs');
const https = require('https');
const path = require('path');

const service = require('./server/service');

const DATA_DIR = path.join(__dirname, '../data');

let config;

argv.option([
    {
        name: 'config',
        short: 'c',
        type: 'string',
        description: 'Optional config path. Default path is ./data/config.js',
        example: 'node www --config=./config.json'
    }, {
        name: 'port',
        short: 'p',
        type: 'number',
        description: 'Optional port. If is not set, service will start at port from config.',
        example: 'node www --port=12345'
    }, {
        name: 'devmode',
        short: 'd',
        type: 'boolean',
        description: 'Optional. If passed, Express.js will host static files too.',
        example: 'node www -d'
    }
]);

const args = (argv.run()).options;

try {
    if (args.config) {
        config = require(args.config);
    } else {
        config = require(path.join(DATA_DIR, 'config.js'));
    }
} catch (e) {
    console.error(colors.red('Config error:', e.message));
    return;
}

const port = args.port || config.listenOnPort;

if (!port) {
    console.error(colors.red('No server port specified!'));
    return;
}

const { certificatePath } = config;

if (!(certificatePath instanceof Object) || !certificatePath.crt || !certificatePath.key) {
    console.error(colors.red('Config is missing "certificatePath" property or the property is not object containing "crt" and "key" properties'));
    return;
}

const { crt: crtPath, key: keyPath } = certificatePath;

try {
    service.initApp(args.devmode);
    const server = https.createServer({
        key: fs.readFileSync(keyPath, 'utf8'),
        cert: fs.readFileSync(crtPath, 'utf8')
    }, service.app);
    server.listen(port);

    console.log(colors.cyan(`\t---- Service is running ${args.devmode ? '(in dev mode) ' : ''}----`));
    console.log(colors.green(`\n\tURL: https://localhost:${port}`));
} catch (e) {
    console.error(colors.red('Error:', e));
}
