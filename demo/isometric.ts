import Freerunner from '../src/freerunner';
import { Isometric } from '../src/plugins/Isometric'

const F = Freerunner()
F.init(800, 400)



// tile, url, map
F.sprite(128, "images/isometric_sprite.png", {
    grass: [0,0,1,1],
    stone: [1,0,1,1]
});

let iso = Isometric.size(128, 64)
let z = 0;

F.c('Tile', {
    required: '2D, DOM, Mouse',
    init() {
        F.math.randomInt(0,1)? this.addComponent('grass') : this.addComponent('stone')
        this.areaMap([64,0, 128,32, 128,96, 64,128, 0,96, 0,32])
    },
    events: {
        MouseDown(e) {
            if(e.mouseButton === 2) this.destroy();
        },
        MouseOver() {
            if(this.has("grass")) {
                this.sprite(0,1,1,1);
            } else {
                this.sprite(1,1,1,1);
            }
        },
        MouseOut() {
            if(this.has("grass")) {
                this.sprite(0,0,1,1);
            } else {
                this.sprite(1,0,1,1);
            }
        }
    }
})

for(var x = 9; x >= 0; x--) {
    for(var y = 0; y < 20; y++) {
        
        var tile = F.e('Tile')
            .attr({z: x+1 * y+1})
        iso.place(tile, x, y, 0, 25, 25);
    }
}
	
	F.addEvent(window, F.stage.elem, "mousedown", function(e) {
        console.log('mouse', e.button)
		if(e.button > 1) return;
		var base = {x: e.clientX, y: e.clientY};

		function scroll(e) {
			var dx = base.x - e.clientX,
				dy = base.y - e.clientY;
				base = {x: e.clientX, y: e.clientY};
			F.viewport.x -= dx;
			F.viewport.y -= dy;
		};

		F.addEvent(window, F.stage.elem, "mousemove", scroll);
		F.addEvent(window, F.stage.elem, "mouseup", function() {
			F.removeEvent(window, F.stage.elem, "mousemove", scroll);
		});
	});
