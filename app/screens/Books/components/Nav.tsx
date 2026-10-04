import React from 'react';
import {View} from 'react-native';

import {useTailwind} from 'tailwind-rn';

const Nav = ({children}) => {
  const tailwind = useTailwind();

  return (
    <View style={tailwind('py-6')}>
      <View style={tailwind('flex-row justify-between')}>{children}</View>
    </View>
  );
};

export default Nav;
