import chroma from "chroma-js";

/**
 * Adjusts a color to be softer (lower saturation, higher brightness)
 * @param hexColor The original hex color
 * @returns The adjusted hex color
 */
export function softenColor(hexColor: string): string {
	try {
		// Desaturate by 0.5 (make it less vibrant) and brighten by 0.5 (make it more pastel)
		return chroma(hexColor).desaturate(0.5).brighten(0.5).hex();
	} catch (_e) {
		console.warn("Invalid color:", hexColor);
		return hexColor;
	}
}
