const argv = require('argv');
const colors = require('colors/safe');
const fs = require('fs');
const https = require('https');
const path = require('path');

const service = require('./server/service');

const DATA_DIR = path.join(__dirname, '../data');
const SSL_CERT_DIR = path.join(DATA_DIR, 'sslcert');

const privateKey  = fs.readFileSync(path.join(SSL_CERT_DIR, 'server.key'), 'utf8');
const certificate = fs.readFileSync(path.join(SSL_CERT_DIR, 'server.crt'), 'utf8');

let config;

argv.option([
    {
        name: 'config',
        short: 'c',
        type: 'string',
        description: 'Optional config path. Default path is ./data/config.json',
        example: 'node www --config=./config.json'
    }, {
        name: 'port',
        short: 'p',
        type: 'number',
        description: 'Optional port. If is not set, service will start at port from config.',
        example: 'node www --port=12345'
    }
]);

const args = (argv.run()).options;

try {
    if (args.config) {
        config = require(args.config);
    } else {
        config = require(path.join(DATA_DIR, 'config.json'));
    }
} catch (e) {
    console.log(colors.red('Config error:', e.message));
}

if (config) {
    const port = args.port || config.listenOnPort || 3333;

    try {
        service.initApp(config);
        const server = https.createServer({ key: privateKey, cert: certificate }, service.app);
        server.listen(port);
        console.log(colors.cyan('\t---- Service is running ----'));
        console.log(colors.green(`\n\tURL: https://localhost:${port}`));
    } catch (e) {
       console.log(colors.red('Error:', e.message));
    }
}
