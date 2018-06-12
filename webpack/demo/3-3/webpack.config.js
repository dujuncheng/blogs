module.exports = {
	entry: {
		app: './app.jss'
	},
	output: {
		filename: '[name].[hash:8].js'
	},
	module: {
		rules: [
			{
				test: /\.js$/,
				use: 'babel-loader',
				exclude: '/node_module/'
			}
		]
	}
}