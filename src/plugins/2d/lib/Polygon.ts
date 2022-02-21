import { AABB, createAABB } from "./Aabb.js"
import { createPoint, maxPoints, minPoints, Point, rotatePoint, shiftPoint } from "./Point.js"
import { Rect } from "./Rect.js"

export interface Polygon {
	points: Point[]
}

/**
 * Create polygon
 * @param points
 * @returns new `Polygon`
 */
export default function createPolygon (points: Point[]): Polygon {
	return { points: [...points] }
}
 

/**
 * Determine if a given point is contained by the polygon.
 * 
 * Performs the even-odd-rule Algorithm (a raycasting algorithm) to find out whether a point is in a given polygon.
 * Runs in O(n) where n is the number of edges of the polygon.
 * https://en.wikipedia.org/wiki/Even%E2%80%93odd_rule
 * 
 * @deprecated - broken - needs fixing
 */
export const pointInPolygon = ({points: p}: Polygon, {y, x}: Point): boolean => {
	const N = p.length/2 // half because [x, y] tuples and not actual points
	let odd = false
/*
FIXME: broken - update to use points

	for (let i=0, j=N-1; i<N; j = i++) {
		if (((p[2*i+1] > y) !== (p[2*j+1] > y)) && (x < (p[2*j] - p[2*i]) * (y - p[2*i+1]) / (p[2*j+1] - p[2*i+1]) + p[2*i])) {
			odd = !odd;
		}
	}
*/

	return odd;
}

/**
 * Shifts every single point in the polygon by the specified amount.
 * @param polygon original
 * @param shift shift vector
 * @returns new polygon
 */
export const shiftPolygon = (polygon: Polygon, shift: Point): Polygon =>
	({points: polygon.points.map(p => shiftPoint(p, shift))})

/**
 * Clone a polygon.
 * @param polygon base poly to clone
 * @returns new polygon
 */
export function clonePolygon ({points}: Polygon): Polygon  {
	return createPolygon(points)
}

/**
 * Create polygon from a `Rect`.
 * @param rect Original rect
 * @returns new polygon
 */
export const createPolygonfromRect = ({ _x: x, _y: y, _w: w, _h: h }: Rect): Polygon =>
	createPolygon([createPoint(x, y), createPoint(x + w, y), createPoint(x + w, y + h), createPoint(x, y + h)])

/**
 * Check if obj is a `Polygon`.
 * @param obj 
 * @returns true if property points: number[]
 */
export const isPolygon = (obj: any): boolean =>
	(!!obj && !!obj.points && typeof obj.points.length === 'number')

/**
 * Translate polygon to a `Rect` 
 * @param polygon  
 * @deprecated - broken
 */
export const polygonToRect = ({points: p}: Polygon): Rect =>
	({_x: 0, _y:0, _w:0, _h:0})
//({ _x: p[0].x, _y: p[0].y, _w: p[1].x-p[0].x, _h: p[1].y-p[0].y })

/**
 * Get rotated polygon
 * @param polygon polygon to rotate
 * @param rotation degrees
 * @param origin world based origin
 * @returns A rotated polygon
 */
export const rotatePolygon = (polygon: Polygon, rotation: number, origin: Point): Polygon => 
	createPolygon(polygon.points.map(p => rotatePoint(p, origin, rotation)))

/**
 * Checks if polygon is unrotated rectangle.
 * @param polygon 
 * @returns true if polygon is un-rotated rectangle.
 */
export function isPolygonRect({points: p}: Polygon): boolean {
	// check for matching vertex coords
	/*
		0: X-Y  	1: XW-Y
		3: X-YH 	2: XW-YH
	*/
	return p.length === 4 && p[0].x === p[3].x && p[0].y === p[1].y && p[2].y === p[3].y && p[1].x === p[2].x
}

/**
 * Return mbr of polygon as `AABB`. 
 * @param polygon 
 * @returns 
 */
export function polygonToAABB (polygon: Polygon): AABB {
	return createAABB(minPoints(...polygon.points), maxPoints(...polygon.points))
}
	
