import { Entity, E_2D, FPlugin } from "../freerunner"

const DiamondIsoPlugin: FPlugin = {
    name: 'diamondIso',
    load(F, options) {
        F.extend(diamondIso)
    }
}

const diamondIso = {
    _tile: {
        width: 0,
        height: 0,
        r: 0
    },
    getTileDimensions() {
        return {w: this._tile.width, h: this._tile.height}
    },
    _map: {
        width: 0,
        height: 0,
    },
    _origin: {
        x: 0,
        y: 0
    },
    _tiles: [] as Array<any>,
    getTile(x: number, y: number, z: number) {
        return this._tiles[x][y][z]
    },
    x: 0,
    y: 0,
    layerZLevel: 0,
    init(tw: number, th: number, mw: number, mh: number, x = 0, y = 0) {
        // this._tile.width = parseInt(tw, 10);
        // this._tile.height = parseInt(th, 10) || parseInt(tw, 10) / 2;
        this._tile.r = this._tile.width / this._tile.height

        // this._map.width = parseInt(mw, 10);
        // this._map.height = parseInt(mh, 10) || parseInt(mw, 10);
        for (let i=0; i<mw; i++) {
            this._tiles[i] = Array()
            for (let j=0; j<mh; j++) {
                this._tiles[i][j] = Array()
            }
        }
        this.layerZLevel = (mw + mh + 1)
        return this
    },
    pos2px(x = 0, y = 0) {
        return {
            x: this.x + ((x - y -1) * (this._tile.width / 2)),
            y: this.y + ((x + y) * (this._tile.height / 2))
        }
    },
    /**
     * Raw copy.
     * Return x/y coord at z = 0
     * @param left 
     * @param top 
     * @returns 
     */
    px2pos(left: number, top: number) {
        var v1 = (top - this.y)/this._tile.height;
        var v2 = (left - this.x)/this._tile.width;
        var x = v1+v2;
        var y = v1-v2;
        var inX = x>0 && x<this._map.width;
        var inY = y>0 && y<this._map.height;
        if (!inX || !inY){
            return undefined;
        }
        /*  double tilde is double NOT wich will floor positive number 
            but fail on negative, its only marginally faster in modern browsers
        */
        return {
            x: ~~x,
            y: ~~y
        };
    },
    getZAtLoc(x=0, y=0, layer=0) {
        return this.layerZLevel * layer + x + y
    },
    /**
     * Get tiles overlapping point.
     * @param x 
     * @param y 
     */
    getOverlappingTiles(x: number, y:number) {
        let pos = this.px2pos(x, y)
        if (!pos) return []
        let tiles = [] as Array<any>
        let _x = Math.floor(pos.x)
        let _y = Math.floor(pos.y)
        let maxX = this._map.width - _x
        let maxY = this._map.height - _y
        let furthest = Math.min(maxX - maxY)
        let tile = this._tiles[_x][_y][1]
        if (tile)
            tiles.push(tile)
        for (let i=1; i<furthest; i++) {
            let tmp = this._tiles[_x+i][_y+i][i]
            if (tmp)
                tiles.push(tmp)
        }
        return tiles
    },
    place(tile: E_2D, x = 0, y = 0, layer = 0) {
        let pos = this.pos2px(x, y)
        let spriteHeight = tile.h / this._tile.height
        tile.x = pos.x
        tile.y = pos.y - (spriteHeight - 2) * this._tile.height - this._tile.height * layer
        tile.z = this.getZAtLoc(x, y, layer)
        for (let i=0; i<spriteHeight-2; i++) {
            let prevTile = this._tiles[x][y][layer+i]
            if (prevTile && prevTile !== tile) {
                prevTile.destroy()
            }
            this._tiles[x][y][layer+i] = tile
        }
        return this
    },
    detatchTile(tile: E_2D) {
        for (let iX=0; iX < this._map.width; iX++) {
            for (let iY=0; iY < this._map.height; iY++) {
                const L = this._tiles[iX][iY].length
                for (let iZ=0; iZ<L; iZ++) {
                    if (this._tiles[iX][iY][iZ] && tile === this._tiles[iX][iY][iZ]) {
                        const H = tile.h/this._tile.height
                        for (let iH=0; iH<H; iH++) {
                            this._tiles[iX][iY][iZ+iH] = null
                        }
                        return { x: iX, y: iY, z: iZ }
                    }
                }
            }
        }
        return false
    },

    /**
     * @deprecated this should not be coupled to viewport, better return position
     * 
     */
    centerAt(x=0, y=0) {
    }
}

export default DiamondIsoPlugin
