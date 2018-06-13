var webpack = require('webpack')
var path = require('path')

module.exports = {
	entry: {
		'pageA': './src/pageA'
	},
	output: {
		path: path.resolve(__dirname, './dist'),
		filename: '[name].bundle.js',
		chunckFilename: '[name].chunck.js'
	},
	plugins: [
			new config.optimization.splitChunk({
				name: 'common',
				minChunks:2
			})
	]
}