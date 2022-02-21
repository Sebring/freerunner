export interface Point {
  x: number
  y: number
}

export function createPoint(x: number = 0, y: number = 0): Point {
  return { x, y }
}

/**
 * Deep clone a point.
 * @param point 
 * @returns 
 */
export function clonePoint(point: Point): Point {
  return { x: point.x, y: point.y }
}

/**
 * Get point with min x and min y of provided points.
 * @param a 
 * @param b 
 * @returns 
 */
export function minPoint (a: Point, b: Point) {
  return {x: Math.min(a.x, b.x), y: Math.min(a.y, b.y)}
}

// get max.x max.y 
export function maxPoint(a: Point, b: Point) {
  return {x: Math.max(a.x, b.x), y: Math.max(a.y, b.y)}
}

// point === point ?
export function eqPoint(a: Point, b: Point): boolean {
  return a.x === b.x && a.y === b.y
}

export function edgePoint(a: Point, b:Point) {
  return { x: b.x - a.x, y: b.y - a.y }
}

export function minPoints(...points: Point[]): Point {
  return points.reduce(minPoint, {x:Infinity, y:Infinity})
}

export function maxPoints(...points: Point[]): Point {
  return points.reduce(maxPoint, {x: -Infinity, y: -Infinity})
}

export function addPoints(...points: Point[]): Point {
  return points.reduce(shiftPoint)
}

export function substractPoints(...points: Point[]): Point {
  return points.reduce((a, b) => ({x:a.x - b.x, y: a.y - b.y}))
}

export function rotatePoint(point: Point, origin: Point, rotation: number): Point {
  // no rotation if point matches origin
  if (eqPoint(point, origin)) {
    return point
  }
  const rad = rotation * Math.PI / 180
	const cosRad = roundInfinityFloat(Math.cos(rad))
	const sinRad = roundInfinityFloat(Math.sin(rad))
  
  const ax = point.x - origin.x
	const ay = point.y - origin.y
	return {x: origin.x + ax * cosRad - ay * sinRad, y: origin.y + ax * sinRad + ay * cosRad}
}

export function shiftPoint(point: Point, shift: Point): Point {
  return {x: point.x + shift.x, y: point.y + shift.y}
}

// Math.cos(Math.PI) r:90 and Math.sin(Math.PI/2) r:45
const roundInfinityFloat = (n: number):number => {
	return (n < 1e-10 && n > -1e-10) ? 0 : n
}
