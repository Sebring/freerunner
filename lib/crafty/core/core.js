var version = require('./version');


/**@
 * #Crafty
 * @category Core
 * @kind CoreObject
 *
 * `Crafty` is both an object, and a function for selecting entities.
 * Its many methods and properties are discussed individually.
 * Below is the documentation for use as a selector.
 *
 * @sign public EntitySelection Crafty( String selector)
 * @param selector - A string representing which entities to select
 *
 * @sign public Entity Crafty( Number selector )
 * @param selector - An entity's id
 *
 * Select a set of or single entities by components or an entity's ID.
 *
 * Crafty uses syntax similar to jQuery by having a selector engine to select entities by their components.
 *
 * If there is more than one match, the return value is an Array-like object listing the ID numbers of each matching entity. If there is exactly one match, the entity itself is returned. If you're not sure how many matches to expect, check the number of matches via Crafty(...).length. Alternatively, use Crafty(...).each(...), which works in all cases.
 *
 * @note You can treat an entity as if it was a selection of length 1 -- it implements all the same methods.
 *
 * @example
 * ~~~
 *    Crafty("MyComponent")
 *    Crafty("Hello 2D Component")
 *    Crafty("Hello, 2D, Component")
 * ~~~
 *
 * The first selector will return all entities that have the component `MyComponent`. The second will return all entities that have `Hello` and `2D` and `Component` whereas the last will return all entities that have at least one of those components (or).
 *
 * ~~~
 *   Crafty("*")
 * ~~~
 * Passing `*` will select all entities.
 *
 * ~~~
 *   Crafty(1)
 * ~~~
 * Passing an integer will select the entity with that `ID`.
 *
 * To work directly with an array of entities, use the `get()` method on a selection.
 * To call a function in the context of each entity, use the `.each()` method.
 *
 * The event related methods such as `bind` and `trigger` will work on selections of entities.
 *
 * @see Crafty Core#.get
 * @see Crafty Core#.each
 */

var Crafty = function (selector) {
    return new Crafty.fn.init(selector);
};
    // Internal variables
var GUID, frame, components, entities, handlers, onloads, compEntities,
slice, rlist, rspace;


components  = {}; // Map of components and their functions
slice       = Array.prototype.slice;
rlist       = /\s*,\s*/;
rspace      = /\s+/;

var initState = function () {
    GUID        = 1; // GUID for entity IDs
    frame       = 0;

    entities    = {}; // Map of entities and their data
    compEntities= {}; // Map from componentName to (entityId -> entity)
    handlers    = {}; // Global event handlers
    onloads     = []; // Temporary storage of onload handlers
};

initState();

/**@
 * #Crafty Core
 * @category Core
 * @kind CoreObject
 * 
 * @trigger NewEntityName - After setting new name for entity - String - entity name
 * @trigger NewComponent - when a new component is added to the entity - String - Component
 * @trigger RemoveComponent - when a component is removed from the entity - String - Component
 * @trigger Remove - when the entity is removed by calling .destroy()
 *
 * A set of methods added to every single entity.
 */
Crafty.fn = Crafty.prototype = {

    init: function (selector) {
        //select entities by component
        if (typeof selector === "string") {
            var elem = 0, //index elements
                e, //entity forEach
                and = false, //flags for multiple
                or = false,
                del,
                comps,
                filteredCompEnts, compEnts, compEnts2, compEnt,
                i, l;

            if (selector === '*') {
                i = 0;
                for (e in entities) {
                    // entities is something like {2:entity2, 3:entity3, 11:entity11, ...}
                    // The for...in loop sets e to "2", "3", "11", ... i.e. all
                    // the entity ID numbers. e is a string, so +e converts to number type.
                    this[i] = +e;
                    i++;
                }
                this.length = i;
                // if there's only one entity, return the actual entity
                if (i === 1) {
                    return entities[this[0]];
                }
                return this;
            }

            //multiple components OR
            if (selector.indexOf(',') !== -1) {
                or = true;
                del = rlist;
                //deal with multiple components AND
            } else if (selector.indexOf(' ') !== -1) {
                and = true;
                del = rspace;
            }

            if (or) {
                comps = selector.split(del);

                filteredCompEnts = {}; // populate object with union of keys from all sets
                for (i = 0, l = comps.length; i < l; i++) {
                    compEnts = compEntities[comps[i]];
                    for (compEnt in compEnts) {
                        filteredCompEnts[compEnt] = +compEnt; //convert to int
                    }
                }

                for (compEnt in filteredCompEnts) { // add set elements to result
                    this[elem++] = filteredCompEnts[compEnt];
                }
            } else if (and) {
                comps = selector.split(del);

                filteredCompEnts = {}; // populate initial object with keys in common from first two sets
                compEnts = compEntities[comps[0]];
                compEnts2 = compEntities[comps[1]];
                for (compEnt in compEnts) {
                    if (compEnts2[compEnt] !== undefined)
                        filteredCompEnts[compEnt] = +compEnt; //convert to int
                }

                for (i = 2, l = comps.length; i < l; i++) { // strip initial object keys not in following sets
                    compEnts = compEntities[comps[i]];
                    for (compEnt in filteredCompEnts) {
                        if (compEnts[compEnt] === undefined)
                            filteredCompEnts[compEnt] = -1;
                    }
                }

                for (compEnt in filteredCompEnts) { // add valid elements to result
                    i = filteredCompEnts[compEnt];
                    if (i >= 0) this[elem++] = i;
                }
            } else { // single component selector
                compEnts = compEntities[selector];
                for (compEnt in compEnts) {
                    this[elem++] = +compEnt; //convert to int
                }
            }

            this.length = elem; //length is the last index (already incremented)

            // if there's only one entity, return the actual entity
            if (elem === 1) {
                return entities[this[elem - 1]];
            }

        } else { //Select a specific entity

            if (!selector) { //nothin passed creates God entity
                selector = 0;
                if (!(selector in entities)) entities[selector] = this;
            }

            //if not exists, return undefined
            if (!(selector in entities)) {
                this.length = 0;
                return this;
            }

            this[0] = selector;
            this.length = 1;

            //update from the cache
            if (!this.__c) this.__c = {};
            if (!this._callbacks) Crafty._addCallbackMethods(this);

            //update to the cache if NULL
            if (!entities[selector]) entities[selector] = this;
            return entities[selector]; //return the cached selector
        }

        Crafty._addCallbackMethods(this);
        return this;
    },

    /**@
     * #.setName
     * @comp Crafty Core
     * @kind Method
     * 
     * @sign public this .setName(String name)
     * @param name - A human readable name for debugging purposes.
     *
     * Set a human readable name for debugging purposes.
     *
     * @example
     * ~~~
     * var ent = Crafty.e().setName("Player");
     * ~~~
     *
     * @see Crafty Core#.getName
     */
    setName: function (name) {
        var entityName = String(name);
        this._entityName = entityName;
        this.trigger("NewEntityName", entityName);
        return this;
    },

    /**@
     * #.getName
     * @comp Crafty Core
     * @kind Method
     * 
     * @sign public this .getName(String name)
     * @returns A human readable name for debugging purposes.
     *
     * Get the human readable name for debugging purposes.
     *
     * @example
     * ~~~
     * var ent = Crafty.e().setName("Player");
     * var name = ent.getName();
     * ~~~
     *
     * @see Crafty Core#.setName
     */
    getName: function (name) {
        return this._entityName;
    },

    /**@
     * #.addComponent
     * @comp Crafty Core
     * @kind Method
     * 
     * @sign public this .addComponent(String componentList)
     * @param componentList - A string of components to add separated by a comma `,`
     * @sign public this .addComponent(String Component1[, .., String ComponentN])
     * @param Component# - Component ID to add.
     *
     * Adds a component to the selected entities or entity.
     *
     * Components are used to extend the functionality of entities.
     * This means it will copy properties and assign methods to
     * augment the functionality of the entity.
     *
     * For adding multiple components, you can either pass a string with
     * all the component names (separated by commas), or pass each component name as
     * an argument.
     *
     * If the component has a function named `init` it will be called.
     *
     * If the entity already has the component, the component is skipped (nothing happens).
     *
     * @example
     * ~~~
     * this.addComponent("2D, Canvas");
     * this.addComponent("2D", "Canvas");
     * ~~~
     */
    addComponent: function (id) {
        var comps, compName,
            comp, c = 0;

        //add multiple arguments
        if (arguments.length === 1 && id.indexOf(',') !== -1) {
            comps = id.split(rlist);
        } else {
            comps = arguments;
        }

        //extend the components
        for (; c < comps.length; c++) {
            compName = comps[c];

            // If component already exists, continue
            if (this.__c[compName] === true) {
                continue;
            }
            this.__c[compName] = true;
            // update map from component to (entityId -> entity)
            (compEntities[compName] = compEntities[compName] || {})[this[0]] = this;

            comp = components[compName];
            // Copy all methods of the component
            this.extend(comp);
            // Add any required components
            if (comp && "required" in comp) {
                this.requires( comp.required );
            }
            // Define properties
            if (comp && "properties" in comp) {
                var props = comp.properties;
                for (var propertyName in props) {
                    Object.defineProperty(this, propertyName, props[propertyName]);
                }
            }
            // Bind events
            if (comp && "events" in comp){
                var auto = comp.events;
                for (var eventName in auto){
                    var fn = typeof auto[eventName] === "function" ? auto[eventName] : comp[auto[eventName]];
                    this.bind(eventName, fn);
                }
            }
            // Call constructor function
            if (comp && "init" in comp) {
                comp.init.call(this);
            }
        }

        this.trigger("NewComponent", comps);
        return this;
    },

    /**@
     * #.toggleComponent
     * @comp Crafty Core
     * @kind Method
     * 
     * @sign public this .toggleComponent(String ComponentList)
     * @param ComponentList - A string of components to add or remove separated by a comma `,`
     * @sign public this .toggleComponent(String Component1[, .., String componentN])
     * @param Component# - Component ID to add or remove.
     * 
     * Add or Remove Components from an entity.
     *
     * @example
     * ~~~
     * var e = Crafty.e("2D,DOM,Test");
     * e.toggleComponent("Test,Test2"); //Remove Test, add Test2
     * e.toggleComponent("Test,Test2"); //Add Test, remove Test2
     * ~~~
     *
     * ~~~
     * var e = Crafty.e("2D,DOM,Test");
     * e.toggleComponent("Test","Test2"); //Remove Test, add Test2
     * e.toggleComponent("Test","Test2"); //Add Test, remove Test2
     * e.toggleComponent("Test");         //Remove Test
     * ~~~
     */
    toggleComponent: function (toggle) {
        var i = 0,
            l, comps;
        if (arguments.length > 1) {
            l = arguments.length;

            for (; i < l; i++) {
                if (this.has(arguments[i])) {
                    this.removeComponent(arguments[i]);
                } else {
                    this.addComponent(arguments[i]);
                }
            }
            //split components if contains comma
        } else if (toggle.indexOf(',') !== -1) {
            comps = toggle.split(rlist);
            l = comps.length;
            for (; i < l; i++) {
                if (this.has(comps[i])) {
                    this.removeComponent(comps[i]);
                } else {
                    this.addComponent(comps[i]);
                }
            }

            //single component passed
        } else {
            if (this.has(toggle)) {
                this.removeComponent(toggle);
            } else {
                this.addComponent(toggle);
            }
        }

        return this;
    },

    /**@
     * #.requires
     * @comp Crafty Core
     * @kind Method
     * 
     * @sign public this .requires(String componentList)
     * @param componentList - List of components that must be added
     * 
     * @sign public this .addComponent(String component1, String component2[, .. , ComponentN])
     * @param Component# - A component to add
     *
     * Makes sure the entity has the components listed. If the entity does not
     * have the component, it will add it.
     *
     * (In the current version of Crafty, this function behaves exactly the same
     * as `addComponent`. By convention, developers have used `requires` for
     * component dependencies -- i.e. to indicate specifically that one component
     * will only work properly if another component is present -- and used
     * `addComponent` in all other situations.)
     *
     * @see .addComponent
     */
    requires: function () {
        return this.addComponent.apply(this, arguments);
    },

    /**@
     * #.removeComponent
     * @comp Crafty Core
     * @kind Method
     * 
     * @sign public this .removeComponent(String Component[, soft])
     * @param component - Component to remove
     * @param soft - Whether to soft remove it (defaults to `true`)
     *
     * Removes a component from an entity. A soft remove (the default) will only
     * refrain `.has()` from returning true. Hard will remove all
     * associated properties and methods.
     *
     * @example
     * ~~~
     * var e = Crafty.e("2D,DOM,Test");
     * e.removeComponent("Test");        //Soft remove Test component
     * e.removeComponent("Test", false); //Hard remove Test component
     * ~~~
     */
    removeComponent: function (id, soft) {
        var comp = components[id];
        this.trigger("RemoveComponent", id);
        if (comp && "events" in comp){
            var auto = comp.events;
            for (var eventName in auto){
                var fn = typeof auto[eventName] === "function" ? auto[eventName] : comp[auto[eventName]];
                this.unbind(eventName, fn);
            }
        }
        if (comp && "remove" in comp) {
            comp.remove.call(this, false);
        }
        if (soft === false && comp) {
            for (var prop in comp) {
                delete this[prop];
            }
        }
        delete this.__c[id];
        // update map from component to (entityId -> entity)
        if (compEntities[id]) {
            delete compEntities[id][this[0]];
        }

        return this;
    },

    /**@
     * #.getId
     * @comp Crafty Core
     * @kind Method
     * 
     * @sign public Number .getId(void)
     * @returns the ID of this entity.
     *
     * For better performance, simply use the this[0] property.
     *
     * @example
     * Finding out the `ID` of an entity can be done by returning the property `0`.
     * ~~~
     *    var ent = Crafty.e("2D");
     *    ent[0]; //ID
     *    ent.getId(); //also ID
     * ~~~
     */
    getId: function () {
        return this[0];
    },

    /**@
     * #.has
     * @comp Crafty Core
     * @kind Method
     * 
     * @sign public Boolean .has(String component)
     * @param component - The name of the component to check
     * @returns `true` or `false` depending on if the
     * entity has the given component.
     *
     * For better performance, simply use the `.__c` object
     * which will be `true` if the entity has the component or
     * will not exist (or be `false`).
     */
    has: function (id) {
        return !!this.__c[id];
    },

    /**@
     * #.attr
     * @comp Crafty Core
     * @kind Method
     * 
     * @trigger Change - when properties change - {key: value}
     *
     * @sign public this .attr(String property, Any value[, Boolean silent[, Boolean recursive]])
     * @param property - Property of the entity to modify
     * @param value - Value to set the property to
     * @param silent - If you would like to supress events
     * @param recursive - If you would like merge recursively
     *
     * Use this method to set any property of the entity.
     *
     * @sign public this .attr(Object map[, Boolean silent[, Boolean recursive]])
     * @param map - Object where each key is the property to modify and the value as the property value
     * @param silent - If you would like to supress events
     * @param recursive - If you would like merge recursively
     *
     * Use this method to set multiple properties of the entity.
     *
     * Setter options:
     * - `silent`: If you want to prevent it from firing events.
     * - `recursive`: If you pass in an object you could overwrite sibling keys, this recursively merges instead of just merging it. This is `false` by default, unless you are using dot notation `name.first`.
     *
     * @sign public Any .attr(String property)
     * @param property - Property of the entity to modify
     * @returns Value - the value of the property
     *
     * Use this method to get any property of the entity. You can also retrieve the property using `this.property`.
     * 
     *
     * @example
     * ~~~
     * this.attr({key: "value", prop: 5});
     * this.attr("key"); // returns "value"
     * this.attr("prop"); // returns 5
     * this.key; // "value"
     * this.prop; // 5
     *
     * this.attr("key", "newvalue");
     * this.attr("key"); // returns "newvalue"
     * this.key; // "newvalue"
     *
     * this.attr("parent.child", "newvalue");
     * this.parent; // {child: "newvalue"};
     * this.attr('parent.child'); // "newvalue"
     * ~~~
     */
    attr: function (key, value, silent, recursive) {
        if (arguments.length === 1 && typeof arguments[0] === 'string') {
            return this._attr_get(key);
        } else {
            return this._attr_set(key, value, silent, recursive);
        }
    },

    /**
     * Internal getter method for data on the entity. Called by `.attr`.
     *
     * example
     * ~~~
     * person._attr_get('name'); // Foxxy
     * person._attr_get('contact'); // {email: 'fox_at_example.com'}
     * person._attr_get('contact.email'); // fox_at_example.com
     * ~~~
     */
    _attr_get: function(key, context) {
        var first, keys, subkey;
        if (typeof context === "undefined" || context === null) {
            context = this;
        }
        if (key.indexOf('.') > -1) {
            keys = key.split('.');
            first = keys.shift();
            subkey = keys.join('.');
            return this._attr_get(keys.join('.'), context[first]);
        } else {
            return context[key];
        }
    },

    /**
     * Internal setter method for attributes on the component. Called by `.attr`.
     *
     * Options:
     *
     * `silent`: If you want to prevent it from firing events.
     *
     * `recursive`: If you pass in an object you could overwrite
     * sibling keys, this recursively merges instead of just
     * merging it. This is `false` by default, unless you are
     * using dot notation `name.first`.
     *
     * example
     * ~~~
     * person._attr_set('name', 'Foxxy', true);
     * person._attr_set('name', 'Foxxy');
     * person._attr_set({name: 'Foxxy'}, true);
     * person._attr_set({name: 'Foxxy'});
     * person._attr_set('name.first', 'Foxxy');
     * ~~~
     */
    _attr_set: function() {
        var data, silent, recursive;
        if (typeof arguments[0] === 'string') {
            data = this._set_create_object(arguments[0], arguments[1]);
            silent = !!arguments[2];
            recursive = arguments[3] || arguments[0].indexOf('.') > -1;
        } else {
            data = arguments[0];
            silent = !!arguments[1];
            recursive = !!arguments[2];
        }

        if (!silent) {
            this.trigger('Change', data);
        }

        if (recursive) {
            this._recursive_extend(data, this);
        } else {
            this.extend.call(this, data);
        }
        return this;
    },

    /**
     * If you are setting a key of 'foo.bar' or 'bar', this creates
     * the appropriate object for you to recursively merge with the
     * current attributes.
     */
    _set_create_object: function(key, value) {
        var data = {}, keys, first, subkey;
        if (key.indexOf('.') > -1) {
            keys = key.split('.');
            first = keys.shift();
            subkey = keys.join('.');
            data[first] = this._set_create_object(subkey, value);
        } else {
            data[key] = value;
        }
        return data;
    },

    /**
     * Recursively puts `new_data` into `original_data`.
     */
    _recursive_extend: function(new_data, original_data) {
        var key;
        for (key in new_data) {
            if (new_data[key].constructor === Object) {
                original_data[key] = this._recursive_extend(new_data[key], original_data[key]);
            } else {
                original_data[key] = new_data[key];
            }
        }
        return original_data;
    },

    /**@
     * #.toArray
     * @comp Crafty Core
     * @kind Method
     * 
     * @sign public this .toArray(void)
     *
     * This method will simply return the found entities as an array of ids.  To get an array of the actual entities, use `get()`.
     * @see .get
     */
    toArray: function () {
        return slice.call(this, 0);
    },

    /**@
    * #.timeout
    * @comp Crafty Core
    * @kind Method

    * @sign public this .timeout(Function callback, Number delay)
    * @param callback - Method to execute after given amount of milliseconds
    * @param delay - Amount of milliseconds to execute the method
    *
    * The delay method will execute a function after a given amount of time in milliseconds.
    *
    * Essentially a wrapper for `setTimeout`.
    *
    * @example
    * Destroy itself after 100 milliseconds
    * ~~~
    * this.timeout(function() {
         this.destroy();
    * }, 100);
    * ~~~
    */
    timeout: function (callback, duration) {
        this.each(function () {
            var self = this;
            setTimeout(function () {
                callback.call(self);
            }, duration);
        });
        return this;
    },

    /**@
     * #.bind
     * @comp Crafty Core
     * @kind Method
     * 
     * @sign public this .bind(String eventName, Function callback)
     * @param eventName - Name of the event to bind to
     * @param callback - Method to execute when the event is triggered
     *
     * Attach the current entity (or entities) to listen for an event.
     *
     * Callback will be invoked when an event with the event name passed
     * is triggered. Depending on the event, some data may be passed
     * via an argument to the callback function.
     *
     * The first argument is the event name (can be anything) whilst the
     * second argument is the callback. If the event has data, the
     * callback should have an argument.
     *
     * Events are arbitrary and provide communication between components.
     * You can trigger or bind an event even if it doesn't exist yet.
     *
     * Unlike DOM events, Crafty events are executed synchronously.
     *
     * @example
     * ~~~
     * this.attr("triggers", 0); //set a trigger count
     * this.bind("myevent", function() {
     *     this.triggers++; //whenever myevent is triggered, increment
     * });
     * this.bind("UpdateFrame", function() {
     *     this.trigger("myevent"); //trigger myevent on every frame
     * });
     * ~~~
     *
     * @see .trigger, .unbind
     */
    bind: function (event, callback) {
        //  To learn how the event system functions, see the comments for Crafty._callbackMethods
        //optimization for 1 entity
        if (this.length === 1) {
            this._bindCallback(event, callback);
        } else {
            for (var i = 0; i < this.length; i++) {
                var e = entities[this[i]];
                if (e) {
                    e._bindCallback(event, callback);
                }
            }
        }
        return this;
    },

    /**@
     * #.uniqueBind
     * @comp Crafty Core
     * @kind Method
     * 
     * @sign public Number .uniqueBind(String eventName, Function callback)
     * @param eventName - Name of the event to bind to
     * @param callback - Method to execute upon event triggered
     * @returns ID of the current callback used to unbind
     *
     * Works like Crafty.bind, but prevents a callback from being bound multiple times.
     *
     * @see .bind
     */
    uniqueBind: function (event, callback) {
        this.unbind(event, callback);
        this.bind(event, callback);

    },

    /**@
     * #.one
     * @comp Crafty Core
     * @kind Method
     * 
     * @sign public Number one(String eventName, Function callback)
     * @param eventName - Name of the event to bind to
     * @param callback - Method to execute upon event triggered
     * @returns ID of the current callback used to unbind
     *
     * Works like Crafty.bind, but will be unbound once the event triggers.
     *
     * @see .bind
     */
    one: function (event, callback) {
        var self = this;
        var oneHandler = function (data) {
            callback.call(self, data);
            self.unbind(event, oneHandler);
        };
        return self.bind(event, oneHandler);

    },

    /**@
     * #.unbind
     * @comp Crafty Core
     * @kind Method
     * 
     * @sign public this .unbind(String eventName[, Function callback])
     * @param eventName - Name of the event to unbind
     * @param callback - Function to unbind
     *
     * Removes binding with an event from current entity.
     *
     * Passing an event name will remove all events bound to
     * that event. Passing a reference to the callback will
     * unbind only that callback.
     * @see .bind, .trigger
     */
    unbind: function (event, callback) {
        //  To learn how the event system functions, see the comments for Crafty._callbackMethods
        var i, e;
        for (i = 0; i < this.length; i++) {
            e = entities[this[i]];
            if (e) {
                e._unbindCallbacks(event, callback);
            }
        }
        return this;
    },

    /**@
     * #.trigger
     * @comp Crafty Core
     * @kind Method
     * 
     * @sign public this .trigger(String eventName[, Object data])
     * @param eventName - Event to trigger
     * @param data - Arbitrary data that will be passed into every callback as an argument
     *
     * Trigger an event with arbitrary data. Will invoke all callbacks with
     * the context (value of `this`) of the current entity object.
     *
     * *Note: This will only execute callbacks within the current entity, no other entity.*
     *
     * The first argument is the event name to trigger and the optional
     * second argument is the arbitrary event data. This can be absolutely anything.
     *
     * Unlike DOM events, Crafty events are executed synchronously.
     */
    trigger: function (event, data) {
        //  To learn how the event system functions, see the comments for Crafty._callbackMethods
        if (this.length === 1) {
            //find the handlers assigned to the entity
            this._runCallbacks(event, data);
         } else {
            for (var i = 0; i < this.length; i++) {
                var e = entities[this[i]];
                if (e) {
                    e._runCallbacks(event, data);
                }
            }
        }
        return this;
    },

    /**@
     * #.each
     * @comp Crafty Core
     * @kind Method
     * 
     * @sign public this .each(Function method)
     * @param method - Method to call on each iteration
     *
     * Iterates over found entities, calling a function for every entity.
     *
     * The function will be called for every entity and will pass the index
     * in the iteration as an argument. The context (value of `this`) of the
     * function will be the current entity in the iteration.
     *
     * @example
     * Destroy every second 2D entity
     * ~~~
     * Crafty("2D").each(function(i) {
     *     if(i % 2 === 0) {
     *         this.destroy();
     *     }
     * });
     * ~~~
     */
    each: function (func) {
        var i = 0,
            l = this.length;
        for (; i < l; i++) {
            //skip if not exists
            if (!entities[this[i]]) continue;
            func.call(entities[this[i]], i);
        }
        return this;
    },

    /**@
     * #.get
     * @comp Crafty Core
     * @kind Method
     * 
     * @sign public Array .get()
     * @returns An array of entities corresponding to the active selector
     *
     * @sign public Entity .get(Number index)
     * @returns an entity belonging to the current selection
     * @param index - The index of the entity to return.  If negative, counts back from the end of the array.
     *
     *
     * @example
     * Get an array containing every "2D" entity
     * ~~~
     * var arr = Crafty("2D").get()
     * ~~~
     * Get the first entity matching the selector
     * ~~~
     * // equivalent to Crafty("2D").get()[0], but doesn't create a new array
     * var e = Crafty("2D").get(0)
     * ~~~
     * Get the last "2D" entity matching the selector
     * ~~~
     * var e = Crafty("2D").get(-1)
     * ~~~
     *
     */
    get: function(index) {
        var l = this.length;
        if (typeof index !== "undefined") {
            if (index >= l || index+l < 0)
                return undefined;
            if (index>=0)
                return entities[this[index]];
            else
                return entities[this[index+l]];
        } else {
            var i=0, result = [];
            for (; i < l; i++) {
                //skip if not exists
                if (!entities[this[i]]) continue;
                result.push( entities[this[i]] );
            }
            return result;
        }
    },

    /**@
     * #.clone
     * @comp Crafty Core
     * @kind Method
     * 
     * @sign public Entity .clone(void)
     * @returns Cloned entity of the current entity
     *
     * Method will create another entity with the exact same
     * properties, components and methods as the current entity.
     */
    clone: function () {
        var comps = this.__c,
            comp,
            prop,
            clone = Crafty.e();

        for (comp in comps) {
            clone.addComponent(comp);
        }
        for (prop in this) {
            if (prop !== "0" && prop !== "_global" && prop !== "_changed" && typeof this[prop] !== "function" && typeof this[prop] !== "object") {
                clone[prop] = this[prop];
            }
        }

        return clone;
    },


    /**@
     * #.setter
     * @comp Crafty Core
     * @kind Method
     * 
     * @sign public this .setter(String property, Function callback)
     * @param property - Property to watch for modification
     * @param callback - Method to execute if the property is modified
     *
     * Will watch a property waiting for modification and will then invoke the
     * given callback when attempting to modify.
     *
     * This feature is deprecated; use .defineField() instead.
     * @see .defineField
     */
    setter: function (prop, callback) {
        return this.defineField(prop, function(){}, callback);
    },

    /**@
     * #.defineField
     * @comp Crafty Core
     * @kind Method
     * 
     * @sign public this .defineField(String property, Function getCallback, Function setCallback)
     * @param property - Property name to assign getter & setter to
     * @param getCallback - Method to execute if the property is accessed
     * @param setCallback - Method to execute if the property is mutated
     *
     * Assigns getters and setters to the property. 
     * A getter will watch a property waiting for access and will then invoke the
     * given getCallback when attempting to retrieve.
     * A setter will watch a property waiting for mutation and will then invoke the
     * given setCallback when attempting to modify.
     *
     * @example
     * ~~~
     * var ent = Crafty.e("2D");
     * ent.defineField("customData", function() { 
     *    return this._customData; 
     * }, function(newValue) { 
     *    this._customData = newValue;
     * });
     *
     * ent.customData = "2" // set customData to 2
     * Crafty.log(ent.customData) // prints 2
     * ~~~
     */
    defineField: function (prop, getCallback, setCallback) {
        Crafty.defineField(this, prop, getCallback, setCallback);
        return this;
    },

    /**@
     * #.destroy
     * @comp Crafty Core
     * @kind Method
     * 
     * @sign public this .destroy(void)
     * Will remove all event listeners and delete all properties as well as removing from the stage
     */
    destroy: function () {
        //remove all event handlers, delete from entities
        this.each(function () {
            var comp;
            this.trigger("Remove");
            for (var compName in this.__c) {
                comp = components[compName];
                if (comp && "remove" in comp)
                    comp.remove.call(this, true);

                // update map from component to (entityId -> entity)
                delete compEntities[compName][this[0]];
            }
            this._unbindAll();
            delete entities[this[0]];
        });
    },

    /**@
     * #.freeze
     * @comp Crafty Core
     * @kind Method
     * 
     * @sign public this .freeze()
     * 
     * @triggers Freeze - Directly before the entity is frozen
     * 
     * Freezes the entity.  A frozen entity will not receive events or be displayed by graphics systems. 
     * It is also removed from the spatial map, which means it will not be found by collisions, 
     * raycasting, or similar functions.
     * 
     * This method may be called upon a collection of entities.
     * 
     * @note Because the entity no longer listens to events, modifying its properties can result in an inconsistent state.
     * 
     * If custom components need to handle frozen entities, they can listen to the "Freeze" event, which will be triggered before the event system is disabled.
     * 
     * @example
     * 
     * ```
     * // Freeze all entities with the Dead component
     * Crafty("Dead").freeze();
     * ```
     * 
     * @see .unfreeze
     */
    freeze: function () {
        if (this.length === 1 && !this.__frozen) {
            this.trigger("Freeze", this);
            this._freezeCallbacks();
            this.__frozen = true;
        } else {
            for (var i = 0; i < this.length; i++) {
                var e = entities[this[i]];
                if (e && !e.__frozen) {
                    e.trigger("Freeze", e);
                    e._freezeCallbacks();
                    // Set a frozen flag.  (This is distinct from the __callbackFrozen flag)
                    e.__frozen = true;
                }
            }
        }
        return this;
    },

    /**#
     * #.unfreeze
     * @comp Crafty Core
     * @kind Method
     * 
     * @sign public this .unfreeze()
     * 
     * @triggers Unfreeze - While the entity is being unfrozen
     * 
     * Unfreezes the entity, allowing it to receive events, inserting it back into the spatial map, 
     * and restoring it to its previous visibility.
     * 
     * This method may be called upon a collection of entities.
     * 
     * If a custom component needs to know when an entity is unfrozen, they can listen to the "Unfreeze"" event.
     * 
     * @example
     * ```
     * // Bring the dead back to life!
     * Crafty("Dead").unfreeze().addComponent("Undead");
     * ```
     */
    unfreeze: function () {
        if (this.length === 1 && this.__frozen) {
            this.__frozen = false;
            this._unfreezeCallbacks();
            this.trigger("Unfreeze", this);
        } else {
            for (var i = 0; i < this.length; i++) {
                var e = entities[this[i]];
                if (e && e.__frozen) {
                    e.__frozen = false;
                    e._unfreezeCallbacks();
                    e.trigger("Unfreeze", e);
                }
            }
        }
        return this;
    }
};

//give the init instances the Crafty prototype
Crafty.fn.init.prototype = Crafty.fn;


/**@
 * #Crafty.extend
 * @category Core
 * @kind Method
 * 
 * @sign public this Crafty.extend(Object obj)
 * @param obj - An object whose fields will be copied onto Crafty.  This is a shallow copy.
 *
 * Used to extend the Crafty namespace by passing in an object of properties and methods to add.
 *
 * @example
 * ~~~ * 
 * Crafty.extend({
 *   isArray: function(arg){
 *     return Object.prototype.toString.call(arg) === '[object Array]'
 *   }
 * });
 * 
 * Crafty.isArray([4, 5, 6]);  // returns true
 * Crafty.isArray('hi');       // returns false
 * ~~~
 */
Crafty.extend = Crafty.fn.extend = function (obj) {
    var target = this,
        key;

    //don't bother with nulls
    if (!obj) return target;

    for (key in obj) {
        if (target === obj[key]) continue; //handle circular reference
        target[key] = obj[key];
    }

    return target;
};




// How Crafty handles events and callbacks
// -----------------------------------------
// Callbacks are stored in the global object `handlers`, which has properties for each event.  
// These properties point to an object which has a property for each entity listening to the event.
// These in turn are arrays containing the callbacks to be triggered.
// 
// Here is an example of what "handlers" can look like:
//     handlers ===
//         { Move:  {5:[fnA], 6:[fnB, fnC], global:[fnD]},
//         Change: {6:[fnE]}
//         }
// In this example, when the 'Move' event is triggered on entity #6 (e.g.
// entity6.trigger('Move')), it causes the execution of fnB() and fnC(). When
// the Move event is triggered globally (i.e. Crafty.trigger('Move')), it
// will execute fnA, fnB, fnC, fnD.
//
// In this example, "this" is bound to entity #6 whenever fnB() is executed, and
// "this" is bound to Crafty whenever fnD() is executed.
//
// In other words, the structure of "handlers" is:
//
//     handlers[event][objID] === (Array of callback functions)
//
// In addition to the global object, each object participating in the event system has a `_callbacks` property 
// which lists the events that object is listening to.  It allows access to the object's callbacks like this:
//     obj._callbacks[event] === (Array of callback functions)
//
// Objects, which can listen to events (or collections of such objects) have varying logic 
// on how the events are bound/triggered/unbound.  Since the underlying operations on the callback array are the same,
// the single-object operations are implemented in the following object.  
// Calling `Crafty._addCallbackMethods(obj)` on an object will extend that object with these methods.


 
Crafty._callbackMethods = {
    // Add a function to the list of callbacks for an event
    _bindCallback: function(event, fn) {
        // Get handle to event, creating it if necessary
        var callbacks = this._callbacks[event];
        if (!callbacks) {
            callbacks = this._callbacks[event] = ( handlers[event] || ( handlers[event] = {} ) )[this[0]] = [];
            callbacks.context = this;
            callbacks.depth = 0;
        }
        // Push to callback array
        callbacks.push(fn);
    },

    // Process for running all callbacks for the given event
    _runCallbacks: function(event, data) {
        if (!this._callbacks[event] || this.__callbacksFrozen) {
            return;
        }
        var callbacks = this._callbacks[event];

        // Callback loop; deletes dead callbacks, but only when it is safe to do so
        var i, l = callbacks.length;
        // callbacks.depth tracks whether this function was invoked in the middle of a previous iteration through the same callback array
        callbacks.depth++;
        for (i = 0; i < l; i++) {
            if (typeof callbacks[i] === "undefined") {
                if (callbacks.depth <= 1) {
                    callbacks.splice(i, 1);
                    i--;
                    l--;
                    // Delete callbacks object if there are no remaining bound events
                    if (callbacks.length === 0) {
                        delete this._callbacks[event];
                        delete handlers[event][this[0]];
                    }
                }
            } else {
                callbacks[i].call(this, data);
            }
        }
        callbacks.depth--;
    },

    // Unbind callbacks for the given event
    // If fn is specified, only it will be removed; otherwise all callbacks will be
    _unbindCallbacks: function(event, fn) {
        if (!this._callbacks[event]) {
            return;
        }
        var callbacks = this._callbacks[event];
        // Iterate through and delete the callback functions that match
        // They are spliced out when _runCallbacks is invoked, not here
        // (This function might be called in the middle of a callback, which complicates the logic)
        for (var i = 0; i < callbacks.length; i++) {
            if (!fn || callbacks[i] === fn) {
                delete callbacks[i];
            }
        }
    },

    // Completely all callbacks for every event, such as on object destruction
    _unbindAll: function() {
        if (!this._callbacks) return;
        this.__callbacksFrozen = false;
        for (var event in this._callbacks) {
            if (this._callbacks[event]) {
                // Remove the normal way, in case we've got a nested loop
                this._unbindCallbacks(event);
                // Also completely delete the registered callback from handlers
                delete handlers[event][this[0]];
            }
        }
    },

    _freezeCallbacks: function() {
        if (!this._callbacks) return;
        for (var event in this._callbacks) {
            if (this._callbacks[event]) {
                // Remove the callbacks from the global list of handlers
                delete handlers[event][this[0]];
            }
        }
        // Mark this callback list as frozen
        this.__callbacksFrozen = true;
    },

     _unfreezeCallbacks: function() {
        if (!this._callbacks) return;
        this.__callbacksFrozen = false;
        for (var event in this._callbacks) {
            if (this._callbacks[event]) {
                // Add the callbacks back to the global list of handlers
                 handlers[event][this[0]] = this._callbacks[event];
            }
        }
        
    }
};

// Helper function to add the callback methods above to an object, as well as initializing the callbacks object
// it provies the "low level" operations; bind, unbind, and trigger will still need to be implemented for that object
Crafty._addCallbackMethods = function(context) {
    context.extend(Crafty._callbackMethods);
    context._callbacks = {};
};

Crafty._addCallbackMethods(Crafty);

Crafty.extend({
    // Define Crafty's id
    0: "global",
    /**@
     * #Crafty.init
     * @category Core
     * @kind Method
     * 
     * @trigger Load - Just after the viewport is initialised. Before the UpdateFrame loops is started
     * @sign public this Crafty.init([Number width, Number height, String stage_elem])
     * @sign public this Crafty.init([Number width, Number height, HTMLElement stage_elem])
     * @param Number width - Width of the stage
     * @param Number height - Height of the stage
     * @param String or HTMLElement stage_elem - the element to use for the stage
     *
     * Sets the element to use as the stage, creating it if necessary.  By default a div with id 'game' is used, but if the 'stage_elem' argument is provided that will be used instead.  (see `Crafty.viewport.init`)
     *
     * Starts the `UpdateFrame` interval. This will call the `UpdateFrame` event for every frame.
     *
     * Can pass width and height values for the stage otherwise will default to window size.
     *
     * All `Load` events will be executed.
     *
     * Uses `requestAnimationFrame` to sync the drawing with the browser but will default to `setInterval` if the browser does not support it.
     * @see Crafty.stop,  Crafty.viewport
     */
    init: function (w, h, stage_elem) {
        
        // If necessary, attach any event handlers registered before Crafty started
        if (!this._preBindDone) {
            for(var i = 0; i < this._bindOnInit.length; i++) {

                var preBind = this._bindOnInit[i];
                Crafty.bind(preBind.event, preBind.handler);
            }
        }

        // The viewport will init things like the default graphics layers as well
        Crafty.viewport.init(w, h, stage_elem);

        //call all arbitrary functions attached to onload
        this.trigger("Load");
        this.timer.init();

        return this;
    },

    // There are some events that need to be bound to Crafty when it's started/restarted, so store them here
    // Switching Crafty's internals to use the new system idiom should allow removing this hack
    _bindOnInit: [],
    _preBindDone: false,
    _preBind: function(event, handler) {
        this._bindOnInit.push({
            event: event,
            handler: handler
        });
    },

    /**@
     * #Crafty.getVersion
     * @category Core
     * @kind Method
     * 
     * @sign public String Crafty.getVersion()
     * @returns Current version of Crafty as a string
     *
     * Return current version of crafty
     *
     * @example
     * ~~~
     * Crafty.getVersion(); //'0.5.2'
     * ~~~
     */
    getVersion: function () {
        return version;
    },

    /**@
     * #Crafty.stop
     * @category Core
     * @kind Method
     * 
     * @trigger CraftyStop - when the game is stopped  - {bool clearState}
     * @sign public this Crafty.stop([bool clearState])
     * @param clearState - if true the stage and all game state is cleared.
     *
     * Stops the `UpdateFrame` interval and removes the stage element.
     *
     * To restart, use `Crafty.init()`.
     * @see Crafty.init
     */ 
    stop: function (clearState) {
        Crafty.trigger("CraftyStop", clearState);

        this.timer.stop();
        if (clearState) {
            // Remove audio
            Crafty.audio.remove();

            //Destroy all systems
            for (var s in Crafty._systems) {
                Crafty._systems[s].destroy();
            }

            // Remove the stage element, and re-add a div with the same id
            if (Crafty.stage && Crafty.stage.elem.parentNode) {
                var newCrStage = document.createElement('div');
                newCrStage.id = Crafty.stage.elem.id;
                Crafty.stage.elem.parentNode.replaceChild(newCrStage, Crafty.stage.elem);
            }

            // reset callbacks, and indicate that prebound functions need to be bound on init again
            Crafty._unbindAll();
            Crafty._addCallbackMethods(Crafty);
            this._preBindDone = false;

            initState();
        }
        return this;
    },

    /**@
     * #Crafty.pause
     * @category Core
     * @kind Method
     * 
     * @trigger Pause - when the game is paused
     * @trigger Unpause - when the game is unpaused
     * @sign public this Crafty.pause(void)
     *
     * Pauses the game by stopping the `UpdateFrame` event from firing. If the game is already paused it is unpaused.
     * You can pass a boolean parameter if you want to pause or unpause no matter what the current state is.
     * Modern browsers pauses the game when the page is not visible to the user. If you want the Pause event
     * to be triggered when that happens you can enable autoPause in `Crafty.settings`.
     *
     * @example
     * Have an entity pause the game when it is clicked.
     * ~~~
     * button.bind("click", function() {
     *     Crafty.pause();
     * });
     * ~~~
     */
    pause: function (toggle) {
        if (arguments.length === 1 ? toggle : !this._paused) {
            this.trigger('Pause');
            this._paused = true;
            setTimeout(function () {
                Crafty.timer.stop();
            }, 0);
        } else {
            this.trigger('Unpause');
            this._paused = false;
            setTimeout(function () {
                Crafty.timer.init();
            }, 0);
        }
        return this;
    },

    /**@
     * #Crafty.isPaused
     * @category Core
     * @kind Method
     * 
     * @sign public Boolean Crafty.isPaused()
     * @returns Whether the game is currently paused.
     *
     * @example
     * ~~~
     * Crafty.isPaused();
     * ~~~
     */
    isPaused: function () {
        return this._paused;
    },

    /**@
     * #Crafty.timer
     * @category Game Loop
     * @kind CoreObject
     * 
     * Handles game ticks
     */
    timer: (function () {
        /*
         * `window.requestAnimationFrame` or its variants is called for animation.
         * `.requestID` keeps a record of the return value previous `window.requestAnimationFrame` call.
         * This is an internal variable. Used to stop frame.
         */
        var tick, requestID;

        // Internal variables used to control the game loop.  Use Crafty.timer.steptype() to set these.
        var mode = "fixed",
            maxFramesPerStep = 5,
            maxTimestep = 40;

        // variables used by the game loop to track state
        var endTime = 0,
            timeSlip = 0,
            gameTime;

        // Controls the target rate of fixed mode loop.  Set these with the Crafty.timer.FPS function
        var FPS = 50,
            milliSecPerFrame = 1000 / FPS;




        return {
            init: function () {
                // When first called, set the  gametime one frame before now!
                if (typeof gameTime === "undefined")
                    gameTime = Date.now() - milliSecPerFrame;

                var onFrame = (typeof window !== "undefined") && (
                    window.requestAnimationFrame ||
                    window.webkitRequestAnimationFrame ||
                    window.mozRequestAnimationFrame ||
                    window.oRequestAnimationFrame ||
                    window.msRequestAnimationFrame ||
                    null
                );

                if (onFrame) {
                    tick = function () {
                        Crafty.timer.step();
                        if (tick !== null) {
                            requestID = onFrame(tick);
                        }
                        //Crafty.log(requestID + ', ' + frame)
                    };

                    tick();
                } else {
                    tick = setInterval(function () {
                        Crafty.timer.step();
                    }, 1000 / FPS);
                }
            },

            stop: function () {
                Crafty.trigger("CraftyStopTimer");

                if (typeof tick !== "function") clearInterval(tick);

                var onFrame = (typeof window !== "undefined") && (
                    window.cancelAnimationFrame ||
                    window.cancelRequestAnimationFrame ||
                    window.webkitCancelRequestAnimationFrame ||
                    window.mozCancelRequestAnimationFrame ||
                    window.oCancelRequestAnimationFrame ||
                    window.msCancelRequestAnimationFrame ||
                    null
                );

                if (onFrame) onFrame(requestID);
                tick = null;
            },


            /**@
             * #Crafty.timer.steptype
             * @comp Crafty.timer
             * @kind Method
             *
             * @trigger NewSteptype - when the current steptype changes - { mode, maxTimeStep } - New steptype
             *
             * Can be called to set the type of timestep the game loop uses.
             * @sign public void Crafty.timer.steptype(mode [, maxTimeStep])
             * @param mode - the type of time loop.  Allowed values are "fixed", "semifixed", and "variable".  Crafty defaults to "fixed".
             * @param maxTimeStep - For "fixed", sets the max number of frames per step.   For "variable" and "semifixed", sets the maximum time step allowed.
             *
             * Can be called to get the type of timestep the game loop uses.
             * @sign public Object Crafty.timer.steptype(void)
             * @returns Object containing the current timestep's properties { mode, maxTimeStep }
             *
             * * In "fixed" mode, each frame is sent the same value of `dt`, and to achieve the target game speed, mulitiple frame events are triggered before each render.
             * * In "variable" mode, there is only one frame triggered per render.  This recieves a value of `dt` equal to the actual elapsed time since the last frame.
             * * In "semifixed" mode, multiple frames per render are processed, and the total time since the last frame is divided evenly between them.
             *
             * @see Crafty.timer.FPS
             */
            steptype: function (newmode, option) {
                // setters
                if (newmode === "variable" || newmode === "semifixed") {
                    mode = newmode;
                    if (option)
                        maxTimestep = option;
                    Crafty.trigger("NewSteptype", {mode: mode, maxTimeStep: maxTimestep});
                } else if (newmode === "fixed") {
                    mode = "fixed";
                    if (option)
                        maxFramesPerStep = option;
                    Crafty.trigger("NewSteptype", {mode: mode, maxTimeStep: maxFramesPerStep});
                } else if (newmode !== undefined) {
                    throw "Invalid step type specified";
                // getter
                } else {
                    return {
                        mode: mode,
                        maxTimeStep: (mode === "variable" || mode === "semifixed") ? maxTimestep : maxFramesPerStep
                    };
                }
            },

            /**@
             * #Crafty.timer.step
             * @comp Crafty.timer
             * @kind Method
             * 
             * @sign public void Crafty.timer.step()
             * @trigger EnterFrame - Triggered before each frame.  Passes the frame number, and the amount of time since the last frame.  If the time is greater than maxTimestep, that will be used instead.  (The default value of maxTimestep is 50 ms.) - { frame: Number, dt:Number }
             * @trigger UpdateFrame - Triggered on each frame.  Passes the frame number, and the amount of time since the last frame.  If the time is greater than maxTimestep, that will be used instead.  (The default value of maxTimestep is 50 ms.) - { frame: Number, dt:Number }
             * @trigger ExitFrame - Triggered after each frame.  Passes the frame number, and the amount of time since the last frame.  If the time is greater than maxTimestep, that will be used instead.  (The default value of maxTimestep is 50 ms.) - { frame: Number, dt:Number }
             * @trigger PreRender - Triggered every time immediately before a scene should be rendered
             * @trigger RenderScene - Triggered every time a scene should be rendered
             * @trigger PostRender - Triggered every time immediately after a scene should be rendered
             * @trigger MeasureWaitTime - Triggered at the beginning of each step after the first.  Passes the time the game loop waited between steps. - Number
             * @trigger MeasureFrameTime - Triggered after each frame.  Passes the time it took to advance one frame. - Number
             * @trigger MeasureRenderTime - Triggered after each render. Passes the time it took to render the scene - Number
             *
             * Advances the game by performing a step. A step consists of one/multiple frames followed by a render. The amount of frames depends on the timer's steptype.
             * Specifically it triggers `EnterFrame`, `UpdateFrame` & `ExitFrame` events for each frame and `PreRender`, `RenderScene` & `PostRender` events for each render.
             *
             * @see Crafty.timer.steptype
             * @see Crafty.timer.FPS
             */
            step: function () {
                var drawTimeStart, dt, lastFrameTime, loops = 0;

                var currentTime = Date.now();
                if (endTime > 0)
                    Crafty.trigger("MeasureWaitTime", currentTime - endTime);

                // If we're currently ahead of the current time, we need to wait until we're not!
                if (gameTime + timeSlip >= currentTime) {
                    endTime = currentTime;
                    return;
                }

                var netTimeStep = currentTime - (gameTime + timeSlip);
                // We try to keep up with the target FPS by processing multiple frames per render
                // If we're hopelessly behind, stop trying to catch up.
                if (netTimeStep > milliSecPerFrame * 20) {
                    //gameTime = currentTime - milliSecPerFrame;
                    timeSlip += netTimeStep - milliSecPerFrame;
                    netTimeStep = milliSecPerFrame;
                }

                // Set up how time is incremented
                if (mode === "fixed") {
                    loops = Math.ceil(netTimeStep / milliSecPerFrame);
                    // maxFramesPerStep adjusts how willing we are to delay drawing in order to keep at the target FPS
                    loops = Math.min(loops, maxFramesPerStep);
                    dt = milliSecPerFrame;
                } else if (mode === "variable") {
                    loops = 1;
                    dt = netTimeStep;
                    // maxTimestep is the maximum time to be processed in a frame.  (Large dt => unstable physics)
                    dt = Math.min(dt, maxTimestep);
                } else if (mode === "semifixed") {
                    loops = Math.ceil(netTimeStep / maxTimestep);
                    dt = netTimeStep / loops;
                }

                // Process frames, incrementing the game clock with each frame.
                // dt is determined by the mode
                for (var i = 0; i < loops; i++) {
                    lastFrameTime = currentTime;
                    
                    var frameData = {
                        frame: frame++,
                        dt: dt,
                        gameTime: gameTime
                    };

                    // Event that happens before "UpdateFrame",
                    // e.g. for setting-up movement in response to user input for the next "UpdateFrame" event
                    Crafty.trigger("EnterFrame", frameData);
                    // Everything that changes over time hooks into this event
                    Crafty.trigger("UpdateFrame", frameData);
                    // Event that happens after "UpdateFrame",
                    // e.g. for resolivng collisions applied through movement during "UpdateFrame" events
                    Crafty.trigger("ExitFrame", frameData);
                    gameTime += dt;

                    currentTime = Date.now();
                    Crafty.trigger("MeasureFrameTime", currentTime - lastFrameTime);
                }

                //If any frames were processed, render the results
                if (loops > 0) {
                    drawTimeStart = currentTime;
                    Crafty.trigger("PreRender"); // Pre-render setup opportunity
                    Crafty.trigger("RenderScene");
                    Crafty.trigger("PostRender"); // Post-render cleanup opportunity
                    currentTime = Date.now();
                    Crafty.trigger("MeasureRenderTime", currentTime - drawTimeStart);
                }

                endTime = currentTime;
            },
            /**@
             * #Crafty.timer.FPS
             * @comp Crafty.timer
             * @kind Method
             * 
             * @sign public void Crafty.timer.FPS()
             * Returns the target frames per second. This is not an actual frame rate.
             * @sign public void Crafty.timer.FPS(Number value)
             * @param value - the target rate
             * @trigger FPSChange - Triggered when the target FPS is changed by user - Number - new target FPS
             *
             * Sets the target frames per second. This is not an actual frame rate.
             * The default rate is 50.
             *
             * @see Crafty.timer.steptype
             */
            FPS: function (value) {
                if (typeof value === "undefined")
                    return FPS;
                else {
                    FPS = value;
                    milliSecPerFrame = 1000 / FPS;
                    Crafty.trigger("FPSChange", value);
                }
            },

            /**@
             * #Crafty.timer.simulateFrames
             * @comp Crafty.timer
             * @kind Method
             * 
             * @sign public this Crafty.timer.simulateFrames(Number frames[, Number timestep])
             * Advances the game state by a number of frames and draws the resulting stage at the end. Useful for tests and debugging.
             * @param frames - number of frames to simulate
             * @param timestep - the duration to pass each frame.  Defaults to milliSecPerFrame (20 ms) if not specified.
             */
            simulateFrames: function (frames, timestep) {
                timestep = timestep || milliSecPerFrame;
                while (frames-- > 0) {
                    var frameData = {
                        frame: frame++,
                        dt: timestep
                    };
                    Crafty.trigger("EnterFrame", frameData);
                    Crafty.trigger("UpdateFrame", frameData);
                    Crafty.trigger("ExitFrame", frameData);
                }
                Crafty.trigger("PreRender");
                Crafty.trigger("RenderScene");
                Crafty.trigger("PostRender");
            }
        };
    })(),


    /**@
     * #Crafty.e
     * @category Core
     * @kind Method
     * 
     * @trigger NewEntity - When the entity is created and all components are added - { id:Number }
     * @sign public Entity Crafty.e(String componentList)
     * @param componentList - List of components to assign to new entity
     * @sign public Entity Crafty.e(String component1[, .., String componentN])
     * @param component# - Component to add
     *
     * Creates an entity. Any arguments will be applied in the same
     * way `.addComponent()` is applied as a quick way to add components.
     *
     * Any component added will augment the functionality of
     * the created entity by assigning the properties and methods from the component to the entity.
     *
     * @example
     * ~~~
     * var myEntity = Crafty.e("2D, DOM, Color");
     * ~~~
     *
     * @see Crafty.c
     */
    e: function () {
        var id = UID();
        entities[id] = null;
        entities[id] = Crafty(id);

        if (arguments.length > 0) {
            entities[id].addComponent.apply(entities[id], arguments);
        }
        entities[id].setName('Entity #' + id); //set default entity human readable name
        entities[id].addComponent("obj"); //every entity automatically assumes obj

        Crafty.trigger("NewEntity", {
            id: id
        });

        return entities[id];
    },

    /**@
     * #Crafty.c
     * @category Core
     * @kind Method
     * 
     * @sign public void Crafty.c(String name, Object component)
     * @param name - Name of the component
     * @param component - Object with the component's properties and methods
     *
     * Creates a component where the first argument is the ID and the second
     * is the object that will be inherited by entities.
     *
     * Specifically, each time a component is added to an entity, the component properties are copied over to the entity. 
     * * In the case of primitive datatypes (booleans, numbers, strings) the property is copied by value.
     * * In the case of complex datatypes (objects, arrays, functions) the property is copied by reference and will thus reference the components' original property.
     * * (See the two examples below for further explanation)
     * Note that when a component method gets called, the `this` keyword will refer to the current entity the component was added to.
     *
     * A handful of methods or properties are treated specially. They are invoked in partiular contexts, and (in those contexts) cannot be overridden by other components.
     *
     * - `required`: A string listing required components, which will be added to the component before `init()` runs.
     * - `init`: A function to be called when the component is added to an entity
     * - `remove`: A function which will be called just before a component is removed, or before an entity is destroyed. It is passed a single boolean parameter that is `true` if the entity is being destroyed.
     * - `events`: An object whose properties represent functions bound to events equivalent to the property names.  (See the example below.)  The binding occurs directly after the call to `init`, and will be removed directly before `remove` is called.
     * - `properties`: A dictionary of properties which will be defined using Object.defineProperty.  Typically used to add setters and getters.
     *
     * In addition to these hardcoded special methods, there are some conventions for writing components.
     *
     * - Properties or methods that start with an underscore are considered private.
     * - A method with the same name as the component is considered to be a constructor
     * and is generally used when you need to pass configuration data to the component on a per entity basis.
     *
     * @example
     * ~~~
     * Crafty.c("Annoying", {
     *     _message: "HiHi",
     *     init: function() {
     *         this.bind("UpdateFrame", function() { alert(this.message); });
     *     },
     *     annoying: function(message) { this.message = message; }
     * });
     *
     * Crafty.e("Annoying").annoying("I'm an orange...");
     * ~~~
     * To attach to the "UpdateFrame" event using the `events` property instead:
     * ~~~
     * Crafty.c("Annoying", {
     *     _message: "HiHi",
     *     events: {
     *         "UpdateFrame": function(){alert(this.message);}
     *     }
     *     annoying: function(message) { this.message = message; }
     * });
     * ~~~
     *
     *
     * @warning In the examples above the field _message is local to the entity. 
     * That is, if you create many entities with the Annoying component, they can all have different values for _message.
     * That is because it is a simple value, and simple values are copied by value. 
     * If however the field had been an object or array, 
     * the value would have been shared by all entities with the component,
     * because complex types are copied by reference in javascript.
     * This is probably not what you want and the following example demonstrates how to work around it.
     *
     * ~~~
     * Crafty.c("MyComponent", {
     *     _iAmShared: { a: 3, b: 4 },
     *     init: function() {
     *         this._iAmNotShared = { a: 3, b: 4 };
     *     },
     * });
     * ~~~
     *
     * @see Crafty.e
     */
    c: function (compName, component) {
        components[compName] = component;
    },

    /**@
     * #Crafty.trigger
     * @category Core, Events
     * @kind Method
     * 
     * @sign public void Crafty.trigger(String eventName, * data)
     * @param eventName - Name of the event to trigger
     * @param data - Arbitrary data to pass into the callback as an argument
     *
     * This method will trigger every single callback attached to the event name. This means
     * every global event and every entity that has a callback.
     *
     * @see Crafty.bind
     */
    trigger: function (event, data) {

        //  To learn how the event system functions, see the comments for Crafty._callbackMethods
        var hdl = handlers[event] || (handlers[event] = {}),
            h, callbacks;
        //loop over every object bound
        for (h in hdl) {
            // Check whether h needs to be processed
            if (!hdl.hasOwnProperty(h)) continue;
            callbacks = hdl[h];
            if (!callbacks || callbacks.length === 0) continue;

            callbacks.context._runCallbacks(event, data);
        }
    },

    /**@
     * #Crafty.bind
     * @category Core, Events
     * @kind Method
     * 
     * @sign public Function bind(String eventName, Function callback)
     * @param eventName - Name of the event to bind to
     * @param callback - Method to execute upon event triggered
     * @returns callback function which can be used for unbind
     *
     * Binds to a global event. Method will be executed when `Crafty.trigger` is used
     * with the event name.
     *
     * @see Crafty.trigger, Crafty.unbind
     */
    bind: function (event, callback) {

        // To learn how the event system functions, see the comments for Crafty._callbackMethods
        this._bindCallback(event, callback);
        return callback;
    },


    /**@
     * #Crafty.uniqueBind
     * @category Core, Events
     * @kind Method
     * 
     * @sign public Function uniqueBind(String eventName, Function callback)
     * @param eventName - Name of the event to bind to
     * @param callback - Method to execute upon event triggered
     * @returns callback function which can be used for unbind
     *
     * Works like Crafty.bind, but prevents a callback from being bound multiple times.
     *
     * @see Crafty.bind
     */
    uniqueBind: function (event, callback) {
        this.unbind(event, callback);
        return this.bind(event, callback);
    },

    /**@
     * #Crafty.one
     * @category Core, Events
     * @kind Method
     * 
     * @sign public Function one(String eventName, Function callback)
     * @param eventName - Name of the event to bind to
     * @param callback - Method to execute upon event triggered
     * @returns callback function which can be used for unbind
     *
     * Works like Crafty.bind, but will be unbound once the event triggers.
     *
     * @see Crafty.bind
     */
    one: function (event, callback) {
        var self = this;
        var oneHandler = function (data) {
            callback.call(self, data);
            self.unbind(event, oneHandler);
        };
        return self.bind(event, oneHandler);
    },

    /**@
     * #Crafty.unbind
     * @category Core, Events
     * @kind Method
     * 
     * @sign public Boolean Crafty.unbind(String eventName, Function callback)
     * @param eventName - Name of the event to unbind
     * @param callback - Function to unbind
     * @example
     * ~~~
     *    var play_gameover_sound = function () {...};
     *    Crafty.bind('GameOver', play_gameover_sound);
     *    ...
     *    Crafty.unbind('GameOver', play_gameover_sound);
     * ~~~
     *
     * The first line defines a callback function. The second line binds that
     * function so that `Crafty.trigger('GameOver')` causes that function to
     * run. The third line unbinds that function.
     *
     * ~~~
     *    Crafty.unbind('GameOver');
     * ~~~
     *
     * This unbinds ALL global callbacks for the event 'GameOver'. That
     * includes all callbacks attached by `Crafty.bind('GameOver', ...)`, but
     * none of the callbacks attached by `some_entity.bind('GameOver', ...)`.
     */
    unbind: function (event, callback) {
        //  To learn how the event system functions, see the comments for Crafty._callbackMethods
        this._unbindCallbacks(event, callback);
    },

    /**@
     * #Crafty.frame
     * @category Core
     * @kind Method
     * 
     * @sign public Number Crafty.frame(void)
     * @returns the current frame number
     */
    frame: function () {
        return frame;
    },

    entities: function () {
        return entities;
    },

    components: function () {
        return components;
    },

    isComp: function (comp) {
        return comp in components;
    },

    debug: function (str) {
        // access internal variables - handlers or entities
        if (str === 'handlers') {
            return handlers;
        }
        return entities;
    },

    /**@
     * #Crafty.settings
     * @category Core
     * @kind CoreObject
     * 
     * Modify the inner workings of Crafty through the settings.
     */
    settings: (function () {
        var states = {},
            callbacks = {};

        return {
            /**@
             * #Crafty.settings.register
             * @comp Crafty.settings
             * @kind Method
             * 
             * @sign public void Crafty.settings.register(String settingName, Function callback)
             * @param settingName - Name of the setting
             * @param callback - Function to execute when use modifies setting
             *
             * Use this to register custom settings. Callback will be executed when `Crafty.settings.modify` is used.
             *
             * @see Crafty.settings.modify
             */
            register: function (setting, callback) {
                callbacks[setting] = callback;
            },

            /**@
             * #Crafty.settings.modify
             * @comp Crafty.settings
             * @kind Method
             * 
             * @sign public void Crafty.settings.modify(String settingName, * value)
             * @param settingName - Name of the setting
             * @param value - Value to set the setting to
             *
             * Modify settings through this method.
             *
             * @see Crafty.settings.register, Crafty.settings.get
             */
            modify: function (setting, value) {
                if (!callbacks[setting]) return;
                callbacks[setting].call(states[setting], value);
                states[setting] = value;
            },

            /**@
             * #Crafty.settings.get
             * @comp Crafty.settings
             * @kind Method
             * 
             * @sign public * Crafty.settings.get(String settingName)
             * @param settingName - Name of the setting
             * @returns Current value of the setting
             *
             * Returns the current value of the setting.
             *
             * @see Crafty.settings.register, Crafty.settings.get
             */
            get: function (setting) {
                return states[setting];
            }
        };
    })(),

    /**@
     * #Crafty.defineField
     * @category Core
     * @kind Method
     * 
     * @sign public void Crafty.defineField(Object object, String property, Function getCallback, Function setCallback)
     * @param object - Object to define property on
     * @param property - Property name to assign getter & setter to
     * @param getCallback - Method to execute if the property is accessed
     * @param setCallback - Method to execute if the property is mutated
     *
     * Assigns getters and setters to the property in the given object.
     * A getter will watch a property waiting for access and will then invoke the
     * given getCallback when attempting to retrieve.
     * A setter will watch a property waiting for mutation and will then invoke the
     * given setCallback when attempting to modify.
     *
     * @example
     * ~~~
     * var ent = Crafty.e("2D");
     * Crafty.defineField(ent, "customData", function() { 
     *    return this._customData; 
     * }, function(newValue) { 
     *    this._customData = newValue;
     * });
     *
     * ent.customData = "2" // set customData to 2
     * Crafty.log(ent.customData) // prints 2
     * ~~~
     * @see Crafty Core#.defineField
     */
    defineField: function(obj, prop, getCallback, setCallback) {
        Object.defineProperty(obj, prop, {
            get: getCallback,
            set: setCallback,
            configurable: false,
            enumerable: true,
        });
    },

    clone: clone
});

/**
 * Return a unique ID
 */

function UID() {
    var id = GUID++;
    //if GUID is not unique
    if (id in entities) {
        return UID(); //recurse until it is unique
    }
    return id;
}

/**@
 * #Crafty.clone
 * @category Core
 * @kind Method
 * 
 * @sign public Object .clone(Object obj)
 * @param obj - an object
 *
 * Deep copy (a.k.a clone) of an object.
 * @note This function should be used for plain objects with no cyclic references. To clone an entity use its `.clone` method instead.
 * 
 * @example
 * ~~~
 * // Null or Primitive types
 * Crafty.clone(null); // returns null
 * Crafty.clone(4);    // returns 4
 * 
 * // Objects
 * var globalCount = 0;
 * var obj1 = {
 *   count: 0,
 *   inc: function(){
 *      this.count++;
 *      globalCount++;
 *   },
 *   log: function(){
 *     console.log(this.count + '/' + globalCount);
 *   }
 * };
 * 
 * obj1.inc();
 * obj1.log(); // prints "1/1" to the log
 * 
 * var obj2 = Crafty.clone(obj1);
 * obj2.log(); // prints "1/1" to the log
 * 
 * obj1.inc();
 * obj1.log(); // prints "2/2" to the log
 * obj2.log(); // prints "1/2" to the log
 * ~~~
 *
 * @see Crafty Core#.clone
 */

function clone(obj) {
    if (obj === null || typeof (obj) !== 'object')
        return obj;

    var temp = obj.constructor(); // changed

    for (var key in obj)
        temp[key] = clone(obj[key]);
    return temp;
}

// export Crafty
if (typeof define === 'function') { // AMD
    define('crafty', [], function () { // jshint ignore:line
        return Crafty;
    });
}

module.exports = Crafty;