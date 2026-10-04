import React from 'react';
import {View} from 'react-native';

import {useTailwind} from 'tailwind-rn';

const List = ({children}) => {
  const tailwind = useTailwind();

  return <View style={tailwind('')}>{children}</View>;
};

export default List;
