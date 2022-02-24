
import { Polygon } from "./Polygon.js";
import { createPoint, Point } from "./Point.js";
import { Rect } from "./Rect.js";

/*

	## Concern:
  * Does it handle containment, when A is totally inside B or the other way round?

	## Optimization:
	* Overlap of identical projections could be skipped.
	* If same poly is tested against multiple polys some calculations could be cashed.
	* All normals are pre-calcuated on creation of SatPoly. It's a cheap calc but for 
		high count polys that could impact.
	*/

export interface SatOverlap extends Point {
    overlap: number,
}

interface Line extends Point {}
interface MinMax {
	min: number
	max: number
}

/**
 * Get edges from a vertices.
 * @param vertices as line vectors
 */
function getEdgesFromVertices(vertices: Point[]): Line[] {
	function getEdgeFromVertices(a: Point, b: Point): Line {
		return { x: b.x - a.x, y: b.y - a.y }
	}

	function recursiveGroupAndGetEdge(acc: Point[], [head, next, ...tail]: Point[]): Point[] {
		if (!next) return acc
		acc.push(getEdgeFromVertices(head, next))
		return recursiveGroupAndGetEdge(acc, [next, ...tail])
	}

	return recursiveGroupAndGetEdge([], [...vertices, vertices[0]])
}

/**
 * Get normals from an edges
 * @param edges 
 */
function getNormalsFromEdges(edges: Line[]): Line[] {
	
	// aka perp
	function getNormalFromEdge(a: Line): Line {
		return {x: -a.y, y: a.x}
	}

	let normals = edges.map(getNormalFromEdge)
	return normals
}

/**
 * Get the max-min extreme dotproduct for a polygon of a normal 
 * @param normals 
 */
function getDotProductMinMaxOnPolygonFromLine(polygon: Polygon, normal: Line): MinMax {
	
	function getNormalizedDotProduct(point: Point, normal: Line): number {
		return  (normal.x * point.x + normal.y * point.y) / Math.sqrt((normal.x * normal.x) + (normal.y * normal.y))
	}

	function reduceToMinMax(a: MinMax, b: number) {
		return { min: Math.min(a.min, b), max: Math.max(a.max, b) }
	}

	const dotProducts = polygon.points.map(p => getNormalizedDotProduct(p, normal))
	const minMax = dotProducts.reduce(reduceToMinMax, { min: Infinity, max: -Infinity })
	return minMax
}

/**
 * Get overlapping value of two projections, 0 if no overlap
 * FIXME: is returning 0 as false a problem if overlap actually is 0?
 * @param a 
 * @param b 
 * @returns overlap magnitude or 0 for no overlap
 */
function getOverlappingProjections(a: MinMax, b: MinMax): number {

	// check if both x and y are positive
	function isPointPositive(p: Point): boolean {
		return (p.x > 0 && p.y > 0)
	}

	const gap1 = createPoint(a.max - b.min, b.min - a.min)
	const overlap1 = isPointPositive(gap1) && gap1.x
	const gap2 = createPoint(b.max - a.min, a.min - b.min)	
	const overlap2 = isPointPositive(gap2) && gap2.x
	return overlap1 || overlap2 || 0
}

/**
 * Normalize x, y of a line
 * @param line 
 * @returns 
 */
function getNormalizedLine(line: Line): Line {
	const L = Math.sqrt((line.x * line.x) + (line.y * line.y))
	return {x: line.x/L, y: line.y/L}
}

interface SatPolygon extends Polygon {
	normals: Line[]
	getDotProductsOnNormal(normal: Line): MinMax
}

// constructor
function satPolygon(polygon: Polygon) {
	return {
		points: polygon.points,
		normals: getNormalsFromEdges(getEdgesFromVertices(polygon.points)),
		getDotProductsOnNormal: (normal: Line) => getDotProductMinMaxOnPolygonFromLine(polygon, normal),
	} as SatPolygon
}

type Overlap = {
	overlap: number,
	normal: Line
}

export default function getSat5(polygonA: Polygon, polygonB: Polygon): SatOverlap|null {
	const satA = satPolygon(polygonA)
	const satB = satPolygon(polygonB)

	// recurse over projections to find lowest overlap - fast bail if no overlap 
	const o = recursiveOverlap({overlap: Infinity, normal: createPoint(0,0)}, [...satA.normals, ...satB.normals])
	function recursiveOverlap(lowest: Overlap, [head, ...tail]: Line[]): SatOverlap  {
		const a_projection = satA.getDotProductsOnNormal(head)
		const b_projection = satB.getDotProductsOnNormal(head)
		const overlapping = getOverlappingProjections(a_projection, b_projection)
		if (!overlapping) return null
		if (overlapping < lowest.overlap) {
			lowest = (overlapping < lowest.overlap) ? {overlap: overlapping, normal: head} : lowest
		}
		if (!tail.length) {
			const {x, y} = getNormalizedLine(lowest.normal)
			return {x, y , overlap: lowest.overlap}
		}
		return recursiveOverlap(lowest, tail)
	}

	return o
}

/**
 * Checks whether two rectangles overlap.
 * Compatible with crafty overlap but only reports x or y, never both
 * FIXME: report n on both x and y
 */
 const overlapAmount = (a: Rect, b: Rect): null|SatOverlap => {

  const x1 = b._x + b._w - a._x // X if a is left of bw
  if (x1<1) return null
  const x2 = a._x + a._w - b._x // X if b is left of aw
  if (x2<1) return null
  const y1 = b._y + b._h - a._y // Y if a is above bh
  if (y1<1) return null
  const y2 =  a._y + a._h - b._y // Y if a+h is below b
  if (y2<1) return null
  // we have overlap
  const min = Math.min(x1, x2, y1, y2)
  const nx = min === x1 || min === x2 ? x1-x2 > 0 ? 1 : -1 : 0
  const ny = min === y1 || min === y2 ? y1-y2 > 0 ? 1 : -1 : 0
  const overlap = -min
	
  return {overlap, x: nx, y: ny}
}

/*
// original crafty SAT
export function getSAT1 (poly1: Polygon, poly2: Polygon): null|SatOverlap {
	var i = 0,
			points1 = poly1.points, points2 = poly2.points,
			l = points1.length/2,
			j, k = points2.length/2,
			nx=0, ny=0,
			length,
			min1, min2,
			max1, max2,
			interval,
			MTV = -Infinity,
			MNx = 0,
			MNy = 0,
			dot,
			np;

	//loop through the edges of Polygon 1
	for (; i < l; i++) {
			np = (i === l - 1 ? 0 : i + 1);

			//generate the normal for the current edge
			nx = -(points1[2*i+1] - points1[2*np+1]);
			ny = (points1[2*i] - points1[2*np]);

			//normalize the vector
			length = Math.sqrt(nx * nx + ny * ny);
			nx /= length;
			ny /= length;

			//default min max
			min1 = min2 = Infinity;
			max1 = max2 = -Infinity;

			//project all vertices from poly1 onto axis
			for (j = 0; j < l; ++j) {
					dot = points1[2*j] * nx + points1[2*j+1] * ny;
					if (dot > max1) max1 = dot;
					if (dot < min1) min1 = dot;
			}

			//project all vertices from poly2 onto axis
			for (j = 0; j < k; ++j) {
					dot = points2[2*j] * nx + points2[2*j+1] * ny;
					if (dot > max2) max2 = dot;
					if (dot < min2 ) min2 = dot;
			}

			//calculate the minimum translation vector should be negative
			if (min1 < min2) {
					interval = min2 - max1;
					nx = -nx;
					ny = -ny;
			} else {
					interval = min1 - max2;
			}

			//exit early if positive
			if (interval >= 0) {
					return null
			}

			if (interval > MTV) {
					MTV = interval;
					MNx = nx;
					MNy = ny;
			}
	}

	//loop through the edges of Polygon 2
	for (i = 0; i < k; i++) {
			np = (i === k - 1 ? 0 : i + 1);

			//generate the normal for the current edge
			nx = -(points2[2*i+1] - points2[2*np+1]);
			ny = (points2[2*i] - points2[2*np]);

			//normalize the vector
			length = Math.sqrt(nx * nx + ny * ny);
			nx /= length;
			ny /= length;

			//default min max
			min1 = min2 = Infinity;
			max1 = max2 = -Infinity;

			//project all vertices from poly1 onto axis
			for (j = 0; j < l; ++j) {
					dot = points1[2*j] * nx + points1[2*j+1] * ny;
					if (dot > max1) max1 = dot;
					if (dot < min1) min1 = dot;
			}

			//project all vertices from poly2 onto axis
			for (j = 0; j < k; ++j) {
					dot = points2[2*j] * nx + points2[2*j+1] * ny;
					if (dot > max2) max2 = dot;
					if (dot < min2) min2 = dot;
			}

			//calculate the minimum translation vector should be negative
			if (min1 < min2) {
					interval = min2 - max1;
					nx = -nx;
					ny = -ny;
			} else {
					interval = min1 - max2;
			}

			//exit early if positive
			if (interval >= 0) {
					return null
			}

			if (interval > MTV) {
					MTV = interval;
					MNx = nx;
					MNy = ny;
			}
	}

	return {
			overlap: MTV,
			nx: MNx,
			ny: MNy
	}
}

// use rectangles if applicable
export default function getSAT2 (poly1: Polygon, poly2: Polygon): null|SatOverlap {
  if (isPolyRect(poly1) && isPolyRect(poly2)) {
    return overlapAmount(polyToRect(poly1), polyToRect(poly2))
  }
	var i = 0,
			points1 = poly1.points, points2 = poly2.points,
			l = points1.length/2,
			j, k = points2.length/2,
			nx=0, ny=0,
			length,
			min1, min2,
			max1, max2,
			interval,
			MTV = -Infinity,
			MNx = 0,
			MNy = 0,
			dot,
			np;

	//loop through the edges of Polygon 1
	for (; i < l; i++) {
			np = (i === l - 1 ? 0 : i + 1);

			//generate the normal for the current edge
			nx = -(points1[2*i+1] - points1[2*np+1]);
			ny = (points1[2*i] - points1[2*np]);

			//normalize the vector
			length = Math.sqrt(nx * nx + ny * ny);
			nx /= length;
			ny /= length;

			//default min max
			min1 = min2 = Infinity;
			max1 = max2 = -Infinity;

			//project all vertices from poly1 onto axis
			for (j = 0; j < l; ++j) {
					dot = points1[2*j] * nx + points1[2*j+1] * ny;
					if (dot > max1) max1 = dot;
					if (dot < min1) min1 = dot;
			}

			//project all vertices from poly2 onto axis
			for (j = 0; j < k; ++j) {
					dot = points2[2*j] * nx + points2[2*j+1] * ny;
					if (dot > max2) max2 = dot;
					if (dot < min2 ) min2 = dot;
			}

			//calculate the minimum translation vector should be negative
			if (min1 < min2) {
					interval = min2 - max1;
					nx = -nx;
					ny = -ny;
			} else {
					interval = min1 - max2;
			}

			//exit early if positive
			if (interval >= 0) {
					return null
			}

			if (interval > MTV) {
					MTV = interval;
					MNx = nx;
					MNy = ny;
			}
	}

	//loop through the edges of Polygon 2
	for (i = 0; i < k; i++) {
			np = (i === k - 1 ? 0 : i + 1);

			//generate the normal for the current edge
			nx = -(points2[2*i+1] - points2[2*np+1]);
			ny = (points2[2*i] - points2[2*np]);

			//normalize the vector
			length = Math.sqrt(nx * nx + ny * ny);
			nx /= length;
			ny /= length;

			//default min max
			min1 = min2 = Infinity;
			max1 = max2 = -Infinity;

			//project all vertices from poly1 onto axis
			for (j = 0; j < l; ++j) {
					dot = points1[2*j] * nx + points1[2*j+1] * ny;
					if (dot > max1) max1 = dot;
					if (dot < min1) min1 = dot;
			}

			//project all vertices from poly2 onto axis
			for (j = 0; j < k; ++j) {
					dot = points2[2*j] * nx + points2[2*j+1] * ny;
					if (dot > max2) max2 = dot;
					if (dot < min2) min2 = dot;
			}

			//calculate the minimum translation vector should be negative
			if (min1 < min2) {
					interval = min2 - max1;
					nx = -nx;
					ny = -ny;
			} else {
					interval = min1 - max2;
			}

			//exit early if positive
			if (interval >= 0) {
					return null
			}

			if (interval > MTV) {
					MTV = interval;
					MNx = nx;
					MNy = ny;
			}
	}

	return {
			overlap: MTV,
			nx: MNx,
			ny: MNy
	}
}

export function getSAT3 (poly1: Polygon, poly2: Polygon): null|SatOverlap {
  if (isPolyRect(poly1) && isPolyRect(poly2)) {
		
    return overlapAmount(polyToRect(poly1), polyToRect(poly2))
  }
	var i = 0,
			points1 = poly1.points, points2 = poly2.points,
			l = points1.length/2,
			j, k = points2.length/2,
			nx=0, ny=0,
			length,
			min1, min2,
			max1, max2,
			interval,
			MTV = -Infinity,
			MNx = 0,
			MNy = 0,
			dot,
			np;

	//loop through the edges of Polygon 1
	for (; i < l; i++) {
			np = (i === l - 1 ? 0 : i + 1);

			//generate the normal for the current edge
			nx = -(points1[2*i+1] - points1[2*np+1]);
			ny = (points1[2*i] - points1[2*np]);

			//normalize the vector
			length = Math.sqrt(nx * nx + ny * ny);
			nx /= length;
			ny /= length;

			//default min max
			min1 = min2 = Infinity;
			max1 = max2 = -Infinity;

			//project all vertices from poly1 onto axis
			for (j = 0; j < l; ++j) {
					dot = points1[2*j] * nx + points1[2*j+1] * ny;
					if (dot > max1) max1 = dot;
					if (dot < min1) min1 = dot;
			}

			//project all vertices from poly2 onto axis
			for (j = 0; j < k; ++j) {
					dot = points2[2*j] * nx + points2[2*j+1] * ny;
					if (dot > max2) max2 = dot;
					if (dot < min2 ) min2 = dot;
			}

			//calculate the minimum translation vector should be negative
			if (min1 < min2) {
					interval = min2 - max1;
					nx = -nx;
					ny = -ny;
			} else {
					interval = min1 - max2;
			}

			//exit early if positive
			if (interval >= 0) {
					return null
			}

			if (interval > MTV) {
					MTV = interval;
					MNx = nx;
					MNy = ny;
			}
	}

	//loop through the edges of Polygon 2
	for (i = 0; i < k; i++) {
			np = (i === k - 1 ? 0 : i + 1);

			//generate the normal for the current edge
			nx = -(points2[2*i+1] - points2[2*np+1]);
			ny = (points2[2*i] - points2[2*np]);

			//normalize the vector
			length = Math.sqrt(nx * nx + ny * ny);
			nx /= length;
			ny /= length;

			//default min max
			min1 = min2 = Infinity;
			max1 = max2 = -Infinity;

			//project all vertices from poly1 onto axis
			for (j = 0; j < l; ++j) {
					dot = points1[2*j] * nx + points1[2*j+1] * ny;
					if (dot > max1) max1 = dot;
					if (dot < min1) min1 = dot;
			}

			//project all vertices from poly2 onto axis
			for (j = 0; j < k; ++j) {
					dot = points2[2*j] * nx + points2[2*j+1] * ny;
					if (dot > max2) max2 = dot;
					if (dot < min2) min2 = dot;
			}

			//calculate the minimum translation vector should be negative
			if (min1 < min2) {
					interval = min2 - max1;
					nx = -nx;
					ny = -ny;
			} else {
					interval = min1 - max2;
			}

			//exit early if positive
			if (interval >= 0) {
					return null
			}

			if (interval > MTV) {
					MTV = interval;
					MNx = nx;
					MNy = ny;
			}
	}

	return {
			overlap: MTV,
			nx: MNx,
			ny: MNy
	}
}
*/
