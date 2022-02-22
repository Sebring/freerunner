import test, { expect } from "@playwright/test";
import { cloneAABB, createAABB, intersectsAABB } from '../build/plugins/2d/lib/AaBb.js'
import { createPoint } from '../build/plugins/2d/lib/Point.js'

test.describe.parallel ('AABB struct', () => {
  const pointA = createPoint(200, 200)
  const boxA = createAABB(pointA, pointA)

  const pointB = createPoint(1000, -100)
  const boxB = createAABB(pointA, pointB)

  test('create', () => {
    expect(boxB.min).toMatchObject(pointA)
    expect(boxB.max).toMatchObject(pointB)
    expect(boxA.min).toMatchObject(pointA)
    expect(boxA.max).toMatchObject(pointA)
    expect(boxA).toMatchObject({min: {x:200, y:200}, max:{x:200, y:200}})
  })

  test('clone', () => {
    // clone should equal
    const boxC = cloneAABB(boxA)
    expect(boxC.min).toMatchObject(boxA.min)
    expect(boxC.max).toMatchObject(boxA.min)
    
    // deep clone is not referencing original points
    boxC.min.x = 50
    expect(boxC).toMatchObject({min: {x:50, y:200}, max:{x:200, y:200}})
    expect(boxA.min).toMatchObject(pointA)
  })

  test('intersects', () => {
    // intersection
    const boxC = createAABB(createPoint(100, 100), createPoint(300, 300))
    expect(intersectsAABB(boxC, boxA)).toBeTruthy()
    
    // no intersection
    const boxD = createAABB(createPoint(10, 10), createPoint(100, 100))
    expect(intersectsAABB(boxD, boxA)).toBeFalsy()
  })
})
