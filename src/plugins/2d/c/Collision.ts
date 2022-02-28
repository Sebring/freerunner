import { Component, Entity, FComponent, FGame } from "../../../freerunner.js";
import { AABB, intersectsAABB } from "../lib/Aabb.js";
import { createPolygon, createPolygonfromRect, Polygon, polygonToAABB, rotatePolygon } from "../lib/Polygon.js";
import { getRect } from "../lib/Rect.js";
import { Rotatable } from "../lib/Rotatable.js";
import getSAT, { SatOverlap } from "../lib/sat.js";
import { HashMapSystem } from "../s/HashMap.js";
import { E_2D } from "./GameObject.js";

export interface E_Collision extends C_Collision, E_2D {
	aabb: AABB
}

type CollisionType = 'SAT' | 'MBR'

type CollisionShape = 'Rect' | 'Circle' | 'Polygon'

interface SatCollision extends SatOverlap {
	obj: Entity,
	type: CollisionType
}

interface C_Collision {
  _collisionData: any
	_collisionHandlers: any
	_collisionSet: Set<number>
	_collisionOccuring: number[]
	_collisionShape: CollisionShape
	_mapEntry: any

	map: Polygon
	hitmap: Rotatable<Polygon>
  
	collision(this: E_Collision, shape?: CollisionShape) : E_Collision
	checkHits(this: E_Collision, components: string|string[]): E_Collision
	hit(this: E_Collision, component: string, ackumulate?: SatCollision[]): SatCollision[]
	ignoreHits(this: E_Collision, components?: string|string[]): E_Collision
	resetHitChecks(this: E_Collision): E_Collision
	onHit(this: E_Collision, component: string, callbackOn: { (hitData:any, first:boolean): void}, callbackOff?: {():void}): E_Collision
	
	_setHitboxDirty(this: E_Collision): void
	_updateHitmap(this: E_Collision): void
}

interface Collision extends C_Collision, Component {}

const DEG_TO_RAD = Math.PI / 180

const Collision: FComponent = {
	type: 'Component',
	load(F, options) {
		const MAP = (<HashMapSystem>F.s('HashMap'))
		const CollisionComponent: Collision = {
			name: 'Collision',
			map: createPolygon([]),
			hitmap: {isDirty: true, base: createPolygon([]), rotated: createPolygon([])},
			required: '2D',
			_mapEntry: null,
			_collisionData: {},
			_collisionSet: new Set(),
			_collisionHandlers: {},
			_collisionOccuring: [],
			_collisionShape: 'Rect',
			init(this: E_Collision) {
				this.requires('2D')
				// this.collision()
			},
		
			remove(this: E_Collision) {
				this.unbind('Invalidate', this._updateHitmap)
				this.unbind('Resize', this._updateHitmap)
				this.unbind('Rotate', this._updateHitmap)
				MAP.remove(this._mapEntry)
			},
		
			collision(shape: CollisionShape = 'Rect') {
				if (shape === 'Rect') {
					this.hitmap = {
						base: createPolygonfromRect(getRect(this)), 
						rotated: createPolygonfromRect(getRect(this)),
						isDirty: true
					}
				} else {
					console.error('Not implemented...')
					// TODO: circle
					// TODO: polygon
				}
	
				// only update size if no custom hitbox
				this.bind('Invalidate', () => {
					this._updateHitmap()
				})
				this.bind('Change', () => {
					this._updateHitmap()
				})
				this.bind('Resize', this._updateHitmap)
				this.bind("Rotate", this._updateHitmap)
				
				// notify observers
				// FIXME: this.trigger('NewHitmap', hitmap)
	
				this._mapEntry = MAP.insert(this)
	
				return this
			},
	
	
			/**
			 * Perform collision check against list of components.
			 * @param components list of components to check for hits
			 * @returns this for chaining
			 */
			checkHits(...components: string[]) {
	
				/*
					for each colliding component
						handler - check for new or ending collisions
						bind UpdateFrame handler
	
	
						need to save handler on this to be able to unbind from UpdateFrame
						 - _collisionHandlers[comp] = handler
						
						need to keep track of current collisions to only report hit on/off
						- _collisionOccuring[id] = true
	
						// any hit not existing in occuring are new
						// any id in occuring not in hit are off
	
						// occuring []
						// hitData [1, 3]
						// hitOn [1, 3]
						// hitOff []
	
						// occuring [1, 3]
						// hitData [1, 5]
						// hitOn [5]
						// hitOff [3]
	
						// occuring [1]
	
				*/
				for (let comp of components) {
					console.log('checkHits', components)
					
					// bail if already defined
					if (this._collisionHandlers[comp]) continue
					this._collisionHandlers[comp] = {}
					
					let reportCollisions = () => {
						let hitData = this.hit(comp)
						let hitSet = new Set as Set<number>
						let hitOn = [] as SatCollision[]
						let hitOff = [] as any[]
						let occuringSize = this._collisionSet.size
						
						// find and add new collisions
						for (const hit of hitData) {
							const id = hit.obj[0]
							hitSet.add(id)
							if (!this._collisionSet.has(id)) {
								this._collisionSet.add(id)
								hitOn.push(hit)
							}
						}
						// trigger on
						hitOn.length && this.trigger('HitOn', hitOn)
	
						// find and add ending collisions
						hitOff = [...this._collisionSet].filter(id => !hitSet.has(id))
	
						// remove off from set
						hitOff.map(off => this._collisionSet.delete(off))
	
						// trigger off
						hitOff.length && this.trigger('HitOff', hitOff)
					}
	
	/* 
					let handler = () => {
						let occuring = false // bug here prevents more hits than one at a time
						let hitData = this.hit(comp)
	
	
						// new hit
						if (!occuring && hitData) {
							occuring = true
							this.trigger('HitOn', hitData)
						}
	
						// hit end
						if (occuring && !hitData) {
							occuring = false
							this.trigger('HitOff', comp)
						}
					} */
	
					this._collisionHandlers[comp] = reportCollisions
					this.bind('UpdateFrame', reportCollisions)
				}
				
				return this
			},
	
			/**
			 * Stop checking for collision with specified components.
			 * @param components components to remove, all of none provided
			 * * // FIXME - take array instead of splitting comma
			 */
			ignoreHits(this: E_Collision, components?: string|string[]) {
				
				// ignore all
				if (!components) {
					// remove all
					// fixme - modified from crafty which seemed bugged
					for (let comp in this._collisionData) {
						this.unbind('UpdateFrame', this._collisionData[comp].handler)
					}
					this._collisionData = {}
					return this
				}
				
				// split comma sep
				if (components.length === 1) 
					components = components[0].split(/\s*,\s*/)
	
				// ignore specified
				for (let comp of components) {
					let collisionData = this._collisionData[comp]
					if (collisionData === undefined) continue
					this.unbind('UpdateFrame', collisionData.handler)
					delete this._collisionData[comp]
				}
				
				return this
			},
	
			/**
			 * 
			 * @param component 
			 * @param results 
			 * @returns 
			 */
			hit (component, results = [] as SatCollision[]) {
				
				const searchResults = MAP.unfilteredSearch(this.aabb)
	
				if (!searchResults.length)
					return []
				
				let dupes = [] as number[]
	
				for (let eId of searchResults) {
					// bail if invalid id
					if (!eId) continue
					
					// bail if self
					if (eId === this[0]) continue
					
					// bail if already checked
					if (dupes.includes(eId)) continue
					dupes = [...dupes, eId]
	
					// get entity
					const e = F(eId) as E_Collision
					
					// bail if not matching component
					if (!e.__c[component]) continue
					
					// bail if aabb does not intersect
					if (!intersectsAABB(this.aabb, e.aabb)) continue
					
					// sat polygon check with mvt
					let sat = <SatCollision|null>getSAT(this.hitmap.rotated, e.hitmap.rotated)
	
					// bail if no sat
					if (!sat) continue
	
					// we have collision
					sat.obj = e
					sat.type = 'SAT'
					results.push(sat)
				}
				return results.length ? results : []
			},
	
			/**
			 * Reset occuring hits on a component, causing them to report again.
			 *  
			 */
			resetHitChecks(this: E_Collision, components?: string|string[]): E_Collision {
				
				// reset all
				if (!components) {
					for (let comp in this._collisionData) {
						this._collisionData[comp].occuring = false
					}
					return this
				}
	
				// split comma sep
				if (components.length === 1)
					components = components[0].split(/\s*,\s*/)
				
				for (let comp of components) {
					let collisionData = this._collisionData[comp]
					if (!collisionData) continue
					this._collisionData[comp].occuring = false
				}
				return this
			},
	
	
			/**
			 * Check for hits each frame with provided callbacks for on and off.
			 * 
			 */
			onHit(this: E_Collision, component: string, callbackOn: Function, callbackOff?: Function): E_Collision {
				let justHit = false
				this.bind('UpdateFrame', function (this: E_Collision) {
					let hitData = this.hit(component)
					if (hitData) {
						callbackOn.call(this, hitData, !justHit)
						justHit = true
					} else if (justHit) {
						if (typeof callbackOff === 'function')
							callbackOff.call(this)
							justHit = false
					}
				})
				
				return this
			},
	
			_setHitboxDirty() {
				this.hitmap.isDirty = true
			},
	
			_updateHitmap() {
				if (true || this.hitmap.isDirty) {
					this.hitmap.base = createPolygonfromRect(getRect(this))
					this.hitmap.rotated = rotatePolygon(this.hitmap.base, this.rotation, {x: this.ox, y: this.oy})
					this.hitmap.isDirty = false
					this._mapEntry = MAP.updateEntry(this._mapEntry, polygonToAABB(this.hitmap.rotated))
				}
			},
		}
		return CollisionComponent
	}
}

export default Collision
