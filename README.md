# Freerunner
Frerunner is an [event driven](https://gameprogrammingpatterns.com/event-queue.html) game engine.  
Frerunner is a [entity component system](https://gameprogrammingpatterns.com/component.html) based game engine.  
Frerunner is...

well...

Honestly at this early stage it is not much more than a typescript wrapper around [Crafty](https://github.com/craftyjs/Crafty). If you have tried craftyjs you know what a wonderful engine it is and how powerful yet simple the ecs pattern is for game development. Sadly crafty never made it to 1.0.0 and hasn't seen a commit in the last 4 or so years. Crafty has [decent api documentation](http://craftyjs.com/api/) and most of it applies on Freerunner.

## Getting started

### Install
```
npm i freerunner
```

### Usage
_game.ts_
```typescript
import Freerunner from 'freerunner'
const F = Freerunner() // F is you new Crafty object
F.init()
F.e('2D, Color').attr({x:10, y:10, h:20, w:20}).color('hotpink')
```

See [Platformer demo](https://github.com/Sebring/freerunner/wiki/Quickstart-using-Parcel) for a working example.  
And did I mention it's based on [Crafty](http://craftyjs.com/getting-started/)?
