import { Entity, FComponent, FGame, FPlugin } from "../../freerunner.js";
import AngularMotion from './c/AngularMotion.js';
import CollisionClosure from "./c/Collision.js";
import Motion from "./c/Motion.js";
import { AABB, cloneAABB, createAABB } from "./lib/Aabb.js";
import { cosinusRadians, degreesToRadians, sinusRadians } from "./lib/Math2d.js";
import { createPoint } from "./lib/Point.js";
import { createPolygonfromRect, Polygon, polygonToAABB, polygonToRect, rotatePolygon } from "./lib/Polygon.js";
import { getRect, Rect } from "./lib/Rect.js";
import { Rotatable } from "./lib/Rotatable.js";
import HashMapSystem, { HashMap } from "./s/HashMap.js";
import RectPool, { RectSystem } from "./s/RectPool.js";

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

export interface E_2D extends Entity, C_2D {
	aabb: AABB
	x: number
	y: number
	h: number
	w: number
	z: number
	ox: number
	oy: number
	rotation: number
}

interface C_2D extends Rect {
	// _mbr: null|Rect
	_origin: Point
	_rotation: number
	_z: number
	_globalZ: number
	_aabb: Rotatable<AABB>
	
	_children: E_2D[]
	_parent: null|E_2D

	area(): number
	attach(entities: E_2D[]): E_2D
	contains(x: number, y: number, w: number, h: number): boolean
	detach(entity?: E_2D): E_2D
	intersect(x: number|E_2D, y?: number, w?: number, h?: number): boolean
	isAt(x: number, y: number): boolean
	// mbr(): Rect
	move(dir: Orientation, by: number): E_2D
	origin (x: number|string, y?: number): E_2D
	offsetBoundary (x1: number, y1?: number, x2?: number, y2?: number): E_2D
	pos () : Rect
	rotate (deg: number, ox: number, oy: number, cos: number, sin: number): E_2D
	shift (x: number, y: number, w?: number, h?: number): E_2D
	within (x: number, y: number, w: number, h: number): boolean
	_cascade(mbr: Rect): void
	//_calculateMBR(): void
	_rotate (v: number): void 
	_setPosition (x: number ,y: number): void
	_setter2d (name: string, value: number): void
	_updateAABB(this: E_2D): void
	_toRotatedPolygon(this: E_2D): Polygon
}

interface Named2dComp extends C_2D, FComponent {}

export function isE_2D(obj: any): obj is E_2D {
	return (typeof obj === 'object' && 'requires' in obj && 'x' in obj && 'y' in obj)
}

type Orientation = 's'|'n'|'e'|'w'|'ne'|'nw'|'se'|'sw'

interface Plugin2D extends FPlugin {
	loadComponents(F:FGame): void
}

const plugin2d: Plugin2D = {
	name: '2dPlugin',
	type: 'Plugin',
	
	load (F: FGame, options={}) {
		F.load(HashMapSystem)
		F.load(RectPool)
		this.loadComponents(F)
	},

	loadComponents (F: FGame) {
		const MAP = (<HashMap>F.s('HashMap'))
		const POOL = (<RectSystem>F.s('RectPool')).pool
		const D2: Named2dComp = {
			name: '2D',
			type: 'Component',
			_x: 0,
			_y: 0,
			_h: 0,
			_w: 0,
			_z: 0,
			_aabb: {base: createAABB(), rotated: createAABB(), isDirty: true},
			_globalZ: 0,
			_rotation: 0,
			_origin: {x:0, y:0},
			//_mbr: null,
			_children: [],
			_parent: null,
			properties: {
				aabb: {
					get(this: E_2D) {
						if (this._aabb.isDirty) {
							this._updateAABB()
						}
						return this._aabb.rotated
					}
				},
				x: {
					set (this: Entity, v: number) {
						this._setter2d('_x', v)
					},
					get (this: Entity) {
						return this._x
					},
					configurable: true,
					enumerable: true
				},
				_x: {enumerable: false},
				y: {
					set (this: Entity, v: number) {
						this._setter2d('_y', v)
					},
					get (this: Entity) {
						return this._y
					},
					configurable: true,
					enumerable: true
				},
				_y: {enumerable: false},
				w: {
					set (this: Entity, v: number) {
						this._setter2d('_w', v)
					},
					get (this: Entity) {
						return this._w
					},
					configurable: true,
					enumerable: true
				},
				_w: {enumerable: false},
				h: {
					set (this: Entity, v: number) {
						this._setter2d('_h', v)
					},
					get (this: Entity) {
						return this._h
					},
					configurable: true,
					enumerable: true
				},
				_h: {enumerable: false},
				z: {
					set (this: Entity, v: number) {
						this._setter2d('_z', v)
					},
					get (this: Entity) {
						return this._z
					},
					configurable: true,
					enumerable: true
				},
				_z: {enumerable: false},
				rotation: {
					set (this: Entity, v: number) {
						this._setter2d('_rotation', v)
					},
					get (this: Entity) {
						return this._rotation
					},
					configurable: true,
					enumerable: true
				},
				_rotation: {enumerable: false},
				ox: {
					set (this: Entity, v: number) {
						this._setter2d('_x', v - this._origin.x)
					},
					get (this: Entity) {
						return this._x + this._origin.x
					},
					configurable: true,
					enumerable: true
				},
				oy: {
						set (this: Entity, v: number) {
								this._setter2d('_y', v - this._origin.y)
						},
						get (this: Entity) {
								return this._y + this._origin.y
						},
						configurable: true,
						enumerable: true
				},
			},

			init (this: E_2D) {
				this._globalZ = this[0]
				this._origin = { x: 0, y: 0 }

				// offsets for the basic bounding box
				// fixme - add to interface
				this._bx1 = 0
				this._bx2 = 0
				this._by1 = 0
				this._by2 = 0

				this._children = []
				

				//when object changes, update HashMap
				this.bind("Move", function (this: E_2D, e: any) {
				//	this._entry = MAP.updateEntry(this._entry, this)
					// Move children (if any) by the same amount
					if (this._children.length > 0) {
						this._cascade(e)
					}
				})

				this.bind("Rotate", function (this: E_2D, e: any) {
					this._aabb.isDirty = true
					//this._entry = MAP.updateEntry(this._entry, this)
					// Rotate children (if any) by the same amount
					if (this._children.length > 0) {
						this._cascadeRotation(e)
					}
				})

				//when object is removed, remove from HashMap and destroy attached children
				this.bind("Remove", function (this: E_2D) {
					if (this._children) {
						for (let i = 0; i < this._children.length; i++) {
							// delete the child's _parent link, or else the child will splice itself out of
							// this._children while destroying itself (which messes up this for-loop iteration).
							this._children[i]._parent = null

							// Destroy child if possible (It's not always possible, e.g. the polygon attached
							// by areaMap has no .destroy(), it will just get garbage-collected.)
							if (this._children[i].destroy) {
								this._children[i].destroy()
							}
						}
						this._children = []
					}

					if (this._parent) {
						this._parent.detach(this)
					}

					//MAP.remove(this._entry)

					this.detach()
				})

				this.bind('Change', function (this: E_2D, {x, y, w, h, rotation} : any) {
					console.log('Change', {x, y, w, h, rotation})
					x || y || w || h || rotation && this.trigger('Invalidate')
				})

				this.bind('Invalidate', function (this: E_2D) { this._aabb.isDirty = true })
			},

			events: {
				Freeze (this: E_2D) {
					//MAP.remove(this._entry)
				},
				Unfreeze (this: E_2D) {
					//this._entry = MAP.insert(this, this._entry)
				}
			},

			/**
			 * Calculate area of the entity.
			 */
			area () {
					return this._w * this._h
				},

			/**
			 * Sets one or more entities to be children, with the current entity (`this`)
			 * as the parent. When the parent moves or rotates, its children move or
			 * rotate by the same amount. (But not vice-versa: If you move a child, it
			 * will not move the parent.) When the parent is destroyed, its children are
			 * destroyed.
			 *
			 * For any entity, `this._children` is the array of its children entity
			 * objects (if any), and `this._parent` is its parent entity object (if any).
			 *
			 * As many objects as wanted can be attached, and a hierarchy of objects is
			 * possible by attaching.
			 */
			attach (this: E_2D, entities: E_2D[]) {
				for (let i=0, N=entities.length; i < N; ++i) {
					let obj = entities[i];
					if (obj._parent) {
							obj._parent.detach(obj);
					}
					obj._parent = this;
					this._children.push(obj);
				}
				return this;
			},

			/**
			 * Determines if the rectangle is within the current entity.
			 * If the entity is rotated, its MBR is used for the test.
			 * Fixme: use rect as param? 
			 */
			contains (x: number, y: number, w: number, h: number) {
				/*	let rect, mbr = this._mbr || this
					if (typeof x === "object") {
						rect = x
					} else {
						rect = {_x: x, _y: y, _w: w, _h: h}
					}

				return rect._x >= mbr._x && rect._x + rect._w <= mbr._x + mbr._w &&
					rect._y >= mbr._y && rect._y + rect._h <= mbr._y + mbr._h
					*/
					return false
			},

			/**
			 * Stop an entity from following the current entity. Passing no arguments will stop
			 * every entity attached.
			 * 
			 * Freerunner: Looks like one could pass an array but changed to single, might break.
			 */
			detach (this: E_2D, entity?: E_2D) {
				//if nothing passed, remove all attached objects
				if (!entity) {
					for (let i = 0, N=this._children.length; i < N; i++) {
						this._children[i]._parent = null;
					}
					this._children = [];
					return this;
				}

				//if obj passed, find the handler and unbind
				for (let i = 0, N=this._children.length; i < N; i++) {
					if (this._children[i] === entity) {
						this._children.splice(i, 1);
					}
				}
				entity._parent = null;

				return this;
			},

			/**
			 * Determines if this entity intersects a rectangle.
			 * If the entity is rotated, its MBR is used for the test. 
			 * FIXME: Take rect as param?
			 */
			intersect (this: E_2D, x: number|E_2D, y: number, w: number, h: number) {
				let rect, mbr = this._mbr || this
				if (typeof x === "object") {
					rect = x
				} else {
					rect = { _x: x, _y: y, _w: w, _h: h	}
				}

				return mbr._x < rect._x + rect._w && mbr._x + mbr._w > rect._x &&
					mbr._y < rect._y + rect._h && mbr._y + mbr._h > rect._y
			},

			/**
			 * Determines whether a point is contained by the entity. Unlike other methods,
			 * an object can't be passed. The arguments require the x and y value.
			 *
			 * The given point is tested against the first of the following that exists: 
			 * a mapArea associated with "Mouse", the hitarea associated with "Collision", or the object's MBR.
			 * 
			 * FIXME: code is coupled to mouse and collision...
			 */
			isAt (this: any, x: number, y: number) {
					if (this.mapArea) {
							return this.mapArea.containsPoint(x, y)
					} else if (this.map) {
							return this.map.containsPoint(x, y)
					}
					let mbr = this._mbr || this
					return mbr._x <= x && mbr._x + mbr._w >= x &&
							mbr._y <= y && mbr._y + mbr._h >= y
				},

			/**
			 * Quick method to move the entity in a direction (n, s, e, w, ne, nw, se, sw) by an amount of pixels.
			 */
			move (this: E_2D, dir: Orientation, by: number) {
				if (dir.charAt(0) === 'n') this.y -= by
				if (dir.charAt(0) === 's') this.y += by
				if (dir === 'e' || dir.charAt(1) === 'e') this.x += by
				if (dir === 'w' || dir.charAt(1) === 'w') this.x -= by

				return this
			},

			/**
       * Set the origin point of an entity for it to rotate around.
			 * The properties `ox` and `oy` map to the coordinates of the origin on the stage; 
			 * setting them moves the entity.
     	 * In contrast, this method sets the origin relative to the entity itself.
			 * 
			 * The origin should be set before changing the `rotation` since it does not apply retroactively.
			 * Additionally, setting the origin via an alignment identifier works only
			 * after the entity's dimensions have been set.
			 * 
			 * FIXME: named arguments
			 */
			origin (this: E_2D, x: number|string, y: number) {
        //text based origin
        if (typeof x === "string") {
					if (x === "centre" || x === "center" || x.indexOf(' ') === -1) {
						x = this._w / 2
						y = this._h / 2
					} else {
						var cmd = x.split(' ')
						if (cmd[0] === "top") y = 0
						else if (cmd[0] === "bottom") y = this._h
						else if (cmd[0] === "middle" || cmd[1] === "center" || cmd[1] === "centre") y = this._h / 2

						if (cmd[1] === "center" || cmd[1] === "centre" || cmd[1] === "middle") x = this._w / 2
						else if (cmd[1] === "left") x = 0
						else if (cmd[1] === "right") x = this._w
					}
        }

        this._origin.x = Number(x)
        this._origin.y = y
        this.trigger("OriginChanged")
        return this
    	},

			/**
			 * Return an object containing a copy of this entity's bounds (`_x`, `_y`, `_w`, and `_h` values).
			 */
			pos (this: E_2D): Rect {
				return getRect(this)
    	},

			/**
			 * Extends the MBR of the entity by a specified amount.
			 */ 
			offsetBoundary (this: E_2D, x1: number, y1?: number, x2?: number, y2?: number) {
				if (arguments.length === 1)
					y1 = x2 = y2 = x1
				this._bx1 = x1
				this._bx2 = x2
				this._by1 = y1
				this._by2 = y2
				this.trigger("BoundaryOffset")
				this._calculateMBR()
				return this
			},

			/**
			 * Method for rotation rather than through a setter
			 * Pass in degree amount, origin coordinate and precalculated cos/sin
			 * FIXME: aabb
			 */
			rotate (this: E_2D, deg: number, ox: number, oy: number, cos: number, sin: number) {
				let x2, y2
				x2 = (this._x + this._origin.x - ox) * cos + (this._y + this._origin.y - oy) * sin + (ox - this._origin.x)
				y2 = (this._y + this._origin.y - oy) * cos - (this._x + this._origin.x - ox) * sin + (oy - this._origin.y)
				this._setter2d('_rotation', this._rotation - deg)
				this._setter2d('_x', x2 )
				this._setter2d('_y', y2 )
				return this
			},

			/**
			* Shift or move the entity by an amount.
			* Use negative values for an opposite direction.
			* FIXME: aabb
			*/
			shift (this: E_2D, x: number, y: number, w?: number, h?: number) {
        if (x || y) {
					this._setPosition(this._x + x, this._y + y)
				}
        if (w) this.w += w
        if (h) this.h += h
        return this
    	},

			/**
			 * Return an object containing a copy of this entity's minimum bounding rectangle.
			 * The MBR encompasses a rotated entity's bounds.
			 * If there is no rotation on the entity it will return its bounds (`.pos()`) instead.
			 * FIXME: aabb
			 *
			mbr (this: E_2D) {
        if (!this._mbr)
					return this.pos()
				return getRect(this._mbr)
    	},
			*/

			/**
			 * Determines if this current entity is within another rectangle.
			 * Fixme: take rect as param?
			 * FIXME: aabb
			 */
			within (x: number, y: number, w: number, h: number) {
				/*let rect, mbr = this._mbr || this
				if (typeof x === "object") {
					rect = x
				} else {
					rect = {_x: x, _y: y,	_w: w, _h: h}
				}

				return rect._x <= mbr._x && rect._x + rect._w >= mbr._x + mbr._w &&
					rect._y <= mbr._y && rect._y + rect._h >= mbr._y + mbr._h
				*/
					return false
			},

			/**
			 * Move the entity's children according to a certain motion.
     	 * This method is part of a function bound to "Move": It is used
    	 * internally for ensuring that when a parent moves, the child also
    	 * moves in the same way.
			 ** FIXME: aabb
			 */
		 	_cascade (mbr: Rect) {
				 console.log('_Cascade', mbr)
				// bail if no change in position 
				if (!mbr) return

				//use current position
				let dx = this._x - mbr._x,
						dy = this._y - mbr._y,
						dw = this._w - mbr._w,
						dh = this._h - mbr._h;

				let children = this._children
				for (let i=0, N=children.length; i < N; ++i) {
						let obj = children[i]
						if (obj.__frozen) continue
						obj.shift(dx, dy, dw, dh)
				}
			},

			/**
			 * Calculates the MBR when rotated some number of radians about an origin point o.
			 * Necessary on a rotation, or a resize.
			 *
			_calculateMBR (this: E_2D) {
				let ox = this._origin.x + this._x,
					oy = this._origin.y + this._y,
					rad = -this._rotation * Math.PI / 180
				// axis-aligned (unrotated) coordinates, relative to the origin point
				let dx1 = this._x - this._bx1 - ox,
					dx2 = this._x + this._w + this._bx2 - ox,
					dy1 = this._y - this._by1 - oy,
					dy2 = this._y + this._h + this._by2 - oy

				let ct = Math.cos(rad),
					st = Math.sin(rad)
				// Special case 90 degree rotations to prevent rounding problems
				ct = (ct < 1e-10 && ct > -1e-10) ? 0 : ct
				st = (st < 1e-10 && st > -1e-10) ? 0 : st

				// Calculate the new points relative to the origin, then find the new (absolute) bounding coordinates!
				let x0 =   dx1 * ct + dy1 * st,
					y0 = - dx1 * st + dy1 * ct,
					x1 =   dx2 * ct + dy1 * st,
					y1 = - dx2 * st + dy1 * ct,
					x2 =   dx2 * ct + dy2 * st,
					y2 = - dx2 * st + dy2 * ct,
					x3 =   dx1 * ct + dy2 * st,
					y3 = - dx1 * st + dy2 * ct,
					minx = Math.floor(Math.min(x0, x1, x2, x3) + ox),
					miny = Math.floor(Math.min(y0, y1, y2, y3) + oy),
					maxx = Math.ceil(Math.max(x0, x1, x2, x3) + ox),
					maxy = Math.ceil(Math.max(y0, y1, y2, y3) + oy)
					this._mbr = {
						_x: minx,
						_y: miny,
						_w: maxx - minx,
						_h: maxy - miny
					}

				// If a collision hitbox exists AND sits outside the entity, find a bounding box for both.
				// `_cbr` contains information about a bounding circle of the hitbox. 
				// The bounds of `_cbr` will be the union of the `_mbr` and the bounding box of that circle.
				// This will not be a minimal region, but since it's only used for the broad phase pass it's good enough.
				// cbr is calculated by the `_checkBounds` method of the "Collision" component
				 if (this._cbr) {
					let cbr = this._cbr
					let cx = cbr._x, cy = cbr._y, r = cbr.r
					let cx2 = ox + (cx + this._x - ox) * ct + (cy + this._y - oy) * st
					let cy2 = oy - (cx + this._x - ox) * st + (cy + this._y - oy) * ct
					cbr._x = Math.min(cx2 - r, minx)
					cbr._y = Math.min(cy2 - r, miny)
					cbr._w = Math.max(cx2 + r, maxx) - cbr._x
					cbr._h = Math.max(cy2 + r, maxy) - cbr._y
				}
			},

			/**
     	 * Handle changes that need to happen on a rotation
     	 */
			_rotate (this: E_2D, v: number) {
				const diff = this._rotation - v
				// skip if there's no rotation!
				if (!diff) return
				
				this._rotation = v
				// this._mbr = calculateMBR(this)
				this.trigger("Rotate", diff)
			},

			// A separate setter for moving an entity along both axes - trigger Move once.
			_setPosition (this: E_2D, x: number, y: number) {
				if (x === this._x && y === this._y) return
				const old = POOL.copy(this)
				let mbr = this._mbr
				if (mbr) {
						mbr._x -= this._x - x
						mbr._y -= this._y - y
				}
				this._x = x
				this._y = y
				this.trigger("Move", old)
				this.trigger("Invalidate")
				POOL.recycle(old)
			},

			// This is a setter method for all 2D properties including
			// FIXME - hide from interface  _2d_setProp
			_setter2d (this: E_2D, name: string, value: number) {
				// quick bail if no change
				if (this[name] === value) return

				// keep old reference
				const old =  POOL.copy(this)

				if (name === '_rotation') {
					this._rotate(value)
				} else if (name === '_x' || name === '_y') {
					this[name] = value // FIXME: not needed?
					this.trigger('Move', old)
				} else if (name === '_h' || name === '_w') {
					let oldVale = this[name] // FIXME: not needed?
					const amount = value - oldVale
					const axis = name === '_h' ? 'h' : 'w'
					this.trigger('Resize', {amount, axis})
					this.trigger('Move', old)
				} else if (name === 'z') {
					var intValue = value << 0 // fixme - math.floor - always int, no?
					value = value === intValue? intValue : intValue+1 // floor but ceil to 1
					this._globalZ = value * 10000 + this[0] //magic number 10^5 is the max num of entities
					this[name] = value // fixme: not needed?
					this.trigger('Reorder')
				}

				this[name] = value
				this._aabb.isDirty = true
				this.trigger('Invalidate')
				POOL.recycle(old)
			},

			// aabb is a min/max rectangle - 2 points only
			// IMPROVE: shift if only position change
			// IMPROVE: shift max if only size change
			// IMPROVE: shift rotated if rotation has not changed
			_updateAABB(this: E_2D) {
				// debugger
				const base = createAABB(createPoint(this._x, this._y), createPoint(this._x + this._w, this._y + this._h))
				let rotated = this._rotation ? polygonToAABB(this._toRotatedPolygon()) : cloneAABB(base)
				this._aabb = { base, rotated, isDirty: false }
			},
			
			_toRotatedPolygon() {
				return rotatePolygon(createPolygonfromRect(this), this._rotation, {x: this.ox, y: this.oy})
			}
		}
		F.load(D2)

		const collision = CollisionClosure(F)
		F.load(collision)

		F.load(Motion)
		F.load(AngularMotion)
	}
}


// FIXME - use points
export function __calculateMBR (entity: E_2D): Rect {
	entity._updateAABB()
	// world origin
	const world_origin = createPoint(entity.ox, entity.oy)

	// world bounds min/max rect relative to padding and origin
	const bounds_min = createPoint(
		entity._x - entity._bx1 - world_origin.x,
		entity._y - entity._by1 - world_origin.y)
	const bounds_max = createPoint(
		entity._x + entity._w + entity._bx2 - world_origin.x,
		entity._y + entity._h + entity._by2 - world_origin.y
	)
	const dx1 = entity._x - entity._bx1 - world_origin.x
	const dx2 = entity._x + entity._w + entity._bx2 - world_origin.x
	const dy1 = entity._y - entity._by1 - world_origin.y
	const dy2 = entity._y + entity._h + entity._by2 - world_origin.y

	// rotation
	let radians = 0
	let cosRad = 1
	let sinRad = 0
	if (entity._rotation) {
		radians = degreesToRadians(-entity._rotation)
		cosRad = cosinusRadians(radians)
		sinRad = sinusRadians(radians)
	}

	// new x coords
	const x0 = dx1 * cosRad + dy1 * sinRad
	const x1 = dx2 * cosRad + dy1 * sinRad
	const x2 = dx2 * cosRad + dy2 * sinRad
	const x3 = dx1 * cosRad + dy2 * sinRad

	// new y coords
	const y0 = -dx1 * sinRad + dy1 * cosRad
	const y1 = -dx2 * sinRad + dy1 * cosRad
	const y2 = -dx2 * sinRad + dy2 * cosRad
	const y3 = -dx1 * sinRad + dy2 * cosRad

	// mbr is the extremes of all coords + origin
	const	min_x = Math.floor(Math.min(x0, x1, x2, x3) + world_origin.x)
	const min_y = Math.floor(Math.min(y0, y1, y2, y3) + world_origin.y)
	const max_x = Math.ceil(Math.max(x0, x1, x2, x3) + world_origin.x)
	const max_y = Math.ceil(Math.max(y0, y1, y2, y3) + world_origin.y)
	
	const mbr = {
		_x: min_x,
		_y: min_y,
		_w: max_x - min_x,
		_h: max_y - min_y
	}

	// padding?  _bx
  const poly = createPolygonfromRect(entity)
	const  r_poly = rotatePolygon(poly, entity.rotation, {x: entity.ox, y: entity.oy})
	const poly_mbr = polygonToRect(poly)  // max min


	// If a collision hitbox exists AND sits outside the entity, find a bounding box for both.
	// `_cbr` contains information about a bounding circle of the hitbox. 
	// The bounds of `_cbr` will be the union of the `_mbr` and the bounding box of that circle.
	// entity will not be a minimal region, but since it's only used for the broad phase pass it's good enough.
	// cbr is calculated by the `_checkBounds` method of the "Collision" component
	/* 
	if (entity._cbr) {
		let cbr = entity._cbr
		let cx = cbr._x, cy = cbr._y, r = cbr.r
		let cx2 = ox + (cx + entity._x - ox) * ct + (cy + entity._y - oy) * st
		let cy2 = oy - (cx + entity._x - ox) * st + (cy + entity._y - oy) * ct
		cbr._x = Math.min(cx2 - r, minx)
		cbr._y = Math.min(cy2 - r, miny)
		cbr._w = Math.max(cx2 + r, maxx) - cbr._x
		cbr._h = Math.max(cy2 + r, maxy) - cbr._y
	}
	*/
	return mbr
}

export default plugin2d
