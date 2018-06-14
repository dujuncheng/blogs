var path = require('path')
var HtmlWebpackPlugin = require('html-webpack-plugin')
module.exports = {
	entry: {
		main: './src/index.js',
		foo: './src/foo.js'
	},
	output: {
		filename: '[name].bundle.[hash].js',
		path: path.resolve(__dirname, 'dist')
	},
	plugins: [
		new HtmlWebpackPlugin({
			filename: path.resolve(__dirname, 'dist/index.html'),
			template: './src/index.html'
		})
	]
}