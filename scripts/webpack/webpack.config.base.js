const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const ROOT_DIR = path.resolve(__dirname, '../../');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const RES_DIR = path.join(ROOT_DIR, 'res');

module.exports = {
    entry: path.join(ROOT_DIR, 'src/client/index.js'),
    output: {
        path: DIST_DIR,
        filename: 'bundle.js'
    },
    plugins: [
        new HtmlWebpackPlugin({ template: path.join(RES_DIR, 'index.html') }),
        new CopyWebpackPlugin([ { from: RES_DIR, to: DIST_DIR } ])
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
        extensions: ['.js', '.jsx', '.css']
    }
};