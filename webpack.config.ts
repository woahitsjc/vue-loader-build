"use strict";
declare const __dirname: string;
import * as path from "path";

import * as webpack from "webpack";
import ForkTsCheckerNotifierWebpackPlugin from "fork-ts-checker-notifier-webpack-plugin";
import ForkTsCheckerWebpackPlugin from "fork-ts-checker-webpack-plugin";
import { CleanWebpackPlugin } from "clean-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import { VueLoaderPlugin } from "vue-loader";
import TerserPlugin from "terser-webpack-plugin";
import { BundleAnalyzerPlugin } from "webpack-bundle-analyzer";
import CopyPlugin from "copy-webpack-plugin";

// the clean options to use
const cleanOptions = {
    verbose: true,
    dry: false
};

const getConfig = (mode): webpack.Configuration => ({
    entry: {
        adminApp: "./src/admin/adminApp.ts",
        instructorApp: "./src/instructor/instructorApp.ts",
        studentApp: "./src/student/studentApp.ts",
        mainCss: "./styles/site.scss"
    },
    // Creates source map and its possible to debug the js files
    devtool: "eval-source-map",
    plugins: [
        new webpack.DefinePlugin({
            PRODUCTION: JSON.stringify(mode === "production")
        }),
        new webpack.ProgressPlugin({}),
        new CleanWebpackPlugin(cleanOptions),
        new VueLoaderPlugin(),
        new ForkTsCheckerWebpackPlugin({
            typescript: {
                extensions: {
                    vue: true
                }
            }
        }),
        new ForkTsCheckerNotifierWebpackPlugin({ title: "TypeScript", excludeWarnings: false, skipSuccessful: true }),
        new MiniCssExtractPlugin({
            // Options similar to the same options in webpackOptions.output
            // both options are optional
            filename: mode === "production" ? "[name].[contenthash].bundle.css" : "[name].dev.bundle.css",
        }),
        new CopyPlugin({
            patterns: [
                { from: "images", to: "images" }
            ]
        })
    ],
    output: {
        publicPath: "",
        path: path.join(__dirname, "./dist"),
        filename: mode === "production" ? "[name].[contenthash].bundle.js" : "[name].dev.bundle.js",
        devtoolModuleFilenameTemplate: info => {
            let $filename = "sources://" + info.resourcePath;
            if (info.resourcePath.match(/\.vue$/) && !info.query.match(/type=script/)) {
                $filename = "webpack-generated:///" + info.resourcePath + "?" + info.hash;
            }
            return $filename;
        },
        devtoolFallbackModuleFilenameTemplate: "webpack:///[resource-path]?[hash]",
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                exclude: /node_modules|vue\/src/,
                use: [
                    {
                        loader: "babel-loader"
                    },
                    {
                        loader: "ts-loader",
                        options: {
                            appendTsxSuffixTo: [/\.vue$/],
                            transpileOnly: true
                        }
                    }
                ]
            },
            {
                test: /\.jsx?$/,
                loader: "babel-loader",
                exclude: /(node_modules)/
            },
            {
                test: /\.vue$/,
                loader: "vue-loader",
            },
            {
                test: /\.(svg|png|jpg|gif|eot|ttf|woff|woff2)$/i,
                type: "asset"
            },
            {
                test: /\.(sa|sc|c)ss$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    { loader: "css-loader", options: { sourceMap: true } },
                    { loader: "resolve-url-loader", options: { sourceMap: true, removeCR: true } },
                    {
                        loader: "sass-loader",
                        options: {
                            sourceMap: true,
                            additionalData: `
                                @import "@css/_abstract.scss";
                            `
                        }
                    }
                ],
            }
        ]
    },
    resolve: {
        alias: {
            "vue": mode === "production" ? "vue/dist/vue.min.js" : "vue/dist/vue.js",
            "@common": path.resolve(__dirname, "./src/common/"),
            "@css": path.resolve(__dirname, "./styles"),
            "@ant-design/icons/lib/dist$": path.resolve(__dirname, "./src/antd/icons.ts")
        },
        extensions: [".ts", ".tsx", ".js", ".vue"]
    },
    optimization: {
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    keep_classnames: true
                }
            })
        ]
    }
});

export default (env, argv) => {

    const config = getConfig(argv.mode);

    if (argv.mode === "production") {
        config.devtool = undefined;
    }

    if (argv.analyze) {
        config.plugins.push(new BundleAnalyzerPlugin());
    }

    return config;
};
