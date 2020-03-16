const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { DefinePlugin } = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const secrets = require('../../data/secrets.json');

const ROOT_DIR = path.resolve(__dirname, '../../');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const RES_DIR = path.join(ROOT_DIR, 'res');

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = Buffer.from(base64, 'base64').toString();
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

module.exports = {
    entry: path.join(ROOT_DIR, 'src/client/index.js'),
    output: {
        path: DIST_DIR,
        filename: '[name].[contenthash].js',
    },
    plugins: [
        new HtmlWebpackPlugin({ template: path.join(RES_DIR, 'index.html') }),
        new CopyWebpackPlugin([{
            test: /\.(png|svg|jpe?g|gif|js)$/,
            from: RES_DIR,
            to: DIST_DIR
        }]),
        new DefinePlugin({
            VAPID_PUBLIC_KEY: urlBase64ToUint8Array(secrets.webPushPublicKey)
        }),
        new CleanWebpackPlugin({
            cleanAfterEveryBuildPatterns: ['!static/**']
        })
    ],
    module: {
        rules: [{
            loader: 'babel-loader',
            test: /\.jsx?$/,
            exclude: /node_modules/,
            query: {
                presets: ['@babel/react'],
                plugins: [
                    ['@babel/plugin-proposal-decorators', { 'legacy': true }],
                    ['@babel/plugin-proposal-class-properties', { 'loose': true }]
                ]
            }
        }, {
            test: /\.css$/,
            exclude: /node_modules/,
            use: ['style-loader', 'css-loader']
        }]
    },
    resolve: {
        extensions: ['.js', '.jsx', '.json', '.css', '.png', '.jpg']
    }
};
