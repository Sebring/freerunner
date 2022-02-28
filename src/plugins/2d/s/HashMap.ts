import { FSystem, System } from "../../../freerunner.js"
import { E_Collision } from "../c/Collision.js"
import { E_2D, isE_2D } from "../c/GameObject.js"
import { AABB } from "../lib/Aabb.js"

type Coords = {
	maxX: number
	maxY: number
	minX: number
	minY: number
}
const CoordsDef = () => {
	return {
		maxX: -Infinity,
		maxY: -Infinity,
		minX: Infinity,
		minY: Infinity
	}
}
type Keys = {
	x1: number, 
	x2: number, 
	y1: number, 
	y2: number
}

export interface Entry {
	keys: Keys
	id: number
}

const emptyKeys = { x1: 0, x2: 0, y1: 0, y2: 0 } as Keys

export interface HashMapSystem extends System {
	_cellSize: number
	_boundsDirty: boolean
	_coordBoundsDirty: boolean
	_boundsHash: Coords
	_boundsCoords: Coords
	map: Array<Array<Array<number>>>
	boundaries() : void 
	insert(entity: E_Collision, entry?: Entry): Entry
	key (obj: AABB) : Keys
	refresh(entry: Entry, aabb: AABB) : void
	remove(entry: Entry) : void
	unfilteredSearch(aabb: AABB, results?: number[]) : number[]
	updateEntry(entry: Entry, aabb :AABB) : void
	_hashXY(x: number, y: number): string
	_isEntity(obj: any): obj is E_2D
	_updateBoundaries(): void
	_removeEntry(entry: Entry): void
	_insert(id: number, aabb: AABB): Entry
}

const getKeyHash = (keys: Keys) : string => {
	return `${keys.x1} ${keys.y1} ${keys.x2} ${keys.y2}`
}

const HashMap: FSystem = {
	type: 'System',
	load(F, options: {size:number}) {
		const CELL_SIZE = options?.size ?? 64

		const hashMap: HashMapSystem = {
			name: 'HashMap',
			_cellSize: CELL_SIZE,
			_boundsDirty: false,
			_coordBoundsDirty: false,
			_boundsHash: CoordsDef(),
			_boundsCoords: CoordsDef(),
			map: [],
			init() {
				console.log('Init HashMap-System')
			},

			/**
			 * Return a mbr of map containing all entities. 
			 */
			boundaries() {
				// TODO: flatten output, likewise do it for Crafty.viewport.bounds
				// TODO: accept optional parameter to save result in
				this._updateBoundaries()
				var bounds = this._boundsCoords
				return {
					min: {
						x: bounds.minX,
						y: bounds.minY
					},
					max: {
						x: bounds.maxX,
						y: bounds.maxY
					}
				}
			},

			/**
			 * Insert entiety into map
			*/
			insert (entity): Entry {
				return this._insert(entity.getId(), entity.aabb)
			},

			_insert (id, aabb): Entry {
				const keys = this.key(aabb)

				// insert into map
				for (let x = keys.x1; x <= keys.x2; x++) {
					for (let y = keys.y1; y <= keys.y2; y++) {
						// let hash = this._hashXY(x, y)
						if (!this.map[x])
							this.map[x] = []
						if (!this.map[x][y])
							this.map[x][y] = []
						this.map[x][y].push(id)
					}
				}

				this._boundsDirty = true
				return {keys, id}
			},

			/**
			 * Get the rectangular region (in terms of the grid, with grid size `cellsize`),
			 * where the object may fall in.
			 * This region is determined by the object's bounding box.
			 * The `cellsize` is 64 by default.
				* 
				// FIXME:  so very unpure - update existing keys or return new
			*/
			key (aabb: AABB): Keys{
				let keys = {x1: 0, x2:0, y1:0, y2: 0} as Keys
				keys.x1 = Math.floor(aabb.min.x / this._cellSize)
				keys.y1 = Math.floor(aabb.min.y / this._cellSize)
				keys.x2 = Math.floor(aabb.max.x / this._cellSize)
				keys.y2 = Math.floor(aabb.max.y / this._cellSize)
				return keys
			},

			/**
			 * Update an entry's keys, and its position in the broad phrase map.
			 * 
			 */
			refresh (entry, aabb) {
				// FIXME: performance - don't update all
				// 1) remove entity where keys not match with entry.keys
				// 2) add entity where new keys 

				// delete all
				this._removeEntry(entry)

				// insert as new
				return this._insert(entry.id, aabb)
			},

			_removeEntry(entry) {
				// remove entity from map
				for (let x = entry.keys.x1; x <= entry.keys.x2; x++) {
					for (let y = entry.keys.y1; y <= entry.keys.y2; y++) {
						let cell = this.map[x][y] as number[]
						const i = cell.findIndex(v => v===entry.id)
						cell.splice(i, 1)
					}
				}
			},

			/**
			 * Remove an entry from the broad phase map.
			*/
			remove (entry: Entry) {
				// debugger
				let keys = entry.keys
				let id = entry.id
				
				this._removeEntry(entry)

				this._boundsDirty = true;
			},

			/**
			 * Do a search for entities in the given region.
			 * Returned entities are **not** guaranteed to overlap.
			 * Results may contain duplicates. 
			 * 
			 * This method is intended to be used as the first step of a more complex search.
			 * More common use cases should use Crafty.map.search, which filters the results.
			 * @param aabb Region to search for entities.
			 * @param results If passed, entities found will be appended to this array.
			*/
			unfilteredSearch(aabb: AABB, results) {

				results = results || [];
				const idSet = new Set<number>()

				const keys = this.key(aabb)

				for (let x = keys.x1; x <= keys.x2; x++) {
					for (let y = keys.y1; y<= keys.y2; y++) {
						results = [...results, ...this.map[x][y]]
						this.map[x][y].forEach( (id: number) => {
							idSet.add(id)
						})
					}
				}
				return Array.from(idSet)
			},

			/**
			 * Update the entry.
			 * Called by 'Move' and 'Rotate' events in 2D.
			 * 
			 * This was Entry.update in Crafty
			 */
			updateEntry(entry, aabb) {
				if (!keysMatch(this.key(aabb), entry.keys))
					return this.refresh(entry, aabb)
				
				this._coordBoundsDirty = true
				return entry		
			},

			_hashXY(x: number, y: number): string {
				//return (x << 16) ^ y
				return (`${x}_${y}`)
			},

			_isEntity(obj: any): obj is E_2D {
				return isE_2D(obj)
			},

			_updateBoundaries() {
			
				if (!this._boundsDirty && !this._coordBoundsDirty) return

				let hash = this._boundsHash
				if (this._boundsDirty) {
					hash = this._boundsHash = CoordsDef()
				}

				let coords = this._boundsCoords = CoordsDef()

				for (let h in this.map) {
					let cell = this.map[h]
					if (!cell.length) continue

					// broad phase coordinate
					let x = <any>h >> 16
					let y = (<any>h << 16) >> 16;
					if (y < 0) {
							x = ~x; // i ^ -1
					}

					if (x >= hash.maxX) {
						hash.maxX = x
						for (let k in cell) {
							let ent = cell[k]
							if (this._isEntity(ent))
								coords.maxX = Math.max(coords.maxX, ent.x + ent.w)
						}
					}
					if (x <= hash.minX) {
						hash.minX = x
						for (let k in cell) {
							let ent = cell[k]
							if (this._isEntity(ent))
								coords.minX = Math.min(coords.minX, ent.x)
						}
					}
					if (y >= hash.maxY) {
						hash.maxY = y
						for (let k in cell) {
							let ent = cell[k]
							if (this._isEntity(ent))
								coords.maxY = Math.max(coords.maxY, ent.y + ent.h)
						}
					}
					if (y <= hash.minY) {
						hash.minY = y
						for (let k in cell) {
							let ent = cell[k]
							if (this._isEntity(ent))
								coords.minY = Math.min(coords.minY, ent.y)
						}
					}
					this._boundsDirty = this._coordBoundsDirty = false
				}
			}
		}
	
		return hashMap
	}
}

function keysMatch(a: Keys, b: Keys): boolean {
	return (a.x1 === b.x1 && a.x2 === b.x2 && a.y1 === b.y1 && a.y2 === b.y2)
}

export default HashMap
