import { clonePoint, createPoint, Point } from './Point.js';

/**
 * Max/min rectangle of two points. 
 */
export interface AABB {
  min: Point
  max: Point
}

/**
 * Create aabb by providing points for min, max.
 * @param min point defining x, y
 * @param max point defining x+w, y+h
 * @returns new aabb
 */
export function createAABB (min: Point = createPoint(), max: Point = createPoint()): AABB {
  return { min, max }
}

/**
 * Deep clone an aabb.
 * @param aabb original
 * @returns new aab
 */
export function cloneAABB (aabb: AABB): AABB {
  return { min: clonePoint(aabb.min), max: clonePoint(aabb.max) }
}

export function mbrFromRotatedAABB(a: AABB, rotation: number) {
}

export function intersectsAABB(a: AABB, b: AABB) {
  return a.min.x < b.max.x && a.max.x > b.min.x && a.min.y < b.max.y && a.max.y > b.min.y
}
