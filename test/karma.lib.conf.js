const baseConfig = require('./karma-base-config');
baseConfig.files = [{ pattern: './lib/**/*.test.ts', watched: false }];
baseConfig.preprocessors = { './lib/**/*.test.ts': ['webpack'] };

module.exports = function (config) {
    config.set(baseConfig);
}