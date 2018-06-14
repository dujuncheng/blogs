var path = require('path')

var htmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
	entry: {
		main: path.resolve(__dirname, 'index.js')
	},
	output: {
		filename: "[name].bundle[hash].js",
		path: path.resolve(__dirname, 'dist')
	},
	plugins: [
		new htmlWebpackPlugin({
			filename: path.resolve(__dirname, 'dist/index.html'),
			template: './index.html',
		})
	]
}
