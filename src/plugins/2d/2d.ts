import { FGame, FPlugin } from "../../freerunner.js";
import AngularMotion from './c/AngularMotion.js';
import Collision from "./c/Collision.js";
import GameObject from "./c/GameObject.js";
import Motion from "./c/Motion.js";
import { Rect } from "./lib/Rect.js";
import Gravitation, { Gravity } from "./s/Gravity.js";
import HashMap from "./s/HashMap.js";
import RectPool from "./s/RectPool.js";

export type Point = {
	x: number,
	y: number
}

export const emptyPoint = {x:0, y:0}

export const eqPoint = (a: Point, b: Point): boolean => {
	return a.x === b.x && a.y === b.y
}

export interface Cbr extends Rect {
	cx: number,
	cy: number,
	r: number
}

type Axis = 'x' | 'y' | 'w' | 'h'

export interface ResizeEvent {
	amount: number,
	axis: Axis
}

interface Plugin2D extends FPlugin {
	loadComponents(F:FGame): void
}

const plugin2d: Plugin2D = {
	type: 'Plugin',
	name: '2D',
	load (F: FGame, options={}) {
		F.load(HashMap)
		F.load(RectPool)
		F.load(Gravitation)
		this.loadComponents(F)
	},

	loadComponents (F: FGame) {

		F.load(GameObject)

		F.load(Collision)

		F.load(Motion)
		F.load(AngularMotion)
		F.load(Gravity)
	}
}

export default plugin2d
