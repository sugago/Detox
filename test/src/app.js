import React, {Component} from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  Linking,
} from 'react-native';

class example extends Component {

  constructor(props) {
    super(props);
    this.state = {
      screen: undefined,
      url: undefined,
      notification: undefined
    };
  }

  renderButton(title, onPressCallback) {
    return (
      <TouchableOpacity onPress={() => {
        onPressCallback();
      }}>
        <Text style={{color: 'blue', marginBottom: 20}}>{title}</Text>
      </TouchableOpacity>
    );
  }

  renderScreenButton(title, component) {
    return this.renderButton(title, () => {
      this.setState({screen: component});
    });
  }

  renderText(text) {
    return (
      <View style={{flex: 1, paddingTop: 20, justifyContent: 'center', alignItems: 'center'}}>
        <Text style={{fontSize: 25}}>
          {text}
        </Text>
      </View>
    );
  }

  async componentDidMount() {
    const url = await Linking.getInitialURL();
    if (url) {
      this.setState({url: url});
    }
  }

  componentWillMount() {
    Linking.addEventListener('url', (params) => this._handleOpenURL(params));
  }

  render() {
    if (this.state.notification) {
      console.log("notification:", this.state.notification);
      if (this.state.notification.title) {
        return this.renderText(this.state.notification.title);
      } else {
        return this.renderText(this.state.notification);
      }

    }

    else if (this.state.url) {
      console.log("url:", this.state.url);
      return this.renderText(this.state.url);
    }

    if (!this.state.screen) {
		console.log("JS rendering");
      return (
        <View style={{flex: 1, paddingTop: 20, justifyContent: 'center', alignItems: 'center'}}>
          <Text style={{fontSize: 20, marginBottom: 30}}>
            Hello World
          </Text>
        </View>
      );
    }
    const Screen = this.state.screen;
    return (
      <Screen/>
    );
  }

  _onNotification(notification) {
    console.log("onNotification:", notification);
    this.setState({notification: notification.getAlert()});
  }

  _handleOpenURL(params) {
    console.log("handleOpenURL:", params);
    this.setState({url: params.url});
  }
}

module.exports = example;
