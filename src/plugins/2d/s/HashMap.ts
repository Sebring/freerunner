import { FGame, FSystem } from "../../../freerunner"
import { E_2D, isE_2D } from "../2d"
import { getRect, Rect } from "../lib/Rect"

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
	obj: E_2D
}

const emptyKeys = { x1: 0, x2: 0, y1: 0, y2: 0 } as Keys

export interface HashMap extends FSystem {
	load(F: FGame, options?: {size: number}): void
	_cellSize: number
	_boundsDirty: boolean
	_coordBoundsDirty: boolean
	_boundsHash: Coords
	_boundsCoords: Coords
	map: any
	boundaries() : void 
	insert(obj: E_2D, entry?: Entry): Entry
	key (obj: Rect) : Keys
	refresh(entry: Entry) : void
	remove(entry: Entry) : void
	unfilteredSearch(rect: Rect, results?: E_2D[]) : E_2D[]
	updateEntry(entry: Entry, rect :Rect) : void
	_hashXY(x: number, y: number): number
	_isEntity(obj: any): obj is E_2D
	_updateBoundaries(): void
}

const getKeyHash = (keys: Keys) : string => {
	return `${keys.x1} ${keys.y1} ${keys.x2} ${keys.y2}`
}

const HashMapSystem: HashMap = {
	name: 'HashMap',
	type: 'System',
	_cellSize: 64,
	_boundsDirty: false,
	_coordBoundsDirty: false,
	_boundsHash: CoordsDef(),
	_boundsCoords: CoordsDef(),
	map: {},
	load(F, {size} = {size:64}) {
		console.log('Load', this.name)
		this._cellSize = size
	},

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
	 * Insert obj into map, possibly be reusing an entry.
	*/
	insert (obj: E_2D, entry?: Entry): Entry {

		// create entry
		let keys = this.key(obj)
		
		// insert into map
		for (let x = keys.x1; x <= keys.x2; x++) {
			for (let y = keys.y1; y <= keys.y2; y++) {
				let hash = this._hashXY(x, y)
				if (!this.map[hash])
					this.map[hash] = []
				this.map[hash].push(obj)
			}
		}

		this._boundsDirty = true
		return {keys, obj}
	},

	/**
	 * Get the rectangular region (in terms of the grid, with grid size `cellsize`),
	 * where the object may fall in.
	 * This region is determined by the object's bounding box.
 	 * The `cellsize` is 64 by default.
		* 
		// FIXME:  so very unpure - update existing keys or return new
	 */
	key (e: E_2D): Keys{
		//debugger
		let rect = e._cbr || e._mbr || getRect(e)
		let keys = {x1: 0, x2:0, y1:0, y2: 0} as Keys
		keys.x1 = Math.floor(rect._x / this._cellSize)
		keys.y1 = Math.floor(rect._y / this._cellSize)
		keys.x2 = Math.floor((rect._w + rect._x) / this._cellSize)
		keys.y2 = Math.floor((rect._h + rect._y) / this._cellSize)
		console.log('keys', keys, e)
		return keys
	},

	/**
	 * Update an entry's keys, and its position in the broad phrase map.
	 */
	refresh ({keys, obj} : Entry) {
		
		// remove obj from map
		for (let x = keys.x1; x <= keys.x2; x++) {
			for (let y = keys.y1; y <= keys.y2; y++) {
				let hash = this._hashXY(x, y)
				let cell = this.map[hash]
				if (cell) {
					let n = cell.length;
					//loop over objs in cell and delete
					for (let m = 0; m < n; m++)
							if (cell[m] && cell[m][0] === obj[0]) {
									cell.splice(m, 1);
							}
				}
					
			}
		}

		// call function instead of code as in crafty source
		return this.insert(obj)
	},

	/**
	 * Remove an entry from the broad phase map.
	*/
	remove(entry: Entry) {
		let keys = entry.keys
		let obj = entry.obj
		
		// search in all buckets
		for (let x = keys.x1; x <= keys.x2; x++) {
			for (let y = keys.y1; y <= keys.y2; y++) {
				let hash = this._hashXY(x, y)
				if (this.map[hash]) {
					let cell = this.map[hash]
					// loop over items and delete
					for (let m = 0, L = cell.length; m < L; m++) {
						if (cell[m] && cell[m][0] === obj[0])
            	cell.splice(m, 1)
					}
				}
			}
		}

		this._boundsDirty = true;
	},

	/**
	 * Do a search for entities in the given region.  Returned entities are **not** guaranteed
	 * to overlap with the given region, and the results may contain duplicates.
	 * 
	 * This method is intended to be used as the first step of a more complex search.
	 * More common use cases should use Crafty.map.search, which filters the results.
	 * @param rect Region to search for entities.
	 * @param results If passed, entities found will be appended to this array.
	*/
	unfilteredSearch(rect: Rect, results?: E_2D[]) {
		var keys = this.key(rect),
				i, j, k,  cell;
		results = results || [];

		//search in all x buckets
		for (i = keys.x1; i <= keys.x2; i++) {
				//insert into all y buckets
				for (j = keys.y1; j <= keys.y2; j++) {
						if ((cell = this.map[(i << 16) ^ j])) {
								for (k = 0; k < cell.length; k++) {
										results.push(cell[k])
								}
						}
				}
		}
		return results
	},

	/**
	 * Update the entry.
	 * Called by 'Move' and 'Rotate' events in 2D.
	 * 
	 * This was Entry.update in Crafty
	 */
	updateEntry(entry: Entry, rect :Rect) {
		if (getKeyHash(this.key(rect)) !== getKeyHash(entry.keys))
			 return this.refresh(entry)
		
		this._coordBoundsDirty = true
		return entry		
	},

	_hashXY(x: number, y: number): number {
		return (x << 16) ^ y
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

export default HashMapSystem
