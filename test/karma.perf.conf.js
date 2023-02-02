const baseConfig = require('./karma-base-config');
const webpack = require('webpack');

baseConfig.files = [
    '../node_modules/kelonio/out/plugin/karmaReporterSetup.js',
    { pattern: './perf/**/*.test.ts', watched: false }
];
baseConfig.pingTimeout = 100000;
baseConfig.preprocessors = {
    '../node_modules/kelonio/out/plugin/karmaReporterSetup.js': ['webpack'],
    './perf/**/*.test.ts': ['webpack']
};
baseConfig.webpack.resolve.fallback.fs = false;
baseConfig.webpack.plugins = [
    new webpack.DefinePlugin({
        'process.hrtime': undefined,
    })
]
baseConfig.plugins.push('kelonio/out/plugin/karmaReporter');
baseConfig.reporters.push('kelonio');
baseConfig.client = {
    mocha: {
        timeout: 100000,
    }
};
baseConfig.browserConsoleLogOptions = {
    terminal: false,
};

baseConfig.kelonioReporter = {
    inferBrowsers: true,
    printReportAtEnd: true,
};

module.exports = function (config) {
    config.set(baseConfig);
}