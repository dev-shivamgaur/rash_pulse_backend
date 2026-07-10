const path = require('path');

module.exports = (options) => ({
  ...options,
  resolve: {
    ...options.resolve,
    alias: {
      ...options.resolve?.alias,
      '@rash-pulse/swagger': path.resolve(__dirname, 'libs/swagger/src'),
    },
  },
});
