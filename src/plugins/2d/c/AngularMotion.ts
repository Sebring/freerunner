import { Component, FComponent } from "../../../freerunner.js";
import { E_2D } from "./GameObject.js";

export interface E_AngularMotion extends E_2D, C_AngularMotion {
  arotation: number
  drotation: number
  vrotation: number
}

interface C_AngularMotion {
  _arotation: number
  _drotation: number
  _vrotation: number
  _oldRotationDirection: 1|0|-1

  resetAngularMotion(this: E_AngularMotion): E_AngularMotion

  _angularMotionTick(this: E_AngularMotion, frameDelta: any): void
}

interface AngularMotionComponent extends C_AngularMotion, Component {
  _prop(this: E_AngularMotion, prop: 'arotation'|'vrotation', value: number): void
}

const AngularMotion: FComponent = {
  type: 'Component',
  load(F, options) {
    return Component
  }
}

const Component: AngularMotionComponent = {
  name: 'AngularMotion',

  required: '2D',

  _arotation: 0,
  _drotation: 0,
  _vrotation: 0,
  _oldRotationDirection: 0,

  init() {
    this.bind('UpdateFrame', this._angularMotionTick)
  },

  remove(this: E_AngularMotion) {
    this.unbind('UpdateFrame', this._angularMotionTick)
  },

  properties: {
    arotation: {
      set(this: E_AngularMotion, value: number) {
        this._prop('arotation', value)
      },
      get(this: E_AngularMotion) {
        return this._arotation
      }
    },
    drotation: {
      get(this: E_AngularMotion) {
        return this._drotation
      }
    },
    vrotation: {
      set(this: E_AngularMotion, value: number) {
        this._prop('vrotation', value)
      },
      get(this: E_AngularMotion) {
        return this._vrotation
      }
    }
  },

  resetAngularMotion() {
    this._drotation = 0
    this._arotation = 0
    this._vrotation = 0

    return this
  },

  _angularMotionTick(frameDelta) {
    const dt = frameDelta.dt / 1000
    const oldR = this._rotation
    const oldVr = this._vrotation
    const oldAr = this._arotation

    // acceleration over time
    const newR = oldR + oldVr * dt + 0.5 * oldAr * dt * dt

    // increase velocity
    this.vrotation = oldVr + oldAr * dt

    // direction change?
    const vR = this._vrotation
    const dvr = vR ? (vR < 0 ? -1 : 1) : 0
    if (this._oldRotationDirection !== dvr) {
      this._oldRotationDirection = dvr
      this.trigger('NewRotationDirection', dvr)
    }

    // new rotation velocity?
    this._drotation = newR - oldR
    if (this._drotation !== 0) {
      this.rotation = newR
      this.trigger('Rotated', oldR)
    }
  },

  _prop(prop, value) {
    this[`_${prop}`] = value
    // trigger event
  }
}

export default AngularMotion
