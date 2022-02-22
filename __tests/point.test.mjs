import test, { expect } from "@playwright/test";
import { clonePoint, createPoint, eqPoint, maxPoint, maxPoints, minPoint, minPoints, rotatePoint } from '../build/plugins/2d/lib/Point.js'

test.describe.parallel ('Point struct', () => {
  const pointA = createPoint(10, 100)
  const pointB = createPoint(-20, 200)
  const pointC  = createPoint(111, 30)

  test('create point', () => {
    expect(pointA).toMatchObject({x: 10, y: 100})
  })

  test('clone', () => {
    const cloneA = clonePoint(pointA)
    expect(cloneA).toMatchObject(pointA)
    const cloneB = clonePoint(pointA)
    expect(cloneA).toMatchObject(cloneB)

    // deep clone does not reference original
    cloneB.y = 10
    expect(cloneA).toMatchObject(pointA)
    expect(cloneA).toMatchObject(createPoint(10, 100))
    expect(cloneB).toMatchObject(createPoint(10, 10))
  })

  test('findMin', () => {
    const min = minPoint(pointA, pointB)
    expect(min).toMatchObject({x:-20, y: 100})
  })

  test('reduce min', () => {
    //const r = reduce({x: -Infinity, y: -Infinity}, maxPoint.concat)([pointB, pointA, pointC])
    const min = minPoints(pointC, pointA, pointB)
    expect(min).toMatchObject({x: -20, y: 30})
  })

  test('max', () => {
    const max = maxPoint(pointA, pointB)
    expect(max).toMatchObject({x: 10, y: 200})
  })

  test('reduce max', () => {
    const max = maxPoints(pointC, pointA, pointB)
    expect(max).toMatchObject({x: 111, y: 200})
  })

  test('equals', () => {
    const p = createPoint({x: pointA.x, y: pointA.y})
    expect(eqPoint(p, pointA)).toBeTruthy
    expect(eqPoint(pointA, pointB)).toBeTruthy
    expect(eqPoint(p, p)).toBeTruthy
    expect(eqPoint(p, pointB)).toBeFalsy
  })

  test.describe('rotation', () => {
    test('0 degrees', () => {
      const rotatedA = rotatePoint(pointA, {x: 0, y: 0}, 0)
      const rotatedB = rotatePoint(pointB, {x: 0, y: 0}, 0)
      expect(rotatedA).toMatchObject(pointA)
      expect(rotatedB).toMatchObject(pointB)
    })
    test('90 degrees', () => {
      const rotatedA = rotatePoint(pointA, {x: 0, y: 0}, 90)
      const rotatedB = rotatePoint(pointB, {x: 0, y: 0}, 90)
      expect(rotatedA).toMatchObject({x: -pointA.y, y:pointA.x})
      expect(rotatedB).toMatchObject({x: -pointB.y, y:pointB.x})
    })
    test('360 degrees', () => {
      const rotatedA = rotatePoint(pointA, {x: 0, y: 0}, 360)
      const rotatedB = rotatePoint(pointB, {x: 0, y: 0}, 360)
      expect(rotatedA).toMatchObject({x: pointA.x, y:pointA.y})
      expect(rotatedB).toMatchObject({x: pointB.x, y:pointB.y})
    })
    test('point = origin', () => {
      const rotatedA = rotatePoint(pointA, pointA, 45)
      const rotatedB = rotatePoint(pointB, pointB, 20)
      expect(rotatedA).toMatchObject(pointA)
      expect(rotatedB).toMatchObject(pointB)
    })

  })

})
