// @ts-ignore
import C from '../lib/crafty/crafty.js'

const Freerunner = (function(width?: number, height?: number, element?: HTMLElement) : FGame {
    console.log('init Freerunner')
    C.plugin = []
    C.loadPlugin = function(plugin: FPlugin) {
        if (C.plugin[plugin.name]) {
            console.info(`Plugin ${plugin.name} already loaded - ignoring`)
            return
        }
        C.plugin[plugin.name] = plugin
        plugin.load(this)
        return plugin
    }
    if (width && height)
        C.init(width, height, element)
    C.cc = function(comp: CComponent) {
        C.c([comp.name], comp)
    }
    return C
})

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
    cc<T extends CComponent>(component: CComponent) : T
    e<T extends Entity>(components: string): T
    fps: number
    init(width?:number, height?:number): this
    
    keys: any
    
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
     * Registers a system.
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
    rectManager: any
    UID() : any
    math: Math
    viewport: Viewport
    loadPlugin(plugin: FPlugin) : FPlugin
}

export interface Component {
    init?() : this
    required?: string
    properties?: any
    events?: any
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
export interface CComponent extends Component {
    name: string
}

export interface FPlugin {
    name: string
    load(C: FGame, options?: any) : void
}

export interface Viewport {
    width: number
    height: number
    reload() : void
    init() : void
    reset() : void
}


export interface Entity {
    attr(attributes: any) : this
    addComponent(componentName: string) : this
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