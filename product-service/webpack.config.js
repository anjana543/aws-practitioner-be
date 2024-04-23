const path = require('path');

module.exports = {
	entry: './handler.js',
	target: 'node',
	mode: 'production',
	module: {
		rules: [
			{
				test: /\.js$/,
				use: [
					{
						loader: 'babel-loader',
						options: {
							presets: ['@babel/preset-env'],
						},
					},
				],
				exclude: /node_modules/,
			},
		],
	},
	output: {
		libraryTarget: 'commonjs',
		path: path.join(__dirname, '.webpack'),
		filename: 'handler.js',
	},
};
