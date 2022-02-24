// @ts-ignore
import Crafty from '../lib/crafty/crafty.js'

export default (function() : FGame {
    console.log('init Freerunner')
    const F = Crafty
    F.plugin = []
    F.loadPlugin = function(plugin: FPlugin, options?: any) {
        console.info('Load plugin', {plugin, options})
        if (F.plugin[plugin.name]) {
            console.info(`Plugin ${plugin.name} already loaded - ignoring`)
            return
        }
        plugin.load(F, options)
        F.plugin[plugin.name] = true
        return plugin
    }
    F.createEntity = F.e
    F.createComponent = function(comp: NamedComponent) {
        console.info('Load component', comp)
        F.c([comp.name], comp)
    }
    F.createSystem = function(system: System) {
        console.info('Load system', system)
        F.s(system.name, system)
    }
    
    F.load = function<T extends Loadable>(loadable: T, options: object): T {
        isPlugin(loadable) && F.loadPlugin(loadable, options)
        isSystem(loadable) && F.createSystem(loadable, options)
        isComponent(loadable) && F.createComponent(loadable, options)
        return loadable
    }

    /**
    * Get one specific entity by id.
    * @param entityId the id of the entity
    */
    F.get = function(entityId: number): Entity {
        return F(entityId)
    }
    F.c('obj', {})
    return F
})

function isPlugin(loadable: Loadable) : loadable is FPlugin {
    return loadable.type === 'Plugin'
}

function isComponent(loadable: Loadable): loadable is FComponent {
    return loadable.type === 'Component'
}

function isSystem(loadable: Loadable): loadable is FSystem {
    return loadable.type === 'System'
}


export declare interface FGame {
    (selector: string|number): Array<Entity> | Entity
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
    defineScene(name: string, scene: Function): void
    enterScene(name: string): void
    e<T extends Entity>(components: string): T
    extend(obj: any): this
    fps: number
    init(width?:number, height?:number, element?:HTMLElement|string|null): this
    load<T extends Loadable>(loadable: T, options?: object): T
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
    viewport: Viewport
    loadPlugin(plugin: FPlugin): FPlugin
    events: CoreEvent
}

export interface Loadable {
    readonly type: string
    name: string
    load?(F?: FGame, options?: object): void
}

export interface FPlugin extends Loadable {
    type: 'Plugin'
    load(F: FGame, options?: object): void
}

export interface FSystem extends Loadable, System {
    type: 'System',
    name: string
}

export interface FComponent extends Loadable, Component {
    type: 'Component',
    name: string
}

export interface Component {
    init?(this: Entity): void
    required?: string
    remove?(): void
    properties?: any
    events?: object
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
 * F.createComponent(MyComponent)
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

export interface Viewport {
    width: number
    height: number
    reload(): void
    init(): void
    reset(): void
}


export interface Entity extends Events {
    getId(): number
    attr(attributes: any): this
    addComponent(componentName: string): this
    requires(componentName: string): this
    [keys:string]: any
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

export interface Events {
    /**
     * Bind function to a named event.
     * @param name Named event.
     * @param fn Function to be bound
     */
    bind(name: string, fn: Function): void
    /**
     * Unbind event, note that reference to bound event is needed, so can't use anonymous functions.
     * @param name Event
     * @param fn Reference to function that was bound
     */
    unbind(name: string, fn: Function): void
    /**
     * Bind to an event only once.
     * @param name Named event.
     * @param fn Function to be bound
     */
    once(name: string, fn: Function): void
    /**
     * Trigger an event and provide data.
     * @param name Name of event
     * @param data Pass any data
     */
    trigger(name: string, data?: any): void
    /**
     * Bind function to named event but prevent multiple bounds.
     * @param name Named event.
     * @param fn Function to be bound
     */
    uniqueBind(name: string, fn: Function): void
}

export const GlobalEvents = {UpdateFrame: 'UpdateFrame'}

type CoreEvent = {UpdateFrame: 'UpdateFrame'}
