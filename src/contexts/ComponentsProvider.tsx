import React, { ReactNode } from 'react'
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper'

type Props = {
	children: ReactNode
}

const theme = {
	...DefaultTheme,
	colors: {
		...DefaultTheme.colors,
		primary: '#6200ee',
		accent: '#03dac4',
		background: '#ffffff',
		surface: '#ffffff',
		text: '#000000',
	},
}

export default function ComponentsProvider({ children }: Props) {
	return <PaperProvider theme={theme}>{children}</PaperProvider>
}

export { theme }
