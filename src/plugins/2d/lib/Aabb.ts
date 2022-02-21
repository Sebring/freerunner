import { clonePoint, createPoint, maxPoint, minPoint, Point } from './Point.js';
import { Rotatable } from './Rotatable.js';

export interface AABB {
  min: Point
  max: Point
}

export interface RotatableAABB extends Rotatable<AABB> {
}

/**
 * Create aabb by providing points for min, max.
 * @param min 
 * @param max 
 * @returns 
 */
export function createAABB (min: Point = createPoint(), max: Point = createPoint()): AABB {
  return { min, max }
}

/**
 * Deep clone an aabb.
 * @param aabb 
 * @returns 
 */
export function cloneAABB (aabb: AABB): AABB {
  return { min: clonePoint(aabb.min), max: clonePoint(aabb.max) }
}

export function mbrAABB (a: AABB, b: AABB) {
  return createAABB(minPoint(a.min, b.min), maxPoint(a.max, b.max))
}

export function mbrFromRotatedAABB(a: AABB, rotation: number) {
  
}
