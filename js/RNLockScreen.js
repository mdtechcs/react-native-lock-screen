import React, { Component } from 'react';
import { ViewPropTypes, View, ImageBackground } from 'react-native';
import PropTypes from 'prop-types';
import Toast from 'react-native-simple-toast';
import { HeaderFragment } from './HeaderFragment';
import { PinFragment } from './PinFragment';
import { PatternFragment } from './PatternFragment';

import style from './RNLockScreen.style';

class RNLockScreen extends Component {
  static Mode = {
    Capture: 0,
    Verify: 1,
  };

  static Type = {
    Pin: 0,
    Pattern: 1,
  };

  static propTypes = {
    ...ViewPropTypes,

    mode: PropTypes.number,
    type: PropTypes.number,
    lock: PropTypes.string,
    lockLimit: PropTypes.number,
    clearLockOnError: PropTypes.bool,

    backgroundImage: PropTypes.number,

    defaultState: PropTypes.object,
    reenterState: PropTypes.object,
    successState: PropTypes.object,
    errorState: PropTypes.object,

    patternProps: PropTypes.object,
    pinProps: PropTypes.object,

    renderHeaderFragment: PropTypes.func,
    renderSeparator: PropTypes.func,
    renderLockFragment: PropTypes.func,

    headerFragmentProps: PropTypes.object,
    lockFragmentProps: PropTypes.object,
  };

  static defaultProps = {
    type: 0,
    mode: 0,
    lock: '',
    lockLimit: 4,
    clearLockOnError: true,
  };

  constructor(props) {
    super(props);

    this.state = {
      lock: RNLockScreen.defaultProps.lock,
      state: HeaderFragment.State.Default,
    };
  }

  _onAdd = (pin) => {
    let { lockLimit, type } = this.props;
    let { lock, state } = this.state;

    if (lock && lock.length >= lockLimit) {
      if (type === RNLockScreen.Type.Pin) {
        Toast.show('Passcode Limit Reached', Toast.SHORT);
      }

      return;
    }

    this.setState({
      lock: lock.concat(pin),
    });
  };

  _onRemove = () => {
    let lock = this.state.lock;
    if (lock.length > 0) {
      this.setState({
        lock: lock.substr(0, lock.length - 1),
      });
    }
  };

  _onDone = (pin) => {
    let { mode, lockLimit, type } = this.props;
    let lock = this.state.lock;

    if (
      type === RNLockScreen.Type.Pin &&
      (lock === undefined || lock.length < lockLimit)
    ) {
      Toast.show(`Please re-enter ${lockLimit} digit passcode`, Toast.SHORT);
      return;
    }

    if (pin !== undefined && pin !== RNLockScreen.defaultProps.lock) {
      lock = pin;
    }

    if (mode === RNLockScreen.Mode.Capture) {
      this._onCapture(lock);
    } else if (mode === RNLockScreen.Mode.Verify) {
      this._onVerify(lock);
    }
  };

  _onCapture = (lock) => {
    let { onCapture, type, clearLockOnError } = this.props;

    if (this.state.state === HeaderFragment.State.Default) {
      this.setState({
        primaryLock: lock,
        lock: RNLockScreen.defaultProps.lock,
        state: HeaderFragment.State.Reenter,
      });
    } else if (
      this.state.state === HeaderFragment.State.Reenter ||
      this.state.state === HeaderFragment.State.Error ||
      this.state.state === HeaderFragment.State.Success
    ) {
      if (this.state.primaryLock === lock) {
        this.setState({
          state: HeaderFragment.State.Success,
        });

        onCapture && onCapture(lock);
      } else {
        if (type === RNLockScreen.Type.Pin) {
          Toast.show('Incorrect Passcode', Toast.SHORT);
          this.setState({
            lock: RNLockScreen.defaultProps.lock,
            state: HeaderFragment.State.Default,
          });
          if (clearLockOnError) {
            setTimeout(() => {
              this.setState({
                lock: RNLockScreen.defaultProps.lock,
                state: HeaderFragment.State.Default,
              });
            }, 1000);
          }
        }
        if (type === RNLockScreen.Type.Pattern) {
          Toast.show('Password not matched', Toast.SHORT);
          this.setState({
            state: HeaderFragment.State.Error,
            lock: RNLockScreen.defaultProps.lock,
          });
        }
      }
    }
  };

  _onVerify = (capturedLock) => {
    let { lock, onVerified, type, clearLockOnError } = this.props;

    let verified;
    if (lock === capturedLock) {
      verified = true;
    } else {
      verified = false;
    }
    console.log(
      'ISVERIFIED',
      verified,
      'LOCK',
      lock,
      'capturedLock',
      capturedLock
    );
    if (verified) {
      this.setState({
        state: HeaderFragment.State.Success,
      });

      onVerified && onVerified(lock);
    } else {
      if (type === RNLockScreen.Type.Pin) {
        Toast.show('Incorrect Passcode', Toast.SHORT);
        this.setState({
          lock: RNLockScreen.defaultProps.lock,
          state: HeaderFragment.State.Default,
        });
        if (clearLockOnError) {
          setTimeout(() => {
            this.setState({
              primaryLock: '',
              lock: RNLockScreen.defaultProps.lock,
              state: HeaderFragment.State.Default,
            });
          }, 1000);
        }
      }
      if (type === RNLockScreen.Type.Pattern) {
        console.log('PATTERN HERE');
        Toast.show('Incorrect Passcode', Toast.SHORT);
        this.setState({
          primaryLock: '',
          lock: RNLockScreen.defaultProps.lock,
          state: HeaderFragment.State.Default,
        });
      }
    }
  };

  _renderLockFragment() {
    let {
      pinProps,
      patternProps,
      lockFragmentProps,
      mode,
      renderLockFragment,
      backgroundImage,
      type,
      lock,
    } = this.props;

    if (renderLockFragment) return renderLockFragment();

    let containerProps = {};
    if (backgroundImage) {
      containerProps = style.transparentContainer;
    }

    if (type === RNLockScreen.Type.Pin) {
      return (
        <PinFragment
          lock={this.state.lock}
          onAdd={this._onAdd}
          onRemove={this._onRemove}
          onDone={this._onDone}
          style={containerProps}
          {...lockFragmentProps}
          {...pinProps}
        />
      );
    } else if (type === RNLockScreen.Type.Pattern) {
      let lock;

      if (this.state.state === HeaderFragment.State.Default) {
        if (mode === RNLockScreen.Mode.Verify) {
          lock = lock;
        } else if (mode === RNLockScreen.Mode.Capture) {
          lock = this.state.primaryLock;
        }
      } else {
        if (mode === RNLockScreen.Mode.Verify) {
          lock = lock;
        } else if (mode === RNLockScreen.Mode.Capture) {
          lock = this.state.primaryLock;
        }
      }

      return (
        <PatternFragment
          onAdd={this._onAdd}
          onRemove={this._onRemove}
          onDone={this._onDone}
          clear={
            this.state.state === HeaderFragment.State.Default ? false : true
          }
          lock={this.state.lock}
          {...lockFragmentProps}
          {...patternProps}
        />
      );
    }
  }

  render() {
    let { backgroundImage } = this.props;

    if (backgroundImage) {
      return (
        <ImageBackground
          source={backgroundImage}
          style={[style.container]}
          width={1000}
          height={1000}
        >
          {this._renderLockFragment()}
        </ImageBackground>
      );
    } else {
      return (
        <View style={[style.container]}>{this._renderLockFragment()}</View>
      );
    }
  }
}

export { RNLockScreen };
