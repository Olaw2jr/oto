// Single source of truth for oto's design tokens, shared by tailwind.config.js
// (CommonJS) and the typed theme modules. Values come from the oto design
// canvas: https://claude.ai/artifact/NtXhA3VnydXvCvepVidLL6

const colors = {
  light: {
    paper: '#F7F6F2',
    ink: '#1B1B19',
    surface: '#FFFFFF',
    raised: '#ECE9E1',
    tonal: '#E6E3DA',
    graphite: '#66655F',
    track: '#E4E1D8',
    hairline: '#E8E6E0',
    kaki: '#BF3E27',
    danger: '#B3261E',
    segment: '#E9E6DE',
    field: '#F1EFE9',
    switchOff: '#D3D0C6',
    onInk: '#FFFFFF',
    avatarInk: '#3D3C38',
    dotIdle: '#CFCCC2',
  },
  dark: {
    paper: '#121211',
    ink: '#F1EFE8',
    surface: '#1D1D1B',
    raised: '#242422',
    tonal: '#2A2A27',
    graphite: '#A3A199',
    track: '#333330',
    hairline: '#262624',
    kaki: '#E0543A',
    danger: '#F0705A',
    segment: '#242422',
    field: '#2A2A27',
    switchOff: '#3A3A37',
    onInk: '#121211',
    avatarInk: '#D8D5CC',
    dotIdle: '#3A3A37',
  },
};

// React Native selects custom fonts by file (PostScript) name, not by
// fontWeight, so each weight is its own family.
const fonts = {
  sans: {
    regular: 'Figtree-Regular',
    medium: 'Figtree-Medium',
    semibold: 'Figtree-SemiBold',
    bold: 'Figtree-Bold',
  },
  serif: {
    medium: 'ShipporiMincho-Medium',
  },
};

module.exports = {colors, fonts};
