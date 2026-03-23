export const tailwindMap = {
  bold: 'font-bold',
  italic: 'italic',
  underline: 'underline',
  strikethrough: 'line-through',

  fontSizes: {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
    '4xl': 'text-4xl',
    '5xl': 'text-5xl',
  } as Record<string, string>,

  fontWeights: {
    thin: 'font-thin',
    light: 'font-light',
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
    extrabold: 'font-extrabold',
    black: 'font-black',
  } as Record<string, string>,

  headingDefaults: {
    1: 'text-5xl font-bold',
    2: 'text-4xl font-bold',
    3: 'text-3xl font-semibold',
    4: 'text-2xl font-semibold',
    5: 'text-xl font-medium',
    6: 'text-lg font-medium',
  } as Record<number, string>,

  align: {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
    justify: 'text-justify',
  } as Record<string, string>,
} as const

export type FontSizeKey = keyof typeof tailwindMap.fontSizes
export type FontWeightKey = keyof typeof tailwindMap.fontWeights
