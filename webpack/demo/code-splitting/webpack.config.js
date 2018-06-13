const path = require('path')

module.exports = {
	entry: './src/index.js',
	output: {
		path: path.resolve(__dirname, 'dist/'),
		filename: '[name].bundle.js',
		chunkFilename: '[name].bundle.js'
	},
	devServer: {
		contentBase: 'dist'
	},
	module: {
		rules: [
			{
				test: /\.js$/,
				loader: 'babel-loader',
				exclude: /node_module/
			}
		]
	}
}