#!/bin/bash
# Script to start React Native Metro bundler without Watchman
export REACT_NATIVE_DISABLE_WATCHMAN=1
npx react-native start
