var  smart = require('webpack-merge')
var  base = require('./webpack.base.js')


module.exports = smart(base, {
	module: {
		rules: [
			{
				test: /\.js$/,
				use: 'babel-loader'
			}
		]
	}
})