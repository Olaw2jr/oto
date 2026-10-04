import {ComponentProps, FC, PropsWithChildren} from 'react';
import {TailwindProvider as BaseTailwindProvider} from 'tailwind-rn';

// tailwind-rn types its provider as React.FC without children, which React 18
// types no longer add implicitly.
export const TailwindProvider = BaseTailwindProvider as FC<
  PropsWithChildren<ComponentProps<typeof BaseTailwindProvider>>
>;
