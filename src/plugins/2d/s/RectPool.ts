import { FSystem } from "../../../freerunner";
import { emptyRect, Rect } from "../lib/Rect";

export interface RectSystem extends FSystem {
	pool: Pool
}

interface Pool {
	copy(orig: Rect): Rect
	get(x:number, y: number, w: number, h: number): Rect
	recycle(old: Rect): void
}

// RectPool is used as a cache of the rect that is currently being processed in 2d
// At an event old rect is saved into pool and used for events and references
// and later recycled when event is complete.

// FIXME - any uses of POOL.get ? otherwise this is functionality as unused

const RectPool: RectSystem = {
	type: 'System',
	name: 'RectPool',
	load() {
		console.log('Load', this.name)
	},
	init() {
		console.log('Init', this.name)
	},

	// This is a private object used internally by 2D methods
	// Cascade and _attr need to keep track of an entity's old position,
	// but we want to avoid creating temp objects every time an attribute is set.
	// The solution is to have a pool of objects that can be reused.
	//
	// The current implementation makes a BIG ASSUMPTION:  that if multiple rectangles are requested,
	// the later one is recycled before any preceding ones.  This matches how they are used in the code.
	// Each rect is created by a triggered event, and will be recycled by the time the event is complete.
	pool: (function () : Pool {
		let pool = [] as Rect[]
		let pointer = 0
		return {
			get (x: number, y: number, w: number, h: number) {
				if (pool.length <= pointer)
					pool.push(emptyRect)
				let r = pool[pointer++]
				r._x = x
				r._y = y
				r._w = w
				r._h = h
				return r
			},

			copy (orig: Rect) {
				if (pool.length <= pointer)
					pool.push(emptyRect)
				let copy = pool[pointer++]
				copy._x = orig._x
				copy._y = orig._y
				copy._w = orig._w
				copy._h = orig._h
				return copy
			},

			// arguments make code using this more readably
			recycle (old: Rect) {
				pointer--
			}
		}
	})()
}

export default RectPool
