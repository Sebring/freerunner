
export interface Rect {
	_x: number
	_y: number
	_w: number
	_h: number
}

export const getRect = <T extends Rect>(o: T): Rect => {
	return {_x: o._x, _y: o._y, _w: o._w, _h: o._h}
}

/**
 * Calculate the mbr of multiple rects.
 */
export const boundingRect = (set: Rect[]): Rect => {
	let mbr = set[0]
	let x = typeof set
	for (let r of set.slice(1)) {
		if (r._x < mbr._x) mbr._x = r._x
		if (r._y < mbr._y) mbr._y = r._y
		if (r._w > mbr._w) mbr._w = r._w
		if (r._h > mbr._h) mbr._h = r._h
	}
	return mbr
}

export const emptyRect = {_x: 0, _y:0, _w: 0, _h: 0}
export const isRect = (rect: any): rect is Rect => {
	return (
		typeof rect._x === 'number' 
		&& typeof rect._y === 'number'
		&& typeof rect._w === 'number' 
		&& typeof rect._h === 'number')
}



/**
 * Calculate the smallest rectangle with integer coordinates that encloses the specified rectangle,
 * modifying the passed object to have those bounds.
 * 
 * FIXME: so very unpure!
 */
export const integerBounds = (rect: Rect) => {
	rect._x = Math.floor(rect._x)
	rect._y = Math.floor(rect._y)
	rect._w = Math.ceil(rect._w)
	rect._h = Math.ceil(rect._h)
	return rect
}

/**
 * Merge two rects.
 * FIXME: remove target?
 */
export const merge = <T extends Rect>(a: T, b: T, target?: T|Rect) => {
	if (!target) target = {_x: 0, _y: 0, _h: 0, _w: 0}
	target._h = Math.max(a._y + a._h, b._y + b._h)
	target._w = Math.max(a._x + a._w, b._x + b._w)
	target._x = Math.min(a._x, b._x)
	target._y = Math.min(a._y, b._y)
	target._w -= target._x
	target._h -= target._y
	return target
}

/**
 * Merge any consecutive, overlapping rects into each other.
 * Its an optimization for the redraw regions.
 *
 * The order of set isn't strictly meaningful,
 * but overlapping objects will often cause each other to change,
 * and so might be consecutive.
 */
export const mergeSet = <T extends Rect> (set: T[]) : T => {
	if (set.length < 2 ) return set[0]

	let n = set.length - 1
	while (n--) {
		if (overlap(set[n], set[n+1])) {
			merge(set[n], set[n+1], set[n])
			set.splice(n+1, 1)
		}
	}
	return set[0]
}

/**
 * Checks whether two rectangles overlap.
 */
export const overlap = (a: Rect, b: Rect) => {
	return (a._x < b._x + b._w && a._x + a._w > b._x &&
		a._y < b._y + b._h && a._y + a._h > b._y)
}

export const clone = (orig: Rect): Rect => {
	return {...orig}
}
