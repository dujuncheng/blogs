var webpack = require('webpack')
var path = require('path')

moduel.exports = {
	entry: {
		'pageA': './src/pageA'
	},
	output: {
		path: path.resolve(__dirname, './dist'),
		filename: '[name].bundle.js',
		chunckFilename: '[name].chunck.js'
	},
	plugins: [
			new webpack.optimize.CommonsChunkPlugin({
				name: 'common',
				minChunks:2
			})
	]
}