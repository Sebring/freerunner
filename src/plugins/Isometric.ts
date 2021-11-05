import { Entity, E_2D, FPlugin } from "../freerunner"

const IsometricPlugin: FPlugin = {
    name: 'Isometric',
    load(F, options) {
        F.extend({Isometric})
    }
}

export default IsometricPlugin

type Tile = {
    left: number
    top: number
}

type Point = {
    x: number
    y: number
}

export const Isometric = {
    _tile: {
        width: 0,
        height: 0
    },
    _elements: {},
    _pos: {
        x: 0,
        y: 0
    },
    _z: 0,
    /**
     * Set the size of each tile to calculate offset in placing.
     * For a flat surface this is the size of the top surface.
     * For a square surface the height is width/2.
     * Recommended to use a size values in the power of `2` (128, 64 or 32).
     * This makes it easy to calculate positions and implement zooming.
     * @param width
     * @param height Defaults as width/2
     */
    size(width: number, height=(width/2)) {
        this._tile.width = width
        this._tile.height = height
        return this
    },
    place(e: E_2D, x=0, y=0, z=0, offsetX=0, offsetY=0) {
        let pos = this.pos2px({ x, y })
        pos.top -= z * (this._tile.height / 2)
        e.x = pos.left + offsetX
        e.y = pos.top + offsetY
        e.z += z
        return this 
    },
    pos2px(p: Point): Tile {
        return {
            left: p.x * this._tile.width + (p.y & 1) * (this._tile.width / 2),
            top: p.y * this._tile.height / 2
        }
    },
    px2pos(tile: Tile) {
        return {
            x: -Math.ceil(-tile.left / this._tile.width - (tile.top & 1) * 0.5),
            y: tile.top / this._tile.height * 2
        }
    },
    /**
     * @deprecated return position and move viewport outside this plugin
     * @param p 
     */
    centerAt(p: Point): Tile {
        return this.pos2px(p)
    },
    /**
     * @deprecated uses viewport
     * Get tiles inside viewport
     */
    area() {

    }
}