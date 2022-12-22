const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlBeautifyPlugin = require('@nurminen/html-beautify-webpack-plugin');
const HtmlWebpackSkipAssetsPlugin = require('html-webpack-skip-assets-plugin').HtmlWebpackSkipAssetsPlugin;
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const RemoveEmptyScriptsPlugin = require('webpack-remove-empty-scripts');
const TerserPlugin = require("terser-webpack-plugin");

const isDev = process.env.WEBPACK_SERVE;

function entryPoints(dir) {
    let entry_points = {
        style: './src/scss/style.scss'
    };

    function each_file(dir) {
        try {
            fs.readdirSync(dir, {withFileTypes: true}).forEach(function(item) {
                const file = item.name;
                const parts = file.split('.');
                if (parts[1] !== 'js') return;
                var file_path = dir + '/' + file;
                entry_points[parts[0]] = file_path;
            });
        } catch (e) {
            console.log(e);
        }
    }

    each_file(dir);

    return entry_points;
}

function generateHtmlPlugins(templateDir) {
    const templateFiles = fs.readdirSync(path.resolve(__dirname, templateDir), {withFileTypes: true});

    return templateFiles.reduce((result, item) => {
        const parts = item.name.split('.');
        const name = parts[0];
        const extension = parts[1];

        if (extension === 'html') result.push(
            new HtmlWebpackPlugin({
                filename: path.resolve(__dirname, `./theme/html/${name}.html`),
                template: path.resolve(__dirname, `${templateDir}/${name}.${extension}`),
                chunks: ['style', 'vendors', 'global', name],
                chunksSortMode: 'manual',
                excludeAssets: 'style.js'
            })
        );
       
        return result;
    }, []);
}

function plugins() {
    let plugins = [...generateHtmlPlugins('./src/pages/')];

    if (isDev) {
        plugins.push(new webpack.HotModuleReplacementPlugin());
    } else {
        plugins = [
            ...plugins,
            new HtmlBeautifyPlugin({
                config: {
                    html: {
                        end_with_newline: true,
                        indent_size: 4,
                        indent_with_tabs: true,
                        indent_inner_html: true,
                        preserve_newlines: true,
                        unformatted: ['strong', 'i', 'b'],
                        inline: []
                    }
                }
            }),
            new HtmlWebpackSkipAssetsPlugin({
                excludeAssets: ['style.js']
            }),
            new RemoveEmptyScriptsPlugin(),
            new MiniCssExtractPlugin({
                filename: ({chunk}) => chunk.name === 'style' ? '[name].css' : 'css/[name].css'
            })
        ]
    }
    
    return plugins;
}

function processNestedHtml(content, loaderContext) {
    const INCLUDE_PATTERN = /\<include src=\"(.+)\"\/?\>(?:\<\/include\>)?/gi;
    
    return !INCLUDE_PATTERN.test(content) 
    ? content 
    : content.replace(INCLUDE_PATTERN, (m, src) => {
        const pathToPartial = path.resolve(loaderContext.context, src);
        loaderContext.addDependency(pathToPartial);
        return processNestedHtml(fs.readFileSync(pathToPartial, 'utf8'), {...loaderContext, context: path.dirname(pathToPartial)});
    });
}

function styleLoaders() {
    if (isDev) {
        return [
            "style-loader",
            "css-loader",
            "resolve-url-loader",
            {
                loader: "sass-loader",
                options: {
                    sourceMap: true, // <-- !!IMPORTANT!! for "resolve-url-loader"
                }
            }
        ]
    }

    return [
        MiniCssExtractPlugin.loader,
        "css-loader",
        "postcss-loader",
        "resolve-url-loader",
        {
            loader: "sass-loader",
            options: {
                sourceMap: true, // <-- !!IMPORTANT!! for "resolve-url-loader"
            }
        }
    ]
}


module.exports = {
    entry: entryPoints('./src/js'),

    output: {
		filename: 'js/[name].js',
		path: path.resolve(__dirname, './theme'),
        assetModuleFilename: 'images/[name][ext]',
        clean: isDev ? false : {
            keep(asset) {
                const targets = ['fonts/', 'html/', 'css/', 'images/', 'js/', '.css'];
                return !targets.some(v => asset.includes(v));
            }
        }
	},

    plugins: plugins(),

    externals: {
		jquery: 'jQuery',
	},

    module: {
        rules: [
            {
                test: /\.html$/i,
                use: {
                    loader: 'html-loader',
                    options: {
                        minimize: false,
                        preprocessor: processNestedHtml
                    }
                } 
            },
            {
                test: /\.s[ac]ss|\.css/i,
                use: styleLoaders()
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
                test: /\.(png|jpg|gif)$/i,
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
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendors',
                    chunks (chunk) {
                        // exclude `style`
                        return chunk.name !== 'style';
                    }
                }
            }
        },
        minimizer: [
            new CssMinimizerPlugin(),
            new TerserPlugin({ extractComments: false })
        ],
        runtimeChunk: 'single'
    }
};