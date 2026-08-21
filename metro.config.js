const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// CIや制限されたビルド環境でも、WatchmanなしでiOSバンドルを生成できるようにする。
config.resolver.useWatchman = false;

module.exports = config;
