import { cosinusRadians, sinusRadians } from "./Math2d.js"

export interface Point {
  x: number
  y: number
}

/**
 * Create a `Point`.
 * @param x 
 * @param y 
 * @returns new `Point`
 */
export function createPoint(x: number = 0, y: number = 0): Point {
  return { x, y }
}

/**
 * Deep clone a `Point`.
 * @param point 
 * @returns new `Point`
 */
export function clonePoint(point: Point): Point {
  return { x: point.x, y: point.y }
}

/**
 * Eq
 * @param a 
 * @param b 
 * @returns 
 */
 export function eqPoint(a: Point, b: Point): boolean {
  return a.x === b.x && a.y === b.y
}

/**
 * Get `Point` with min x and min y.
 * @param a 
 * @param b 
 * @returns new `Point`
 */
export function minPoint (a: Point, b: Point) {
  return {x: Math.min(a.x, b.x), y: Math.min(a.y, b.y)}
}

/**
 * Get min x and min y of points.
 * @param points 
 * @returns new `Point`
 */
 export function minPoints(...points: Point[]): Point {
  return points.reduce(minPoint, {x:Infinity, y:Infinity})
}

/**
 * Get `Point` with max x and max y.
 * @param a 
 * @param b 
 * @returns new `Point`
 */
export function maxPoint(a: Point, b: Point) {
  return {x: Math.max(a.x, b.x), y: Math.max(a.y, b.y)}
}

/**
 * Get max x and max y of points.
 * @param points 
 * @returns new `Point`
 */
 export function maxPoints(...points: Point[]): Point {
  return points.reduce(maxPoint, {x: -Infinity, y: -Infinity})
}

/**
 * Get edge line vector of two points. 
 * @param a 
 * @param b 
 * @returns new `Point`
 */

export function edgePoint(a: Point, b:Point) {
  return { x: b.x - a.x, y: b.y - a.y }
}


/**
 * Sum all x and y of points.
 * @param points 
 * @returns new `Point`
 */
export function sumPoints(...points: Point[]): Point {
  return points.reduce(shiftPoint)
}

/**
 * Substract all x and y of points.
 * @param points 
 * @returns new `Point`
 */
export function substractPoints(...points: Point[]): Point {
  return points.reduce((a, b) => ({x:a.x - b.x, y: a.y - b.y}))
}

/**
 * Rotated point.
 * @param point 
 * @param origin 
 * @param degrees 
 * @returns new `Point`
 */
export function rotatePoint(point: Point, origin: Point, degrees: number): Point {
  // no rotation if point matches origin
  if (eqPoint(point, origin)) {
    return point
  }
  const rad = degrees * Math.PI / 180
	const cosRad = cosinusRadians(rad)
	const sinRad = sinusRadians(rad)
  
  const ax = point.x - origin.x
	const ay = point.y - origin.y
	return {x: origin.x + ax * cosRad - ay * sinRad, y: origin.y + ax * sinRad + ay * cosRad}
}

/**
 * Shift point.
 * @param point 
 * @param shift 
 * @returns new `Point`
 */
export function shiftPoint(point: Point, shift: Point): Point {
  return {x: point.x + shift.x, y: point.y + shift.y}
}
