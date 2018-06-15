console.log('webpack.base.js')
var path = require('path')
module.exports = {
	entry: './src/index.js',
	output: {
		filename: 'bundle[hash].js',
		path: path.resolve(__dirname,'../dist')
	},
}