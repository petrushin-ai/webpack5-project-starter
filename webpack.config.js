const path = require('path');
const HtmlBundlerPlugin = require('html-bundler-webpack-plugin');

const isDev = process.env.WEBPACK_SERVE;

module.exports = {
    output: {
        path: path.resolve(__dirname, './theme'),
        assetModuleFilename: 'images/[name][ext]',
        clean: isDev ? false : {
            keep(asset) {
                const targets = ['fonts/', 'html/', 'css/', 'images/', 'js/', '.css'];
                return !targets.some(v => asset.includes(v));
            }
        }
    },

    resolve: {
        alias: {
            // aliases used in template for source assets
            '@scripts': path.join(__dirname, 'src/js'),
            '@styles': path.join(__dirname, 'src/scss'),
            '@images': path.join(__dirname, 'src/images'),
            '@fonts': path.join(__dirname, 'src/fonts'),
        }
    },

    plugins: [
        new HtmlBundlerPlugin({
            // define a relative or absolute path to entry templates
            // note: the partials dir must be outside the pages
            entry: 'src/views/pages/',
            outputPath: path.resolve(__dirname, './theme/html'),
            js: {
                // output filename of compiled JavaScript, used if `inline` option is false (defaults)
                filename: 'js/[name].[contenthash:8].js',
                //inline: true, // inlines JS into HTML
            },
            css: {
                // output filename of extracted CSS, used if `inline` option is false (defaults)
                //filename: 'css/[name].[contenthash:8].css',
                filename: ({chunk}) => chunk.name === 'style' ? '[name].[contenthash:8].css' : 'css/[name].[contenthash:8].css'
                //inline: true, // inlines CSS into HTML
            },
            preprocessor: 'eta', // use the template engine
            preprocessorOptions: {
                views: 'src/views', // path for includes in template
            },
            minify: 'auto', // minify html in production mode only
        }),
    ],

    externals: {
		jquery: 'jQuery',
	},

    module: {
        rules: [
            {
                test: /\.s[ac]ss|\.css/i,
                use: [
                    "css-loader",
                    isDev ? null : "postcss-loader",
                    "sass-loader", // minimizes generated CSS in production mode
                ]
            },
            {
                test: /\.js$/i,
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            },
            {
                test: /\.(png|jpg|gif|ico)$/i,
                type: 'asset/resource',
                use: isDev ? void(0) : 'image-webpack-loader' 
            },
            {
                test: /\.svg$/i,
                type: isDev ? 'asset' : 'asset/resource',
                generator: {
                    filename: isDev ? 'images/[name][hash][ext]' : 'images/[name][ext]'
                }
            },
            {
                test: /\.(woff|woff2|eot|ttf|otf)$/i,
                type: 'asset/resource',
                generator: {
                    filename: 'fonts/[name][ext]'
                }
            },
        ],
    },

    devServer: {
        client: {
            overlay: true,
        },
        static: {
            directory: path.join(__dirname, './theme/html'),
        },
        watchFiles: ['src/pages/**/*'],
        hot: true,
        host: '0.0.0.0',
        port: 8080
    },

    optimization: {
        splitChunks: {
            cacheGroups: {
                commons: {
                    test: /[\\/]node_modules[\\/].+\.(js|ts)$/, // split js only
                    name: 'vendors',
                }
            }
        },
        runtimeChunk: 'single'
    }
};