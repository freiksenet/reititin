module.exports = {
  entry: './reititin.js',
  output: {
     path: 'build',
     filename: 'reititin.js',
     library: 'Reititin',
     libraryTarget: 'umd'
  },
  module: {
  },
  externals: {
    fs: 'fs'
  },
  plugins: []
};
