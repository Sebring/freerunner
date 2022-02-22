import { expect, test } from '@playwright/test';
import { createPoint } from '../build/plugins/2d/lib/Point.js';
import { clonePolygon, createPolygon, createPolygonfromRect, isPolygon, isPolygonRect, rotatePolygon, shiftPolygon } from '../build/plugins/2d/lib/Polygon.js';

test.describe.parallel ('Polygon methods', () => {
	const p0 = createPoint(3, 1)
	const p1 = createPoint(4, 1)
	const p2 = createPoint(4, 3)
	const p3 = createPoint(3, 3)
	const ps = [p0, p1, p2, p3]
	
	const polygon = createPolygon(ps)

	test('create', () => {
		expect(polygon.points).toMatchObject(ps)
	})

	test('rotation', () => {
		const rotated = rotatePolygon(polygon, 90, {x:3, y:1})
		const r0 = createPoint(3, 1)
		const r1 = createPoint(3, 2)
		const r2 = createPoint(1, 2)
		const r3 = createPoint(1, 1)
		expect(rotated.points).toMatchObject([r0, r1, r2, r3])
	})

	test('clone', () => {
		const clone = clonePolygon(polygon)
		expect(polygon.points).toMatchObject(ps)
		expect(clone.points).toMatchObject(ps)

		// change clone
		clone.points = [p1, p0, p2, p3]
		expect(clone.points).toMatchObject([p1, p0, p2, p3])
		// original is unchanged
		expect(polygon.points).toMatchObject(ps)
	})

	test('shift', () => {
		const shifted = shiftPolygon(polygon, {x: 3, y: 4})
		const s0 = createPoint(6, 5)
		const s1 = createPoint(7, 5)
		const s2 = createPoint(7, 7)
		const s3 = createPoint(6, 7)
		expect(shifted.points).toMatchObject([s0, s1, s2, s3])
	})

	test('isPolygon', () => {
		const rect = {_x: 3, _y: 1, _w: 1, _h: 2}
		expect(isPolygon(rect)).toBeFalsy()
		expect (isPolygon(p1)).toBeFalsy()
		expect(isPolygon(polygon)).toBeTruthy()
	})

	test('fromRect', () => {
		const rect = {_x: 3, _y: 1, _w: 1, _h: 2}
		const polygon = createPolygonfromRect(rect)
		const v0 = createPoint(3, 1)
		const v1 = createPoint(4, 1)
		const v2 = createPoint(4, 3)
		const v3 = createPoint(3, 3)
		expect(polygon.points).toMatchObject([v0, v1, v2, v3])
	})

	test('isPolygonRect', () => {
		// is rect
		expect(isPolygonRect(polygon)).toBeTruthy()
		// is not
		const polyB = createPolygon([p2, p3, p1, p0])
		expect(isPolygonRect(polyB)).toBeFalsy()
	})


})
