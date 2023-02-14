module.exports = {
    singleRun: true,
    browsers: ['ChromeHeadless'],
    frameworks: ['mocha', 'webpack'],
    plugins: ['karma-webpack', 'karma-mocha', 'karma-chrome-launcher', 'karma-spec-reporter'],
    reporters: ['spec'],
    webpack: {
        devtool: 'inline-source-map',
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    use: 'ts-loader',
                    exclude: /node_modules/,
                },
            ],
        },
        resolve: {
            extensions: ['.tsx', '.ts', '.js'],
            fallback: {
                "buffer": require.resolve('buffer/'),
            }
        }

    },
}