import React from "react";
import { View, TouchableOpacity } from "react-native";

import { useTailwind } from "tailwind-rn";

const NavItem = ({ href, isActive, children }) => {
  const tailwind = useTailwind();

  return (
    <View>
      <TouchableOpacity
        onPress={href}
        style={
          isActive
            ? tailwind("px-3 py-2 rounded-md bg-sky-500 text-slate-100")
            : tailwind("px-3 py-2 rounded-md bg-slate-100 text-slate-400")
        }
      >
        {children}
      </TouchableOpacity>
    </View>
  );
};

export default NavItem;
