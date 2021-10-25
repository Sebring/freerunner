// @ts-ignore
import Crafty from '../lib/crafty/crafty.js'

const Freerunner = (function() : FGame {
    console.log('init Freerunner')
    Crafty.plugin = []
    Crafty.loadPlugin = function(plugin: FPlugin) {
        if (Crafty.plugin[plugin.name]) {
            console.info(`Plugin ${plugin.name} already loaded - ignoring`)
            return
        }
        Crafty.plugin[plugin.name] = plugin
        plugin.load(this)
        return plugin
    }
    Crafty.createEntity = Crafty.e
    Crafty.createComponent = function(comp: NamedComponent) {
        Crafty.c([comp.name], comp)
    }
    Crafty.createSystem = function(system: System) {
        Crafty.c([system.name], system)
    }
    return Crafty
})

// @ts-ignore
if (window) window.Freerunner = Freerunner;

export default Freerunner

export declare interface FGame {
    (selector: string): Array<Entity>
    /**
     * Create a component.
     * @param name name of the new component
     * @param component component object data
     */
    c<T extends Component>(name: string, component: T): T
    /**
     * Create a component.
     * @param component componenent object data
     */
    createComponent<T extends NamedComponent>(component: NamedComponent) : T
    createEntity<T extends Entity>(components: string): T
    e<T extends Entity>(components: string): T
    fps: number
    init(width?:number, height?:number, element?:HTMLElement|string|null): this
    
    /**
     * Set background color to html color name.
     */
    background(color: string): this
    
    /**
     * Pauses the game by stopping the `UpdateFrame` event from firing. If the game is already paused it is unpaused.
     * You can pass a boolean parameter if you want to pause or unpause no matter what the current state is.
     * Modern browsers pauses the game when the page is not visible to the user. If you want the Pause event
     * to be triggered when that happens you can enable autoPause in `Crafty.settings`.
     */
    pause(toggle?:boolean): this

    /**
     * Creates a system.
     *
     * _Triggers Events_
     * - `"SystemLoaded", this` - When the system has initialized itself
     * - `"SystemDestroyed", this` - Right before the system is destroyed 
     *
     * Objects which handle entities might want to subscribe to the event system without being entities themselves.
     * When you declare a system with a template object, all the methods and properties of that template are copied to a new object.
     * This new system will automatically have the following event related methods, which function like those of components:
     * `.bind()`, `unbind()`, `trigger()`, `one()`, `uniqueBind()`, `destroy()`.
     * Much like components, you can also provide `init()` and `remove()` methods,
     * a `properties` dictionary which will be used to define properties with Object.defineProperty,
     * as well as an `events` parameter for automatically binding to events.
     *
     * @note The `init()` method is for setting up the internal state of the system,
     * if you create entities in it that then reference the system, that'll create an infinite loop.
     */
    createSystem<T extends NamedSystem>(system: NamedSystem): T
    s<T>(name: string, template?: T): T
    /**
     * Stops the `UpdateFrame` interval and removes the stage element.
     *
     * To restart, use `Crafty.init()`.
     * @param clearState - if true the stage and all game state is cleared.
     */
    stop(clearState?: boolean): this

    isPaused(): boolean
    /**
     * Trigger event
     * @param event name of event
     * @param data data to pass 
     */
    trigger(event: string, data: any): void
    rectManager: any
    UID(): any
    math: Math
    viewport: Viewport
    loadPlugin(plugin: FPlugin): FPlugin
}

export interface Component {
    init?(): void
    required?: string
    properties?: any
    events?: object
    [keys:string]: any
}

/**
 * Same as [[Component]] except name-attribute is required.
 * 
 * This gives the possibility to export component objects and create them without the need of
 * providing name as separate parameter.
 * 
 * ```typescript
 * import MyComponent from '/components/MyComponent'
 * 
 * const F = Freerunner()
 * F.cc(MyComponent)
 * ```
 */
 export interface NamedComponent extends Component {
    name: string
}

export interface System {
    init?(): void
    events?: object
    [keys:string]: any
}

export interface NamedSystem extends System {
    name: string
}



export interface FPlugin {
    name: string
    load(C: FGame, options?: any): void
}

export interface Viewport {
    width: number
    height: number
    reload(): void
    init(): void
    reset(): void
}


export interface Entity {
    attr(attributes: any): this
    addComponent(componentName: string): this
    bind(event: string, fn: any): this
    [keys:string]: any
}

export interface E_2D extends Entity {
    x: number
    y: number
    h: number
    w: number
}

export interface E_Motion extends E_2D {
    vx: number
    vy: number
}

export interface E_Gravity extends E_Motion {
    gravity(): this
    antigravity(): this
}

/**
 * Entities with the text-component.
 * 
 * By default, text will have the style "10px sans-serif".
 */
export interface E_Text extends Entity {
    /**
     * Update the text inside the entity.
     * @param text String of text that will be inserted into the DOM or Canvas element.
     */
    text(text: string): this
    /**
     * Change the alignment of the text. Valid values are 'start'|'end'|'left'|'center'|'right'.
     * @param alignment The new alignment of the text.
     */
    textAlign(alignment: 'start'|'end'|'left'|'center'|'right'): this
    /**
     * Chage the color of the text.
     * @param color The color in name or string representation of hex, rgb or rgba.
     */
    textColor(color: string): this
    /**
     * Set font properties of the text entity.
     * #### Example
     * ```javascript
     * F.createEntity('2D, DOM, Text').textFont({ size: '20px', weight: 'bold' })
     * ```
     * @param obj Object with key: 'value' pairs.
     */
    textFont(obj: object): this
    /**
     * This method sets the text so that it cannot be selected (highlighted) by dragging. 
     * (Canvas text can never be highlighted, so this only matters for DOM text.) Works by changing 
     * the css property "user-select" and its variants.  
     * Likewise, this sets the mouseover cursor to be "default" (arrow), not "text" (I-beam)
     */
    unselectable(): this
    /**
     * Turns on (or off) dynamic text generation for this entity. While dynamic text generation is on, if the .text() 
     * method is called with a text generating function, the text will be updated each frame.
     * If textUpdateEvent is provided, text generation will be bound to that event instead of "UpdateFrame".
     * The text generating function is invoked with the event object parameter, which the event was triggered with.
     * 
     * **Note:** Dynamic text generation could cause performance issues when the entity is attached to a Canvas layer.
     * @param isEnabled 
     * @param eventName Text generation is triggered by this event, defaults to 'UpdateFrame'. 
     */
    dynamicTextGeneration(isEnabled: boolean, eventName: string): this
}
export interface EventFunction {
    (event: any): void
}