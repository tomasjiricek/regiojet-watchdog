const argv = require('argv');
const execSync = require('child_process').execSync;
const path = require('path');

const ENVIRONMENTS = {
    DEV: 'dev',
    PROD: 'prod',
}

const DEFAULT_ENVIRONMENT = ENVIRONMENTS.PROD;

argv.option([
    {
        name: 'env',
        short: 'e',
        type: 'string',
        description: `Environment for webpack. Available environments: ${Object.values(ENVIRONMENTS).join(', ')}.`
            + `Default is ${DEFAULT_ENVIRONMENT}.`,
        example: `npm run build --env=${DEFAULT_ENVIRONMENT}`
    }
]);

const args = (argv.run()).options;
let env = DEFAULT_ENVIRONMENT;

const WEBPACK_CONFIG_DIR = path.resolve(__dirname, '..', 'webpack');

if (!args.env) {
    console.log(`Using default environment: ${env}`);
} else {
    if (!Object.values(ENVIRONMENTS).includes(args.env)) {
        console.log(`Invalid environment: ${args.env}`);
        return;
    }
    env = args.env;
    console.log(`Using environment: ${env}`);
}

const WEBPACK_CONFIG_PATH = path.join(WEBPACK_CONFIG_DIR, `webpack.config.${env}.js`);
const commandArguments = ['--', '--config', WEBPACK_CONFIG_PATH].join(' ');

execSync(
    `npm run webpack ${commandArguments}`,
    { cwd: path.resolve(__dirname, '../../'), stdio: 'inherit' },
);
