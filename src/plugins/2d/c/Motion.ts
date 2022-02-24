import { FComponent } from "../../../freerunner.js";
import { eqPoint, E_2D, Point } from "../2d.js";
import { emptyRect, Rect } from "../lib/Rect.js";

export interface E_Motion extends E_2D, C_Motion {
  ax: number
  ay: number
  dx: number
  dy: number
  vx: number
  vy: number
}

type DirectionPoint = {
  x: -1 | 0 | 1,
  y: -1 | 0 | 1
}

interface C_Motion {
  _ax: number,
  _ay: number,
  _dx: number,
  _dy: number,
  _vx: number,
  _vy: number,
  _acceleration: Point,
  _motionDelta: Point,
  __oldDirection: DirectionPoint

  acceleration(): Point
  ccdbr(ccdbr: Rect): Rect
  motionDelta(): Point
  resetMotion(): E_Motion
  velocity(): Point

  _linearMotionTick(frameDelta: any): void
}

interface MotionComponent extends C_Motion, FComponent {
  _motionProp(prop: string, v: number): void
}

const Motion : MotionComponent = {
  name: 'Motion',
  type: 'Component',

  required: '2D',

  _ax: 0,
  _ay: 0,
  _dx: 0,
  _dy: 0,
  _vx: 0,
  _vy: 0,
  _acceleration: {x:0, y:0},
  _motionDelta: {x:0, y:0},
  __oldDirection: {x:0, y:0} as DirectionPoint,

  init(this: E_Motion) {
    // fix properties
    this.bind('UpdateFrame', this._linearMotionTick)
  },

  remove(this: E_Motion) {
    this.unbind('UpdateFrame', this._linearMotionTick)
  },

  properties: {
    vx: {
      set(this: MotionComponent, v: number) {
        this._motionProp('vx', v)
      },
      get(this: MotionComponent) {
        return this._vx
      }
    },
    vy: {
      set(this: MotionComponent, v: number) {
        this._motionProp('vy', v)
      },
      get(this: MotionComponent) {
        return this._vy
      }
    }
  },

  _motionProp(this: E_Motion, prop: string, v: number) {
    this[`_${prop}`] = v
  },

  /**
   * Linear x, y acceleration
   */
  acceleration(this: E_Motion): Point {
    return this._acceleration
  },

  /**
   * CCDBR is the continous collision detectection bounding rectangle, 
   * hence mbr + velocity
   * FIXME - unpure, side effects on argument ccdbr
   */
  ccdbr(this: E_Motion, ccdbr: Rect): Rect {
    console.error('Motion.ccdbr: Not implemented')
    return emptyRect
  },

  /**
   * Difference between position from last frame.
   */
  motionDelta(this: E_Motion): Point {
    return this._motionDelta
  },

  /**
   * Reset all linear motion (velocity, acceleration, motionDelta).
   * @returns this
   */
  resetMotion(this: E_Motion): E_Motion {
    this.vx = this.vy = this.ax = this.ay = this._dx = this._dy = 0
    return this
  },

  /**
   * Get the velocity vector.
   */
  velocity(this: E_Motion): Point {
    return this._velocity
  },

  // update according to velocity
  // bound to trigger on `UpdateFrame`
  // FIXME: delta type
  _linearMotionTick(this: E_Motion, delta: any) {
    let dt = delta.dt / 1000
    let vx = this._vx
    let vy = this._vy
    let ax = this._ax
    let ay = this._ay

    // update delta movement
    this._dx = getDeltaPosition(vx, ax, dt)
    this._dy = getDeltaPosition(vy, ay, dt)

    // update velocity = a * Δt
    this.vx = getNewVelocity(vx, ax, dt)
    this.vy = getNewVelocity(vy, ay, dt)

    // check for new direction
    const currDirection = getDirectionPoint(this._vx, this._vy)
    if (!eqPoint(currDirection, this.__oldDirection)) {
      this.__oldDirection = {...currDirection}
      this.trigger('NewDirection', currDirection)
    }

    // update position
    this._setPosition(this._x + this._dx, this._y + this._dy)
  },

}

/**
 * Calculate updated position given delta time.
 *  v * Δt + (0.5 * a) * Δt * Δt
 * @param v velocity
 * @param a acceleration
 * @param dt delta time
 * @returns position change
 */
const getDeltaPosition = (v: number, a: number, dt: number): number => {
  return v * dt + 0.5 * a * dt * dt
}

/**
 * Calculate updated velocity given delta time. 
 * v += a * Δt
 * @param v velocity
 * @param a acceleration
 * @param dt delta time
 * @returns new velocity
 */
const getNewVelocity = (v: number, a: number, dt: number): number => {
  return v + a * dt
}

const getDirectionPoint = (x: number, y: number): DirectionPoint => {
  return { x: x ? (x < 0 ? -1 : 1) : 0 , y: y ? (y < 0 ? -1 : 1) : 0 }
}

export default Motion
