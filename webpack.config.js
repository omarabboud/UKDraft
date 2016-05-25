var path = require('path');
var webpack = require('webpack');
var PROD = JSON.parse(process.env.PROD || '0');

module.exports = { 
    entry: __dirname + '/components.js',
     output: {
        path: __dirname,
        filename: PROD ? 'bundle.min.js' : 'bundle.js'
    },
     module: {   
        loaders: [{
            test: /.jsx?$/,
            loader: 'babel-loader',
            exclude: /node_modules/,
            query: {
                presets: ['es2015', 'react']
            }
        }] 
    },
    plugins: PROD ? [
        new webpack.optimize.UglifyJsPlugin({
            compress: { warnings: false }
        }),
        new webpack.DefinePlugin({
            'process.env': {
                'NODE_ENV': JSON.stringify('production')
            }
        })
    ] : []
};
