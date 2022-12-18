// https://stackoverflow.com/questions/63937106/try-to-make-my-svg-element-rotating-using-animated-but-it-doesnt-work

import React, { Component, useState, useEffect } from "react";
import { View, Animated, Easing } from "react-native";
import { useTailwind } from "tailwind-rn";
import Spinner from "./Spinner";

const LoadingSpinner = () => {
  const tailwind = useTailwind();
  const [spinAnim, setSpinAnim] = useState(new Animated.Value(0));

  const interpolateRotation = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const animatedStyle = {
    transform: [{ rotate: interpolateRotation }],
  };

  // If the object you want to rotate is not centered in the <Animated.View>, you can change the center of rotation by moving the object, rotating it and then moving it back, e.g.

  // const animatedStyle = {
  //   transform: [
  //     { translateX: -50 },
  //     { translateY: -50 },
  //     { rotate: interpolateRotation },
  //     { translateX: 50 },
  //     { translateY: 50 },
  //   ],
  // };

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  });

  return (
    <View style={tailwind("flex-1 justify-center items-center")}>
      <Animated.View style={animatedStyle}>
        <Spinner props={""} />
      </Animated.View>
    </View>
  );
};

export default LoadingSpinner;
