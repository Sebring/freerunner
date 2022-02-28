import { Events, FSystem, Component, System, FComponent } from "../../../freerunner";
import { E_2D } from "../c/GameObject";

export interface S_Gravity extends _GravitySystem, Events {
  
}

export interface E_Gravity extends C_Gravity, E_2D {

}

interface _GravitySystem extends System {
  _gravityComponents: E_Gravity[]
  add(this: S_Gravity, comp: E_Gravity): S_Gravity
}


const Gravitation: FSystem = {
  type: 'System',
  load(F, options: {gravity: number}) {
    const GRAVITY_CONST = options?.gravity ?? 1
    const gravityComponent: _GravitySystem = {
      name: 'Gravity',
      _gravityComponents: [],
      init(this: S_Gravity) {
      },
      add(comp: E_Gravity) {
        this._gravityComponents.push(comp)
        return this
      },
      events: {
        UpdateFrame(this: S_Gravity) {
          for (const component of this._gravityComponents) {
            component.y += 1 
          }
        }
      }
    }
    return gravityComponent
  },

}

interface C_Gravity {
  gravity(this: E_Gravity): E_Gravity
}

interface Gravity extends C_Gravity, Component {

}

export const Gravity: FComponent = {
  type: 'Component',
  load(F) {

    const GRAVITY = (<S_Gravity>F.s('Gravity'))

    const gravityComponent: Gravity = {
      name: 'Gravity',
      init() {
    
      },
      gravity() {
        GRAVITY.add(this)
        return this
      }
    }

    return gravityComponent
  }
}

export default Gravitation
