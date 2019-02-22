const path = require('path');

module.exports = {
  entry: './src/co-editor.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'co-editor.min.js'
  },
  mode: 'production',
  module: {
    rules: [
      {
        test: require.resolve('./vendor/vaadin-quill.min.js'),
        use: [{
          loader: 'expose-loader',
          options: 'Quill'
        }]
      },
      {
        test: require.resolve('./node_modules/quill-cursors/dist/quill-cursors.min.js'),
        use: [{
          loader: 'expose-loader',
          options: 'QuillCursors'
        }]
      }
    ]
  }
}
