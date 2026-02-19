import { registerRootComponent } from 'expo';

import App from './App';

// If we're running on the web, attempt to load Skia's WASM first so the
// graphics runtime is ready before the app mounts. Use a dynamic require so
// native platforms without the package won't crash.
if (typeof window !== 'undefined') {
	try {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const { LoadSkiaWeb } = require('@shopify/react-native-skia/lib/module/web');
		if (typeof LoadSkiaWeb === 'function') {
			LoadSkiaWeb()
				.then(() => {
					// Skia loaded — register app
					registerRootComponent(App);
				})
				.catch((err: any) => {
					// If Skia failed to load, still mount the app with a fallback
					// (MiJuegoSkia and other components use dynamic require/fallbacks).
					// eslint-disable-next-line no-console
					console.warn('LoadSkiaWeb failed:', err);
					registerRootComponent(App);
				});
		} else {
			registerRootComponent(App);
		}
	} catch (e) {
		// Package not installed or other error — continue without blocking mount
		// eslint-disable-next-line no-console
		console.warn('Could not initialize Skia web loader:', e);
		registerRootComponent(App);
	}
} else {
	// Non-web platforms: register immediately
	registerRootComponent(App);
}
