var htmlWebpackPlugin = require('html-webpack-plugin');
var path = require('path')
module.exports = (env, argv) =>{
	console.log(argv.mode)
	return {
		entry: './src/index.js',
		output: {
			filename: 'bundle[hash].js',
			path: path.resolve(__dirname, 'dist')
		},
		mode: 'production',
		plugins: [
			new htmlWebpackPlugin({
				template: path.resolve(__dirname, 'src/index.html'),
				filename: path.resolve(__dirname, 'dist/index.html')
			})
		]
	}
}