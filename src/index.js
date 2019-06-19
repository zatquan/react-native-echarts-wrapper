import React, { Component } from "react";
import { View, Platform } from "react-native";
import PropTypes from "prop-types";
import echarts from "./echarts.min";

/* eslint-enable */

import * as jsBuilder from "./jsBuilder";

/* eslint-disable */
var WebView;
var WebViewExternalPackage;
try {
  WebView = require("react-native").WebView;
  WebViewExternalPackage = require("react-native-webview").WebView;
} catch (err) {}

class ECharts extends Component {
  static propTypes = {
    onData: PropTypes.func,
    baseUrl: PropTypes.string,
    legacyMode: PropTypes.bool,
    canvas: PropTypes.bool,
    onLoadEnd: PropTypes.func,
    backgroundColor: PropTypes.string.isRequired
  };

  static defaultProps = {
    baseUrl: "",
    onData: () => {},
    legacyMode: false,
    canvas: false,
    onLoadEnd: () => {},
    backgroundColor: "#00000000"
  };

  constructor(props) {
    super(props);
    this.onGetHeight = null;
    this.callbacks = {};
  }

  onMessage = e => {
    if (!e) return null;

    const { onData } = this.props;

    const data = JSON.parse(e.nativeEvent.data);

    if (data.types === "DATA") {
      onData(data.payload);
    } else if (data.types === "CALLBACK") {
      /* eslint-disable no-case-declarations */
      const { uuid } = data;
      /* eslint-enable no-case-declarations */
      this.callbacks[uuid](data.payload);
    }
  };

  postMessage = data => {
    this.webview.postMessage(jsBuilder.convertToPostMessageString(data));
  };

  ID = () =>
    `_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

  getOption = (callback, properties = undefined) => {
    const uuid = this.ID();
    this.callbacks[uuid] = callback;
    const data = {
      types: "GET_OPTION",
      uuid,
      properties
    };
    this.postMessage(data);
  };

  setOption = (option, notMerge, lazyUpdate) => {
    const data = {
      types: "SET_OPTION",
      payload: {
        option,
        notMerge: notMerge || false,
        lazyUpdate: lazyUpdate || false
      }
    };
    this.postMessage(data);
  };

  clear = () => {
    const data = {
      types: "CLEAR"
    };
    this.postMessage(data);
  };

  getWebViewRef = ref => {
    this.webview = ref;
  };

  render() {
    let source;
    const { baseUrl, legacyMode } = this.props;

    if (baseUrl) {
      source = {
        html: this.html,
        baseUrl
      };
    } else {
      /* eslint-disable global-require */
      source =
        Platform.OS === "ios"
          ? require("./index.html")
          : { uri: "file:///android_asset/index.html" };
      /* eslint-enable global-require */
    }

    let isExpo = false;

    if (typeof Expo !== "undefined" && Expo.Constants) {
      isExpo = Expo.Constants.appOwnership === "expo";
    }

    return (
      <View style={{ flex: 1 }}>
        {legacyMode ? (
          <WebView
            ref={this.getWebViewRef}
            useWebKit={isExpo}
            originWhitelist={["*"]}
            scrollEnabled={false}
            source={source}
            injectedJavaScript={jsBuilder.getJavascriptSource(this.props)}
            onMessage={this.onMessage}
            allowFileAccess
            allowUniversalAccessFromFileURLs
            mixedContentMode="always"
            onLoadEnd={this.props.onLoadEnd}
          />
        ) : (
          <WebViewExternalPackage
            ref={this.getWebViewRef}
            useWebKit={isExpo}
            originWhitelist={["*"]}
            scrollEnabled={false}
            source={source}
            injectedJavaScript={jsBuilder.getJavascriptSource(this.props)}
            onMessage={this.onMessage}
            allowFileAccess
            allowUniversalAccessFromFileURLs
            mixedContentMode="always"
            onLoadEnd={this.props.onLoadEnd}
          />
        )}
      </View>
    );
  }
}

export { ECharts, echarts };
