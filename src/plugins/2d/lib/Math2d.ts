
export function degreesToRadians(d: number) {
  return d * Math.PI / 180
}

export function sinusRadians(radians: number) {
  return roundInfinityFloat(Math.sin(radians))
}

export function cosinusRadians(radians: number) {
  return roundInfinityFloat(Math.cos(radians))
}

/**
 * Math.cos(Math.PI) r:90 and Math.sin(Math.PI/2) r:45
 * @param f float result of cos or sin
 * @returns 
 */
export function roundInfinityFloat(f: number):number {
	return (f < 1e-10 && f > -1e-10) ? 0 : f
}