
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function exclude_internal_props(props) {
        const result = {};
        for (const k in props)
            if (k[0] !== '$')
                result[k] = props[k];
        return result;
    }
    function compute_rest_props(props, keys) {
        const rest = {};
        keys = new Set(keys);
        for (const k in props)
            if (!keys.has(k) && k[0] !== '$')
                rest[k] = props[k];
        return rest;
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function set_svg_attributes(node, attributes) {
        for (const key in attributes) {
            attr(node, key, attributes[key]);
        }
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
        else if (callback) {
            callback();
        }
    }

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.49.0' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/components/Header.svelte generated by Svelte v3.49.0 */

    const file$h = "src/components/Header.svelte";

    function create_fragment$h(ctx) {
    	let div1;
    	let div0;
    	let p0;
    	let t0;
    	let t1;
    	let h1;
    	let t3;
    	let p1;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			p0 = element("p");
    			t0 = text(/*welcome*/ ctx[0]);
    			t1 = space();
    			h1 = element("h1");
    			h1.textContent = "I'm Alessio Gandelli";
    			t3 = space();
    			p1 = element("p");
    			p1.textContent = "Developer & MSc Data Science Student";
    			attr_dev(p0, "class", "welcome svelte-43s2r1");
    			add_location(p0, file$h, 2, 4, 47);
    			attr_dev(h1, "class", "svelte-43s2r1");
    			add_location(h1, file$h, 3, 4, 86);
    			attr_dev(p1, "class", "svelte-43s2r1");
    			add_location(p1, file$h, 4, 4, 120);
    			attr_dev(div0, "class", "title svelte-43s2r1");
    			add_location(div0, file$h, 1, 2, 23);
    			attr_dev(div1, "class", "header svelte-43s2r1");
    			add_location(div1, file$h, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, p0);
    			append_dev(p0, t0);
    			append_dev(div0, t1);
    			append_dev(div0, h1);
    			append_dev(div0, t3);
    			append_dev(div0, p1);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*welcome*/ 1) set_data_dev(t0, /*welcome*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$h.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$h($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Header', slots, []);

    	const welcomes = [
    		"Welcome!",
    		"Benvenuto!",
    		"Willkommen!",
    		"Välkommen!",
    		"Bienvenue!",
    		"¡Bienvenidas!"
    	];

    	let wIndex = 0;
    	let welcome = welcomes[wIndex];

    	function changeWelcome() {
    		let newWIndex = wIndex;
    		while (newWIndex === wIndex) newWIndex = Math.floor(Math.random() * welcomes.length);
    		wIndex = newWIndex;
    		$$invalidate(0, welcome = welcomes[wIndex]);
    	}

    	setTimeout(
    		() => {
    			changeWelcome();

    			setInterval(
    				() => {
    					changeWelcome();
    				},
    				10000
    			);
    		},
    		8750
    	);

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ welcomes, wIndex, welcome, changeWelcome });

    	$$self.$inject_state = $$props => {
    		if ('wIndex' in $$props) wIndex = $$props.wIndex;
    		if ('welcome' in $$props) $$invalidate(0, welcome = $$props.welcome);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [welcome];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$h, create_fragment$h, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$h.name
    		});
    	}
    }

    /* node_modules/svelte-material-icons/Github.svelte generated by Svelte v3.49.0 */

    const file$g = "node_modules/svelte-material-icons/Github.svelte";

    function create_fragment$g(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "d", "M12,2A10,10 0 0,0 2,12C2,16.42 4.87,20.17 8.84,21.5C9.34,21.58 9.5,21.27 9.5,21C9.5,20.77 9.5,20.14 9.5,19.31C6.73,19.91 6.14,17.97 6.14,17.97C5.68,16.81 5.03,16.5 5.03,16.5C4.12,15.88 5.1,15.9 5.1,15.9C6.1,15.97 6.63,16.93 6.63,16.93C7.5,18.45 8.97,18 9.54,17.76C9.63,17.11 9.89,16.67 10.17,16.42C7.95,16.17 5.62,15.31 5.62,11.5C5.62,10.39 6,9.5 6.65,8.79C6.55,8.54 6.2,7.5 6.75,6.15C6.75,6.15 7.59,5.88 9.5,7.17C10.29,6.95 11.15,6.84 12,6.84C12.85,6.84 13.71,6.95 14.5,7.17C16.41,5.88 17.25,6.15 17.25,6.15C17.8,7.5 17.45,8.54 17.35,8.79C18,9.5 18.38,10.39 18.38,11.5C18.38,15.32 16.04,16.16 13.81,16.41C14.17,16.72 14.5,17.33 14.5,18.26C14.5,19.6 14.5,20.68 14.5,21C14.5,21.27 14.66,21.59 15.17,21.5C19.14,20.16 22,16.42 22,12A10,10 0 0,0 12,2Z");
    			attr_dev(path, "fill", /*color*/ ctx[2]);
    			add_location(path, file$g, 8, 59, 234);
    			attr_dev(svg, "width", /*width*/ ctx[0]);
    			attr_dev(svg, "height", /*height*/ ctx[1]);
    			attr_dev(svg, "viewBox", /*viewBox*/ ctx[3]);
    			add_location(svg, file$g, 8, 0, 175);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*color*/ 4) {
    				attr_dev(path, "fill", /*color*/ ctx[2]);
    			}

    			if (dirty & /*width*/ 1) {
    				attr_dev(svg, "width", /*width*/ ctx[0]);
    			}

    			if (dirty & /*height*/ 2) {
    				attr_dev(svg, "height", /*height*/ ctx[1]);
    			}

    			if (dirty & /*viewBox*/ 8) {
    				attr_dev(svg, "viewBox", /*viewBox*/ ctx[3]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$g.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$g($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Github', slots, []);
    	let { size = "1em" } = $$props;
    	let { width = size } = $$props;
    	let { height = size } = $$props;
    	let { color = "currentColor" } = $$props;
    	let { viewBox = "0 0 24 24" } = $$props;
    	const writable_props = ['size', 'width', 'height', 'color', 'viewBox'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Github> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('size' in $$props) $$invalidate(4, size = $$props.size);
    		if ('width' in $$props) $$invalidate(0, width = $$props.width);
    		if ('height' in $$props) $$invalidate(1, height = $$props.height);
    		if ('color' in $$props) $$invalidate(2, color = $$props.color);
    		if ('viewBox' in $$props) $$invalidate(3, viewBox = $$props.viewBox);
    	};

    	$$self.$capture_state = () => ({ size, width, height, color, viewBox });

    	$$self.$inject_state = $$props => {
    		if ('size' in $$props) $$invalidate(4, size = $$props.size);
    		if ('width' in $$props) $$invalidate(0, width = $$props.width);
    		if ('height' in $$props) $$invalidate(1, height = $$props.height);
    		if ('color' in $$props) $$invalidate(2, color = $$props.color);
    		if ('viewBox' in $$props) $$invalidate(3, viewBox = $$props.viewBox);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [width, height, color, viewBox, size];
    }

    class Github extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$g, create_fragment$g, safe_not_equal, {
    			size: 4,
    			width: 0,
    			height: 1,
    			color: 2,
    			viewBox: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Github",
    			options,
    			id: create_fragment$g.name
    		});
    	}

    	get size() {
    		throw new Error("<Github>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Github>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get width() {
    		throw new Error("<Github>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set width(value) {
    		throw new Error("<Github>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get height() {
    		throw new Error("<Github>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set height(value) {
    		throw new Error("<Github>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Github>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Github>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get viewBox() {
    		throw new Error("<Github>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set viewBox(value) {
    		throw new Error("<Github>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelte-material-icons/Linkedin.svelte generated by Svelte v3.49.0 */

    const file$f = "node_modules/svelte-material-icons/Linkedin.svelte";

    function create_fragment$f(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "d", "M19 3A2 2 0 0 1 21 5V19A2 2 0 0 1 19 21H5A2 2 0 0 1 3 19V5A2 2 0 0 1 5 3H19M18.5 18.5V13.2A3.26 3.26 0 0 0 15.24 9.94C14.39 9.94 13.4 10.46 12.92 11.24V10.13H10.13V18.5H12.92V13.57C12.92 12.8 13.54 12.17 14.31 12.17A1.4 1.4 0 0 1 15.71 13.57V18.5H18.5M6.88 8.56A1.68 1.68 0 0 0 8.56 6.88C8.56 5.95 7.81 5.19 6.88 5.19A1.69 1.69 0 0 0 5.19 6.88C5.19 7.81 5.95 8.56 6.88 8.56M8.27 18.5V10.13H5.5V18.5H8.27Z");
    			attr_dev(path, "fill", /*color*/ ctx[2]);
    			add_location(path, file$f, 8, 59, 234);
    			attr_dev(svg, "width", /*width*/ ctx[0]);
    			attr_dev(svg, "height", /*height*/ ctx[1]);
    			attr_dev(svg, "viewBox", /*viewBox*/ ctx[3]);
    			add_location(svg, file$f, 8, 0, 175);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*color*/ 4) {
    				attr_dev(path, "fill", /*color*/ ctx[2]);
    			}

    			if (dirty & /*width*/ 1) {
    				attr_dev(svg, "width", /*width*/ ctx[0]);
    			}

    			if (dirty & /*height*/ 2) {
    				attr_dev(svg, "height", /*height*/ ctx[1]);
    			}

    			if (dirty & /*viewBox*/ 8) {
    				attr_dev(svg, "viewBox", /*viewBox*/ ctx[3]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$f.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$f($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Linkedin', slots, []);
    	let { size = "1em" } = $$props;
    	let { width = size } = $$props;
    	let { height = size } = $$props;
    	let { color = "currentColor" } = $$props;
    	let { viewBox = "0 0 24 24" } = $$props;
    	const writable_props = ['size', 'width', 'height', 'color', 'viewBox'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Linkedin> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('size' in $$props) $$invalidate(4, size = $$props.size);
    		if ('width' in $$props) $$invalidate(0, width = $$props.width);
    		if ('height' in $$props) $$invalidate(1, height = $$props.height);
    		if ('color' in $$props) $$invalidate(2, color = $$props.color);
    		if ('viewBox' in $$props) $$invalidate(3, viewBox = $$props.viewBox);
    	};

    	$$self.$capture_state = () => ({ size, width, height, color, viewBox });

    	$$self.$inject_state = $$props => {
    		if ('size' in $$props) $$invalidate(4, size = $$props.size);
    		if ('width' in $$props) $$invalidate(0, width = $$props.width);
    		if ('height' in $$props) $$invalidate(1, height = $$props.height);
    		if ('color' in $$props) $$invalidate(2, color = $$props.color);
    		if ('viewBox' in $$props) $$invalidate(3, viewBox = $$props.viewBox);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [width, height, color, viewBox, size];
    }

    class Linkedin extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$f, create_fragment$f, safe_not_equal, {
    			size: 4,
    			width: 0,
    			height: 1,
    			color: 2,
    			viewBox: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Linkedin",
    			options,
    			id: create_fragment$f.name
    		});
    	}

    	get size() {
    		throw new Error("<Linkedin>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Linkedin>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get width() {
    		throw new Error("<Linkedin>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set width(value) {
    		throw new Error("<Linkedin>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get height() {
    		throw new Error("<Linkedin>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set height(value) {
    		throw new Error("<Linkedin>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Linkedin>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Linkedin>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get viewBox() {
    		throw new Error("<Linkedin>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set viewBox(value) {
    		throw new Error("<Linkedin>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelte-material-icons/Email.svelte generated by Svelte v3.49.0 */

    const file$e = "node_modules/svelte-material-icons/Email.svelte";

    function create_fragment$e(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "d", "M20,8L12,13L4,8V6L12,11L20,6M20,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6C22,4.89 21.1,4 20,4Z");
    			attr_dev(path, "fill", /*color*/ ctx[2]);
    			add_location(path, file$e, 8, 59, 234);
    			attr_dev(svg, "width", /*width*/ ctx[0]);
    			attr_dev(svg, "height", /*height*/ ctx[1]);
    			attr_dev(svg, "viewBox", /*viewBox*/ ctx[3]);
    			add_location(svg, file$e, 8, 0, 175);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*color*/ 4) {
    				attr_dev(path, "fill", /*color*/ ctx[2]);
    			}

    			if (dirty & /*width*/ 1) {
    				attr_dev(svg, "width", /*width*/ ctx[0]);
    			}

    			if (dirty & /*height*/ 2) {
    				attr_dev(svg, "height", /*height*/ ctx[1]);
    			}

    			if (dirty & /*viewBox*/ 8) {
    				attr_dev(svg, "viewBox", /*viewBox*/ ctx[3]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$e($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Email', slots, []);
    	let { size = "1em" } = $$props;
    	let { width = size } = $$props;
    	let { height = size } = $$props;
    	let { color = "currentColor" } = $$props;
    	let { viewBox = "0 0 24 24" } = $$props;
    	const writable_props = ['size', 'width', 'height', 'color', 'viewBox'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Email> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('size' in $$props) $$invalidate(4, size = $$props.size);
    		if ('width' in $$props) $$invalidate(0, width = $$props.width);
    		if ('height' in $$props) $$invalidate(1, height = $$props.height);
    		if ('color' in $$props) $$invalidate(2, color = $$props.color);
    		if ('viewBox' in $$props) $$invalidate(3, viewBox = $$props.viewBox);
    	};

    	$$self.$capture_state = () => ({ size, width, height, color, viewBox });

    	$$self.$inject_state = $$props => {
    		if ('size' in $$props) $$invalidate(4, size = $$props.size);
    		if ('width' in $$props) $$invalidate(0, width = $$props.width);
    		if ('height' in $$props) $$invalidate(1, height = $$props.height);
    		if ('color' in $$props) $$invalidate(2, color = $$props.color);
    		if ('viewBox' in $$props) $$invalidate(3, viewBox = $$props.viewBox);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [width, height, color, viewBox, size];
    }

    class Email extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$e, create_fragment$e, safe_not_equal, {
    			size: 4,
    			width: 0,
    			height: 1,
    			color: 2,
    			viewBox: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Email",
    			options,
    			id: create_fragment$e.name
    		});
    	}

    	get size() {
    		throw new Error("<Email>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Email>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get width() {
    		throw new Error("<Email>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set width(value) {
    		throw new Error("<Email>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get height() {
    		throw new Error("<Email>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set height(value) {
    		throw new Error("<Email>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Email>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Email>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get viewBox() {
    		throw new Error("<Email>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set viewBox(value) {
    		throw new Error("<Email>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelte-material-icons/Telegram.svelte generated by Svelte v3.49.0 */

    const file$d = "node_modules/svelte-material-icons/Telegram.svelte";

    function create_fragment$d(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "d", "M9.78,18.65L10.06,14.42L17.74,7.5C18.08,7.19 17.67,7.04 17.22,7.31L7.74,13.3L3.64,12C2.76,11.75 2.75,11.14 3.84,10.7L19.81,4.54C20.54,4.21 21.24,4.72 20.96,5.84L18.24,18.65C18.05,19.56 17.5,19.78 16.74,19.36L12.6,16.3L10.61,18.23C10.38,18.46 10.19,18.65 9.78,18.65Z");
    			attr_dev(path, "fill", /*color*/ ctx[2]);
    			add_location(path, file$d, 8, 59, 234);
    			attr_dev(svg, "width", /*width*/ ctx[0]);
    			attr_dev(svg, "height", /*height*/ ctx[1]);
    			attr_dev(svg, "viewBox", /*viewBox*/ ctx[3]);
    			add_location(svg, file$d, 8, 0, 175);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*color*/ 4) {
    				attr_dev(path, "fill", /*color*/ ctx[2]);
    			}

    			if (dirty & /*width*/ 1) {
    				attr_dev(svg, "width", /*width*/ ctx[0]);
    			}

    			if (dirty & /*height*/ 2) {
    				attr_dev(svg, "height", /*height*/ ctx[1]);
    			}

    			if (dirty & /*viewBox*/ 8) {
    				attr_dev(svg, "viewBox", /*viewBox*/ ctx[3]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Telegram', slots, []);
    	let { size = "1em" } = $$props;
    	let { width = size } = $$props;
    	let { height = size } = $$props;
    	let { color = "currentColor" } = $$props;
    	let { viewBox = "0 0 24 24" } = $$props;
    	const writable_props = ['size', 'width', 'height', 'color', 'viewBox'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Telegram> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('size' in $$props) $$invalidate(4, size = $$props.size);
    		if ('width' in $$props) $$invalidate(0, width = $$props.width);
    		if ('height' in $$props) $$invalidate(1, height = $$props.height);
    		if ('color' in $$props) $$invalidate(2, color = $$props.color);
    		if ('viewBox' in $$props) $$invalidate(3, viewBox = $$props.viewBox);
    	};

    	$$self.$capture_state = () => ({ size, width, height, color, viewBox });

    	$$self.$inject_state = $$props => {
    		if ('size' in $$props) $$invalidate(4, size = $$props.size);
    		if ('width' in $$props) $$invalidate(0, width = $$props.width);
    		if ('height' in $$props) $$invalidate(1, height = $$props.height);
    		if ('color' in $$props) $$invalidate(2, color = $$props.color);
    		if ('viewBox' in $$props) $$invalidate(3, viewBox = $$props.viewBox);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [width, height, color, viewBox, size];
    }

    class Telegram extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$d, create_fragment$d, safe_not_equal, {
    			size: 4,
    			width: 0,
    			height: 1,
    			color: 2,
    			viewBox: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Telegram",
    			options,
    			id: create_fragment$d.name
    		});
    	}

    	get size() {
    		throw new Error("<Telegram>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Telegram>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get width() {
    		throw new Error("<Telegram>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set width(value) {
    		throw new Error("<Telegram>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get height() {
    		throw new Error("<Telegram>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set height(value) {
    		throw new Error("<Telegram>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Telegram>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Telegram>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get viewBox() {
    		throw new Error("<Telegram>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set viewBox(value) {
    		throw new Error("<Telegram>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelte-material-icons/PdfBox.svelte generated by Svelte v3.49.0 */

    const file$c = "node_modules/svelte-material-icons/PdfBox.svelte";

    function create_fragment$c(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "d", "M12,10.5H13V13.5H12V10.5M7,11.5H8V10.5H7V11.5M20,6V18A2,2 0 0,1 18,20H6A2,2 0 0,1 4,18V6A2,2 0 0,1 6,4H18A2,2 0 0,1 20,6M9.5,10.5A1.5,1.5 0 0,0 8,9H5.5V15H7V13H8A1.5,1.5 0 0,0 9.5,11.5V10.5M14.5,10.5A1.5,1.5 0 0,0 13,9H10.5V15H13A1.5,1.5 0 0,0 14.5,13.5V10.5M18.5,9H15.5V15H17V13H18.5V11.5H17V10.5H18.5V9Z");
    			attr_dev(path, "fill", /*color*/ ctx[2]);
    			add_location(path, file$c, 8, 59, 234);
    			attr_dev(svg, "width", /*width*/ ctx[0]);
    			attr_dev(svg, "height", /*height*/ ctx[1]);
    			attr_dev(svg, "viewBox", /*viewBox*/ ctx[3]);
    			add_location(svg, file$c, 8, 0, 175);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*color*/ 4) {
    				attr_dev(path, "fill", /*color*/ ctx[2]);
    			}

    			if (dirty & /*width*/ 1) {
    				attr_dev(svg, "width", /*width*/ ctx[0]);
    			}

    			if (dirty & /*height*/ 2) {
    				attr_dev(svg, "height", /*height*/ ctx[1]);
    			}

    			if (dirty & /*viewBox*/ 8) {
    				attr_dev(svg, "viewBox", /*viewBox*/ ctx[3]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('PdfBox', slots, []);
    	let { size = "1em" } = $$props;
    	let { width = size } = $$props;
    	let { height = size } = $$props;
    	let { color = "currentColor" } = $$props;
    	let { viewBox = "0 0 24 24" } = $$props;
    	const writable_props = ['size', 'width', 'height', 'color', 'viewBox'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<PdfBox> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('size' in $$props) $$invalidate(4, size = $$props.size);
    		if ('width' in $$props) $$invalidate(0, width = $$props.width);
    		if ('height' in $$props) $$invalidate(1, height = $$props.height);
    		if ('color' in $$props) $$invalidate(2, color = $$props.color);
    		if ('viewBox' in $$props) $$invalidate(3, viewBox = $$props.viewBox);
    	};

    	$$self.$capture_state = () => ({ size, width, height, color, viewBox });

    	$$self.$inject_state = $$props => {
    		if ('size' in $$props) $$invalidate(4, size = $$props.size);
    		if ('width' in $$props) $$invalidate(0, width = $$props.width);
    		if ('height' in $$props) $$invalidate(1, height = $$props.height);
    		if ('color' in $$props) $$invalidate(2, color = $$props.color);
    		if ('viewBox' in $$props) $$invalidate(3, viewBox = $$props.viewBox);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [width, height, color, viewBox, size];
    }

    class PdfBox extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {
    			size: 4,
    			width: 0,
    			height: 1,
    			color: 2,
    			viewBox: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PdfBox",
    			options,
    			id: create_fragment$c.name
    		});
    	}

    	get size() {
    		throw new Error("<PdfBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<PdfBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get width() {
    		throw new Error("<PdfBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set width(value) {
    		throw new Error("<PdfBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get height() {
    		throw new Error("<PdfBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set height(value) {
    		throw new Error("<PdfBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<PdfBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<PdfBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get viewBox() {
    		throw new Error("<PdfBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set viewBox(value) {
    		throw new Error("<PdfBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/About.svelte generated by Svelte v3.49.0 */
    const file$b = "src/components/About.svelte";

    function create_fragment$b(ctx) {
    	let h2;
    	let t1;
    	let div0;
    	let p0;
    	let span0;
    	let t3;
    	let t4;
    	let p1;
    	let span1;
    	let t6;
    	let t7;
    	let p2;
    	let span2;
    	let t9;
    	let t10;
    	let p3;
    	let span3;
    	let t12;
    	let t13;
    	let div2;
    	let div1;
    	let t14;
    	let p4;
    	let t15;
    	let t16;
    	let t17;
    	let br;
    	let t18;
    	let t19;
    	let div3;
    	let a0;
    	let github;
    	let t20;
    	let a1;
    	let linkedin;
    	let t21;
    	let a2;
    	let email;
    	let t22;
    	let a3;
    	let telegram;
    	let t23;
    	let div4;
    	let a4;
    	let p5;
    	let pdfbox;
    	let current;
    	github = new Github({ props: { size: "48" }, $$inline: true });
    	linkedin = new Linkedin({ props: { size: "48" }, $$inline: true });
    	email = new Email({ props: { size: "48" }, $$inline: true });
    	telegram = new Telegram({ props: { size: "48" }, $$inline: true });
    	pdfbox = new PdfBox({ props: { size: "32" }, $$inline: true });

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			h2.textContent = "ABOUT ME";
    			t1 = space();
    			div0 = element("div");
    			p0 = element("p");
    			span0 = element("span");
    			span0.textContent = "Name:";
    			t3 = text("Alessio Gandelli");
    			t4 = space();
    			p1 = element("p");
    			span1 = element("span");
    			span1.textContent = "From:";
    			t6 = text("Italy");
    			t7 = space();
    			p2 = element("p");
    			span2 = element("span");
    			span2.textContent = "Age:";
    			t9 = text(/*age*/ ctx[0]);
    			t10 = space();
    			p3 = element("p");
    			span3 = element("span");
    			span3.textContent = "Now in:";
    			t12 = text("Trento (it)");
    			t13 = space();
    			div2 = element("div");
    			div1 = element("div");
    			t14 = space();
    			p4 = element("p");
    			t15 = text("I'm a ");
    			t16 = text(/*age*/ ctx[0]);
    			t17 = text(" years old Italian student, currently attending a Masters Degree in Data Science at UniTn.");
    			br = element("br");
    			t18 = text("\n        I'm passionate about data science, human behaviour and innovation.");
    			t19 = space();
    			div3 = element("div");
    			a0 = element("a");
    			create_component(github.$$.fragment);
    			t20 = space();
    			a1 = element("a");
    			create_component(linkedin.$$.fragment);
    			t21 = space();
    			a2 = element("a");
    			create_component(email.$$.fragment);
    			t22 = space();
    			a3 = element("a");
    			create_component(telegram.$$.fragment);
    			t23 = space();
    			div4 = element("div");
    			a4 = element("a");
    			p5 = element("p");
    			p5.textContent = "Download resume as PDF";
    			create_component(pdfbox.$$.fragment);
    			add_location(h2, file$b, 0, 0, 0);
    			attr_dev(span0, "class", "info-name svelte-mxaasj");
    			add_location(span0, file$b, 2, 7, 47);
    			attr_dev(p0, "class", "svelte-mxaasj");
    			add_location(p0, file$b, 2, 4, 44);
    			attr_dev(span1, "class", "info-name svelte-mxaasj");
    			add_location(span1, file$b, 3, 7, 111);
    			attr_dev(p1, "class", "svelte-mxaasj");
    			add_location(p1, file$b, 3, 4, 108);
    			attr_dev(span2, "class", "info-name svelte-mxaasj");
    			add_location(span2, file$b, 4, 7, 164);
    			attr_dev(p2, "class", "svelte-mxaasj");
    			add_location(p2, file$b, 4, 4, 161);
    			attr_dev(span3, "class", "info-name svelte-mxaasj");
    			add_location(span3, file$b, 5, 7, 218);
    			attr_dev(p3, "class", "svelte-mxaasj");
    			add_location(p3, file$b, 5, 4, 215);
    			attr_dev(div0, "class", "my-info svelte-mxaasj");
    			add_location(div0, file$b, 1, 0, 18);
    			attr_dev(div1, "class", "picture svelte-mxaasj");
    			add_location(div1, file$b, 8, 4, 304);
    			add_location(br, file$b, 10, 111, 451);
    			attr_dev(p4, "class", "svelte-mxaasj");
    			add_location(p4, file$b, 9, 4, 336);
    			attr_dev(div2, "class", "about svelte-mxaasj");
    			add_location(div2, file$b, 7, 0, 280);
    			attr_dev(a0, "href", "https://www.github.com/alessiogandelli/");
    			attr_dev(a0, "aria-label", "GitHub");
    			attr_dev(a0, "class", "themed-icon svelte-mxaasj");
    			attr_dev(a0, "target", "_blank");
    			add_location(a0, file$b, 15, 4, 572);
    			attr_dev(a1, "href", "https://www.linkedin.com/in/alessio-gandelli-36289a181/");
    			attr_dev(a1, "aria-label", "LinkedIn");
    			attr_dev(a1, "class", "themed-icon svelte-mxaasj");
    			attr_dev(a1, "target", "_blank");
    			add_location(a1, file$b, 16, 4, 717);
    			attr_dev(a2, "href", "mailto:alessiogandelli99@gmail.com");
    			attr_dev(a2, "aria-label", "Email");
    			attr_dev(a2, "class", "themed-icon svelte-mxaasj");
    			attr_dev(a2, "target", "_blank");
    			add_location(a2, file$b, 17, 4, 873);
    			attr_dev(a3, "href", "https://www.t.me/d8eea/");
    			attr_dev(a3, "aria-label", "Telegram");
    			attr_dev(a3, "class", "themed-icon svelte-mxaasj");
    			attr_dev(a3, "target", "_blank");
    			add_location(a3, file$b, 18, 4, 1029);
    			attr_dev(div3, "class", "urls svelte-mxaasj");
    			add_location(div3, file$b, 14, 0, 549);
    			attr_dev(p5, "class", "svelte-mxaasj");
    			add_location(p5, file$b, 22, 8, 1263);
    			attr_dev(a4, "href", "./files/curriculum2022.pdf");
    			attr_dev(a4, "target", "_blank");
    			attr_dev(a4, "class", "svelte-mxaasj");
    			add_location(a4, file$b, 21, 4, 1201);
    			attr_dev(div4, "class", "download-as-pdf svelte-mxaasj");
    			add_location(div4, file$b, 20, 0, 1167);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div0, anchor);
    			append_dev(div0, p0);
    			append_dev(p0, span0);
    			append_dev(p0, t3);
    			append_dev(div0, t4);
    			append_dev(div0, p1);
    			append_dev(p1, span1);
    			append_dev(p1, t6);
    			append_dev(div0, t7);
    			append_dev(div0, p2);
    			append_dev(p2, span2);
    			append_dev(p2, t9);
    			append_dev(div0, t10);
    			append_dev(div0, p3);
    			append_dev(p3, span3);
    			append_dev(p3, t12);
    			insert_dev(target, t13, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div2, t14);
    			append_dev(div2, p4);
    			append_dev(p4, t15);
    			append_dev(p4, t16);
    			append_dev(p4, t17);
    			append_dev(p4, br);
    			append_dev(p4, t18);
    			insert_dev(target, t19, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, a0);
    			mount_component(github, a0, null);
    			append_dev(div3, t20);
    			append_dev(div3, a1);
    			mount_component(linkedin, a1, null);
    			append_dev(div3, t21);
    			append_dev(div3, a2);
    			mount_component(email, a2, null);
    			append_dev(div3, t22);
    			append_dev(div3, a3);
    			mount_component(telegram, a3, null);
    			insert_dev(target, t23, anchor);
    			insert_dev(target, div4, anchor);
    			append_dev(div4, a4);
    			append_dev(a4, p5);
    			mount_component(pdfbox, a4, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(github.$$.fragment, local);
    			transition_in(linkedin.$$.fragment, local);
    			transition_in(email.$$.fragment, local);
    			transition_in(telegram.$$.fragment, local);
    			transition_in(pdfbox.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(github.$$.fragment, local);
    			transition_out(linkedin.$$.fragment, local);
    			transition_out(email.$$.fragment, local);
    			transition_out(telegram.$$.fragment, local);
    			transition_out(pdfbox.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t13);
    			if (detaching) detach_dev(div2);
    			if (detaching) detach_dev(t19);
    			if (detaching) detach_dev(div3);
    			destroy_component(github);
    			destroy_component(linkedin);
    			destroy_component(email);
    			destroy_component(telegram);
    			if (detaching) detach_dev(t23);
    			if (detaching) detach_dev(div4);
    			destroy_component(pdfbox);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('About', slots, []);
    	const age = Math.floor((new Date().getTime() - new Date(1999, 0, 31).getTime()) / 3.15576e+10);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<About> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Github,
    		Linkedin,
    		Email,
    		Telegram,
    		PdfBox,
    		age
    	});

    	return [age];
    }

    class About extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "About",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    /* node_modules/svelte-flag-icons/It.svelte generated by Svelte v3.49.0 */

    const file$a = "node_modules/svelte-flag-icons/It.svelte";

    function create_fragment$a(ctx) {
    	let svg;
    	let g;
    	let path0;
    	let path1;
    	let path2;
    	let svg_class_value;

    	let svg_levels = [
    		{ xmlns: "http://www.w3.org/2000/svg" },
    		{ id: "flag-icons-it" },
    		{ width: /*size*/ ctx[0] },
    		{ height: /*size*/ ctx[0] },
    		{
    			class: svg_class_value = /*$$props*/ ctx[2].class
    		},
    		/*$$restProps*/ ctx[3],
    		{ "aria-label": /*ariaLabel*/ ctx[1] },
    		{ viewBox: "0 0 640 480" }
    	];

    	let svg_data = {};

    	for (let i = 0; i < svg_levels.length; i += 1) {
    		svg_data = assign(svg_data, svg_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			g = svg_element("g");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			path2 = svg_element("path");
    			attr_dev(path0, "fill", "#fff");
    			attr_dev(path0, "d", "M0 0h640v480H0z");
    			add_location(path0, file$a, 16, 2, 309);
    			attr_dev(path1, "fill", "#009246");
    			attr_dev(path1, "d", "M0 0h213.3v480H0z");
    			add_location(path1, file$a, 17, 2, 352);
    			attr_dev(path2, "fill", "#ce2b37");
    			attr_dev(path2, "d", "M426.7 0H640v480H426.7z");
    			add_location(path2, file$a, 18, 2, 400);
    			attr_dev(g, "fill-rule", "evenodd");
    			attr_dev(g, "stroke-width", "1pt");
    			add_location(g, file$a, 15, 1, 264);
    			set_svg_attributes(svg, svg_data);
    			add_location(svg, file$a, 5, 0, 83);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, g);
    			append_dev(g, path0);
    			append_dev(g, path1);
    			append_dev(g, path2);
    		},
    		p: function update(ctx, [dirty]) {
    			set_svg_attributes(svg, svg_data = get_spread_update(svg_levels, [
    				{ xmlns: "http://www.w3.org/2000/svg" },
    				{ id: "flag-icons-it" },
    				dirty & /*size*/ 1 && { width: /*size*/ ctx[0] },
    				dirty & /*size*/ 1 && { height: /*size*/ ctx[0] },
    				dirty & /*$$props*/ 4 && svg_class_value !== (svg_class_value = /*$$props*/ ctx[2].class) && { class: svg_class_value },
    				dirty & /*$$restProps*/ 8 && /*$$restProps*/ ctx[3],
    				dirty & /*ariaLabel*/ 2 && { "aria-label": /*ariaLabel*/ ctx[1] },
    				{ viewBox: "0 0 640 480" }
    			]));
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	const omit_props_names = ["size","ariaLabel"];
    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('It', slots, []);
    	let { size = '24' } = $$props;
    	let { ariaLabel = 'flag of it' } = $$props;

    	$$self.$$set = $$new_props => {
    		$$invalidate(2, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		$$invalidate(3, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ('size' in $$new_props) $$invalidate(0, size = $$new_props.size);
    		if ('ariaLabel' in $$new_props) $$invalidate(1, ariaLabel = $$new_props.ariaLabel);
    	};

    	$$self.$capture_state = () => ({ size, ariaLabel });

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(2, $$props = assign(assign({}, $$props), $$new_props));
    		if ('size' in $$props) $$invalidate(0, size = $$new_props.size);
    		if ('ariaLabel' in $$props) $$invalidate(1, ariaLabel = $$new_props.ariaLabel);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$props = exclude_internal_props($$props);
    	return [size, ariaLabel, $$props, $$restProps];
    }

    class It extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, { size: 0, ariaLabel: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "It",
    			options,
    			id: create_fragment$a.name
    		});
    	}

    	get size() {
    		throw new Error("<It>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<It>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get ariaLabel() {
    		throw new Error("<It>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ariaLabel(value) {
    		throw new Error("<It>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelte-flag-icons/Es.svelte generated by Svelte v3.49.0 */

    const file$9 = "node_modules/svelte-flag-icons/Es.svelte";

    function create_fragment$9(ctx) {
    	let svg;
    	let path0;
    	let path1;
    	let path2;
    	let path3;
    	let path4;
    	let path5;
    	let path6;
    	let path7;
    	let path8;
    	let path9;
    	let path10;
    	let path11;
    	let path12;
    	let path13;
    	let path14;
    	let path15;
    	let path16;
    	let path17;
    	let path18;
    	let path19;
    	let path20;
    	let path21;
    	let path22;
    	let path23;
    	let path24;
    	let path25;
    	let path26;
    	let path27;
    	let path28;
    	let path29;
    	let path30;
    	let path31;
    	let path32;
    	let path33;
    	let path34;
    	let path35;
    	let path36;
    	let path37;
    	let path38;
    	let path39;
    	let path40;
    	let path41;
    	let path42;
    	let path43;
    	let path44;
    	let path45;
    	let path46;
    	let path47;
    	let path48;
    	let path49;
    	let path50;
    	let path51;
    	let path52;
    	let path53;
    	let path54;
    	let path55;
    	let path56;
    	let path57;
    	let path58;
    	let path59;
    	let path60;
    	let path61;
    	let path62;
    	let path63;
    	let path64;
    	let path65;
    	let path66;
    	let path67;
    	let path68;
    	let path69;
    	let path70;
    	let path71;
    	let path72;
    	let path73;
    	let path74;
    	let path75;
    	let path76;
    	let path77;
    	let path78;
    	let path79;
    	let path80;
    	let path81;
    	let path82;
    	let path83;
    	let path84;
    	let path85;
    	let path86;
    	let path87;
    	let path88;
    	let path89;
    	let path90;
    	let path91;
    	let path92;
    	let path93;
    	let path94;
    	let path95;
    	let path96;
    	let path97;
    	let path98;
    	let path99;
    	let path100;
    	let path101;
    	let path102;
    	let path103;
    	let path104;
    	let path105;
    	let path106;
    	let path107;
    	let path108;
    	let path109;
    	let path110;
    	let path111;
    	let path112;
    	let path113;
    	let path114;
    	let path115;
    	let path116;
    	let path117;
    	let path118;
    	let path119;
    	let path120;
    	let path121;
    	let path122;
    	let path123;
    	let path124;
    	let path125;
    	let path126;
    	let path127;
    	let path128;
    	let path129;
    	let path130;
    	let path131;
    	let path132;
    	let path133;
    	let path134;
    	let path135;
    	let path136;
    	let path137;
    	let path138;
    	let path139;
    	let path140;
    	let path141;
    	let path142;
    	let path143;
    	let path144;
    	let path145;
    	let path146;
    	let path147;
    	let path148;
    	let path149;
    	let path150;
    	let path151;
    	let path152;
    	let path153;
    	let path154;
    	let path155;
    	let path156;
    	let path157;
    	let path158;
    	let path159;
    	let path160;
    	let path161;
    	let path162;
    	let path163;
    	let path164;
    	let path165;
    	let path166;
    	let path167;
    	let path168;
    	let path169;
    	let path170;
    	let path171;
    	let path172;
    	let path173;
    	let path174;
    	let path175;
    	let path176;
    	let path177;
    	let path178;
    	let path179;
    	let path180;
    	let path181;
    	let path182;
    	let path183;
    	let path184;
    	let path185;
    	let path186;
    	let path187;
    	let path188;
    	let path189;
    	let path190;
    	let path191;
    	let path192;
    	let path193;
    	let path194;
    	let path195;
    	let path196;
    	let path197;
    	let path198;
    	let path199;
    	let path200;
    	let path201;
    	let path202;
    	let path203;
    	let path204;
    	let path205;
    	let path206;
    	let path207;
    	let path208;
    	let path209;
    	let path210;
    	let path211;
    	let path212;
    	let path213;
    	let path214;
    	let path215;
    	let path216;
    	let path217;
    	let path218;
    	let path219;
    	let path220;
    	let path221;
    	let path222;
    	let path223;
    	let path224;
    	let path225;
    	let path226;
    	let path227;
    	let path228;
    	let path229;
    	let path230;
    	let path231;
    	let path232;
    	let path233;
    	let path234;
    	let path235;
    	let path236;
    	let path237;
    	let path238;
    	let path239;
    	let path240;
    	let path241;
    	let path242;
    	let path243;
    	let path244;
    	let path245;
    	let path246;
    	let path247;
    	let path248;
    	let path249;
    	let path250;
    	let path251;
    	let path252;
    	let path253;
    	let path254;
    	let path255;
    	let path256;
    	let path257;
    	let path258;
    	let path259;
    	let path260;
    	let path261;
    	let path262;
    	let path263;
    	let path264;
    	let path265;
    	let path266;
    	let path267;
    	let path268;
    	let path269;
    	let path270;
    	let path271;
    	let path272;
    	let path273;
    	let path274;
    	let path275;
    	let path276;
    	let path277;
    	let path278;
    	let path279;
    	let path280;
    	let path281;
    	let path282;
    	let path283;
    	let path284;
    	let path285;
    	let path286;
    	let path287;
    	let path288;
    	let path289;
    	let path290;
    	let path291;
    	let path292;
    	let path293;
    	let path294;
    	let path295;
    	let path296;
    	let path297;
    	let path298;
    	let path299;
    	let path300;
    	let path301;
    	let path302;
    	let path303;
    	let path304;
    	let path305;
    	let path306;
    	let path307;
    	let path308;
    	let path309;
    	let path310;
    	let path311;
    	let path312;
    	let path313;
    	let path314;
    	let path315;
    	let path316;
    	let path317;
    	let path318;
    	let path319;
    	let path320;
    	let path321;
    	let path322;
    	let path323;
    	let path324;
    	let path325;
    	let path326;
    	let path327;
    	let path328;
    	let path329;
    	let path330;
    	let path331;
    	let path332;
    	let path333;
    	let path334;
    	let path335;
    	let path336;
    	let path337;
    	let path338;
    	let path339;
    	let path340;
    	let path341;
    	let path342;
    	let path343;
    	let path344;
    	let path345;
    	let path346;
    	let path347;
    	let path348;
    	let path349;
    	let path350;
    	let path351;
    	let path352;
    	let path353;
    	let path354;
    	let path355;
    	let path356;
    	let path357;
    	let path358;
    	let path359;
    	let path360;
    	let path361;
    	let path362;
    	let path363;
    	let path364;
    	let path365;
    	let path366;
    	let path367;
    	let path368;
    	let path369;
    	let path370;
    	let path371;
    	let path372;
    	let path373;
    	let path374;
    	let path375;
    	let path376;
    	let path377;
    	let path378;
    	let path379;
    	let path380;
    	let path381;
    	let path382;
    	let path383;
    	let path384;
    	let path385;
    	let path386;
    	let path387;
    	let path388;
    	let path389;
    	let path390;
    	let path391;
    	let path392;
    	let path393;
    	let path394;
    	let path395;
    	let path396;
    	let path397;
    	let path398;
    	let path399;
    	let path400;
    	let path401;
    	let path402;
    	let path403;
    	let path404;
    	let path405;
    	let path406;
    	let path407;
    	let path408;
    	let path409;
    	let path410;
    	let path411;
    	let path412;
    	let path413;
    	let path414;
    	let path415;
    	let path416;
    	let path417;
    	let path418;
    	let path419;
    	let path420;
    	let path421;
    	let path422;
    	let path423;
    	let path424;
    	let path425;
    	let path426;
    	let path427;
    	let path428;
    	let path429;
    	let path430;
    	let path431;
    	let path432;
    	let path433;
    	let path434;
    	let path435;
    	let path436;
    	let path437;
    	let path438;
    	let path439;
    	let path440;
    	let path441;
    	let path442;
    	let path443;
    	let path444;
    	let path445;
    	let path446;
    	let path447;
    	let path448;
    	let path449;
    	let path450;
    	let path451;
    	let path452;
    	let path453;
    	let path454;
    	let path455;
    	let path456;
    	let path457;
    	let path458;
    	let path459;
    	let path460;
    	let path461;
    	let path462;
    	let path463;
    	let path464;
    	let path465;
    	let path466;
    	let path467;
    	let path468;
    	let path469;
    	let path470;
    	let path471;
    	let path472;
    	let path473;
    	let path474;
    	let path475;
    	let path476;
    	let path477;
    	let path478;
    	let path479;
    	let path480;
    	let path481;
    	let path482;
    	let path483;
    	let path484;
    	let path485;
    	let path486;
    	let path487;
    	let path488;
    	let path489;
    	let path490;
    	let path491;
    	let path492;
    	let path493;
    	let path494;
    	let path495;
    	let path496;
    	let path497;
    	let path498;
    	let path499;
    	let path500;
    	let path501;
    	let path502;
    	let path503;
    	let path504;
    	let path505;
    	let path506;
    	let path507;
    	let path508;
    	let path509;
    	let path510;
    	let path511;
    	let path512;
    	let path513;
    	let path514;
    	let path515;
    	let path516;
    	let path517;
    	let path518;
    	let path519;
    	let path520;
    	let path521;
    	let path522;
    	let path523;
    	let path524;
    	let path525;
    	let path526;
    	let path527;
    	let path528;
    	let path529;
    	let path530;
    	let path531;
    	let path532;
    	let path533;
    	let path534;
    	let path535;
    	let path536;
    	let path537;
    	let path538;
    	let path539;
    	let path540;
    	let path541;
    	let svg_class_value;

    	let svg_levels = [
    		{ xmlns: "http://www.w3.org/2000/svg" },
    		{ id: "flag-icons-es" },
    		{ width: /*size*/ ctx[0] },
    		{ height: /*size*/ ctx[0] },
    		{
    			class: svg_class_value = /*$$props*/ ctx[2].class
    		},
    		/*$$restProps*/ ctx[3],
    		{ "aria-label": /*ariaLabel*/ ctx[1] },
    		{ viewBox: "0 0 640 480" }
    	];

    	let svg_data = {};

    	for (let i = 0; i < svg_levels.length; i += 1) {
    		svg_data = assign(svg_data, svg_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			path2 = svg_element("path");
    			path3 = svg_element("path");
    			path4 = svg_element("path");
    			path5 = svg_element("path");
    			path6 = svg_element("path");
    			path7 = svg_element("path");
    			path8 = svg_element("path");
    			path9 = svg_element("path");
    			path10 = svg_element("path");
    			path11 = svg_element("path");
    			path12 = svg_element("path");
    			path13 = svg_element("path");
    			path14 = svg_element("path");
    			path15 = svg_element("path");
    			path16 = svg_element("path");
    			path17 = svg_element("path");
    			path18 = svg_element("path");
    			path19 = svg_element("path");
    			path20 = svg_element("path");
    			path21 = svg_element("path");
    			path22 = svg_element("path");
    			path23 = svg_element("path");
    			path24 = svg_element("path");
    			path25 = svg_element("path");
    			path26 = svg_element("path");
    			path27 = svg_element("path");
    			path28 = svg_element("path");
    			path29 = svg_element("path");
    			path30 = svg_element("path");
    			path31 = svg_element("path");
    			path32 = svg_element("path");
    			path33 = svg_element("path");
    			path34 = svg_element("path");
    			path35 = svg_element("path");
    			path36 = svg_element("path");
    			path37 = svg_element("path");
    			path38 = svg_element("path");
    			path39 = svg_element("path");
    			path40 = svg_element("path");
    			path41 = svg_element("path");
    			path42 = svg_element("path");
    			path43 = svg_element("path");
    			path44 = svg_element("path");
    			path45 = svg_element("path");
    			path46 = svg_element("path");
    			path47 = svg_element("path");
    			path48 = svg_element("path");
    			path49 = svg_element("path");
    			path50 = svg_element("path");
    			path51 = svg_element("path");
    			path52 = svg_element("path");
    			path53 = svg_element("path");
    			path54 = svg_element("path");
    			path55 = svg_element("path");
    			path56 = svg_element("path");
    			path57 = svg_element("path");
    			path58 = svg_element("path");
    			path59 = svg_element("path");
    			path60 = svg_element("path");
    			path61 = svg_element("path");
    			path62 = svg_element("path");
    			path63 = svg_element("path");
    			path64 = svg_element("path");
    			path65 = svg_element("path");
    			path66 = svg_element("path");
    			path67 = svg_element("path");
    			path68 = svg_element("path");
    			path69 = svg_element("path");
    			path70 = svg_element("path");
    			path71 = svg_element("path");
    			path72 = svg_element("path");
    			path73 = svg_element("path");
    			path74 = svg_element("path");
    			path75 = svg_element("path");
    			path76 = svg_element("path");
    			path77 = svg_element("path");
    			path78 = svg_element("path");
    			path79 = svg_element("path");
    			path80 = svg_element("path");
    			path81 = svg_element("path");
    			path82 = svg_element("path");
    			path83 = svg_element("path");
    			path84 = svg_element("path");
    			path85 = svg_element("path");
    			path86 = svg_element("path");
    			path87 = svg_element("path");
    			path88 = svg_element("path");
    			path89 = svg_element("path");
    			path90 = svg_element("path");
    			path91 = svg_element("path");
    			path92 = svg_element("path");
    			path93 = svg_element("path");
    			path94 = svg_element("path");
    			path95 = svg_element("path");
    			path96 = svg_element("path");
    			path97 = svg_element("path");
    			path98 = svg_element("path");
    			path99 = svg_element("path");
    			path100 = svg_element("path");
    			path101 = svg_element("path");
    			path102 = svg_element("path");
    			path103 = svg_element("path");
    			path104 = svg_element("path");
    			path105 = svg_element("path");
    			path106 = svg_element("path");
    			path107 = svg_element("path");
    			path108 = svg_element("path");
    			path109 = svg_element("path");
    			path110 = svg_element("path");
    			path111 = svg_element("path");
    			path112 = svg_element("path");
    			path113 = svg_element("path");
    			path114 = svg_element("path");
    			path115 = svg_element("path");
    			path116 = svg_element("path");
    			path117 = svg_element("path");
    			path118 = svg_element("path");
    			path119 = svg_element("path");
    			path120 = svg_element("path");
    			path121 = svg_element("path");
    			path122 = svg_element("path");
    			path123 = svg_element("path");
    			path124 = svg_element("path");
    			path125 = svg_element("path");
    			path126 = svg_element("path");
    			path127 = svg_element("path");
    			path128 = svg_element("path");
    			path129 = svg_element("path");
    			path130 = svg_element("path");
    			path131 = svg_element("path");
    			path132 = svg_element("path");
    			path133 = svg_element("path");
    			path134 = svg_element("path");
    			path135 = svg_element("path");
    			path136 = svg_element("path");
    			path137 = svg_element("path");
    			path138 = svg_element("path");
    			path139 = svg_element("path");
    			path140 = svg_element("path");
    			path141 = svg_element("path");
    			path142 = svg_element("path");
    			path143 = svg_element("path");
    			path144 = svg_element("path");
    			path145 = svg_element("path");
    			path146 = svg_element("path");
    			path147 = svg_element("path");
    			path148 = svg_element("path");
    			path149 = svg_element("path");
    			path150 = svg_element("path");
    			path151 = svg_element("path");
    			path152 = svg_element("path");
    			path153 = svg_element("path");
    			path154 = svg_element("path");
    			path155 = svg_element("path");
    			path156 = svg_element("path");
    			path157 = svg_element("path");
    			path158 = svg_element("path");
    			path159 = svg_element("path");
    			path160 = svg_element("path");
    			path161 = svg_element("path");
    			path162 = svg_element("path");
    			path163 = svg_element("path");
    			path164 = svg_element("path");
    			path165 = svg_element("path");
    			path166 = svg_element("path");
    			path167 = svg_element("path");
    			path168 = svg_element("path");
    			path169 = svg_element("path");
    			path170 = svg_element("path");
    			path171 = svg_element("path");
    			path172 = svg_element("path");
    			path173 = svg_element("path");
    			path174 = svg_element("path");
    			path175 = svg_element("path");
    			path176 = svg_element("path");
    			path177 = svg_element("path");
    			path178 = svg_element("path");
    			path179 = svg_element("path");
    			path180 = svg_element("path");
    			path181 = svg_element("path");
    			path182 = svg_element("path");
    			path183 = svg_element("path");
    			path184 = svg_element("path");
    			path185 = svg_element("path");
    			path186 = svg_element("path");
    			path187 = svg_element("path");
    			path188 = svg_element("path");
    			path189 = svg_element("path");
    			path190 = svg_element("path");
    			path191 = svg_element("path");
    			path192 = svg_element("path");
    			path193 = svg_element("path");
    			path194 = svg_element("path");
    			path195 = svg_element("path");
    			path196 = svg_element("path");
    			path197 = svg_element("path");
    			path198 = svg_element("path");
    			path199 = svg_element("path");
    			path200 = svg_element("path");
    			path201 = svg_element("path");
    			path202 = svg_element("path");
    			path203 = svg_element("path");
    			path204 = svg_element("path");
    			path205 = svg_element("path");
    			path206 = svg_element("path");
    			path207 = svg_element("path");
    			path208 = svg_element("path");
    			path209 = svg_element("path");
    			path210 = svg_element("path");
    			path211 = svg_element("path");
    			path212 = svg_element("path");
    			path213 = svg_element("path");
    			path214 = svg_element("path");
    			path215 = svg_element("path");
    			path216 = svg_element("path");
    			path217 = svg_element("path");
    			path218 = svg_element("path");
    			path219 = svg_element("path");
    			path220 = svg_element("path");
    			path221 = svg_element("path");
    			path222 = svg_element("path");
    			path223 = svg_element("path");
    			path224 = svg_element("path");
    			path225 = svg_element("path");
    			path226 = svg_element("path");
    			path227 = svg_element("path");
    			path228 = svg_element("path");
    			path229 = svg_element("path");
    			path230 = svg_element("path");
    			path231 = svg_element("path");
    			path232 = svg_element("path");
    			path233 = svg_element("path");
    			path234 = svg_element("path");
    			path235 = svg_element("path");
    			path236 = svg_element("path");
    			path237 = svg_element("path");
    			path238 = svg_element("path");
    			path239 = svg_element("path");
    			path240 = svg_element("path");
    			path241 = svg_element("path");
    			path242 = svg_element("path");
    			path243 = svg_element("path");
    			path244 = svg_element("path");
    			path245 = svg_element("path");
    			path246 = svg_element("path");
    			path247 = svg_element("path");
    			path248 = svg_element("path");
    			path249 = svg_element("path");
    			path250 = svg_element("path");
    			path251 = svg_element("path");
    			path252 = svg_element("path");
    			path253 = svg_element("path");
    			path254 = svg_element("path");
    			path255 = svg_element("path");
    			path256 = svg_element("path");
    			path257 = svg_element("path");
    			path258 = svg_element("path");
    			path259 = svg_element("path");
    			path260 = svg_element("path");
    			path261 = svg_element("path");
    			path262 = svg_element("path");
    			path263 = svg_element("path");
    			path264 = svg_element("path");
    			path265 = svg_element("path");
    			path266 = svg_element("path");
    			path267 = svg_element("path");
    			path268 = svg_element("path");
    			path269 = svg_element("path");
    			path270 = svg_element("path");
    			path271 = svg_element("path");
    			path272 = svg_element("path");
    			path273 = svg_element("path");
    			path274 = svg_element("path");
    			path275 = svg_element("path");
    			path276 = svg_element("path");
    			path277 = svg_element("path");
    			path278 = svg_element("path");
    			path279 = svg_element("path");
    			path280 = svg_element("path");
    			path281 = svg_element("path");
    			path282 = svg_element("path");
    			path283 = svg_element("path");
    			path284 = svg_element("path");
    			path285 = svg_element("path");
    			path286 = svg_element("path");
    			path287 = svg_element("path");
    			path288 = svg_element("path");
    			path289 = svg_element("path");
    			path290 = svg_element("path");
    			path291 = svg_element("path");
    			path292 = svg_element("path");
    			path293 = svg_element("path");
    			path294 = svg_element("path");
    			path295 = svg_element("path");
    			path296 = svg_element("path");
    			path297 = svg_element("path");
    			path298 = svg_element("path");
    			path299 = svg_element("path");
    			path300 = svg_element("path");
    			path301 = svg_element("path");
    			path302 = svg_element("path");
    			path303 = svg_element("path");
    			path304 = svg_element("path");
    			path305 = svg_element("path");
    			path306 = svg_element("path");
    			path307 = svg_element("path");
    			path308 = svg_element("path");
    			path309 = svg_element("path");
    			path310 = svg_element("path");
    			path311 = svg_element("path");
    			path312 = svg_element("path");
    			path313 = svg_element("path");
    			path314 = svg_element("path");
    			path315 = svg_element("path");
    			path316 = svg_element("path");
    			path317 = svg_element("path");
    			path318 = svg_element("path");
    			path319 = svg_element("path");
    			path320 = svg_element("path");
    			path321 = svg_element("path");
    			path322 = svg_element("path");
    			path323 = svg_element("path");
    			path324 = svg_element("path");
    			path325 = svg_element("path");
    			path326 = svg_element("path");
    			path327 = svg_element("path");
    			path328 = svg_element("path");
    			path329 = svg_element("path");
    			path330 = svg_element("path");
    			path331 = svg_element("path");
    			path332 = svg_element("path");
    			path333 = svg_element("path");
    			path334 = svg_element("path");
    			path335 = svg_element("path");
    			path336 = svg_element("path");
    			path337 = svg_element("path");
    			path338 = svg_element("path");
    			path339 = svg_element("path");
    			path340 = svg_element("path");
    			path341 = svg_element("path");
    			path342 = svg_element("path");
    			path343 = svg_element("path");
    			path344 = svg_element("path");
    			path345 = svg_element("path");
    			path346 = svg_element("path");
    			path347 = svg_element("path");
    			path348 = svg_element("path");
    			path349 = svg_element("path");
    			path350 = svg_element("path");
    			path351 = svg_element("path");
    			path352 = svg_element("path");
    			path353 = svg_element("path");
    			path354 = svg_element("path");
    			path355 = svg_element("path");
    			path356 = svg_element("path");
    			path357 = svg_element("path");
    			path358 = svg_element("path");
    			path359 = svg_element("path");
    			path360 = svg_element("path");
    			path361 = svg_element("path");
    			path362 = svg_element("path");
    			path363 = svg_element("path");
    			path364 = svg_element("path");
    			path365 = svg_element("path");
    			path366 = svg_element("path");
    			path367 = svg_element("path");
    			path368 = svg_element("path");
    			path369 = svg_element("path");
    			path370 = svg_element("path");
    			path371 = svg_element("path");
    			path372 = svg_element("path");
    			path373 = svg_element("path");
    			path374 = svg_element("path");
    			path375 = svg_element("path");
    			path376 = svg_element("path");
    			path377 = svg_element("path");
    			path378 = svg_element("path");
    			path379 = svg_element("path");
    			path380 = svg_element("path");
    			path381 = svg_element("path");
    			path382 = svg_element("path");
    			path383 = svg_element("path");
    			path384 = svg_element("path");
    			path385 = svg_element("path");
    			path386 = svg_element("path");
    			path387 = svg_element("path");
    			path388 = svg_element("path");
    			path389 = svg_element("path");
    			path390 = svg_element("path");
    			path391 = svg_element("path");
    			path392 = svg_element("path");
    			path393 = svg_element("path");
    			path394 = svg_element("path");
    			path395 = svg_element("path");
    			path396 = svg_element("path");
    			path397 = svg_element("path");
    			path398 = svg_element("path");
    			path399 = svg_element("path");
    			path400 = svg_element("path");
    			path401 = svg_element("path");
    			path402 = svg_element("path");
    			path403 = svg_element("path");
    			path404 = svg_element("path");
    			path405 = svg_element("path");
    			path406 = svg_element("path");
    			path407 = svg_element("path");
    			path408 = svg_element("path");
    			path409 = svg_element("path");
    			path410 = svg_element("path");
    			path411 = svg_element("path");
    			path412 = svg_element("path");
    			path413 = svg_element("path");
    			path414 = svg_element("path");
    			path415 = svg_element("path");
    			path416 = svg_element("path");
    			path417 = svg_element("path");
    			path418 = svg_element("path");
    			path419 = svg_element("path");
    			path420 = svg_element("path");
    			path421 = svg_element("path");
    			path422 = svg_element("path");
    			path423 = svg_element("path");
    			path424 = svg_element("path");
    			path425 = svg_element("path");
    			path426 = svg_element("path");
    			path427 = svg_element("path");
    			path428 = svg_element("path");
    			path429 = svg_element("path");
    			path430 = svg_element("path");
    			path431 = svg_element("path");
    			path432 = svg_element("path");
    			path433 = svg_element("path");
    			path434 = svg_element("path");
    			path435 = svg_element("path");
    			path436 = svg_element("path");
    			path437 = svg_element("path");
    			path438 = svg_element("path");
    			path439 = svg_element("path");
    			path440 = svg_element("path");
    			path441 = svg_element("path");
    			path442 = svg_element("path");
    			path443 = svg_element("path");
    			path444 = svg_element("path");
    			path445 = svg_element("path");
    			path446 = svg_element("path");
    			path447 = svg_element("path");
    			path448 = svg_element("path");
    			path449 = svg_element("path");
    			path450 = svg_element("path");
    			path451 = svg_element("path");
    			path452 = svg_element("path");
    			path453 = svg_element("path");
    			path454 = svg_element("path");
    			path455 = svg_element("path");
    			path456 = svg_element("path");
    			path457 = svg_element("path");
    			path458 = svg_element("path");
    			path459 = svg_element("path");
    			path460 = svg_element("path");
    			path461 = svg_element("path");
    			path462 = svg_element("path");
    			path463 = svg_element("path");
    			path464 = svg_element("path");
    			path465 = svg_element("path");
    			path466 = svg_element("path");
    			path467 = svg_element("path");
    			path468 = svg_element("path");
    			path469 = svg_element("path");
    			path470 = svg_element("path");
    			path471 = svg_element("path");
    			path472 = svg_element("path");
    			path473 = svg_element("path");
    			path474 = svg_element("path");
    			path475 = svg_element("path");
    			path476 = svg_element("path");
    			path477 = svg_element("path");
    			path478 = svg_element("path");
    			path479 = svg_element("path");
    			path480 = svg_element("path");
    			path481 = svg_element("path");
    			path482 = svg_element("path");
    			path483 = svg_element("path");
    			path484 = svg_element("path");
    			path485 = svg_element("path");
    			path486 = svg_element("path");
    			path487 = svg_element("path");
    			path488 = svg_element("path");
    			path489 = svg_element("path");
    			path490 = svg_element("path");
    			path491 = svg_element("path");
    			path492 = svg_element("path");
    			path493 = svg_element("path");
    			path494 = svg_element("path");
    			path495 = svg_element("path");
    			path496 = svg_element("path");
    			path497 = svg_element("path");
    			path498 = svg_element("path");
    			path499 = svg_element("path");
    			path500 = svg_element("path");
    			path501 = svg_element("path");
    			path502 = svg_element("path");
    			path503 = svg_element("path");
    			path504 = svg_element("path");
    			path505 = svg_element("path");
    			path506 = svg_element("path");
    			path507 = svg_element("path");
    			path508 = svg_element("path");
    			path509 = svg_element("path");
    			path510 = svg_element("path");
    			path511 = svg_element("path");
    			path512 = svg_element("path");
    			path513 = svg_element("path");
    			path514 = svg_element("path");
    			path515 = svg_element("path");
    			path516 = svg_element("path");
    			path517 = svg_element("path");
    			path518 = svg_element("path");
    			path519 = svg_element("path");
    			path520 = svg_element("path");
    			path521 = svg_element("path");
    			path522 = svg_element("path");
    			path523 = svg_element("path");
    			path524 = svg_element("path");
    			path525 = svg_element("path");
    			path526 = svg_element("path");
    			path527 = svg_element("path");
    			path528 = svg_element("path");
    			path529 = svg_element("path");
    			path530 = svg_element("path");
    			path531 = svg_element("path");
    			path532 = svg_element("path");
    			path533 = svg_element("path");
    			path534 = svg_element("path");
    			path535 = svg_element("path");
    			path536 = svg_element("path");
    			path537 = svg_element("path");
    			path538 = svg_element("path");
    			path539 = svg_element("path");
    			path540 = svg_element("path");
    			path541 = svg_element("path");
    			attr_dev(path0, "fill", "#AA151B");
    			attr_dev(path0, "d", "M0 0h640v480H0z");
    			add_location(path0, file$9, 15, 1, 264);
    			attr_dev(path1, "fill", "#F1BF00");
    			attr_dev(path1, "d", "M0 120h640v240H0z");
    			add_location(path1, file$9, 16, 1, 309);
    			attr_dev(path2, "fill", "#ad1519");
    			attr_dev(path2, "d", "m127.3 213.3-.8-.1-1-1-.7-.4-.6-.8s-.7-1.1-.4-2c.3-.9.9-1.2 1.4-1.5a12 12 0 0 1 1.5-.5l1-.4 1.3-.3.5-.3c.2 0 .7 0 1-.2l1-.2 1.6.1h4.8c.4 0 1.2.3 1.4.4a35 35 0 0 0 2 .7c.5.1 1.6.3 2.2.6.5.3.9.7 1.1 1l.5 1v1.1l-.5.8-.6 1-.8.6s-.5.5-1 .4c-.4 0-4.8-.8-7.6-.8s-7.3.9-7.3.9");
    			add_location(path2, file$9, 17, 1, 356);
    			attr_dev(path3, "fill", "none");
    			attr_dev(path3, "stroke", "#000");
    			attr_dev(path3, "stroke-linejoin", "round");
    			attr_dev(path3, "stroke-width", ".3");
    			attr_dev(path3, "d", "m127.3 213.3-.8-.1-1-1-.7-.4-.6-.8s-.7-1.1-.4-2c.3-.9.9-1.2 1.4-1.5a12 12 0 0 1 1.5-.5l1-.4 1.3-.3.5-.3c.2 0 .7 0 1-.2l1-.2 1.6.1h4.8c.4 0 1.2.3 1.4.4a35 35 0 0 0 2 .7c.5.1 1.6.3 2.2.6.5.3.9.7 1.1 1l.5 1v1.1l-.5.8-.6 1-.8.6s-.5.5-1 .4c-.4 0-4.8-.8-7.6-.8s-7.3.9-7.3.9z");
    			add_location(path3, file$9, 21, 1, 658);
    			attr_dev(path4, "fill", "#c8b100");
    			attr_dev(path4, "d", "M133.3 207c0-1.3.6-2.3 1.3-2.3.8 0 1.4 1 1.4 2.4 0 1.3-.6 2.4-1.4 2.4s-1.3-1.1-1.3-2.5");
    			add_location(path4, file$9, 28, 1, 1020);
    			attr_dev(path5, "fill", "none");
    			attr_dev(path5, "stroke", "#000");
    			attr_dev(path5, "stroke-width", ".3");
    			attr_dev(path5, "d", "M133.3 207c0-1.3.6-2.3 1.3-2.3.8 0 1.4 1 1.4 2.4 0 1.3-.6 2.4-1.4 2.4s-1.3-1.1-1.3-2.5z");
    			add_location(path5, file$9, 32, 1, 1141);
    			attr_dev(path6, "fill", "#c8b100");
    			attr_dev(path6, "d", "M134 207c0-1.2.3-2.1.7-2.1.3 0 .6 1 .6 2.1 0 1.3-.3 2.2-.6 2.2-.4 0-.6-1-.6-2.2");
    			add_location(path6, file$9, 38, 1, 1296);
    			attr_dev(path7, "fill", "none");
    			attr_dev(path7, "stroke", "#000");
    			attr_dev(path7, "stroke-width", ".3");
    			attr_dev(path7, "d", "M134 207c0-1.2.3-2.1.7-2.1.3 0 .6 1 .6 2.1 0 1.3-.3 2.2-.6 2.2-.4 0-.6-1-.6-2.2z");
    			add_location(path7, file$9, 42, 1, 1410);
    			attr_dev(path8, "fill", "#c8b100");
    			attr_dev(path8, "d", "M133.8 204.5c0-.4.4-.8.8-.8s1 .4 1 .8c0 .5-.5.9-1 .9s-.8-.4-.8-.9");
    			add_location(path8, file$9, 48, 1, 1558);
    			attr_dev(path9, "fill", "#c8b100");
    			attr_dev(path9, "d", "M135.3 204.2v.6h-1.4v-.6h.5V203h-.7v-.6h.7v-.5h.5v.5h.6v.6h-.6v1.2h.4");
    			add_location(path9, file$9, 49, 1, 1653);
    			attr_dev(path10, "fill", "none");
    			attr_dev(path10, "stroke", "#000");
    			attr_dev(path10, "stroke-width", ".3");
    			attr_dev(path10, "d", "M135.3 204.2v.6h-1.4v-.6h.5V203h-.7v-.6h.7v-.5h.5v.5h.6v.6h-.6v1.2h.4");
    			add_location(path10, file$9, 50, 1, 1752);
    			attr_dev(path11, "fill", "#c8b100");
    			attr_dev(path11, "d", "M135.9 204.2v.6h-2.5v-.6h1V203h-.7v-.6h.7v-.5h.5v.5h.6v.6h-.6v1.2h1");
    			add_location(path11, file$9, 56, 1, 1889);
    			attr_dev(path12, "fill", "none");
    			attr_dev(path12, "stroke", "#000");
    			attr_dev(path12, "stroke-width", ".3");
    			attr_dev(path12, "d", "M135.9 204.2v.6h-2.5v-.6h1V203h-.7v-.6h.7v-.5h.5v.5h.6v.6h-.6v1.2h1");
    			add_location(path12, file$9, 57, 1, 1986);
    			attr_dev(path13, "fill", "none");
    			attr_dev(path13, "stroke", "#000");
    			attr_dev(path13, "stroke-width", ".3");
    			attr_dev(path13, "d", "M134.9 203.7c.4.1.6.4.6.8 0 .5-.4.9-.8.9s-1-.4-1-.9c0-.4.3-.7.7-.8");
    			add_location(path13, file$9, 63, 1, 2121);
    			attr_dev(path14, "fill", "#c8b100");
    			attr_dev(path14, "d", "M134.7 213.2H130v-1.1l-.3-1.2-.2-1.5c-1.3-1.7-2.5-2.8-2.9-2.5.1-.3.2-.6.5-.7 1.1-.7 3.5 1 5.2 3.6l.5.7h3.8l.4-.7c1.8-2.7 4.1-4.3 5.2-3.6.3.1.4.4.5.7-.4-.3-1.6.8-2.9 2.5l-.2 1.5-.2 1.2-.1 1.1h-4.7");
    			add_location(path14, file$9, 69, 1, 2255);
    			attr_dev(path15, "fill", "none");
    			attr_dev(path15, "stroke", "#000");
    			attr_dev(path15, "stroke-width", ".3");
    			attr_dev(path15, "d", "M134.7 213.2H130v-1.1l-.3-1.2-.2-1.5c-1.3-1.7-2.5-2.8-2.9-2.5.1-.3.2-.6.5-.7 1.1-.7 3.5 1 5.2 3.6l.5.7h3.8l.4-.7c1.8-2.7 4.1-4.3 5.2-3.6.3.1.4.4.5.7-.4-.3-1.6.8-2.9 2.5l-.2 1.5-.2 1.2-.1 1.1h-4.7z");
    			add_location(path15, file$9, 73, 1, 2485);
    			attr_dev(path16, "fill", "none");
    			attr_dev(path16, "stroke", "#000");
    			attr_dev(path16, "stroke-width", ".3");
    			attr_dev(path16, "d", "M126.8 206.8c1-.5 3 1.1 4.6 3.6m11-3.6c-.8-.5-2.8 1.1-4.5 3.6");
    			add_location(path16, file$9, 79, 1, 2749);
    			attr_dev(path17, "fill", "#c8b100");
    			attr_dev(path17, "d", "m127.8 215.3-.5-1a27.3 27.3 0 0 1 14.7 0l-.5.8a5.7 5.7 0 0 0-.3.8 22.9 22.9 0 0 0-6.6-.8c-2.6 0-5.2.3-6.5.8l-.3-.6");
    			add_location(path17, file$9, 85, 1, 2878);
    			attr_dev(path18, "fill", "none");
    			attr_dev(path18, "stroke", "#000");
    			attr_dev(path18, "stroke-width", ".3");
    			attr_dev(path18, "d", "m127.8 215.3-.5-1a27.3 27.3 0 0 1 14.7 0l-.5.8a5.7 5.7 0 0 0-.3.8 22.9 22.9 0 0 0-6.6-.8c-2.6 0-5.2.3-6.5.8l-.3-.6");
    			add_location(path18, file$9, 89, 1, 3027);
    			attr_dev(path19, "fill", "#c8b100");
    			attr_dev(path19, "d", "M134.6 217.7c2.4 0 5-.4 5.9-.6.6-.2 1-.5 1-.8 0-.2-.2-.3-.4-.4-1.4-.5-4-.8-6.5-.8s-5 .3-6.4.8c-.2 0-.3.2-.4.3 0 .4.3.7 1 .9 1 .2 3.5.6 5.8.6");
    			add_location(path19, file$9, 95, 1, 3209);
    			attr_dev(path20, "fill", "none");
    			attr_dev(path20, "stroke", "#000");
    			attr_dev(path20, "stroke-width", ".3");
    			attr_dev(path20, "d", "M134.6 217.7c2.4 0 5-.4 5.9-.6.6-.2 1-.5 1-.8 0-.2-.2-.3-.4-.4-1.4-.5-4-.8-6.5-.8s-5 .3-6.4.8c-.2 0-.3.2-.4.3 0 .4.3.7 1 .9 1 .2 3.5.6 5.8.6z");
    			add_location(path20, file$9, 99, 1, 3384);
    			attr_dev(path21, "fill", "#c8b100");
    			attr_dev(path21, "d", "m142.1 213.2-.5-.5s-.6.3-1.3.2c-.6 0-.9-1-.9-1s-.7.7-1.3.7c-.7 0-1-.6-1-.6s-.7.5-1.3.4c-.6 0-1.2-.8-1.2-.8s-.6.8-1.2.8c-.6.1-1-.5-1-.5s-.4.6-1.1.7-1.4-.6-1.4-.6-.5.7-1 1c-.5 0-1.2-.4-1.2-.4l-.2.5-.3.1.2.5a27 27 0 0 1 7.2-.9c3 0 5.5.4 7.4 1l.2-.6");
    			add_location(path21, file$9, 105, 1, 3593);
    			attr_dev(path22, "fill", "none");
    			attr_dev(path22, "stroke", "#000");
    			attr_dev(path22, "stroke-width", ".3");
    			attr_dev(path22, "d", "m142.1 213.2-.5-.5s-.6.3-1.3.2c-.6 0-.9-1-.9-1s-.7.7-1.3.7c-.7 0-1-.6-1-.6s-.7.5-1.3.4c-.6 0-1.2-.8-1.2-.8s-.6.8-1.2.8c-.6.1-1-.5-1-.5s-.4.6-1.1.7-1.4-.6-1.4-.6-.5.7-1 1c-.5 0-1.2-.4-1.2-.4l-.2.5-.3.1.2.5a27 27 0 0 1 7.2-.9c3 0 5.5.4 7.4 1l.2-.6z");
    			add_location(path22, file$9, 109, 1, 3873);
    			attr_dev(path23, "fill", "#c8b100");
    			attr_dev(path23, "d", "M134.7 210.7h.2a1 1 0 0 0 0 .4c0 .6.4 1 1 1a1 1 0 0 0 1-.7l.2-.3v.4c.1.5.6.8 1.1.8.6 0 1-.4 1-1v-.1l.4-.4.2.5a.9.9 0 0 0-.1.4 1 1 0 0 0 1 1c.4 0 .7-.2.9-.5l.2-.2v.3c0 .3.1.6.4.7 0 0 .4 0 1-.4l.7-.7v.4s-.5.8-1 1c-.2.2-.5.4-.8.3-.3 0-.6-.3-.7-.6-.2.2-.4.2-.7.2-.6 0-1.2-.3-1.4-.8-.3.3-.7.5-1.1.5a1.6 1.6 0 0 1-1.2-.6 1.6 1.6 0 0 1-1 .4 1.6 1.6 0 0 1-1.3-.6 1.6 1.6 0 0 1-2.4.2 1.6 1.6 0 0 1-1.2.6 1.5 1.5 0 0 1-1.1-.5c-.2.5-.8.8-1.4.8-.2 0-.5 0-.7-.2-.1.3-.4.6-.7.6-.3 0-.6 0-.9-.2l-1-1 .1-.5.8.7c.5.4.9.4.9.4.3 0 .4-.4.4-.7v-.3l.2.2c.2.3.5.5.9.5a1 1 0 0 0 1-1 .9.9 0 0 0 0-.4v-.5l.4.4a.7.7 0 0 0 0 .1c0 .6.5 1 1 1 .6 0 1-.3 1.1-.9v-.3l.2.3c.2.4.6.7 1 .7.7 0 1.1-.4 1.1-1a1 1 0 0 0 0-.3h.3");
    			add_location(path23, file$9, 115, 1, 4187);
    			attr_dev(path24, "fill", "none");
    			attr_dev(path24, "stroke", "#000");
    			attr_dev(path24, "stroke-width", ".3");
    			attr_dev(path24, "d", "M134.7 210.7h.2a1 1 0 0 0 0 .4c0 .6.4 1 1 1a1 1 0 0 0 1-.7l.2-.3v.4c.1.5.6.8 1.1.8.6 0 1-.4 1-1v-.1l.4-.4.2.5a.9.9 0 0 0-.1.4 1 1 0 0 0 1 1c.4 0 .7-.2.9-.5l.2-.2v.3c0 .3.1.6.4.7 0 0 .4 0 1-.4l.7-.7v.4s-.5.8-1 1c-.2.2-.5.4-.8.3-.3 0-.6-.3-.7-.6-.2.2-.4.2-.7.2-.6 0-1.2-.3-1.4-.8-.3.3-.7.5-1.1.5a1.6 1.6 0 0 1-1.2-.6 1.6 1.6 0 0 1-1 .4 1.6 1.6 0 0 1-1.3-.6 1.6 1.6 0 0 1-2.4.2 1.6 1.6 0 0 1-1.2.6 1.5 1.5 0 0 1-1.1-.5c-.2.5-.8.8-1.4.8-.2 0-.5 0-.7-.2-.1.3-.4.6-.7.6-.3 0-.6 0-.9-.2l-1-1 .1-.5.8.7c.5.4.9.4.9.4.3 0 .4-.4.4-.7v-.3l.2.2c.2.3.5.5.9.5a1 1 0 0 0 1-1 .9.9 0 0 0 0-.4v-.5l.4.4a.7.7 0 0 0 0 .1c0 .6.5 1 1 1 .6 0 1-.3 1.1-.9v-.3l.2.3c.2.4.6.7 1 .7.7 0 1.1-.4 1.1-1a1 1 0 0 0 0-.3h.3z");
    			add_location(path24, file$9, 119, 1, 4909);
    			attr_dev(path25, "fill", "#c8b100");
    			attr_dev(path25, "d", "M134.6 213.3c-2.9 0-5.5.4-7.3 1l-.3-.2.1-.3a27 27 0 0 1 7.5-1c3 0 5.7.4 7.6 1 0 0 .2.2.1.3l-.3.2a27.3 27.3 0 0 0-7.4-1");
    			add_location(path25, file$9, 125, 1, 5665);
    			attr_dev(path26, "fill", "none");
    			attr_dev(path26, "stroke", "#000");
    			attr_dev(path26, "stroke-linejoin", "round");
    			attr_dev(path26, "stroke-width", ".3");
    			attr_dev(path26, "d", "M134.6 213.3c-2.9 0-5.5.4-7.3 1l-.3-.2.1-.3a27 27 0 0 1 7.5-1c3 0 5.7.4 7.6 1 0 0 .2.2.1.3l-.3.2a27.3 27.3 0 0 0-7.4-1z");
    			add_location(path26, file$9, 129, 1, 5818);
    			attr_dev(path27, "fill", "#fff");
    			attr_dev(path27, "d", "M131.8 214.4c0-.3.2-.4.5-.4a.4.4 0 0 1 .4.4c0 .2-.2.4-.4.4a.4.4 0 0 1-.5-.4");
    			add_location(path27, file$9, 136, 1, 6031);
    			attr_dev(path28, "fill", "none");
    			attr_dev(path28, "stroke", "#000");
    			attr_dev(path28, "stroke-width", ".3");
    			attr_dev(path28, "d", "M131.8 214.4c0-.3.2-.4.5-.4a.4.4 0 0 1 .4.4c0 .2-.2.4-.4.4a.4.4 0 0 1-.5-.4z");
    			add_location(path28, file$9, 140, 1, 6138);
    			attr_dev(path29, "fill", "#ad1519");
    			attr_dev(path29, "d", "M134.7 214.5h-1c-.1 0-.3 0-.3-.3l.3-.3h2a.3.3 0 0 1 .2.3.3.3 0 0 1-.3.3h-1");
    			add_location(path29, file$9, 146, 1, 6282);
    			attr_dev(path30, "fill", "none");
    			attr_dev(path30, "stroke", "#000");
    			attr_dev(path30, "stroke-width", ".3");
    			attr_dev(path30, "d", "M134.7 214.5h-1c-.1 0-.3 0-.3-.3l.3-.3h2a.3.3 0 0 1 .2.3.3.3 0 0 1-.3.3h-1");
    			add_location(path30, file$9, 150, 1, 6391);
    			attr_dev(path31, "fill", "#058e6e");
    			attr_dev(path31, "d", "M130 214.9h-.7c-.1 0-.3 0-.3-.2a.3.3 0 0 1 .2-.3l.7-.1.7-.1c.2 0 .3 0 .4.2a.3.3 0 0 1-.3.4h-.7");
    			add_location(path31, file$9, 156, 1, 6533);
    			attr_dev(path32, "fill", "none");
    			attr_dev(path32, "stroke", "#000");
    			attr_dev(path32, "stroke-width", ".3");
    			attr_dev(path32, "d", "M130 214.9h-.7c-.1 0-.3 0-.3-.2a.3.3 0 0 1 .2-.3l.7-.1.7-.1c.2 0 .3 0 .4.2a.3.3 0 0 1-.3.4h-.7");
    			add_location(path32, file$9, 160, 1, 6662);
    			attr_dev(path33, "fill", "#ad1519");
    			attr_dev(path33, "d", "m127.3 215.3.3-.4h.7l-.4.6-.6-.2");
    			add_location(path33, file$9, 166, 1, 6824);
    			attr_dev(path34, "fill", "none");
    			attr_dev(path34, "stroke", "#000");
    			attr_dev(path34, "stroke-width", ".3");
    			attr_dev(path34, "d", "m127.3 215.3.3-.4h.7l-.4.6-.6-.2");
    			add_location(path34, file$9, 167, 1, 6886);
    			attr_dev(path35, "fill", "#fff");
    			attr_dev(path35, "d", "M136.6 214.4c0-.3.2-.4.4-.4a.4.4 0 0 1 .5.4.4.4 0 0 1-.5.4.4.4 0 0 1-.4-.4");
    			add_location(path35, file$9, 168, 1, 6977);
    			attr_dev(path36, "fill", "none");
    			attr_dev(path36, "stroke", "#000");
    			attr_dev(path36, "stroke-width", ".3");
    			attr_dev(path36, "d", "M136.6 214.4c0-.3.2-.4.4-.4a.4.4 0 0 1 .5.4.4.4 0 0 1-.5.4.4.4 0 0 1-.4-.4z");
    			add_location(path36, file$9, 172, 1, 7083);
    			attr_dev(path37, "fill", "#058e6e");
    			attr_dev(path37, "d", "M139.3 214.9h.6a.3.3 0 0 0 .4-.2.3.3 0 0 0-.3-.3l-.6-.1-.7-.1c-.2 0-.3 0-.4.2 0 .2.1.3.3.4h.7");
    			add_location(path37, file$9, 178, 1, 7226);
    			attr_dev(path38, "fill", "none");
    			attr_dev(path38, "stroke", "#000");
    			attr_dev(path38, "stroke-width", ".3");
    			attr_dev(path38, "d", "M139.3 214.9h.6a.3.3 0 0 0 .4-.2.3.3 0 0 0-.3-.3l-.6-.1-.7-.1c-.2 0-.3 0-.4.2 0 .2.1.3.3.4h.7");
    			add_location(path38, file$9, 182, 1, 7354);
    			attr_dev(path39, "fill", "#ad1519");
    			attr_dev(path39, "d", "m142 215.4-.3-.5h-.7l.3.6.6-.1");
    			add_location(path39, file$9, 188, 1, 7515);
    			attr_dev(path40, "fill", "none");
    			attr_dev(path40, "stroke", "#000");
    			attr_dev(path40, "stroke-width", ".3");
    			attr_dev(path40, "d", "m142 215.4-.3-.5h-.7l.3.6.6-.1");
    			add_location(path40, file$9, 189, 1, 7575);
    			attr_dev(path41, "fill", "#ad1519");
    			attr_dev(path41, "d", "M134.6 217.1a25 25 0 0 1-6-.6 25.5 25.5 0 0 1 12.1 0c-1.6.4-3.7.6-6 .6");
    			add_location(path41, file$9, 190, 1, 7664);
    			attr_dev(path42, "fill", "none");
    			attr_dev(path42, "stroke", "#000");
    			attr_dev(path42, "stroke-linejoin", "round");
    			attr_dev(path42, "stroke-width", ".3");
    			attr_dev(path42, "d", "M134.6 217.1a25 25 0 0 1-6-.6 25.5 25.5 0 0 1 12.1 0c-1.6.4-3.7.6-6 .6z");
    			add_location(path42, file$9, 191, 1, 7764);
    			attr_dev(path43, "fill", "#c8b100");
    			attr_dev(path43, "d", "m142 212-.1-.3c-.2 0-.3 0-.4.2 0 .2 0 .4.2.4 0 0 .2 0 .3-.3");
    			add_location(path43, file$9, 198, 1, 7929);
    			attr_dev(path44, "fill", "none");
    			attr_dev(path44, "stroke", "#000");
    			attr_dev(path44, "stroke-width", ".3");
    			attr_dev(path44, "d", "m142 212-.1-.3c-.2 0-.3 0-.4.2 0 .2 0 .4.2.4 0 0 .2 0 .3-.3z");
    			add_location(path44, file$9, 199, 1, 8018);
    			attr_dev(path45, "fill", "#c8b100");
    			attr_dev(path45, "d", "M137.3 211.2c0-.2 0-.4-.2-.4 0 0-.2.1-.2.3 0 .2 0 .4.2.4l.3-.3");
    			add_location(path45, file$9, 205, 1, 8146);
    			attr_dev(path46, "fill", "none");
    			attr_dev(path46, "stroke", "#000");
    			attr_dev(path46, "stroke-width", ".3");
    			attr_dev(path46, "d", "M137.3 211.2c0-.2 0-.4-.2-.4 0 0-.2.1-.2.3 0 .2 0 .4.2.4l.3-.3z");
    			add_location(path46, file$9, 206, 1, 8238);
    			attr_dev(path47, "fill", "#c8b100");
    			attr_dev(path47, "d", "m132 211.2.1-.4c.2 0 .3.1.3.3 0 .2 0 .4-.2.4l-.2-.3");
    			add_location(path47, file$9, 212, 1, 8369);
    			attr_dev(path48, "fill", "none");
    			attr_dev(path48, "stroke", "#000");
    			attr_dev(path48, "stroke-width", ".3");
    			attr_dev(path48, "d", "m132 211.2.1-.4c.2 0 .3.1.3.3 0 .2 0 .4-.2.4l-.2-.3z");
    			add_location(path48, file$9, 213, 1, 8450);
    			attr_dev(path49, "fill", "#c8b100");
    			attr_dev(path49, "d", "m127.3 212 .1-.3c.2 0 .3 0 .4.2 0 .2 0 .4-.2.4 0 0-.2 0-.3-.3");
    			add_location(path49, file$9, 219, 1, 8570);
    			attr_dev(path50, "fill", "none");
    			attr_dev(path50, "stroke", "#000");
    			attr_dev(path50, "stroke-width", ".3");
    			attr_dev(path50, "d", "m127.3 212 .1-.3c.2 0 .3 0 .4.2 0 .2 0 .4-.2.4 0 0-.2 0-.3-.3z");
    			add_location(path50, file$9, 220, 1, 8661);
    			attr_dev(path51, "fill", "#c8b100");
    			attr_dev(path51, "d", "m134.6 208.5-.8.5.6 1.3.2.1.2-.1.7-1.3-.9-.5");
    			add_location(path51, file$9, 226, 1, 8791);
    			attr_dev(path52, "fill", "none");
    			attr_dev(path52, "stroke", "#000");
    			attr_dev(path52, "stroke-width", ".3");
    			attr_dev(path52, "d", "m134.6 208.5-.8.5.6 1.3.2.1.2-.1.7-1.3-.9-.5");
    			add_location(path52, file$9, 227, 1, 8865);
    			attr_dev(path53, "fill", "#c8b100");
    			attr_dev(path53, "d", "m132.8 210.5.4.5 1.3-.4.1-.2-.1-.2-1.3-.3-.4.6");
    			add_location(path53, file$9, 233, 1, 8977);
    			attr_dev(path54, "fill", "none");
    			attr_dev(path54, "stroke", "#000");
    			attr_dev(path54, "stroke-width", ".3");
    			attr_dev(path54, "d", "m132.8 210.5.4.5 1.3-.4.1-.2-.1-.2-1.3-.3-.4.6");
    			add_location(path54, file$9, 234, 1, 9053);
    			attr_dev(path55, "fill", "#c8b100");
    			attr_dev(path55, "d", "m136.4 210.5-.3.5-1.3-.4-.2-.2.2-.2 1.3-.3.3.6");
    			add_location(path55, file$9, 240, 1, 9167);
    			attr_dev(path56, "fill", "none");
    			attr_dev(path56, "stroke", "#000");
    			attr_dev(path56, "stroke-width", ".3");
    			attr_dev(path56, "d", "m136.4 210.5-.3.5-1.3-.4-.2-.2.2-.2 1.3-.3.3.6");
    			add_location(path56, file$9, 241, 1, 9243);
    			attr_dev(path57, "fill", "#c8b100");
    			attr_dev(path57, "d", "m129.3 209-.7.7.9 1 .2.1.1-.1.3-1.3-.8-.3");
    			add_location(path57, file$9, 247, 1, 9357);
    			attr_dev(path58, "fill", "none");
    			attr_dev(path58, "stroke", "#000");
    			attr_dev(path58, "stroke-width", ".3");
    			attr_dev(path58, "d", "m129.3 209-.7.7.9 1 .2.1.1-.1.3-1.3-.8-.3");
    			add_location(path58, file$9, 248, 1, 9428);
    			attr_dev(path59, "fill", "#c8b100");
    			attr_dev(path59, "d", "m128 211.2.4.5 1.2-.6v-.2l-.1-.2-1.3-.1-.3.6");
    			add_location(path59, file$9, 249, 1, 9528);
    			attr_dev(path60, "fill", "none");
    			attr_dev(path60, "stroke", "#000");
    			attr_dev(path60, "stroke-width", ".3");
    			attr_dev(path60, "d", "m128 211.2.4.5 1.2-.6v-.2l-.1-.2-1.3-.1-.3.6");
    			add_location(path60, file$9, 250, 1, 9602);
    			attr_dev(path61, "fill", "#c8b100");
    			attr_dev(path61, "d", "m131.5 210.5-.3.6H130l-.2-.2.1-.3 1.2-.6.5.5");
    			add_location(path61, file$9, 256, 1, 9714);
    			attr_dev(path62, "fill", "none");
    			attr_dev(path62, "stroke", "#000");
    			attr_dev(path62, "stroke-width", ".3");
    			attr_dev(path62, "d", "m131.5 210.5-.3.6H130l-.2-.2.1-.3 1.2-.6.5.5");
    			add_location(path62, file$9, 257, 1, 9788);
    			attr_dev(path63, "fill", "#c8b100");
    			attr_dev(path63, "d", "M126.6 211.4v.6l-1.4.2-.2-.1v-.2l1-.9.6.4");
    			add_location(path63, file$9, 263, 1, 9900);
    			attr_dev(path64, "fill", "none");
    			attr_dev(path64, "stroke", "#000");
    			attr_dev(path64, "stroke-width", ".3");
    			attr_dev(path64, "d", "M126.6 211.4v.6l-1.4.2-.2-.1v-.2l1-.9.6.4");
    			add_location(path64, file$9, 264, 1, 9971);
    			attr_dev(path65, "fill", "#c8b100");
    			attr_dev(path65, "d", "M129.2 210.9c0-.3.2-.5.5-.5s.5.2.5.5a.5.5 0 0 1-.5.4.5.5 0 0 1-.5-.4");
    			add_location(path65, file$9, 265, 1, 10071);
    			attr_dev(path66, "fill", "none");
    			attr_dev(path66, "stroke", "#000");
    			attr_dev(path66, "stroke-width", ".3");
    			attr_dev(path66, "d", "M129.2 210.9c0-.3.2-.5.5-.5s.5.2.5.5a.5.5 0 0 1-.5.4.5.5 0 0 1-.5-.4z");
    			add_location(path66, file$9, 266, 1, 10169);
    			attr_dev(path67, "fill", "#c8b100");
    			attr_dev(path67, "d", "m140 209 .7.7-.9 1-.2.1-.1-.1-.3-1.3.8-.3");
    			add_location(path67, file$9, 272, 1, 10306);
    			attr_dev(path68, "fill", "none");
    			attr_dev(path68, "stroke", "#000");
    			attr_dev(path68, "stroke-width", ".3");
    			attr_dev(path68, "d", "m140 209 .7.7-.9 1-.2.1-.1-.1-.3-1.3.8-.3");
    			add_location(path68, file$9, 273, 1, 10377);
    			attr_dev(path69, "fill", "#c8b100");
    			attr_dev(path69, "d", "m141.4 211.2-.5.5-1.2-.6v-.2l.1-.2 1.3-.1.3.6");
    			add_location(path69, file$9, 274, 1, 10477);
    			attr_dev(path70, "fill", "none");
    			attr_dev(path70, "stroke", "#000");
    			attr_dev(path70, "stroke-width", ".3");
    			attr_dev(path70, "d", "m141.4 211.2-.5.5-1.2-.6v-.2l.1-.2 1.3-.1.3.6");
    			add_location(path70, file$9, 275, 1, 10552);
    			attr_dev(path71, "fill", "#c8b100");
    			attr_dev(path71, "d", "m137.8 210.5.3.6h1.3l.2-.2-.1-.3-1.2-.6-.5.5");
    			add_location(path71, file$9, 281, 1, 10665);
    			attr_dev(path72, "fill", "none");
    			attr_dev(path72, "stroke", "#000");
    			attr_dev(path72, "stroke-width", ".3");
    			attr_dev(path72, "d", "m137.8 210.5.3.6h1.3l.2-.2-.1-.3-1.2-.6-.5.5");
    			add_location(path72, file$9, 282, 1, 10739);
    			attr_dev(path73, "fill", "#c8b100");
    			attr_dev(path73, "d", "m142.5 211.4.1.6 1.3.2.2-.1v-.2l-1-.9-.6.4");
    			add_location(path73, file$9, 288, 1, 10851);
    			attr_dev(path74, "fill", "none");
    			attr_dev(path74, "stroke", "#000");
    			attr_dev(path74, "stroke-width", ".3");
    			attr_dev(path74, "d", "m142.5 211.4.1.6 1.3.2.2-.1v-.2l-1-.9-.6.4");
    			add_location(path74, file$9, 289, 1, 10923);
    			attr_dev(path75, "fill", "#c8b100");
    			attr_dev(path75, "d", "M134.2 210.4a.5.5 0 0 1 .4-.4c.3 0 .5.2.5.4a.5.5 0 0 1-.5.5.5.5 0 0 1-.4-.5");
    			add_location(path75, file$9, 295, 1, 11033);
    			attr_dev(path76, "fill", "none");
    			attr_dev(path76, "stroke", "#000");
    			attr_dev(path76, "stroke-width", ".3");
    			attr_dev(path76, "d", "M134.2 210.4a.5.5 0 0 1 .4-.4c.3 0 .5.2.5.4a.5.5 0 0 1-.5.5.5.5 0 0 1-.4-.5z");
    			add_location(path76, file$9, 299, 1, 11143);
    			attr_dev(path77, "fill", "#c8b100");
    			attr_dev(path77, "d", "M139.1 210.9c0-.3.3-.5.5-.5a.5.5 0 0 1 .5.5.5.5 0 0 1-.5.4.5.5 0 0 1-.5-.4");
    			add_location(path77, file$9, 305, 1, 11287);
    			attr_dev(path78, "fill", "none");
    			attr_dev(path78, "stroke", "#000");
    			attr_dev(path78, "stroke-width", ".3");
    			attr_dev(path78, "d", "M139.1 210.9c0-.3.3-.5.5-.5a.5.5 0 0 1 .5.5.5.5 0 0 1-.5.4.5.5 0 0 1-.5-.4z");
    			add_location(path78, file$9, 309, 1, 11396);
    			attr_dev(path79, "fill", "#c8b100");
    			attr_dev(path79, "d", "m124.8 212.2-.6-.7c-.2-.2-.7-.3-.7-.3 0-.1.3-.3.6-.3a.5.5 0 0 1 .4.2v-.2s.3 0 .4.3v1");
    			add_location(path79, file$9, 315, 1, 11539);
    			attr_dev(path80, "fill", "none");
    			attr_dev(path80, "stroke", "#000");
    			attr_dev(path80, "stroke-width", ".3");
    			attr_dev(path80, "d", "m124.8 212.2-.6-.7c-.2-.2-.7-.3-.7-.3 0-.1.3-.3.6-.3a.5.5 0 0 1 .4.2v-.2s.3 0 .4.3v1z");
    			add_location(path80, file$9, 319, 1, 11658);
    			attr_dev(path81, "fill", "#c8b100");
    			attr_dev(path81, "d", "M124.8 212c.1-.2.4-.2.5 0 .2.1.3.3.2.5l-.5-.1c-.2-.1-.3-.4-.2-.5");
    			add_location(path81, file$9, 325, 1, 11811);
    			attr_dev(path82, "fill", "none");
    			attr_dev(path82, "stroke", "#000");
    			attr_dev(path82, "stroke-width", ".3");
    			attr_dev(path82, "d", "M124.8 212c.1-.2.4-.2.5 0 .2.1.3.3.2.5l-.5-.1c-.2-.1-.3-.4-.2-.5z");
    			add_location(path82, file$9, 326, 1, 11905);
    			attr_dev(path83, "fill", "#c8b100");
    			attr_dev(path83, "d", "m144.3 212.2.6-.7c.2-.2.7-.3.7-.3 0-.1-.3-.3-.6-.3a.6.6 0 0 0-.4.2v-.2s-.3 0-.4.3v.7l.1.3");
    			add_location(path83, file$9, 332, 1, 12038);
    			attr_dev(path84, "fill", "none");
    			attr_dev(path84, "stroke", "#000");
    			attr_dev(path84, "stroke-width", ".3");
    			attr_dev(path84, "d", "m144.3 212.2.6-.7c.2-.2.7-.3.7-.3 0-.1-.3-.3-.6-.3a.6.6 0 0 0-.4.2v-.2s-.3 0-.4.3v.7l.1.3z");
    			add_location(path84, file$9, 336, 1, 12162);
    			attr_dev(path85, "fill", "#c8b100");
    			attr_dev(path85, "d", "M144.3 212c0-.2-.3-.2-.5 0-.2.1-.2.3-.1.5l.5-.1c.2-.1.2-.4.1-.5");
    			add_location(path85, file$9, 342, 1, 12320);
    			attr_dev(path86, "fill", "none");
    			attr_dev(path86, "stroke", "#000");
    			attr_dev(path86, "stroke-width", ".3");
    			attr_dev(path86, "d", "M144.3 212c0-.2-.3-.2-.5 0-.2.1-.2.3-.1.5l.5-.1c.2-.1.2-.4.1-.5z");
    			add_location(path86, file$9, 343, 1, 12413);
    			attr_dev(path87, "fill", "#c8b100");
    			attr_dev(path87, "d", "M124 223h21.4v-5.5H124v5.6z");
    			add_location(path87, file$9, 349, 1, 12545);
    			attr_dev(path88, "fill", "none");
    			attr_dev(path88, "stroke", "#000");
    			attr_dev(path88, "stroke-width", ".4");
    			attr_dev(path88, "d", "M124 223h21.4v-5.5H124v5.6z");
    			add_location(path88, file$9, 350, 1, 12602);
    			attr_dev(path89, "fill", "#c8b100");
    			attr_dev(path89, "d", "M126.2 226.8a1 1 0 0 1 .4 0h16.5a1.4 1.4 0 0 1-1-1.2c0-.6.5-1.1 1-1.3a1.7 1.7 0 0 1-.4 0h-16a1.4 1.4 0 0 1-.5 0c.6.2 1 .7 1 1.3a1.3 1.3 0 0 1-1 1.2");
    			add_location(path89, file$9, 351, 1, 12688);
    			attr_dev(path90, "fill", "none");
    			attr_dev(path90, "stroke", "#000");
    			attr_dev(path90, "stroke-linejoin", "round");
    			attr_dev(path90, "stroke-width", ".4");
    			attr_dev(path90, "d", "M126.2 226.8a1 1 0 0 1 .4 0h16.5a1.4 1.4 0 0 1-1-1.2c0-.6.5-1.1 1-1.3a1.7 1.7 0 0 1-.4 0h-16a1.4 1.4 0 0 1-.5 0c.6.2 1 .7 1 1.3a1.3 1.3 0 0 1-1 1.2z");
    			add_location(path90, file$9, 355, 1, 12870);
    			attr_dev(path91, "fill", "#c8b100");
    			attr_dev(path91, "d", "M126.6 226.8h16c.6 0 1 .3 1 .7 0 .4-.4.8-1 .8h-16c-.5 0-1-.4-1-.8s.5-.8 1-.8");
    			add_location(path91, file$9, 362, 1, 13112);
    			attr_dev(path92, "fill", "none");
    			attr_dev(path92, "stroke", "#000");
    			attr_dev(path92, "stroke-width", ".4");
    			attr_dev(path92, "d", "M126.6 226.8h16c.6 0 1 .3 1 .7 0 .4-.4.8-1 .8h-16c-.5 0-1-.4-1-.8s.5-.8 1-.8z");
    			add_location(path92, file$9, 366, 1, 13223);
    			attr_dev(path93, "fill", "#c8b100");
    			attr_dev(path93, "d", "M126.6 223h16c.6 0 1 .4 1 .7 0 .4-.4.6-1 .6h-16c-.5 0-1-.2-1-.6 0-.3.5-.6 1-.6");
    			add_location(path93, file$9, 372, 1, 13368);
    			attr_dev(path94, "fill", "none");
    			attr_dev(path94, "stroke", "#000");
    			attr_dev(path94, "stroke-width", ".4");
    			attr_dev(path94, "d", "M126.6 223h16c.6 0 1 .4 1 .7 0 .4-.4.6-1 .6h-16c-.5 0-1-.2-1-.6 0-.3.5-.6 1-.6z");
    			add_location(path94, file$9, 376, 1, 13481);
    			attr_dev(path95, "fill", "#005bbf");
    			attr_dev(path95, "d", "M149.6 317.4c-1.4 0-2.8-.3-3.7-.8a8.4 8.4 0 0 0-3.8-.8c-1.4 0-2.7.3-3.7.8a8.3 8.3 0 0 1-3.8.8c-1.5 0-2.8-.3-3.7-.8a8.4 8.4 0 0 0-3.7-.8 8 8 0 0 0-3.7.8 8.3 8.3 0 0 1-3.8.8v2.4c1.5 0 2.8-.4 3.8-.9a8.2 8.2 0 0 1 3.7-.8c1.4 0 2.7.3 3.7.8s2.2.9 3.7.9a8.4 8.4 0 0 0 3.8-.9c1-.5 2.3-.8 3.7-.8 1.5 0 2.8.3 3.8.8s2.2.9 3.7.9v-2.4");
    			add_location(path95, file$9, 382, 1, 13628);
    			attr_dev(path96, "fill", "none");
    			attr_dev(path96, "stroke", "#000");
    			attr_dev(path96, "stroke-width", ".4");
    			attr_dev(path96, "d", "M149.6 317.4c-1.4 0-2.8-.3-3.7-.8a8.4 8.4 0 0 0-3.8-.8c-1.4 0-2.7.3-3.7.8a8.3 8.3 0 0 1-3.8.8c-1.5 0-2.8-.3-3.7-.8a8.4 8.4 0 0 0-3.7-.8 8 8 0 0 0-3.7.8 8.3 8.3 0 0 1-3.8.8v2.4c1.5 0 2.8-.4 3.8-.9a8.2 8.2 0 0 1 3.7-.8c1.4 0 2.7.3 3.7.8s2.2.9 3.7.9a8.4 8.4 0 0 0 3.8-.9c1-.5 2.3-.8 3.7-.8 1.5 0 2.8.3 3.8.8s2.2.9 3.7.9v-2.4z");
    			add_location(path96, file$9, 386, 1, 13984);
    			attr_dev(path97, "fill", "#ccc");
    			attr_dev(path97, "d", "M149.6 319.8a8 8 0 0 1-3.7-.9 8.3 8.3 0 0 0-3.8-.8c-1.4 0-2.7.3-3.7.8s-2.3.9-3.8.9-2.8-.4-3.7-.9a8.4 8.4 0 0 0-3.7-.8 8.2 8.2 0 0 0-3.7.8c-1 .5-2.3.9-3.8.9v2.3c1.5 0 2.8-.4 3.8-.9a8.1 8.1 0 0 1 3.7-.7c1.4 0 2.7.2 3.7.7a8.3 8.3 0 0 0 7.5 0 8.5 8.5 0 0 1 7.5.1 8.1 8.1 0 0 0 3.7.8v-2.3");
    			add_location(path97, file$9, 392, 1, 14374);
    			attr_dev(path98, "fill", "none");
    			attr_dev(path98, "stroke", "#000");
    			attr_dev(path98, "stroke-width", ".4");
    			attr_dev(path98, "d", "M149.6 319.8a8 8 0 0 1-3.7-.9 8.3 8.3 0 0 0-3.8-.8c-1.4 0-2.7.3-3.7.8s-2.3.9-3.8.9-2.8-.4-3.7-.9a8.4 8.4 0 0 0-3.7-.8 8.2 8.2 0 0 0-3.7.8c-1 .5-2.3.9-3.8.9v2.3c1.5 0 2.8-.4 3.8-.9a8.1 8.1 0 0 1 3.7-.7c1.4 0 2.7.2 3.7.7a8.3 8.3 0 0 0 7.5 0 8.5 8.5 0 0 1 7.5.1 8.1 8.1 0 0 0 3.7.8v-2.3");
    			add_location(path98, file$9, 396, 1, 14689);
    			attr_dev(path99, "fill", "#005bbf");
    			attr_dev(path99, "d", "M149.6 322a7 7 0 0 1-3.7-.8 8.3 8.3 0 0 0-3.8-.7c-1.4 0-2.7.2-3.7.7-1 .6-2.3.9-3.8.9s-2.8-.4-3.7-.9a8.4 8.4 0 0 0-3.7-.8 8 8 0 0 0-3.7.8c-1 .5-2.3.9-3.8.9v2.3c1.5 0 2.8-.3 3.8-.9a10.2 10.2 0 0 1 7.4 0 7 7 0 0 0 3.7.9 8.4 8.4 0 0 0 3.8-.8c1-.5 2.3-.8 3.7-.8 1.5 0 2.8.3 3.8.8s2.2.8 3.7.8V322");
    			add_location(path99, file$9, 402, 1, 15040);
    			attr_dev(path100, "fill", "none");
    			attr_dev(path100, "stroke", "#000");
    			attr_dev(path100, "stroke-width", ".4");
    			attr_dev(path100, "d", "M149.6 322a7 7 0 0 1-3.7-.8 8.3 8.3 0 0 0-3.8-.7c-1.4 0-2.7.2-3.7.7-1 .6-2.3.9-3.8.9s-2.8-.4-3.7-.9a8.4 8.4 0 0 0-3.7-.8 8 8 0 0 0-3.7.8c-1 .5-2.3.9-3.8.9v2.3c1.5 0 2.8-.3 3.8-.9a10.2 10.2 0 0 1 7.4 0 7 7 0 0 0 3.7.9 8.4 8.4 0 0 0 3.8-.8c1-.5 2.3-.8 3.7-.8 1.5 0 2.8.3 3.8.8s2.2.8 3.7.8V322");
    			add_location(path100, file$9, 406, 1, 15365);
    			attr_dev(path101, "fill", "#ccc");
    			attr_dev(path101, "d", "M149.6 326.7a8 8 0 0 1-3.7-.8c-1-.5-2.3-.8-3.7-.8a8.4 8.4 0 0 0-3.8.8c-1 .5-2.3.8-3.8.8a7 7 0 0 1-3.7-.9 8.4 8.4 0 0 0-3.7-.7c-1.4 0-2.7.3-3.7.8s-2.3.8-3.8.8v-2.3a8.3 8.3 0 0 0 3.8-.9 10.2 10.2 0 0 1 7.4 0 8 8 0 0 0 3.7.9 8.4 8.4 0 0 0 3.8-.8c1-.5 2.3-.8 3.8-.8 1.4 0 2.7.3 3.7.8s2.3.8 3.7.8v2.3");
    			add_location(path101, file$9, 412, 1, 15723);
    			attr_dev(path102, "fill", "none");
    			attr_dev(path102, "stroke", "#000");
    			attr_dev(path102, "stroke-width", ".4");
    			attr_dev(path102, "d", "M149.6 326.7a8 8 0 0 1-3.7-.8c-1-.5-2.3-.8-3.7-.8a8.4 8.4 0 0 0-3.8.8c-1 .5-2.3.8-3.8.8a7 7 0 0 1-3.7-.9 8.4 8.4 0 0 0-3.7-.7c-1.4 0-2.7.3-3.7.8s-2.3.8-3.8.8v-2.3a8.3 8.3 0 0 0 3.8-.9 10.2 10.2 0 0 1 7.4 0 8 8 0 0 0 3.7.9 8.4 8.4 0 0 0 3.8-.8c1-.5 2.3-.8 3.8-.8 1.4 0 2.7.3 3.7.8s2.3.8 3.7.8v2.3");
    			add_location(path102, file$9, 416, 1, 16050);
    			attr_dev(path103, "fill", "#005bbf");
    			attr_dev(path103, "d", "M149.6 329a8.1 8.1 0 0 1-3.7-.8c-1-.5-2.3-.8-3.7-.8a8.4 8.4 0 0 0-3.8.8c-1 .5-2.3.8-3.8.8a7 7 0 0 1-3.7-.9 8.4 8.4 0 0 0-3.7-.7c-1.4 0-2.7.3-3.7.8s-2.3.8-3.8.8v-2.3a8.3 8.3 0 0 0 3.8-.8c1-.5 2.3-.8 3.7-.8 1.4 0 2.7.3 3.7.7a8.4 8.4 0 0 0 7.5 0c1-.4 2.3-.7 3.8-.7 1.4 0 2.7.3 3.7.8s2.2.8 3.7.8v2.3");
    			add_location(path103, file$9, 422, 1, 16413);
    			attr_dev(path104, "fill", "none");
    			attr_dev(path104, "stroke", "#000");
    			attr_dev(path104, "stroke-width", ".4");
    			attr_dev(path104, "d", "M149.6 329a8.1 8.1 0 0 1-3.7-.8c-1-.5-2.3-.8-3.7-.8a8.4 8.4 0 0 0-3.8.8c-1 .5-2.3.8-3.8.8a7 7 0 0 1-3.7-.9 8.4 8.4 0 0 0-3.7-.7c-1.4 0-2.7.3-3.7.8s-2.3.8-3.8.8v-2.3a8.3 8.3 0 0 0 3.8-.8c1-.5 2.3-.8 3.7-.8 1.4 0 2.7.3 3.7.7a8.4 8.4 0 0 0 7.5 0c1-.4 2.3-.7 3.8-.7 1.4 0 2.7.3 3.7.8s2.2.8 3.7.8v2.3z");
    			add_location(path104, file$9, 426, 1, 16743);
    			attr_dev(path105, "fill", "#c8b100");
    			attr_dev(path105, "d", "m126.2 308 .2.5c0 1.5-1.3 2.6-2.7 2.6h22a2.7 2.7 0 0 1-2.7-2.6v-.5a1.3 1.3 0 0 1-.3 0h-16a1.4 1.4 0 0 1-.5 0");
    			add_location(path105, file$9, 432, 1, 17107);
    			attr_dev(path106, "fill", "none");
    			attr_dev(path106, "stroke", "#000");
    			attr_dev(path106, "stroke-linejoin", "round");
    			attr_dev(path106, "stroke-width", ".4");
    			attr_dev(path106, "d", "m126.2 308 .2.5c0 1.5-1.3 2.6-2.7 2.6h22a2.7 2.7 0 0 1-2.7-2.6v-.5a1.3 1.3 0 0 1-.3 0h-16a1.4 1.4 0 0 1-.5 0z");
    			add_location(path106, file$9, 436, 1, 17250);
    			attr_dev(path107, "fill", "#c8b100");
    			attr_dev(path107, "d", "M126.6 306.5h16c.6 0 1 .3 1 .8 0 .4-.4.7-1 .7h-16c-.5 0-1-.3-1-.8 0-.4.5-.7 1-.7");
    			add_location(path107, file$9, 443, 1, 17453);
    			attr_dev(path108, "fill", "none");
    			attr_dev(path108, "stroke", "#000");
    			attr_dev(path108, "stroke-width", ".4");
    			attr_dev(path108, "d", "M126.6 306.5h16c.6 0 1 .3 1 .8 0 .4-.4.7-1 .7h-16c-.5 0-1-.3-1-.8 0-.4.5-.7 1-.7z");
    			add_location(path108, file$9, 447, 1, 17568);
    			attr_dev(path109, "fill", "#c8b100");
    			attr_dev(path109, "d", "M123.7 316.7h22V311h-22v5.6z");
    			add_location(path109, file$9, 453, 1, 17717);
    			attr_dev(path110, "fill", "none");
    			attr_dev(path110, "stroke", "#000");
    			attr_dev(path110, "stroke-width", ".4");
    			attr_dev(path110, "d", "M123.7 316.7h22V311h-22v5.6z");
    			add_location(path110, file$9, 454, 1, 17775);
    			attr_dev(path111, "fill", "#ad1519");
    			attr_dev(path111, "d", "M122 286.7c-2.2 1.2-3.7 2.5-3.4 3.2 0 .6.8 1 1.8 1.6 1.5 1.1 2.5 3 1.7 4a5.5 5.5 0 0 0-.1-8.8");
    			add_location(path111, file$9, 455, 1, 17862);
    			attr_dev(path112, "fill", "none");
    			attr_dev(path112, "stroke", "#000");
    			attr_dev(path112, "stroke-width", ".4");
    			attr_dev(path112, "d", "M122 286.7c-2.2 1.2-3.7 2.5-3.4 3.2 0 .6.8 1 1.8 1.6 1.5 1.1 2.5 3 1.7 4a5.5 5.5 0 0 0-.1-8.8z");
    			add_location(path112, file$9, 459, 1, 17990);
    			attr_dev(path113, "fill", "#ccc");
    			attr_dev(path113, "d", "M126.8 305.6h15.6V229h-15.6v76.5z");
    			add_location(path113, file$9, 465, 1, 18152);
    			attr_dev(path114, "fill", "none");
    			attr_dev(path114, "stroke", "#000");
    			attr_dev(path114, "stroke-width", ".4");
    			attr_dev(path114, "d", "M138 229.2v76.3m1.7-76.3v76.3m-12.9 0h15.6v-76.4h-15.6v76.5z");
    			add_location(path114, file$9, 466, 1, 18212);
    			attr_dev(path115, "fill", "#ad1519");
    			attr_dev(path115, "d", "M158.4 257.7a49.6 49.6 0 0 0-23.3-2c-9.4 1.6-16.5 5.3-15.9 8.4v.2l-3.5-8.2c-.6-3.3 7.2-7.5 17.6-9.2a43 43 0 0 1 9.2-.7c6.6 0 12.4.8 15.8 2.1v9.4");
    			add_location(path115, file$9, 472, 1, 18340);
    			attr_dev(path116, "fill", "none");
    			attr_dev(path116, "stroke", "#000");
    			attr_dev(path116, "stroke-linejoin", "round");
    			attr_dev(path116, "stroke-width", ".4");
    			attr_dev(path116, "d", "M158.4 257.7a49.6 49.6 0 0 0-23.3-2c-9.4 1.6-16.5 5.3-15.9 8.4v.2l-3.5-8.2c-.6-3.3 7.2-7.5 17.6-9.2a43 43 0 0 1 9.2-.7c6.6 0 12.4.8 15.8 2.1v9.4");
    			add_location(path116, file$9, 476, 1, 18519);
    			attr_dev(path117, "fill", "#ad1519");
    			attr_dev(path117, "d", "M126.8 267.3c-4.3-.3-7.3-1.4-7.6-3.2-.3-1.5 1.2-3 3.8-4.5 1.2.1 2.5.3 3.8.3v7.4");
    			add_location(path117, file$9, 483, 1, 18757);
    			attr_dev(path118, "fill", "none");
    			attr_dev(path118, "stroke", "#000");
    			attr_dev(path118, "stroke-width", ".4");
    			attr_dev(path118, "d", "M126.8 267.3c-4.3-.3-7.3-1.4-7.6-3.2-.3-1.5 1.2-3 3.8-4.5 1.2.1 2.5.3 3.8.3v7.4");
    			add_location(path118, file$9, 487, 1, 18871);
    			attr_dev(path119, "fill", "#ad1519");
    			attr_dev(path119, "d", "M142.5 261.5c2.7.4 4.7 1 5.7 1.9l.1.2c.5 1-1.9 3-5.9 5.4v-7.5");
    			add_location(path119, file$9, 493, 1, 19018);
    			attr_dev(path120, "fill", "none");
    			attr_dev(path120, "stroke", "#000");
    			attr_dev(path120, "stroke-width", ".4");
    			attr_dev(path120, "d", "M142.5 261.5c2.7.4 4.7 1 5.7 1.9l.1.2c.5 1-1.9 3-5.9 5.4v-7.5");
    			add_location(path120, file$9, 494, 1, 19109);
    			attr_dev(path121, "fill", "#ad1519");
    			attr_dev(path121, "d", "M117.1 282c-.4-1.2 3.8-3.6 9.8-5.8l7.8-3.2c8.3-3.7 14.4-7.9 13.6-9.4v-.2c.4.4 1 8 1 8 .8 1.3-4.8 5.5-12.4 9.1-2.5 1.2-7.6 3-10 4-4.4 1.4-8.7 4.3-8.3 5.3l-1.5-7.7");
    			add_location(path121, file$9, 500, 1, 19238);
    			attr_dev(path122, "fill", "none");
    			attr_dev(path122, "stroke", "#000");
    			attr_dev(path122, "stroke-linejoin", "round");
    			attr_dev(path122, "stroke-width", ".4");
    			attr_dev(path122, "d", "M117.1 282c-.4-1.2 3.8-3.6 9.8-5.8l7.8-3.2c8.3-3.7 14.4-7.9 13.6-9.4v-.2c.4.4 1 8 1 8 .8 1.3-4.8 5.5-12.4 9.1-2.5 1.2-7.6 3-10 4-4.4 1.4-8.7 4.3-8.3 5.3l-1.5-7.7z");
    			add_location(path122, file$9, 504, 1, 19434);
    			attr_dev(path123, "fill", "#c8b100");
    			attr_dev(path123, "d", "M125.8 254c1.9-.6 3.1-1.5 2.5-3-.4-1-1.4-1-2.8-.6l-2.6 1 2.3 5.8.8-.3.8-.3-1-2.5zm-1.2-2.7.7-.3c.5-.2 1.2.1 1.4.8.2.5.2 1-.5 1.5a4.4 4.4 0 0 1-.6.3l-1-2.3m7.3-2.5-.9.3h-.8l1.3 6.1 4.3-.8-.2-.4v-.4l-2.5.6-1.2-5.3m8.4 5.2c.8-2.2 1.7-4.3 2.7-6.4a5.3 5.3 0 0 1-1 0 54.8 54.8 0 0 1-1.8 4.6l-2.4-4.3-1 .1h-1a131.4 131.4 0 0 1 3.5 6h1m8.8-4.7.4-.9a3.4 3.4 0 0 0-1.7-.6c-1.7-.1-2.7.6-2.8 1.7-.2 2.1 3.2 2 3 3.4 0 .6-.7.9-1.4.8-.8 0-1.4-.5-1.4-1.2h-.3a7.3 7.3 0 0 1-.4 1.1 4 4 0 0 0 1.8.6c1.7.2 3-.5 3.2-1.7.2-2-3.3-2.1-3.1-3.4 0-.5.4-.8 1.3-.7.7 0 1 .4 1.2.9h.2");
    			add_location(path123, file$9, 511, 1, 19690);
    			attr_dev(path124, "fill", "#ad1519");
    			attr_dev(path124, "d", "M277.9 211.6s-.7.8-1.3.9c-.5 0-1.1-.5-1.1-.5s-.5.5-1 .6c-.6.1-1.4-.6-1.4-.6l-1 1c-.6 0-1.1-.3-1.1-.3s-.3.4-.7.6h-.4l-.6-.4-.7-.7-.5-.3-.4-1v-.5c-.1-.6.8-1.4 2.2-1.7a3.9 3.9 0 0 1 2 0c.5-.5 1.7-.8 3-.8s2.4.3 3 .7a5.5 5.5 0 0 1 2.9-.7c1.3 0 2.5.3 3 .8.5-.2 1.2-.2 2 0 1.4.3 2.3 1 2.2 1.7v.5l-.4 1-.6.3-.6.7-.6.3s-.3.2-.4 0c-.4-.1-.7-.5-.7-.5s-.6.4-1 .2c-.5-.2-1-1-1-1s-.9.8-1.4.7c-.6-.1-1-.6-1-.6s-.7.6-1.2.5c-.5-.1-1.2-.9-1.2-.9");
    			add_location(path124, file$9, 515, 1, 20278);
    			attr_dev(path125, "fill", "none");
    			attr_dev(path125, "stroke", "#000");
    			attr_dev(path125, "stroke-width", ".3");
    			attr_dev(path125, "d", "M277.9 211.6s-.7.8-1.3.9c-.5 0-1.1-.5-1.1-.5s-.5.5-1 .6c-.6.1-1.4-.6-1.4-.6l-1 1c-.6 0-1.1-.3-1.1-.3s-.3.4-.7.6h-.4l-.6-.4-.7-.7-.5-.3-.4-1v-.5c-.1-.6.8-1.4 2.2-1.7a3.9 3.9 0 0 1 2 0c.5-.5 1.7-.8 3-.8s2.4.3 3 .7a5.5 5.5 0 0 1 2.9-.7c1.3 0 2.5.3 3 .8.5-.2 1.2-.2 2 0 1.4.3 2.3 1 2.2 1.7v.5l-.4 1-.6.3-.6.7-.6.3s-.3.2-.4 0c-.4-.1-.7-.5-.7-.5s-.6.4-1 .2c-.5-.2-1-1-1-1s-.9.8-1.4.7c-.6-.1-1-.6-1-.6s-.7.6-1.2.5c-.5-.1-1.2-.9-1.2-.9z");
    			add_location(path125, file$9, 519, 1, 20740);
    			attr_dev(path126, "fill", "#c8b100");
    			attr_dev(path126, "d", "M276.5 207.6c0-1 .6-2 1.3-2 .8 0 1.3 1 1.3 2s-.5 1.8-1.3 1.8c-.7 0-1.3-.8-1.3-1.9");
    			add_location(path126, file$9, 525, 1, 21236);
    			attr_dev(path127, "fill", "none");
    			attr_dev(path127, "stroke", "#000");
    			attr_dev(path127, "stroke-width", ".3");
    			attr_dev(path127, "d", "M276.5 207.6c0-1 .6-2 1.3-2 .8 0 1.3 1 1.3 2s-.5 1.8-1.3 1.8c-.7 0-1.3-.8-1.3-1.9z");
    			add_location(path127, file$9, 529, 1, 21352);
    			attr_dev(path128, "fill", "#c8b100");
    			attr_dev(path128, "d", "M277.3 207.6c0-1 .2-1.8.5-1.8.4 0 .7.8.7 1.8s-.3 1.7-.6 1.7c-.4 0-.6-.8-.6-1.8");
    			add_location(path128, file$9, 535, 1, 21502);
    			attr_dev(path129, "fill", "none");
    			attr_dev(path129, "stroke", "#000");
    			attr_dev(path129, "stroke-width", ".3");
    			attr_dev(path129, "d", "M277.3 207.6c0-1 .2-1.8.5-1.8.4 0 .7.8.7 1.8s-.3 1.7-.6 1.7c-.4 0-.6-.8-.6-1.8z");
    			add_location(path129, file$9, 539, 1, 21615);
    			attr_dev(path130, "fill", "#c8b100");
    			attr_dev(path130, "d", "M271 215.3a4.5 4.5 0 0 0-.5-1 27.4 27.4 0 0 1 14.8 0l-.6.8a5.2 5.2 0 0 0-.3.8 22.9 22.9 0 0 0-6.6-.8c-2.6 0-5.2.3-6.6.8l-.2-.6");
    			add_location(path130, file$9, 545, 1, 21762);
    			attr_dev(path131, "fill", "none");
    			attr_dev(path131, "stroke", "#000");
    			attr_dev(path131, "stroke-width", ".3");
    			attr_dev(path131, "d", "M271 215.3a4.5 4.5 0 0 0-.5-1 27.4 27.4 0 0 1 14.8 0l-.6.8a5.2 5.2 0 0 0-.3.8 22.9 22.9 0 0 0-6.6-.8c-2.6 0-5.2.3-6.6.8l-.2-.6");
    			add_location(path131, file$9, 549, 1, 21923);
    			attr_dev(path132, "fill", "#c8b100");
    			attr_dev(path132, "d", "M277.8 217.7c2.4 0 5-.4 5.9-.6.6-.2 1-.5 1-.8 0-.2-.2-.3-.4-.4a24.1 24.1 0 0 0-6.5-.8c-2.5 0-5 .3-6.4.8-.2 0-.3.2-.4.3 0 .4.3.7 1 .9 1 .2 3.5.6 5.8.6");
    			add_location(path132, file$9, 555, 1, 22117);
    			attr_dev(path133, "fill", "none");
    			attr_dev(path133, "stroke", "#000");
    			attr_dev(path133, "stroke-width", ".3");
    			attr_dev(path133, "d", "M277.8 217.7c2.4 0 5-.4 5.9-.6.6-.2 1-.5 1-.8 0-.2-.2-.3-.4-.4a24.1 24.1 0 0 0-6.5-.8c-2.5 0-5 .3-6.4.8-.2 0-.3.2-.4.3 0 .4.3.7 1 .9 1 .2 3.5.6 5.8.6z");
    			add_location(path133, file$9, 559, 1, 22301);
    			attr_dev(path134, "fill", "#fff");
    			attr_dev(path134, "d", "M283.5 208.4c0-.2.2-.4.4-.4s.5.2.5.4-.2.4-.5.4a.4.4 0 0 1-.4-.4");
    			add_location(path134, file$9, 565, 1, 22519);
    			attr_dev(path135, "fill", "none");
    			attr_dev(path135, "stroke", "#000");
    			attr_dev(path135, "stroke-width", ".2");
    			attr_dev(path135, "d", "M283.5 208.4c0-.2.2-.4.4-.4s.5.2.5.4-.2.4-.5.4a.4.4 0 0 1-.4-.4zm-.2-1.4a.4.4 0 0 1 .4-.4c.2 0 .4.1.4.4s-.2.4-.4.4a.4.4 0 0 1-.4-.4zm-1.1-1c0-.2.2-.3.4-.3s.4.1.4.4c0 .2-.2.4-.4.4a.4.4 0 0 1-.4-.5zm-1.4-.4c0-.2.2-.4.4-.4.3 0 .5.2.5.4s-.2.4-.4.4-.5-.2-.5-.4zm-1.4 0c0-.2.2-.3.5-.3s.4.1.4.4c0 .2-.2.4-.4.4a.4.4 0 0 1-.5-.4z");
    			add_location(path135, file$9, 566, 1, 22609);
    			attr_dev(path136, "fill", "none");
    			attr_dev(path136, "stroke", "#000");
    			attr_dev(path136, "stroke-linecap", "round");
    			attr_dev(path136, "stroke-width", ".3");
    			attr_dev(path136, "d", "m287.8 211.2.2-1a2.7 2.7 0 0 0-2.7-2.8c-.5 0-1 .1-1.3.3");
    			add_location(path136, file$9, 572, 1, 22997);
    			attr_dev(path137, "fill", "none");
    			attr_dev(path137, "stroke", "#000");
    			attr_dev(path137, "stroke-width", ".3");
    			attr_dev(path137, "d", "m283 209.2.2-.8c0-1.1-1.1-2-2.5-2-.6 0-1.2.2-1.6.4");
    			add_location(path137, file$9, 579, 1, 23145);
    			attr_dev(path138, "fill", "none");
    			attr_dev(path138, "stroke", "#000");
    			attr_dev(path138, "stroke-width", ".2");
    			attr_dev(path138, "d", "M288.2 210c0-.3.2-.5.4-.5s.4.2.4.4c0 .3-.2.4-.4.4s-.4-.1-.4-.4zm-.2-1.6c0-.2.2-.4.4-.4a.4.4 0 0 1 .5.4c0 .2-.2.4-.4.4-.3 0-.5-.2-.5-.4zm-1-1.1a.4.4 0 0 1 .5-.4c.2 0 .4.1.4.4a.4.4 0 0 1-.4.4.4.4 0 0 1-.5-.4zm-1.3-.7c0-.2.2-.4.5-.4s.4.2.4.4c0 .3-.2.5-.4.5a.4.4 0 0 1-.5-.5zm-1.4.1c0-.2.2-.4.5-.4s.4.2.4.4-.2.4-.4.4-.5-.2-.5-.4z");
    			add_location(path138, file$9, 585, 1, 23263);
    			attr_dev(path139, "fill", "#c8b100");
    			attr_dev(path139, "d", "m285.3 213.2-.5-.5s-.6.3-1.3.2c-.6 0-.9-1-.9-1s-.7.7-1.3.7c-.7 0-1-.6-1-.6s-.7.5-1.3.4c-.6 0-1.2-.8-1.2-.8s-.6.8-1.2.8c-.6.1-1-.5-1-.5s-.3.6-1.1.7-1.4-.6-1.4-.6-.4.7-1 1c-.5 0-1.2-.4-1.2-.4l-.1.5-.3.1.1.5a27 27 0 0 1 7.3-.9c2.8 0 5.4.4 7.3 1l.2-.6");
    			add_location(path139, file$9, 591, 1, 23656);
    			attr_dev(path140, "fill", "none");
    			attr_dev(path140, "stroke", "#000");
    			attr_dev(path140, "stroke-width", ".3");
    			attr_dev(path140, "d", "m285.3 213.2-.5-.5s-.6.3-1.3.2c-.6 0-.9-1-.9-1s-.7.7-1.3.7c-.7 0-1-.6-1-.6s-.7.5-1.3.4c-.6 0-1.2-.8-1.2-.8s-.6.8-1.2.8c-.6.1-1-.5-1-.5s-.3.6-1.1.7-1.4-.6-1.4-.6-.4.7-1 1c-.5 0-1.2-.4-1.2-.4l-.1.5-.3.1.1.5a27 27 0 0 1 7.3-.9c2.8 0 5.4.4 7.3 1l.2-.6z");
    			add_location(path140, file$9, 595, 1, 23938);
    			attr_dev(path141, "fill", "#fff");
    			attr_dev(path141, "d", "M271.3 208.4c0-.2.2-.4.4-.4s.4.2.4.4a.4.4 0 0 1-.4.4.4.4 0 0 1-.4-.4");
    			add_location(path141, file$9, 601, 1, 24254);
    			attr_dev(path142, "fill", "none");
    			attr_dev(path142, "stroke", "#000");
    			attr_dev(path142, "stroke-width", ".2");
    			attr_dev(path142, "d", "M271.3 208.4c0-.2.2-.4.4-.4s.4.2.4.4a.4.4 0 0 1-.4.4.4.4 0 0 1-.4-.4zm.2-1.4c0-.3.2-.4.4-.4s.5.1.5.4-.2.4-.5.4a.4.4 0 0 1-.4-.4zm1-1c0-.2.3-.3.5-.3s.5.1.5.4c0 .2-.2.4-.5.4a.4.4 0 0 1-.4-.5zm1.4-.4c0-.2.2-.4.5-.4s.4.2.4.4-.2.4-.4.4-.5-.2-.5-.4zm1.4 0c0-.2.2-.3.5-.3.2 0 .4.1.4.4 0 .2-.2.4-.4.4a.4.4 0 0 1-.5-.4z");
    			add_location(path142, file$9, 602, 1, 24349);
    			attr_dev(path143, "fill", "none");
    			attr_dev(path143, "stroke", "#000");
    			attr_dev(path143, "stroke-linecap", "round");
    			attr_dev(path143, "stroke-width", ".3");
    			attr_dev(path143, "d", "M267.8 211.2a2.8 2.8 0 0 1-.2-1 2.7 2.7 0 0 1 2.7-2.8c.5 0 1 .1 1.4.3");
    			add_location(path143, file$9, 608, 1, 24727);
    			attr_dev(path144, "fill", "none");
    			attr_dev(path144, "stroke", "#000");
    			attr_dev(path144, "stroke-width", ".3");
    			attr_dev(path144, "d", "M272.7 209.2a1.7 1.7 0 0 1-.3-.8c0-1 1.2-2 2.6-2a3 3 0 0 1 1.5.4");
    			add_location(path144, file$9, 615, 1, 24889);
    			attr_dev(path145, "fill", "none");
    			attr_dev(path145, "stroke", "#000");
    			attr_dev(path145, "stroke-width", ".2");
    			attr_dev(path145, "d", "M266.6 210c0-.3.2-.5.4-.5.3 0 .4.2.4.4a.4.4 0 0 1-.4.4c-.2 0-.4-.1-.4-.4zm.1-1.6c0-.2.3-.4.5-.4s.4.2.4.4-.2.4-.4.4-.4-.2-.4-.4zm1-1.1c0-.3.2-.4.5-.4a.4.4 0 0 1 .4.4.4.4 0 0 1-.4.4.4.4 0 0 1-.5-.4zm1.3-.7c0-.2.2-.4.5-.4.2 0 .4.2.4.4 0 .3-.2.5-.4.5a.4.4 0 0 1-.5-.5zm1.4.1c0-.2.2-.4.5-.4a.4.4 0 0 1 .4.4.4.4 0 0 1-.4.4c-.3 0-.5-.2-.5-.4z");
    			add_location(path145, file$9, 621, 1, 25021);
    			attr_dev(path146, "fill", "#c8b100");
    			attr_dev(path146, "d", "M277.9 210.7h.2a1 1 0 0 0 0 .4c0 .6.5 1 1 1a1 1 0 0 0 1-.7l.2-.3v.4c.1.5.6.8 1.1.8.6 0 1-.4 1-1a.7.7 0 0 0 0-.1l.4-.4.2.5a1 1 0 0 0-.1.4 1 1 0 0 0 1 1c.4 0 .7-.2.9-.5l.2-.2v.3c0 .3.1.6.4.7 0 0 .4 0 1-.4s.7-.7.7-.7v.4s-.5.8-1 1c-.2.2-.5.4-.8.3-.3 0-.6-.3-.7-.6a1.5 1.5 0 0 1-.7.2c-.6 0-1.2-.3-1.4-.8a1.5 1.5 0 0 1-1.1.5c-.5 0-1-.2-1.2-.6a1.5 1.5 0 0 1-1 .4c-.6 0-1-.2-1.4-.6-.2.4-.7.6-1.2.6-.4 0-.8-.1-1-.4a1.6 1.6 0 0 1-1.3.6c-.4 0-.8-.2-1.1-.5-.2.5-.8.8-1.4.8-.2 0-.5 0-.7-.2-.1.3-.4.6-.7.6-.3 0-.6 0-.9-.2a4.2 4.2 0 0 1-1-1l.1-.5.8.7c.5.4.9.4.9.4.3 0 .4-.4.4-.7v-.3l.2.2c.2.3.5.5.9.5a1 1 0 0 0 1-1 1 1 0 0 0 0-.4v-.5l.4.4v.1c0 .6.5 1 1 1 .6 0 1-.3 1.1-.9v-.3l.2.3c.2.4.6.7 1 .7.6 0 1.1-.4 1.1-1a1 1 0 0 0 0-.3h.2");
    			add_location(path146, file$9, 627, 1, 25424);
    			attr_dev(path147, "fill", "none");
    			attr_dev(path147, "stroke", "#000");
    			attr_dev(path147, "stroke-width", ".3");
    			attr_dev(path147, "d", "M277.9 210.7h.2a1 1 0 0 0 0 .4c0 .6.5 1 1 1a1 1 0 0 0 1-.7l.2-.3v.4c.1.5.6.8 1.1.8.6 0 1-.4 1-1a.7.7 0 0 0 0-.1l.4-.4.2.5a1 1 0 0 0-.1.4 1 1 0 0 0 1 1c.4 0 .7-.2.9-.5l.2-.2v.3c0 .3.1.6.4.7 0 0 .4 0 1-.4s.7-.7.7-.7v.4s-.5.8-1 1c-.2.2-.5.4-.8.3-.3 0-.6-.3-.7-.6a1.5 1.5 0 0 1-.7.2c-.6 0-1.2-.3-1.4-.8a1.5 1.5 0 0 1-1.1.5c-.5 0-1-.2-1.2-.6a1.5 1.5 0 0 1-1 .4c-.6 0-1-.2-1.4-.6-.2.4-.7.6-1.2.6-.4 0-.8-.1-1-.4a1.6 1.6 0 0 1-1.3.6c-.4 0-.8-.2-1.1-.5-.2.5-.8.8-1.4.8-.2 0-.5 0-.7-.2-.1.3-.4.6-.7.6-.3 0-.6 0-.9-.2a4.2 4.2 0 0 1-1-1l.1-.5.8.7c.5.4.9.4.9.4.3 0 .4-.4.4-.7v-.3l.2.2c.2.3.5.5.9.5a1 1 0 0 0 1-1 1 1 0 0 0 0-.4v-.5l.4.4v.1c0 .6.5 1 1 1 .6 0 1-.3 1.1-.9v-.3l.2.3c.2.4.6.7 1 .7.6 0 1.1-.4 1.1-1a1 1 0 0 0 0-.3h.2z");
    			add_location(path147, file$9, 631, 1, 26173);
    			attr_dev(path148, "fill", "#c8b100");
    			attr_dev(path148, "d", "M277.8 213.3c-2.9 0-5.5.4-7.3 1l-.3-.2.1-.3c2-.6 4.6-1 7.5-1 3 0 5.7.4 7.6 1 0 0 .2.2.1.3l-.3.2a27 27 0 0 0-7.4-1");
    			add_location(path148, file$9, 637, 1, 26956);
    			attr_dev(path149, "fill", "none");
    			attr_dev(path149, "stroke", "#000");
    			attr_dev(path149, "stroke-width", ".3");
    			attr_dev(path149, "d", "M277.8 213.3c-2.9 0-5.5.4-7.3 1l-.3-.2.1-.3c2-.6 4.6-1 7.5-1 3 0 5.7.4 7.6 1 0 0 .2.2.1.3l-.3.2a27 27 0 0 0-7.4-1z");
    			add_location(path149, file$9, 641, 1, 27104);
    			attr_dev(path150, "fill", "#fff");
    			attr_dev(path150, "d", "M275 214.4c0-.3.2-.4.5-.4a.4.4 0 0 1 .4.4.4.4 0 0 1-.4.4c-.3 0-.5-.2-.5-.4");
    			add_location(path150, file$9, 647, 1, 27286);
    			attr_dev(path151, "fill", "none");
    			attr_dev(path151, "stroke", "#000");
    			attr_dev(path151, "stroke-width", ".3");
    			attr_dev(path151, "d", "M275 214.4c0-.3.2-.4.5-.4a.4.4 0 0 1 .4.4.4.4 0 0 1-.4.4c-.3 0-.5-.2-.5-.4z");
    			add_location(path151, file$9, 651, 1, 27392);
    			attr_dev(path152, "fill", "#ad1519");
    			attr_dev(path152, "d", "M277.9 214.5h-1c-.1 0-.3 0-.3-.3l.3-.3h2a.3.3 0 0 1 .2.3.3.3 0 0 1-.3.3h-1");
    			add_location(path152, file$9, 657, 1, 27535);
    			attr_dev(path153, "fill", "none");
    			attr_dev(path153, "stroke", "#000");
    			attr_dev(path153, "stroke-width", ".3");
    			attr_dev(path153, "d", "M277.9 214.5h-1c-.1 0-.3 0-.3-.3l.3-.3h2a.3.3 0 0 1 .2.3.3.3 0 0 1-.3.3h-1");
    			add_location(path153, file$9, 661, 1, 27644);
    			attr_dev(path154, "fill", "#058e6e");
    			attr_dev(path154, "d", "M273.2 214.9h-.6a.3.3 0 0 1-.4-.2.3.3 0 0 1 .3-.3l.6-.1.7-.1c.2 0 .3 0 .4.2a.3.3 0 0 1-.3.4h-.7");
    			add_location(path154, file$9, 667, 1, 27786);
    			attr_dev(path155, "fill", "none");
    			attr_dev(path155, "stroke", "#000");
    			attr_dev(path155, "stroke-width", ".3");
    			attr_dev(path155, "d", "M273.2 214.9h-.6a.3.3 0 0 1-.4-.2.3.3 0 0 1 .3-.3l.6-.1.7-.1c.2 0 .3 0 .4.2a.3.3 0 0 1-.3.4h-.7");
    			add_location(path155, file$9, 671, 1, 27916);
    			attr_dev(path156, "fill", "#ad1519");
    			attr_dev(path156, "d", "m270.5 215.3.3-.4h.7l-.4.6-.6-.2");
    			add_location(path156, file$9, 677, 1, 28079);
    			attr_dev(path157, "fill", "none");
    			attr_dev(path157, "stroke", "#000");
    			attr_dev(path157, "stroke-width", ".3");
    			attr_dev(path157, "d", "m270.5 215.3.3-.4h.7l-.4.6-.6-.2");
    			add_location(path157, file$9, 678, 1, 28141);
    			attr_dev(path158, "fill", "#fff");
    			attr_dev(path158, "d", "M279.8 214.4c0-.3.2-.4.4-.4.3 0 .5.1.5.4 0 .2-.2.4-.5.4a.4.4 0 0 1-.4-.4");
    			add_location(path158, file$9, 679, 1, 28232);
    			attr_dev(path159, "fill", "none");
    			attr_dev(path159, "stroke", "#000");
    			attr_dev(path159, "stroke-width", ".3");
    			attr_dev(path159, "d", "M279.8 214.4c0-.3.2-.4.4-.4.3 0 .5.1.5.4 0 .2-.2.4-.5.4a.4.4 0 0 1-.4-.4z");
    			add_location(path159, file$9, 680, 1, 28331);
    			attr_dev(path160, "fill", "#058e6e");
    			attr_dev(path160, "d", "M282.5 214.9h.7a.3.3 0 0 0 .3-.2.3.3 0 0 0-.2-.3l-.7-.1-.7-.1c-.2 0-.3 0-.4.2 0 .2.1.3.3.4h.7");
    			add_location(path160, file$9, 686, 1, 28472);
    			attr_dev(path161, "fill", "none");
    			attr_dev(path161, "stroke", "#000");
    			attr_dev(path161, "stroke-width", ".3");
    			attr_dev(path161, "d", "M282.5 214.9h.7a.3.3 0 0 0 .3-.2.3.3 0 0 0-.2-.3l-.7-.1-.7-.1c-.2 0-.3 0-.4.2 0 .2.1.3.3.4h.7");
    			add_location(path161, file$9, 690, 1, 28600);
    			attr_dev(path162, "fill", "#ad1519");
    			attr_dev(path162, "d", "m285.1 215.4-.2-.5h-.7l.3.6.6-.1");
    			add_location(path162, file$9, 696, 1, 28761);
    			attr_dev(path163, "fill", "none");
    			attr_dev(path163, "stroke", "#000");
    			attr_dev(path163, "stroke-width", ".3");
    			attr_dev(path163, "d", "m285.1 215.4-.2-.5h-.7l.3.6.6-.1");
    			add_location(path163, file$9, 697, 1, 28823);
    			attr_dev(path164, "fill", "#ad1519");
    			attr_dev(path164, "d", "M277.8 217.1a25 25 0 0 1-6-.6 25.4 25.4 0 0 1 6-.7c2.4 0 4.5.3 6.1.7-1.6.4-3.7.6-6 .6");
    			add_location(path164, file$9, 698, 1, 28914);
    			attr_dev(path165, "fill", "none");
    			attr_dev(path165, "stroke", "#000");
    			attr_dev(path165, "stroke-linejoin", "round");
    			attr_dev(path165, "stroke-width", ".3");
    			attr_dev(path165, "d", "M277.8 217.1a25 25 0 0 1-6-.6 25.4 25.4 0 0 1 6-.7c2.4 0 4.5.3 6.1.7-1.6.4-3.7.6-6 .6z");
    			add_location(path165, file$9, 702, 1, 29034);
    			attr_dev(path166, "fill", "#c8b100");
    			attr_dev(path166, "d", "m285.2 212-.1-.3c-.2 0-.3 0-.4.2l.1.4c.2 0 .3 0 .4-.3");
    			add_location(path166, file$9, 709, 1, 29214);
    			attr_dev(path167, "fill", "none");
    			attr_dev(path167, "stroke", "#000");
    			attr_dev(path167, "stroke-width", ".3");
    			attr_dev(path167, "d", "m285.2 212-.1-.3c-.2 0-.3 0-.4.2l.1.4c.2 0 .3 0 .4-.3z");
    			add_location(path167, file$9, 710, 1, 29297);
    			attr_dev(path168, "fill", "#c8b100");
    			attr_dev(path168, "d", "M280.6 211.2c0-.2-.1-.4-.3-.4 0 0-.2.1-.2.3 0 .2 0 .4.2.4l.3-.3");
    			add_location(path168, file$9, 716, 1, 29419);
    			attr_dev(path169, "fill", "none");
    			attr_dev(path169, "stroke", "#000");
    			attr_dev(path169, "stroke-width", ".3");
    			attr_dev(path169, "d", "M280.6 211.2c0-.2-.1-.4-.3-.4 0 0-.2.1-.2.3 0 .2 0 .4.2.4l.3-.3z");
    			add_location(path169, file$9, 717, 1, 29512);
    			attr_dev(path170, "fill", "#c8b100");
    			attr_dev(path170, "d", "M275.2 211.2c0-.2 0-.4.2-.4l.3.3-.2.4c-.2 0-.3-.2-.3-.3");
    			add_location(path170, file$9, 723, 1, 29644);
    			attr_dev(path171, "fill", "none");
    			attr_dev(path171, "stroke", "#000");
    			attr_dev(path171, "stroke-width", ".3");
    			attr_dev(path171, "d", "M275.2 211.2c0-.2 0-.4.2-.4l.3.3-.2.4c-.2 0-.3-.2-.3-.3z");
    			add_location(path171, file$9, 724, 1, 29729);
    			attr_dev(path172, "fill", "#c8b100");
    			attr_dev(path172, "d", "m270.5 212 .1-.3c.2 0 .3 0 .4.2l-.1.4c-.2 0-.3 0-.4-.3");
    			add_location(path172, file$9, 730, 1, 29853);
    			attr_dev(path173, "fill", "none");
    			attr_dev(path173, "stroke", "#000");
    			attr_dev(path173, "stroke-width", ".3");
    			attr_dev(path173, "d", "m270.5 212 .1-.3c.2 0 .3 0 .4.2l-.1.4c-.2 0-.3 0-.4-.3z");
    			add_location(path173, file$9, 731, 1, 29937);
    			attr_dev(path174, "fill", "#c8b100");
    			attr_dev(path174, "d", "m277.8 208.5-.8.5.6 1.3.2.1.3-.1.6-1.3-.9-.5");
    			add_location(path174, file$9, 737, 1, 30060);
    			attr_dev(path175, "fill", "none");
    			attr_dev(path175, "stroke", "#000");
    			attr_dev(path175, "stroke-width", ".3");
    			attr_dev(path175, "d", "m277.8 208.5-.8.5.6 1.3.2.1.3-.1.6-1.3-.9-.5");
    			add_location(path175, file$9, 738, 1, 30134);
    			attr_dev(path176, "fill", "#c8b100");
    			attr_dev(path176, "d", "m276 210.5.4.5 1.3-.4.1-.2-.1-.2-1.3-.3-.4.6");
    			add_location(path176, file$9, 744, 1, 30246);
    			attr_dev(path177, "fill", "none");
    			attr_dev(path177, "stroke", "#000");
    			attr_dev(path177, "stroke-width", ".3");
    			attr_dev(path177, "d", "m276 210.5.4.5 1.3-.4.1-.2-.1-.2-1.3-.3-.4.6");
    			add_location(path177, file$9, 745, 1, 30320);
    			attr_dev(path178, "fill", "#c8b100");
    			attr_dev(path178, "d", "m279.6 210.5-.3.5-1.3-.4-.1-.2v-.2l1.4-.3.4.6");
    			add_location(path178, file$9, 751, 1, 30432);
    			attr_dev(path179, "fill", "none");
    			attr_dev(path179, "stroke", "#000");
    			attr_dev(path179, "stroke-width", ".3");
    			attr_dev(path179, "d", "m279.6 210.5-.3.5-1.3-.4-.1-.2v-.2l1.4-.3.4.6");
    			add_location(path179, file$9, 752, 1, 30507);
    			attr_dev(path180, "fill", "#c8b100");
    			attr_dev(path180, "d", "m272.5 209-.7.7.9 1 .2.1.2-.1.2-1.3-.8-.3");
    			add_location(path180, file$9, 758, 1, 30620);
    			attr_dev(path181, "fill", "none");
    			attr_dev(path181, "stroke", "#000");
    			attr_dev(path181, "stroke-width", ".3");
    			attr_dev(path181, "d", "m272.5 209-.7.7.9 1 .2.1.2-.1.2-1.3-.8-.3");
    			add_location(path181, file$9, 759, 1, 30691);
    			attr_dev(path182, "fill", "#c8b100");
    			attr_dev(path182, "d", "m271.1 211.2.5.5 1.2-.6v-.2l-.1-.2-1.3-.1-.3.6");
    			add_location(path182, file$9, 760, 1, 30791);
    			attr_dev(path183, "fill", "none");
    			attr_dev(path183, "stroke", "#000");
    			attr_dev(path183, "stroke-width", ".3");
    			attr_dev(path183, "d", "m271.1 211.2.5.5 1.2-.6v-.2l-.1-.2-1.3-.1-.3.6");
    			add_location(path183, file$9, 761, 1, 30867);
    			attr_dev(path184, "fill", "#c8b100");
    			attr_dev(path184, "d", "m274.7 210.5-.3.6h-1.3l-.2-.2.1-.3 1.2-.6.5.5");
    			add_location(path184, file$9, 767, 1, 30981);
    			attr_dev(path185, "fill", "none");
    			attr_dev(path185, "stroke", "#000");
    			attr_dev(path185, "stroke-width", ".3");
    			attr_dev(path185, "d", "m274.7 210.5-.3.6h-1.3l-.2-.2.1-.3 1.2-.6.5.5");
    			add_location(path185, file$9, 768, 1, 31056);
    			attr_dev(path186, "fill", "#c8b100");
    			attr_dev(path186, "d", "M269.8 211.4v.6l-1.4.2-.2-.1v-.2l1-.9.6.4");
    			add_location(path186, file$9, 774, 1, 31169);
    			attr_dev(path187, "fill", "none");
    			attr_dev(path187, "stroke", "#000");
    			attr_dev(path187, "stroke-width", ".3");
    			attr_dev(path187, "d", "M269.8 211.4v.6l-1.4.2-.2-.1v-.2l1-.9.6.4");
    			add_location(path187, file$9, 775, 1, 31240);
    			attr_dev(path188, "fill", "#c8b100");
    			attr_dev(path188, "d", "M272.4 210.9c0-.3.2-.5.5-.5a.5.5 0 0 1 .5.5.5.5 0 0 1-.5.4.5.5 0 0 1-.5-.4");
    			add_location(path188, file$9, 776, 1, 31340);
    			attr_dev(path189, "fill", "none");
    			attr_dev(path189, "stroke", "#000");
    			attr_dev(path189, "stroke-width", ".3");
    			attr_dev(path189, "d", "M272.4 210.9c0-.3.2-.5.5-.5a.5.5 0 0 1 .5.5.5.5 0 0 1-.5.4.5.5 0 0 1-.5-.4z");
    			add_location(path189, file$9, 780, 1, 31449);
    			attr_dev(path190, "fill", "#c8b100");
    			attr_dev(path190, "d", "m283.2 209 .7.7-.9 1-.2.1-.1-.1-.3-1.3.8-.3");
    			add_location(path190, file$9, 786, 1, 31592);
    			attr_dev(path191, "fill", "none");
    			attr_dev(path191, "stroke", "#000");
    			attr_dev(path191, "stroke-width", ".3");
    			attr_dev(path191, "d", "m283.2 209 .7.7-.9 1-.2.1-.1-.1-.3-1.3.8-.3");
    			add_location(path191, file$9, 787, 1, 31665);
    			attr_dev(path192, "fill", "#c8b100");
    			attr_dev(path192, "d", "m284.6 211.2-.5.5-1.2-.6v-.2l.1-.2 1.3-.1.3.6");
    			add_location(path192, file$9, 793, 1, 31776);
    			attr_dev(path193, "fill", "none");
    			attr_dev(path193, "stroke", "#000");
    			attr_dev(path193, "stroke-width", ".3");
    			attr_dev(path193, "d", "m284.6 211.2-.5.5-1.2-.6v-.2l.1-.2 1.3-.1.3.6");
    			add_location(path193, file$9, 794, 1, 31851);
    			attr_dev(path194, "fill", "#c8b100");
    			attr_dev(path194, "d", "m281 210.5.3.6h1.3l.2-.2-.1-.3-1.2-.6-.5.5");
    			add_location(path194, file$9, 800, 1, 31964);
    			attr_dev(path195, "fill", "none");
    			attr_dev(path195, "stroke", "#000");
    			attr_dev(path195, "stroke-width", ".3");
    			attr_dev(path195, "d", "m281 210.5.3.6h1.3l.2-.2-.1-.3-1.2-.6-.5.5");
    			add_location(path195, file$9, 801, 1, 32036);
    			attr_dev(path196, "fill", "#c8b100");
    			attr_dev(path196, "d", "M285.7 211.4v.6l1.4.2.2-.1v-.2l-1-.9-.6.4");
    			add_location(path196, file$9, 807, 1, 32146);
    			attr_dev(path197, "fill", "none");
    			attr_dev(path197, "stroke", "#000");
    			attr_dev(path197, "stroke-width", ".3");
    			attr_dev(path197, "d", "M285.7 211.4v.6l1.4.2.2-.1v-.2l-1-.9-.6.4");
    			add_location(path197, file$9, 808, 1, 32217);
    			attr_dev(path198, "fill", "#c8b100");
    			attr_dev(path198, "d", "M277.4 210.4c0-.2.2-.4.5-.4.2 0 .4.2.4.4 0 .3-.2.5-.4.5a.5.5 0 0 1-.5-.5");
    			add_location(path198, file$9, 809, 1, 32317);
    			attr_dev(path199, "fill", "none");
    			attr_dev(path199, "stroke", "#000");
    			attr_dev(path199, "stroke-width", ".3");
    			attr_dev(path199, "d", "M277.4 210.4c0-.2.2-.4.5-.4.2 0 .4.2.4.4 0 .3-.2.5-.4.5a.5.5 0 0 1-.5-.5z");
    			add_location(path199, file$9, 813, 1, 32424);
    			attr_dev(path200, "fill", "#c8b100");
    			attr_dev(path200, "d", "M282.3 210.9c0-.3.3-.5.5-.5.3 0 .5.2.5.5s-.2.4-.5.4a.5.5 0 0 1-.5-.4");
    			add_location(path200, file$9, 819, 1, 32565);
    			attr_dev(path201, "fill", "none");
    			attr_dev(path201, "stroke", "#000");
    			attr_dev(path201, "stroke-width", ".3");
    			attr_dev(path201, "d", "M282.3 210.9c0-.3.3-.5.5-.5.3 0 .5.2.5.5s-.2.4-.5.4a.5.5 0 0 1-.5-.4z");
    			add_location(path201, file$9, 820, 1, 32663);
    			attr_dev(path202, "fill", "#c8b100");
    			attr_dev(path202, "d", "M277 205.4c0-.5.4-.8.8-.8s1 .3 1 .8-.5.8-1 .8a.9.9 0 0 1-.8-.8");
    			add_location(path202, file$9, 826, 1, 32800);
    			attr_dev(path203, "fill", "#c8b100");
    			attr_dev(path203, "d", "M278.5 205.1v.6H277v-.6h.4v-1.3h-.5v-.5h.5v-.6h.6v.6h.6v.6h-.6v1.2h.4");
    			add_location(path203, file$9, 827, 1, 32892);
    			attr_dev(path204, "fill", "none");
    			attr_dev(path204, "stroke", "#000");
    			attr_dev(path204, "stroke-width", ".3");
    			attr_dev(path204, "d", "M278.5 205.1v.6H277v-.6h.4v-1.3h-.5v-.5h.5v-.6h.6v.6h.6v.6h-.6v1.2h.4z");
    			add_location(path204, file$9, 828, 1, 32991);
    			attr_dev(path205, "fill", "#c8b100");
    			attr_dev(path205, "d", "M279 205.1v.6h-2.4v-.6h1v-1.3h-.7v-.5h.6v-.6h.6v.6h.6v.6h-.6v1.2h1");
    			add_location(path205, file$9, 834, 1, 33129);
    			attr_dev(path206, "fill", "none");
    			attr_dev(path206, "stroke", "#000");
    			attr_dev(path206, "stroke-width", ".3");
    			attr_dev(path206, "d", "M278.1 204.6c.4 0 .6.4.6.8 0 .5-.4.8-.9.8a.9.9 0 0 1-.8-.8c0-.4.2-.7.6-.8");
    			add_location(path206, file$9, 835, 1, 33225);
    			attr_dev(path207, "fill", "#c8b100");
    			attr_dev(path207, "d", "m268 212.2-.6-.7a2.3 2.3 0 0 0-.7-.3c0-.1.3-.3.6-.3.2 0 .3 0 .4.2v-.2s.3 0 .4.3v1");
    			add_location(path207, file$9, 841, 1, 33366);
    			attr_dev(path208, "fill", "none");
    			attr_dev(path208, "stroke", "#000");
    			attr_dev(path208, "stroke-width", ".3");
    			attr_dev(path208, "d", "m268 212.2-.6-.7a2.3 2.3 0 0 0-.7-.3c0-.1.3-.3.6-.3.2 0 .3 0 .4.2v-.2s.3 0 .4.3v1z");
    			add_location(path208, file$9, 845, 1, 33482);
    			attr_dev(path209, "fill", "#c8b100");
    			attr_dev(path209, "d", "M268 212c.1-.2.4-.2.5 0 .2.1.3.3.1.5l-.5-.1c-.1-.1-.2-.4 0-.5");
    			add_location(path209, file$9, 851, 1, 33632);
    			attr_dev(path210, "fill", "none");
    			attr_dev(path210, "stroke", "#000");
    			attr_dev(path210, "stroke-width", ".3");
    			attr_dev(path210, "d", "M268 212c.1-.2.4-.2.5 0 .2.1.3.3.1.5l-.5-.1c-.1-.1-.2-.4 0-.5z");
    			add_location(path210, file$9, 852, 1, 33723);
    			attr_dev(path211, "fill", "#c8b100");
    			attr_dev(path211, "d", "m287.5 212.2.6-.7c.2-.2.7-.3.7-.3 0-.1-.3-.3-.6-.3a.6.6 0 0 0-.4.2v-.2s-.3 0-.4.3v.7l.1.3");
    			add_location(path211, file$9, 858, 1, 33853);
    			attr_dev(path212, "fill", "none");
    			attr_dev(path212, "stroke", "#000");
    			attr_dev(path212, "stroke-width", ".3");
    			attr_dev(path212, "d", "m287.5 212.2.6-.7c.2-.2.7-.3.7-.3 0-.1-.3-.3-.6-.3a.6.6 0 0 0-.4.2v-.2s-.3 0-.4.3v.7l.1.3z");
    			add_location(path212, file$9, 862, 1, 33977);
    			attr_dev(path213, "fill", "#c8b100");
    			attr_dev(path213, "d", "M287.5 212c-.1-.2-.3-.2-.5 0-.2.1-.2.3-.1.5l.5-.1c.2-.1.2-.4.1-.5");
    			add_location(path213, file$9, 868, 1, 34135);
    			attr_dev(path214, "fill", "none");
    			attr_dev(path214, "stroke", "#000");
    			attr_dev(path214, "stroke-width", ".3");
    			attr_dev(path214, "d", "M287.5 212c-.1-.2-.3-.2-.5 0-.2.1-.2.3-.1.5l.5-.1c.2-.1.2-.4.1-.5z");
    			add_location(path214, file$9, 869, 1, 34230);
    			attr_dev(path215, "fill", "#c8b100");
    			attr_dev(path215, "d", "M267.2 223h21.4v-5.5h-21.4v5.6z");
    			add_location(path215, file$9, 875, 1, 34364);
    			attr_dev(path216, "fill", "none");
    			attr_dev(path216, "stroke", "#000");
    			attr_dev(path216, "stroke-width", ".4");
    			attr_dev(path216, "d", "M267.2 223h21.4v-5.5h-21.4v5.6z");
    			add_location(path216, file$9, 876, 1, 34425);
    			attr_dev(path217, "fill", "#c8b100");
    			attr_dev(path217, "d", "M286.3 226.8a1 1 0 0 0-.4 0h-16.5c.6-.2 1-.7 1-1.2 0-.6-.4-1.1-1-1.3h17-.1c-.6.2-1 .7-1 1.3 0 .5.4 1 1 1.2");
    			add_location(path217, file$9, 877, 1, 34515);
    			attr_dev(path218, "fill", "none");
    			attr_dev(path218, "stroke", "#000");
    			attr_dev(path218, "stroke-linejoin", "round");
    			attr_dev(path218, "stroke-width", ".4");
    			attr_dev(path218, "d", "M286.3 226.8a1 1 0 0 0-.4 0h-16.5c.6-.2 1-.7 1-1.2 0-.6-.4-1.1-1-1.3h17-.1c-.6.2-1 .7-1 1.3 0 .5.4 1 1 1.2z");
    			add_location(path218, file$9, 881, 1, 34656);
    			attr_dev(path219, "fill", "#c8b100");
    			attr_dev(path219, "d", "M269.9 226.8h16c.6 0 1 .3 1 .7 0 .4-.4.8-1 .8h-16c-.6 0-1-.4-1-.8s.5-.8 1-.8");
    			add_location(path219, file$9, 888, 1, 34857);
    			attr_dev(path220, "fill", "none");
    			attr_dev(path220, "stroke", "#000");
    			attr_dev(path220, "stroke-width", ".4");
    			attr_dev(path220, "d", "M269.9 226.8h16c.6 0 1 .3 1 .7 0 .4-.4.8-1 .8h-16c-.6 0-1-.4-1-.8s.5-.8 1-.8z");
    			add_location(path220, file$9, 892, 1, 34968);
    			attr_dev(path221, "fill", "#c8b100");
    			attr_dev(path221, "d", "M269.9 223h16c.6 0 1 .4 1 .7 0 .4-.4.6-1 .6h-16c-.6 0-1-.2-1-.6 0-.3.4-.6 1-.6");
    			add_location(path221, file$9, 898, 1, 35113);
    			attr_dev(path222, "fill", "none");
    			attr_dev(path222, "stroke", "#000");
    			attr_dev(path222, "stroke-width", ".4");
    			attr_dev(path222, "d", "M269.9 223h16c.6 0 1 .4 1 .7 0 .4-.4.6-1 .6h-16c-.6 0-1-.2-1-.6 0-.3.4-.6 1-.6z");
    			add_location(path222, file$9, 902, 1, 35226);
    			attr_dev(path223, "fill", "#005bbf");
    			attr_dev(path223, "d", "M263 317.4c1.4 0 2.7-.3 3.7-.8a8.4 8.4 0 0 1 3.7-.8c1.4 0 2.8.3 3.8.8s2.3.8 3.7.8c1.5 0 2.8-.3 3.8-.8a8.4 8.4 0 0 1 3.6-.8 8 8 0 0 1 3.7.8c1 .5 2.4.8 3.8.8v2.4a8.3 8.3 0 0 1-3.8-.9 8.2 8.2 0 0 0-3.7-.8c-1.4 0-2.7.3-3.6.8-1 .5-2.3.9-3.8.9a8 8 0 0 1-3.7-.9 8.4 8.4 0 0 0-3.8-.8 8.3 8.3 0 0 0-3.7.8c-1 .5-2.3.9-3.8.9v-2.4");
    			add_location(path223, file$9, 908, 1, 35373);
    			attr_dev(path224, "fill", "none");
    			attr_dev(path224, "stroke", "#000");
    			attr_dev(path224, "stroke-width", ".4");
    			attr_dev(path224, "d", "M263 317.4c1.4 0 2.7-.3 3.7-.8a8.4 8.4 0 0 1 3.7-.8c1.4 0 2.8.3 3.8.8s2.3.8 3.7.8c1.5 0 2.8-.3 3.8-.8a8.4 8.4 0 0 1 3.6-.8 8 8 0 0 1 3.7.8c1 .5 2.4.8 3.8.8v2.4a8.3 8.3 0 0 1-3.8-.9 8.2 8.2 0 0 0-3.7-.8c-1.4 0-2.7.3-3.6.8-1 .5-2.3.9-3.8.9a8 8 0 0 1-3.7-.9 8.4 8.4 0 0 0-3.8-.8 8.3 8.3 0 0 0-3.7.8c-1 .5-2.3.9-3.8.9v-2.4z");
    			add_location(path224, file$9, 912, 1, 35726);
    			attr_dev(path225, "fill", "#ccc");
    			attr_dev(path225, "d", "M263 319.8c1.4 0 2.7-.4 3.7-.9s2.3-.8 3.7-.8c1.4 0 2.8.3 3.8.8s2.3.9 3.7.9a8.2 8.2 0 0 0 3.8-.9 8.4 8.4 0 0 1 3.6-.8c1.5 0 2.8.3 3.7.8 1 .5 2.4.9 3.8.9v2.3a8.3 8.3 0 0 1-3.8-.9 8.1 8.1 0 0 0-3.7-.7c-1.4 0-2.7.2-3.6.7-1 .5-2.3.9-3.8.9a7 7 0 0 1-3.7-.9c-1-.4-2.3-.7-3.8-.7a8.3 8.3 0 0 0-3.7.7 8.1 8.1 0 0 1-3.8.9v-2.3");
    			add_location(path225, file$9, 918, 1, 36113);
    			attr_dev(path226, "fill", "none");
    			attr_dev(path226, "stroke", "#000");
    			attr_dev(path226, "stroke-width", ".4");
    			attr_dev(path226, "d", "M263 319.8c1.4 0 2.7-.4 3.7-.9s2.3-.8 3.7-.8c1.4 0 2.8.3 3.8.8s2.3.9 3.7.9a8.2 8.2 0 0 0 3.8-.9 8.4 8.4 0 0 1 3.6-.8c1.5 0 2.8.3 3.7.8 1 .5 2.4.9 3.8.9v2.3a8.3 8.3 0 0 1-3.8-.9 8.1 8.1 0 0 0-3.7-.7c-1.4 0-2.7.2-3.6.7-1 .5-2.3.9-3.8.9a7 7 0 0 1-3.7-.9c-1-.4-2.3-.7-3.8-.7a8.3 8.3 0 0 0-3.7.7 8.1 8.1 0 0 1-3.8.9v-2.3");
    			add_location(path226, file$9, 922, 1, 36460);
    			attr_dev(path227, "fill", "#005bbf");
    			attr_dev(path227, "d", "M263 322c1.4 0 2.7-.2 3.7-.8 1-.4 2.3-.7 3.7-.7 1.4 0 2.8.2 3.8.7s2.3.9 3.7.9a8.2 8.2 0 0 0 3.8-.9 8.4 8.4 0 0 1 3.6-.8 8 8 0 0 1 3.7.8c1 .5 2.4.9 3.8.9v2.3a8.3 8.3 0 0 1-3.8-.9 8.2 8.2 0 0 0-3.7-.7c-1.4 0-2.7.3-3.6.7-1 .6-2.3.9-3.8.9-1.4 0-2.8-.3-3.7-.8a8.4 8.4 0 0 0-3.8-.8 8.3 8.3 0 0 0-3.7.8c-1 .5-2.3.8-3.8.8V322");
    			add_location(path227, file$9, 928, 1, 36843);
    			attr_dev(path228, "fill", "none");
    			attr_dev(path228, "stroke", "#000");
    			attr_dev(path228, "stroke-width", ".4");
    			attr_dev(path228, "d", "M263 322c1.4 0 2.7-.2 3.7-.8 1-.4 2.3-.7 3.7-.7 1.4 0 2.8.2 3.8.7s2.3.9 3.7.9a8.2 8.2 0 0 0 3.8-.9 8.4 8.4 0 0 1 3.6-.8 8 8 0 0 1 3.7.8c1 .5 2.4.9 3.8.9v2.3a8.3 8.3 0 0 1-3.8-.9 8.2 8.2 0 0 0-3.7-.7c-1.4 0-2.7.3-3.6.7-1 .6-2.3.9-3.8.9-1.4 0-2.8-.3-3.7-.8a8.4 8.4 0 0 0-3.8-.8 8.3 8.3 0 0 0-3.7.8c-1 .5-2.3.8-3.8.8V322");
    			add_location(path228, file$9, 932, 1, 37195);
    			attr_dev(path229, "fill", "#ccc");
    			attr_dev(path229, "d", "M263 326.7a8 8 0 0 0 3.7-.8c1-.5 2.3-.8 3.7-.8 1.4 0 2.8.3 3.8.8s2.3.8 3.7.8c1.5 0 2.8-.3 3.8-.9a8.4 8.4 0 0 1 3.6-.7c1.5 0 2.8.3 3.7.8a8.3 8.3 0 0 0 3.8.8v-2.3a8.3 8.3 0 0 1-3.8-.9 8.2 8.2 0 0 0-3.7-.7c-1.4 0-2.7.3-3.6.7-1 .5-2.3.9-3.8.9-1.4 0-2.8-.3-3.7-.8a8.4 8.4 0 0 0-3.8-.8 8.3 8.3 0 0 0-3.7.8c-1 .5-2.3.8-3.8.8v2.3");
    			add_location(path229, file$9, 938, 1, 37580);
    			attr_dev(path230, "fill", "none");
    			attr_dev(path230, "stroke", "#000");
    			attr_dev(path230, "stroke-width", ".4");
    			attr_dev(path230, "d", "M263 326.7a8 8 0 0 0 3.7-.8c1-.5 2.3-.8 3.7-.8 1.4 0 2.8.3 3.8.8s2.3.8 3.7.8c1.5 0 2.8-.3 3.8-.9a8.4 8.4 0 0 1 3.6-.7c1.5 0 2.8.3 3.7.8a8.3 8.3 0 0 0 3.8.8v-2.3a8.3 8.3 0 0 1-3.8-.9 8.2 8.2 0 0 0-3.7-.7c-1.4 0-2.7.3-3.6.7-1 .5-2.3.9-3.8.9-1.4 0-2.8-.3-3.7-.8a8.4 8.4 0 0 0-3.8-.8 8.3 8.3 0 0 0-3.7.8c-1 .5-2.3.8-3.8.8v2.3");
    			add_location(path230, file$9, 942, 1, 37933);
    			attr_dev(path231, "fill", "#005bbf");
    			attr_dev(path231, "d", "M263 329a8.1 8.1 0 0 0 3.7-.8c1-.5 2.3-.8 3.7-.8 1.4 0 2.8.3 3.8.8s2.3.8 3.7.8a8.2 8.2 0 0 0 3.8-.9 8.4 8.4 0 0 1 3.6-.7c1.5 0 2.8.3 3.7.8 1 .5 2.4.8 3.8.8v-2.3a8.3 8.3 0 0 1-3.8-.8 8.2 8.2 0 0 0-3.7-.8 8.4 8.4 0 0 0-3.6.7 8.2 8.2 0 0 1-3.8.9c-1.4 0-2.8-.3-3.7-.8-1-.5-2.3-.8-3.8-.8-1.4 0-2.7.3-3.7.8s-2.3.8-3.8.8v2.3");
    			add_location(path231, file$9, 948, 1, 38322);
    			attr_dev(path232, "fill", "none");
    			attr_dev(path232, "stroke", "#000");
    			attr_dev(path232, "stroke-width", ".4");
    			attr_dev(path232, "d", "M263 329a8.1 8.1 0 0 0 3.7-.8c1-.5 2.3-.8 3.7-.8 1.4 0 2.8.3 3.8.8s2.3.8 3.7.8a8.2 8.2 0 0 0 3.8-.9 8.4 8.4 0 0 1 3.6-.7c1.5 0 2.8.3 3.7.8 1 .5 2.4.8 3.8.8v-2.3a8.3 8.3 0 0 1-3.8-.8 8.2 8.2 0 0 0-3.7-.8 8.4 8.4 0 0 0-3.6.7 8.2 8.2 0 0 1-3.8.9c-1.4 0-2.8-.3-3.7-.8-1-.5-2.3-.8-3.8-.8-1.4 0-2.7.3-3.7.8s-2.3.8-3.8.8v2.3z");
    			add_location(path232, file$9, 952, 1, 38674);
    			attr_dev(path233, "fill", "#c8b100");
    			attr_dev(path233, "d", "m286.3 308-.1.5c0 1.5 1.2 2.6 2.7 2.6h-22c1.5 0 2.7-1.2 2.7-2.6l-.1-.5h16.8");
    			add_location(path233, file$9, 958, 1, 39060);
    			attr_dev(path234, "fill", "none");
    			attr_dev(path234, "stroke", "#000");
    			attr_dev(path234, "stroke-linejoin", "round");
    			attr_dev(path234, "stroke-width", ".4");
    			attr_dev(path234, "d", "m286.3 308-.1.5c0 1.5 1.2 2.6 2.7 2.6h-22c1.5 0 2.7-1.2 2.7-2.6l-.1-.5h16.8z");
    			add_location(path234, file$9, 962, 1, 39170);
    			attr_dev(path235, "fill", "#c8b100");
    			attr_dev(path235, "d", "M269.9 306.5h16c.6 0 1 .3 1 .8 0 .4-.4.7-1 .7h-16c-.6 0-1-.3-1-.8 0-.4.5-.7 1-.7");
    			add_location(path235, file$9, 969, 1, 39340);
    			attr_dev(path236, "fill", "none");
    			attr_dev(path236, "stroke", "#000");
    			attr_dev(path236, "stroke-width", ".4");
    			attr_dev(path236, "d", "M269.9 306.5h16c.6 0 1 .3 1 .8 0 .4-.4.7-1 .7h-16c-.6 0-1-.3-1-.8 0-.4.5-.7 1-.7z");
    			add_location(path236, file$9, 973, 1, 39455);
    			attr_dev(path237, "fill", "#c8b100");
    			attr_dev(path237, "d", "M266.9 316.7h22V311h-22v5.6z");
    			add_location(path237, file$9, 979, 1, 39604);
    			attr_dev(path238, "fill", "none");
    			attr_dev(path238, "stroke", "#000");
    			attr_dev(path238, "stroke-width", ".4");
    			attr_dev(path238, "d", "M266.9 316.7h22V311h-22v5.6z");
    			add_location(path238, file$9, 980, 1, 39662);
    			attr_dev(path239, "fill", "#ad1519");
    			attr_dev(path239, "d", "M290.6 286.7c2.1 1.2 3.6 2.5 3.4 3.2-.1.6-.8 1-1.8 1.6-1.6 1.1-2.5 3-1.8 4a5.5 5.5 0 0 1 .2-8.8");
    			add_location(path239, file$9, 981, 1, 39749);
    			attr_dev(path240, "fill", "none");
    			attr_dev(path240, "stroke", "#000");
    			attr_dev(path240, "stroke-width", ".4");
    			attr_dev(path240, "d", "M290.6 286.7c2.1 1.2 3.6 2.5 3.4 3.2-.1.6-.8 1-1.8 1.6-1.6 1.1-2.5 3-1.8 4a5.5 5.5 0 0 1 .2-8.8z");
    			add_location(path240, file$9, 985, 1, 39879);
    			attr_dev(path241, "fill", "#ccc");
    			attr_dev(path241, "d", "M270.1 305.6h15.6V229h-15.6v76.5z");
    			add_location(path241, file$9, 991, 1, 40043);
    			attr_dev(path242, "fill", "none");
    			attr_dev(path242, "stroke", "#000");
    			attr_dev(path242, "stroke-width", ".4");
    			attr_dev(path242, "d", "M281.4 229.1v76.3m1.8-76.3v76.3m-13 .2h15.5V229h-15.6v76.5z");
    			add_location(path242, file$9, 992, 1, 40103);
    			attr_dev(path243, "fill", "#ad1519");
    			attr_dev(path243, "d", "M254.2 257.7a49.6 49.6 0 0 1 23.3-2c9.3 1.6 16.4 5.3 15.9 8.4v.2l3.5-8.2c.6-3.3-7.3-7.5-17.6-9.2a53.5 53.5 0 0 0-9.2-.7c-6.7 0-12.4.8-15.9 2.1v9.4");
    			add_location(path243, file$9, 998, 1, 40230);
    			attr_dev(path244, "fill", "none");
    			attr_dev(path244, "stroke", "#000");
    			attr_dev(path244, "stroke-linejoin", "round");
    			attr_dev(path244, "stroke-width", ".4");
    			attr_dev(path244, "d", "M254.2 257.7a49.6 49.6 0 0 1 23.3-2c9.3 1.6 16.4 5.3 15.9 8.4v.2l3.5-8.2c.6-3.3-7.3-7.5-17.6-9.2a53.5 53.5 0 0 0-9.2-.7c-6.7 0-12.4.8-15.9 2.1v9.4");
    			add_location(path244, file$9, 1002, 1, 40411);
    			attr_dev(path245, "fill", "#ad1519");
    			attr_dev(path245, "d", "M285.7 267.3c4.4-.3 7.3-1.4 7.7-3.2.2-1.5-1.2-3-3.8-4.5-1.2.1-2.5.3-3.9.3v7.4");
    			add_location(path245, file$9, 1009, 1, 40651);
    			attr_dev(path246, "fill", "none");
    			attr_dev(path246, "stroke", "#000");
    			attr_dev(path246, "stroke-width", ".4");
    			attr_dev(path246, "d", "M285.7 267.3c4.4-.3 7.3-1.4 7.7-3.2.2-1.5-1.2-3-3.8-4.5-1.2.1-2.5.3-3.9.3v7.4");
    			add_location(path246, file$9, 1013, 1, 40763);
    			attr_dev(path247, "fill", "#ad1519");
    			attr_dev(path247, "d", "M270 261.5a13 13 0 0 0-5.7 1.9v.2c-.5 1 1.8 3 5.8 5.4v-7.5");
    			add_location(path247, file$9, 1019, 1, 40908);
    			attr_dev(path248, "fill", "none");
    			attr_dev(path248, "stroke", "#000");
    			attr_dev(path248, "stroke-width", ".4");
    			attr_dev(path248, "d", "M270 261.5a13 13 0 0 0-5.7 1.9v.2c-.5 1 1.8 3 5.8 5.4v-7.5");
    			add_location(path248, file$9, 1020, 1, 40996);
    			attr_dev(path249, "fill", "#ad1519");
    			attr_dev(path249, "d", "M295.4 282c.4-1.2-3.8-3.6-9.7-5.8-2.8-1-5-2-7.8-3.2-8.3-3.7-14.4-7.9-13.6-9.4v-.2c-.4.4-1 8-1 8-.8 1.3 4.8 5.5 12.4 9.1 2.4 1.2 7.6 3 10 4 4.3 1.4 8.7 4.3 8.3 5.3l1.4-7.7");
    			add_location(path249, file$9, 1026, 1, 41122);
    			attr_dev(path250, "fill", "none");
    			attr_dev(path250, "stroke", "#000");
    			attr_dev(path250, "stroke-linejoin", "round");
    			attr_dev(path250, "stroke-width", ".4");
    			attr_dev(path250, "d", "M295.4 282c.4-1.2-3.8-3.6-9.7-5.8-2.8-1-5-2-7.8-3.2-8.3-3.7-14.4-7.9-13.6-9.4v-.2c-.4.4-1 8-1 8-.8 1.3 4.8 5.5 12.4 9.1 2.4 1.2 7.6 3 10 4 4.3 1.4 8.7 4.3 8.3 5.3l1.4-7.7z");
    			add_location(path250, file$9, 1030, 1, 41327);
    			attr_dev(path251, "fill", "#c8b100");
    			attr_dev(path251, "d", "M263.9 254.4c.6-2.3 1.4-4.4 2.1-6.6h-.5a5.2 5.2 0 0 1-.5.1 52.8 52.8 0 0 1-1.4 4.8c-1-1.4-2-2.7-2.7-4.1l-1 .2h-1a131.3 131.3 0 0 1 4 5.7h.5l.5-.1m6-6.6h-1a8 8 0 0 1-.8 0v6.2h4.2v-.7h-2.6l.1-5.5m6.8 1 2 .3v-.7l-5.8-.5v.8a19.3 19.3 0 0 1 2 0l-.4 5.6h1.6l.5-5.4m2.4 6c.3 0 .5 0 .8.2l.8.2.7-2.9.6 1.2.8 2.1 1 .2c.4 0 .7.2 1 .3l-.3-.7c-.4-1-1-1.9-1.3-2.9 1 0 1.9-.3 2.1-1.2.1-.6 0-1-.7-1.5-.4-.3-1.2-.4-1.7-.5l-2.4-.5-1.4 6m3-5.2c.7.2 1.5.3 1.5 1v.5c-.3.9-1 1.2-2 .9l.5-2.4m8 7-.2 2 .8.5.9.5.5-7a3.4 3.4 0 0 1-.7-.3l-6.1 3.8.5.3.4.2 1.7-1.2 2.3 1.3zm-1.7-1.5 2-1.4-.2 2.3-1.8-1");
    			add_location(path251, file$9, 1037, 1, 41592);
    			attr_dev(path252, "fill", "none");
    			attr_dev(path252, "stroke", "#000");
    			attr_dev(path252, "stroke-width", ".1");
    			attr_dev(path252, "d", "M182.2 192.4c0-1 1-2 2-2s2.2 1 2.2 2c0 1.1-1 2-2.1 2a2 2 0 0 1-2.1-2z");
    			add_location(path252, file$9, 1041, 1, 42199);
    			attr_dev(path253, "fill", "#ad1519");
    			attr_dev(path253, "stroke", "#000");
    			attr_dev(path253, "stroke-width", ".3");
    			attr_dev(path253, "d", "M205.7 175.4c6.3 0 12 1 15.7 2.4a31.7 31.7 0 0 0 14.6 2.3c2.7 0 6.5.8 10.3 2.4a27.3 27.3 0 0 1 7.4 4.7l-1.5 1.4-.4 3.8-4.1 4.7-2 1.8-5 3.9-2.5.2-.7 2.1-31.6-3.7-31.7 3.7-.8-2.1-2.5-.2-4.9-4-2-1.7-4.1-4.7-.5-3.8-1.5-1.4a27.6 27.6 0 0 1 7.5-4.7 26 26 0 0 1 10.2-2.4c2 .2 4.2.1 6.6-.2a30 30 0 0 0 8-2c3.7-1.5 9-2.5 15.5-2.5z");
    			add_location(path253, file$9, 1047, 1, 42336);
    			attr_dev(path254, "fill", "#c8b100");
    			attr_dev(path254, "stroke", "#000");
    			attr_dev(path254, "stroke-width", ".4");
    			attr_dev(path254, "d", "M206.2 217.1c-11.8 0-22.4-1.4-29.9-3.6a1.1 1.1 0 0 1-.8-1.2c0-.5.3-1 .8-1.2a109 109 0 0 1 29.9-3.6c11.7 0 22.3 1.4 29.8 3.6a1.3 1.3 0 0 1 0 2.4c-7.5 2.2-18 3.6-29.8 3.6");
    			add_location(path254, file$9, 1053, 1, 42728);
    			attr_dev(path255, "fill", "#ad1519");
    			attr_dev(path255, "d", "M206.1 215.6c-10.6 0-20.2-1.2-27.5-3.1 7.3-2 16.9-3 27.5-3.1a115 115 0 0 1 27.6 3c-7.3 2-17 3.2-27.6 3.2");
    			add_location(path255, file$9, 1059, 1, 42967);
    			attr_dev(path256, "fill", "none");
    			attr_dev(path256, "stroke", "#000");
    			attr_dev(path256, "stroke-width", ".1");
    			attr_dev(path256, "d", "M206.9 215.7v-6.3m-1.7 6.3v-6.3");
    			add_location(path256, file$9, 1063, 1, 43106);
    			attr_dev(path257, "fill", "none");
    			attr_dev(path257, "stroke", "#000");
    			attr_dev(path257, "stroke-width", ".2");
    			attr_dev(path257, "d", "M203.6 215.7v-6.3m-1.6 6.3v-6.3");
    			add_location(path257, file$9, 1064, 1, 43196);
    			attr_dev(path258, "fill", "none");
    			attr_dev(path258, "stroke", "#000");
    			attr_dev(path258, "stroke-width", ".3");
    			attr_dev(path258, "d", "M200.6 215.7v-6.3m-2.8 5.9v-5.7m1.3 5.8v-6m-3.8 5.6v-5.2m1.3 5.4v-5.6");
    			add_location(path258, file$9, 1065, 1, 43286);
    			attr_dev(path259, "fill", "none");
    			attr_dev(path259, "stroke", "#000");
    			attr_dev(path259, "stroke-width", ".4");
    			attr_dev(path259, "d", "M192 214.8V210m1 4.7V210m1.2 5v-5m-3.4 4.7v-4.5");
    			add_location(path259, file$9, 1071, 1, 43423);
    			attr_dev(path260, "fill", "none");
    			attr_dev(path260, "stroke", "#000");
    			attr_dev(path260, "stroke-width", ".5");
    			attr_dev(path260, "d", "M189.7 214.5v-4.2m-1.2 4.1v-4");
    			add_location(path260, file$9, 1077, 1, 43538);
    			attr_dev(path261, "fill", "none");
    			attr_dev(path261, "stroke", "#000");
    			attr_dev(path261, "stroke-width", ".6");
    			attr_dev(path261, "d", "M186 214v-3m1.3 3.2v-3.5m-2.5 3.1V211");
    			add_location(path261, file$9, 1078, 1, 43626);
    			attr_dev(path262, "fill", "none");
    			attr_dev(path262, "stroke", "#000");
    			attr_dev(path262, "stroke-width", ".7");
    			attr_dev(path262, "d", "M183.7 213.6v-2.3m-1.3 2v-1.8m-1.2 1.6v-1.3");
    			add_location(path262, file$9, 1079, 1, 43722);
    			attr_dev(path263, "fill", "none");
    			attr_dev(path263, "stroke", "#000");
    			attr_dev(path263, "stroke-width", ".9");
    			attr_dev(path263, "d", "M179.8 212.8v-.7");
    			add_location(path263, file$9, 1085, 1, 43833);
    			attr_dev(path264, "fill", "none");
    			attr_dev(path264, "stroke", "#000");
    			attr_dev(path264, "stroke-width", ".1");
    			attr_dev(path264, "d", "M213.7 215.3v-5.8m-2.9 6v-6.1m-2.1 6.2v-6.3");
    			add_location(path264, file$9, 1086, 1, 43908);
    			attr_dev(path265, "fill", "#c8b100");
    			attr_dev(path265, "stroke", "#000");
    			attr_dev(path265, "stroke-width", ".4");
    			attr_dev(path265, "d", "M206 207.4a108 108 0 0 0-30 3.9c.6-.3.5-1-.3-3-1-2.5-2.4-2.4-2.4-2.4 8.3-2.5 20-4 32.8-4a123 123 0 0 1 33 4s-1.5-.1-2.5 2.3c-.8 2-.8 2.8-.2 3-7.5-2.2-18.4-3.7-30.3-3.7");
    			add_location(path265, file$9, 1092, 1, 44019);
    			attr_dev(path266, "fill", "#c8b100");
    			attr_dev(path266, "stroke", "#000");
    			attr_dev(path266, "stroke-width", ".4");
    			attr_dev(path266, "d", "M206.1 201.9c-12.9 0-24.5 1.5-32.8 4a1 1 0 0 1-1.3-.6 1 1 0 0 1 .7-1.3 121 121 0 0 1 33.4-4.2c13.2 0 25.2 1.7 33.5 4.2.6.2.9.8.7 1.3-.2.5-.8.8-1.3.6-8.4-2.5-20-4-32.9-4");
    			add_location(path266, file$9, 1098, 1, 44257);
    			attr_dev(path267, "fill", "none");
    			attr_dev(path267, "stroke", "#000");
    			attr_dev(path267, "stroke-linejoin", "round");
    			attr_dev(path267, "stroke-width", ".4");
    			attr_dev(path267, "d", "M206.1 215.6c-10.6 0-20.2-1.2-27.5-3.1 7.3-2 16.9-3 27.5-3.1a115 115 0 0 1 27.6 3c-7.3 2-17 3.2-27.6 3.2z");
    			add_location(path267, file$9, 1104, 1, 44496);
    			attr_dev(path268, "fill", "#fff");
    			attr_dev(path268, "stroke", "#000");
    			attr_dev(path268, "stroke-width", ".4");
    			attr_dev(path268, "d", "M197 204.8c0-.5.4-1 1-1 .5 0 1 .5 1 1s-.4 1-1 1a1 1 0 0 1-1-1");
    			add_location(path268, file$9, 1111, 1, 44695);
    			attr_dev(path269, "fill", "#ad1519");
    			attr_dev(path269, "stroke", "#000");
    			attr_dev(path269, "stroke-width", ".4");
    			attr_dev(path269, "d", "M206.1 205.6H203a1 1 0 0 1 0-2h6.4c.5 0 1 .5 1 1s-.5 1-1 1h-3.2");
    			add_location(path269, file$9, 1117, 1, 44824);
    			attr_dev(path270, "fill", "#058e6e");
    			attr_dev(path270, "stroke", "#000");
    			attr_dev(path270, "stroke-width", ".4");
    			attr_dev(path270, "d", "m190.3 206.5-2.3.2c-.6.1-1-.3-1.2-.8a1 1 0 0 1 1-1.1l2.2-.3 2.4-.3c.5 0 1 .3 1.1.9.1.5-.3 1-.9 1l-2.3.4");
    			add_location(path270, file$9, 1123, 1, 44958);
    			attr_dev(path271, "fill", "#fff");
    			attr_dev(path271, "stroke", "#000");
    			attr_dev(path271, "stroke-width", ".4");
    			attr_dev(path271, "d", "M181 206.7c0-.6.5-1 1.1-1 .6 0 1 .4 1 1 0 .5-.4 1-1 1a1 1 0 0 1-1-1");
    			add_location(path271, file$9, 1129, 1, 45132);
    			attr_dev(path272, "fill", "#ad1519");
    			attr_dev(path272, "stroke", "#000");
    			attr_dev(path272, "stroke-width", ".4");
    			attr_dev(path272, "d", "m174 208.5 1.2-1.6 3.3.4-2.6 2-1.8-.8");
    			add_location(path272, file$9, 1135, 1, 45267);
    			attr_dev(path273, "fill", "#058e6e");
    			attr_dev(path273, "stroke", "#000");
    			attr_dev(path273, "stroke-width", ".4");
    			attr_dev(path273, "d", "m222 206.5 2.3.2c.5.1 1-.3 1.1-.8a1 1 0 0 0-.9-1.1l-2.2-.3-2.4-.3a1 1 0 0 0-1.1.9c-.1.5.3 1 .9 1l2.3.4");
    			add_location(path273, file$9, 1136, 1, 45366);
    			attr_dev(path274, "fill", "#fff");
    			attr_dev(path274, "stroke", "#000");
    			attr_dev(path274, "stroke-width", ".4");
    			attr_dev(path274, "d", "M213.3 204.8c0-.5.4-1 1-1s1 .5 1 1-.4 1-1 1a1 1 0 0 1-1-1m15.8 1.9c0-.6.5-1 1-1 .6 0 1.1.4 1.1 1 0 .5-.4 1-1 1a1 1 0 0 1-1-1");
    			add_location(path274, file$9, 1142, 1, 45539);
    			attr_dev(path275, "fill", "#ad1519");
    			attr_dev(path275, "stroke", "#000");
    			attr_dev(path275, "stroke-width", ".4");
    			attr_dev(path275, "d", "m238.2 208.5-1.1-1.6-3.3.4 2.6 2 1.8-.8");
    			add_location(path275, file$9, 1148, 1, 45731);
    			attr_dev(path276, "fill", "none");
    			attr_dev(path276, "stroke", "#000");
    			attr_dev(path276, "stroke-width", ".4");
    			attr_dev(path276, "d", "M177.3 212.8c7.4-2.1 17.6-3.4 28.8-3.4 11.3 0 21.4 1.3 28.9 3.4");
    			add_location(path276, file$9, 1154, 1, 45841);
    			attr_dev(path277, "fill", "#c8b100");
    			attr_dev(path277, "d", "m182.3 183.8 1.4 1 2-3.2a7.4 7.4 0 0 1-3.6-7.2c.2-4.1 5.2-7.6 11.7-7.6 3.3 0 6.3 1 8.5 2.4 0-.6 0-1.2.2-1.8a17.4 17.4 0 0 0-8.7-2.1c-7.4 0-13.2 4.1-13.5 9.1a8.9 8.9 0 0 0 3 7.6l-1 1.8");
    			add_location(path277, file$9, 1160, 1, 45972);
    			attr_dev(path278, "fill", "none");
    			attr_dev(path278, "stroke", "#000");
    			attr_dev(path278, "stroke-width", ".4");
    			attr_dev(path278, "d", "m182.3 183.8 1.4 1 2-3.2a7.4 7.4 0 0 1-3.6-7.2c.2-4.1 5.2-7.6 11.7-7.6 3.3 0 6.3 1 8.5 2.4 0-.6 0-1.2.2-1.8a17.4 17.4 0 0 0-8.7-2.1c-7.4 0-13.2 4.1-13.5 9.1a8.9 8.9 0 0 0 3 7.6l-1 1.8");
    			add_location(path278, file$9, 1164, 1, 46190);
    			attr_dev(path279, "fill", "#c8b100");
    			attr_dev(path279, "d", "M182.4 183.8a9.3 9.3 0 0 1-4-7.3c0-3.2 2-6.1 5.3-8a8.5 8.5 0 0 0-3.4 6.8 8.9 8.9 0 0 0 3 6.7l-.9 1.8");
    			add_location(path279, file$9, 1170, 1, 46441);
    			attr_dev(path280, "fill", "none");
    			attr_dev(path280, "stroke", "#000");
    			attr_dev(path280, "stroke-width", ".4");
    			attr_dev(path280, "d", "M182.4 183.8a9.3 9.3 0 0 1-4-7.3c0-3.2 2-6.1 5.3-8a8.5 8.5 0 0 0-3.4 6.8 8.9 8.9 0 0 0 3 6.7l-.9 1.8");
    			add_location(path280, file$9, 1174, 1, 46576);
    			attr_dev(path281, "fill", "#c8b100");
    			attr_dev(path281, "d", "M160.1 187.1a8.8 8.8 0 0 1-2.3-5.9c0-1.3.3-2.6 1-3.8 2-4.2 8.4-7.2 16-7.2 2 0 4 .2 5.9.6l-1 1.4a25.5 25.5 0 0 0-4.9-.4c-7 0-12.8 2.7-14.5 6.3a7 7 0 0 0-.7 3.1 7.3 7.3 0 0 0 2.7 5.6l-2.6 4.1-1.3-1 1.7-2.8");
    			add_location(path281, file$9, 1180, 1, 46744);
    			attr_dev(path282, "fill", "none");
    			attr_dev(path282, "stroke", "#000");
    			attr_dev(path282, "stroke-width", ".4");
    			attr_dev(path282, "d", "M160.1 187.1a8.8 8.8 0 0 1-2.3-5.9c0-1.3.3-2.6 1-3.8 2-4.2 8.4-7.2 16-7.2 2 0 4 .2 5.9.6l-1 1.4a25.5 25.5 0 0 0-4.9-.4c-7 0-12.8 2.7-14.5 6.3a7 7 0 0 0-.7 3.1 7.3 7.3 0 0 0 2.7 5.6l-2.6 4.1-1.3-1 1.7-2.8z");
    			add_location(path282, file$9, 1184, 1, 46982);
    			attr_dev(path283, "fill", "#c8b100");
    			attr_dev(path283, "d", "M162.7 173.3a10.5 10.5 0 0 0-4 4.1 8.6 8.6 0 0 0-.9 3.8c0 2.3.9 4.3 2.3 5.9l-1.5 2.5a10.4 10.4 0 0 1-2.3-6.5c0-4 2.5-7.5 6.4-9.8");
    			add_location(path283, file$9, 1190, 1, 47254);
    			attr_dev(path284, "fill", "none");
    			attr_dev(path284, "stroke", "#000");
    			attr_dev(path284, "stroke-width", ".4");
    			attr_dev(path284, "d", "M162.7 173.3a10.5 10.5 0 0 0-4 4.1 8.6 8.6 0 0 0-.9 3.8c0 2.3.9 4.3 2.3 5.9l-1.5 2.5a10.4 10.4 0 0 1-2.3-6.5c0-4 2.5-7.5 6.4-9.8z");
    			add_location(path284, file$9, 1194, 1, 47417);
    			attr_dev(path285, "fill", "#c8b100");
    			attr_dev(path285, "d", "M206 164.4c1.7 0 3.2 1.1 3.5 2.6.3 1.4.4 2.9.4 4.5v1.1c.1 3.3.6 6.3 1.3 8.1l-5.2 5-5.2-5c.7-1.8 1.2-4.8 1.3-8.1v-1.1c0-1.6.2-3.1.4-4.5.3-1.5 1.8-2.6 3.5-2.6");
    			add_location(path285, file$9, 1200, 1, 47614);
    			attr_dev(path286, "fill", "none");
    			attr_dev(path286, "stroke", "#000");
    			attr_dev(path286, "stroke-width", ".4");
    			attr_dev(path286, "d", "M206 164.4c1.7 0 3.2 1.1 3.5 2.6.3 1.4.4 2.9.4 4.5v1.1c.1 3.3.6 6.3 1.3 8.1l-5.2 5-5.2-5c.7-1.8 1.2-4.8 1.3-8.1v-1.1c0-1.6.2-3.1.4-4.5.3-1.5 1.8-2.6 3.5-2.6z");
    			add_location(path286, file$9, 1204, 1, 47805);
    			attr_dev(path287, "fill", "#c8b100");
    			attr_dev(path287, "d", "M206 166c1 0 1.7.6 1.8 1.4.2 1.2.4 2.6.4 4.2v1c.1 3.2.6 6 1.2 7.7l-3.4 3.2-3.4-3.2c.7-1.7 1.1-4.5 1.2-7.7v-1a28.1 28.1 0 0 1 .4-4.2 2 2 0 0 1 1.8-1.4");
    			add_location(path287, file$9, 1210, 1, 48030);
    			attr_dev(path288, "fill", "none");
    			attr_dev(path288, "stroke", "#000");
    			attr_dev(path288, "stroke-width", ".4");
    			attr_dev(path288, "d", "M206 166c1 0 1.7.6 1.8 1.4.2 1.2.4 2.6.4 4.2v1c.1 3.2.6 6 1.2 7.7l-3.4 3.2-3.4-3.2c.7-1.7 1.1-4.5 1.2-7.7v-1a28.1 28.1 0 0 1 .4-4.2 2 2 0 0 1 1.8-1.4z");
    			add_location(path288, file$9, 1214, 1, 48214);
    			attr_dev(path289, "fill", "#c8b100");
    			attr_dev(path289, "d", "m229.7 183.8-1.3 1-2-3.2a7.4 7.4 0 0 0 3.6-6.3 7 7 0 0 0 0-.9c-.2-4.1-5.3-7.6-11.7-7.6a15 15 0 0 0-8.5 2.4 23 23 0 0 0-.2-1.8 17.4 17.4 0 0 1 8.7-2.1c7.4 0 13.2 4.1 13.4 9.1a8.9 8.9 0 0 1-3 7.6l1 1.8");
    			add_location(path289, file$9, 1220, 1, 48432);
    			attr_dev(path290, "fill", "none");
    			attr_dev(path290, "stroke", "#000");
    			attr_dev(path290, "stroke-width", ".4");
    			attr_dev(path290, "d", "m229.7 183.8-1.3 1-2-3.2a7.4 7.4 0 0 0 3.6-6.3 7 7 0 0 0 0-.9c-.2-4.1-5.3-7.6-11.7-7.6a15 15 0 0 0-8.5 2.4 23 23 0 0 0-.2-1.8 17.4 17.4 0 0 1 8.7-2.1c7.4 0 13.2 4.1 13.4 9.1a8.9 8.9 0 0 1-3 7.6l1 1.8");
    			add_location(path290, file$9, 1224, 1, 48666);
    			attr_dev(path291, "fill", "#c8b100");
    			attr_dev(path291, "d", "M229.6 183.8a9.1 9.1 0 0 0 4.1-7.3c0-3.2-2.1-6.1-5.3-8a8.5 8.5 0 0 1 3.4 6.8 8.9 8.9 0 0 1-3.2 6.7l1 1.8");
    			add_location(path291, file$9, 1230, 1, 48933);
    			attr_dev(path292, "fill", "none");
    			attr_dev(path292, "stroke", "#000");
    			attr_dev(path292, "stroke-width", ".4");
    			attr_dev(path292, "d", "M229.6 183.8a9.1 9.1 0 0 0 4.1-7.3c0-3.2-2.1-6.1-5.3-8a8.5 8.5 0 0 1 3.4 6.8 8.9 8.9 0 0 1-3.2 6.7l1 1.8");
    			add_location(path292, file$9, 1234, 1, 49072);
    			attr_dev(path293, "fill", "#c8b100");
    			attr_dev(path293, "d", "M252 187.1a8.8 8.8 0 0 0 2.2-5.9 8.7 8.7 0 0 0-.9-3.8c-2-4.2-8.4-7.2-16-7.2a29 29 0 0 0-6 .6l1 1.4a25.4 25.4 0 0 1 5-.4c7 0 12.8 2.7 14.4 6.3.5 1 .7 2 .7 3.1a7.3 7.3 0 0 1-2.6 5.6l2.5 4.1 1.3-1-1.7-2.8");
    			add_location(path293, file$9, 1240, 1, 49244);
    			attr_dev(path294, "fill", "none");
    			attr_dev(path294, "stroke", "#000");
    			attr_dev(path294, "stroke-width", ".4");
    			attr_dev(path294, "d", "M252 187.1a8.8 8.8 0 0 0 2.2-5.9 8.7 8.7 0 0 0-.9-3.8c-2-4.2-8.4-7.2-16-7.2a29 29 0 0 0-6 .6l1 1.4a25.4 25.4 0 0 1 5-.4c7 0 12.8 2.7 14.4 6.3.5 1 .7 2 .7 3.1a7.3 7.3 0 0 1-2.6 5.6l2.5 4.1 1.3-1-1.7-2.8z");
    			add_location(path294, file$9, 1244, 1, 49480);
    			attr_dev(path295, "fill", "#c8b100");
    			attr_dev(path295, "d", "M249.3 173.3a10.6 10.6 0 0 1 4 4.1 8.7 8.7 0 0 1 .9 3.8 8.8 8.8 0 0 1-2.3 5.9l1.6 2.5a10.4 10.4 0 0 0 2.3-6.5c0-4-2.6-7.5-6.5-9.8");
    			add_location(path295, file$9, 1250, 1, 49750);
    			attr_dev(path296, "fill", "none");
    			attr_dev(path296, "stroke", "#000");
    			attr_dev(path296, "stroke-width", ".4");
    			attr_dev(path296, "d", "M249.3 173.3a10.6 10.6 0 0 1 4 4.1 8.7 8.7 0 0 1 .9 3.8 8.8 8.8 0 0 1-2.3 5.9l1.6 2.5a10.4 10.4 0 0 0 2.3-6.5c0-4-2.6-7.5-6.5-9.8z");
    			add_location(path296, file$9, 1254, 1, 49914);
    			attr_dev(path297, "fill", "#fff");
    			attr_dev(path297, "d", "M204.2 181.4c0-1 .8-1.8 1.8-1.8s1.9.8 1.9 1.8-.9 1.7-1.9 1.7a1.8 1.8 0 0 1-1.8-1.7");
    			add_location(path297, file$9, 1260, 1, 50112);
    			attr_dev(path298, "fill", "none");
    			attr_dev(path298, "stroke", "#000");
    			attr_dev(path298, "stroke-width", ".4");
    			attr_dev(path298, "d", "M204.2 181.4c0-1 .8-1.8 1.8-1.8s1.9.8 1.9 1.8-.9 1.7-1.9 1.7a1.8 1.8 0 0 1-1.8-1.7z");
    			add_location(path298, file$9, 1264, 1, 50226);
    			attr_dev(path299, "fill", "#fff");
    			attr_dev(path299, "stroke", "#000");
    			attr_dev(path299, "stroke-width", ".4");
    			attr_dev(path299, "d", "M204.2 178c0-1 .8-1.8 1.8-1.8s1.9.8 1.9 1.8-.9 1.7-1.9 1.7a1.8 1.8 0 0 1-1.8-1.7m.4-3.7c0-.7.6-1.3 1.4-1.3.8 0 1.5.6 1.5 1.3 0 .8-.7 1.4-1.5 1.4s-1.4-.6-1.4-1.4m.4-3.3c0-.5.4-1 1-1s1 .5 1 1-.4 1-1 1a1 1 0 0 1-1-1m.2-2.8c0-.5.4-.8.8-.8.5 0 .9.3.9.8 0 .4-.4.8-.9.8a.8.8 0 0 1-.8-.8");
    			add_location(path299, file$9, 1270, 1, 50377);
    			attr_dev(path300, "fill", "#c8b100");
    			attr_dev(path300, "stroke", "#000");
    			attr_dev(path300, "stroke-width", ".4");
    			attr_dev(path300, "d", "m206.2 191.8 1.2.2a4.6 4.6 0 0 0 4.5 6 4.7 4.7 0 0 0 4.4-3c.1 0 .5-1.7.7-1.7.2 0 .1 1.8.2 1.7.3 2.3 2.4 3.8 4.7 3.8a4.6 4.6 0 0 0 4.7-5l1.5-1.5.7 2a4 4 0 0 0-.4 1.9 4.4 4.4 0 0 0 4.5 4.2c1.6 0 3-.7 3.8-1.9l.9-1.2v1.5c0 1.5.6 2.8 2 3 0 0 1.7.1 4-1.6 2.1-1.7 3.3-3.1 3.3-3.1l.2 1.7s-1.8 2.8-3.8 4c-1 .6-2.7 1.3-4 1-1.4-.2-2.4-1.3-3-2.6a6.7 6.7 0 0 1-3.3 1 6.5 6.5 0 0 1-6.1-3.7 7 7 0 0 1-10.4-.3 7 7 0 0 1-4.6 1.8 6.9 6.9 0 0 1-5.7-3 6.9 6.9 0 0 1-5.7 3 7 7 0 0 1-4.7-1.8 7 7 0 0 1-10.4.3 6.5 6.5 0 0 1-6 3.7 6.7 6.7 0 0 1-3.4-1c-.6 1.3-1.5 2.4-3 2.7-1.2.2-2.9-.5-4-1.1-2-1.2-3.8-4-3.8-4l.2-1.7s1.2 1.4 3.4 3.1c2.2 1.8 3.9 1.6 3.9 1.6 1.4-.2 2-1.5 2-3v-1.5l1 1.2a4.6 4.6 0 0 0 3.7 2c2.5 0 4.5-2 4.5-4.3a4 4 0 0 0-.4-2l.8-1.9 1.5 1.5a4.4 4.4 0 0 0 0 .6c0 2.4 2 4.4 4.6 4.4 2.4 0 4.4-1.5 4.7-3.8 0 0 0-1.6.2-1.7.2 0 .6 1.7.7 1.6a4.7 4.7 0 0 0 4.5 3.1 4.6 4.6 0 0 0 4.5-6l1.2-.2");
    			add_location(path300, file$9, 1276, 1, 50724);
    			attr_dev(path301, "fill", "#fff");
    			attr_dev(path301, "stroke", "#000");
    			attr_dev(path301, "stroke-width", ".4");
    			attr_dev(path301, "d", "M238.6 197.7c.3-.8 0-1.6-.6-1.8-.5-.2-1.2.3-1.5 1.1-.3.8 0 1.6.6 1.8.5.2 1.2-.3 1.5-1.1m-20.5-4c0-.8-.3-1.6-1-1.6-.5-.1-1 .5-1.2 1.4-.1.8.3 1.5.9 1.6.6 0 1.2-.6 1.3-1.4m-23.9 0c0-.8.4-1.6 1-1.6.6-.1 1.1.5 1.2 1.4.1.8-.3 1.5-.9 1.6-.6 0-1.1-.6-1.2-1.4m-20.6 4c-.2-.8 0-1.6.6-1.8.6-.2 1.2.3 1.5 1.1.3.8 0 1.6-.5 1.8-.6.2-1.3-.3-1.6-1.1");
    			add_location(path301, file$9, 1282, 1, 51668);
    			attr_dev(path302, "fill", "#c8b100");
    			attr_dev(path302, "stroke", "#000");
    			attr_dev(path302, "stroke-width", ".4");
    			attr_dev(path302, "d", "M182.7 184a5.1 5.1 0 0 1 2.2 2.9s0-.3.6-.6 1-.3 1-.3l-.1 1.3-.3 2.2a7.4 7.4 0 0 1-.7 1.6 1.9 1.9 0 0 0-1.5-.4 1.8 1.8 0 0 0-1.2.9s-.7-.6-1.2-1.3l-1.1-2-.7-1.1s.5-.2 1.1 0c.6 0 .8.2.8.2a4.9 4.9 0 0 1 1-3.4m.4 9.8a1.8 1.8 0 0 1-.6-1c0-.5 0-.9.3-1.2 0 0-.9-.5-1.8-.7-.7-.2-2-.2-2.3-.2h-1l.2.5c.2.5.5.7.5.7a5 5 0 0 0-3 2 5.3 5.3 0 0 0 3.5 1l-.2.8v.6l1-.4c.3-.1 1.5-.5 2-1 .8-.4 1.5-1.1 1.5-1.1m2.7-.5a1.6 1.6 0 0 0 .2-1.1 1.7 1.7 0 0 0-.6-1l1.4-1.3a10 10 0 0 1 2-.9l1.1-.4v.6a5.7 5.7 0 0 1-.2.8 5 5 0 0 1 3.4 1 5 5 0 0 1-2.9 2 6.4 6.4 0 0 0 .7 1.2h-1c-.4 0-1.6 0-2.3-.2a11 11 0 0 1-1.8-.7");
    			add_location(path302, file$9, 1288, 1, 52069);
    			attr_dev(path303, "fill", "#ad1519");
    			attr_dev(path303, "stroke", "#000");
    			attr_dev(path303, "stroke-width", ".4");
    			attr_dev(path303, "d", "M182.2 192.4c0-1 1-2 2-2s2.2 1 2.2 2c0 1.1-1 2-2.1 2a2 2 0 0 1-2.1-2");
    			add_location(path303, file$9, 1294, 1, 52724);
    			attr_dev(path304, "fill", "#c8b100");
    			attr_dev(path304, "stroke", "#000");
    			attr_dev(path304, "stroke-width", ".4");
    			attr_dev(path304, "d", "M206.1 180.8a5.7 5.7 0 0 1 1.9 3.7s.2-.3.9-.5c.7-.3 1.2-.2 1.2-.2l-.5 1.4-.8 2.4a8.2 8.2 0 0 1-1 1.7 2.1 2.1 0 0 0-1.7-.7c-.6 0-1.2.3-1.6.7 0 0-.6-.7-1-1.7l-.8-2.4-.5-1.4 1.2.2c.7.2.9.5.9.5 0-1.4.8-2.8 1.8-3.7");
    			add_location(path304, file$9, 1300, 1, 52863);
    			attr_dev(path305, "fill", "#c8b100");
    			attr_dev(path305, "stroke", "#000");
    			attr_dev(path305, "stroke-width", ".4");
    			attr_dev(path305, "d", "M204.6 191.8a2 2 0 0 1-.5-1.2c0-.5.1-1 .4-1.3 0 0-.8-.7-1.8-1-.7-.4-2-.7-2.5-.7l-1.2-.2.2.6.4.9a5.9 5.9 0 0 0-3.7 1.7c1 .9 2.3 1.6 3.7 1.6l-.4 1-.2.6 1.2-.2c.4-.1 1.8-.4 2.5-.7 1-.4 1.9-1 1.9-1m3 0a1.9 1.9 0 0 0 .1-2.6s.9-.7 1.8-1a8 8 0 0 1 2.5-.7l1.2-.3-.1.7-.4.9c1.4 0 2.7.8 3.6 1.7a5.9 5.9 0 0 1-3.6 1.6 6.9 6.9 0 0 0 .5 1.6l-1.2-.2-2.5-.7c-1-.4-1.8-1-1.8-1m22-8a5.2 5.2 0 0 0-2.2 3l-.7-.6c-.6-.3-1-.3-1-.3l.2 1.3c0 .3 0 1.3.3 2.2.2 1 .6 1.6.6 1.6a2 2 0 0 1 1.5-.4c.6.1 1 .5 1.3.9l1.1-1.3c.6-.8 1-1.7 1.1-2l.7-1.1s-.4-.2-1 0c-.7 0-1 .2-1 .2a4.9 4.9 0 0 0-1-3.4m-.3 9.8c.3-.3.5-.6.6-1a1.6 1.6 0 0 0-.2-1.2s.8-.5 1.7-.7c.7-.2 2-.2 2.3-.2h1.1l-.3.5a6.2 6.2 0 0 1-.4.7 5 5 0 0 1 2.9 2 5.3 5.3 0 0 1-3.5 1l.2.8v.6l-1-.4c-.3-.1-1.4-.5-2-1-.8-.4-1.4-1.1-1.4-1.1m-2.8-.5a1.7 1.7 0 0 1-.2-1.1c0-.5.3-.8.6-1 0 0-.6-.8-1.4-1.3-.6-.4-1.7-.8-2-.9a171.4 171.4 0 0 1-1-.4v.6c0 .5.2.8.2.8a5.2 5.2 0 0 0-3.5 1c.7.9 1.7 1.7 3 2 0 0-.3.2-.5.7l-.3.5h1c.4 0 1.7 0 2.3-.2a11.1 11.1 0 0 0 1.8-.7");
    			add_location(path305, file$9, 1306, 1, 53143);
    			attr_dev(path306, "fill", "#ad1519");
    			attr_dev(path306, "stroke", "#000");
    			attr_dev(path306, "stroke-width", ".4");
    			attr_dev(path306, "d", "M226 192.4c0-1 1-2 2-2s2.1 1 2.1 2a2 2 0 0 1-2 2 2 2 0 0 1-2.1-2m23.2 4.4c-.4-.5-1.4-.4-2.2.2-.8.7-1 1.6-.5 2.2.5.5 1.5.4 2.3-.3.7-.6 1-1.6.5-2");
    			add_location(path306, file$9, 1312, 1, 54189);
    			attr_dev(path307, "fill", "#c8b100");
    			attr_dev(path307, "stroke", "#000");
    			attr_dev(path307, "stroke-width", ".4");
    			attr_dev(path307, "d", "m246.3 198 .7-1c.7-.6 1.8-.7 2.3-.2l.1.2s1-2 2.3-2.6c1.3-.7 3.4-.5 3.4-.5a2.8 2.8 0 0 0-2.9-2.8 3 3 0 0 0-2.4 1l-.2-1s-1.3.3-1.9 1.8c-.6 1.5 0 3.6 0 3.6s-.3-.9-.7-1.5a8 8 0 0 0-2.4-1.6l-1.3-.7-.1.5a5 5 0 0 0 0 .8 7.9 7.9 0 0 0-3.7.5 4.7 4.7 0 0 0 2.5 2.2l-.8.7a4 4 0 0 0-.4.5l1.3.2 2.5.2a14.5 14.5 0 0 0 1.7-.2m-80.3 0c0-.4-.3-.7-.7-1-.7-.7-1.7-.8-2.2-.3l-.2.3s-1-2-2.3-2.7c-1.2-.7-3.3-.5-3.3-.5a2.8 2.8 0 0 1 2.8-2.8c1 0 1.9.4 2.4 1l.2-1s1.3.3 2 1.8c.5 1.5-.1 3.6-.1 3.6s.3-.9.8-1.5a8 8 0 0 1 2.4-1.6l1.3-.7v1.3a7.9 7.9 0 0 1 3.7.5 4.7 4.7 0 0 1-2.5 2.2l.8.7.4.5-1.2.2-2.6.2a14.7 14.7 0 0 1-1.7-.2");
    			add_location(path307, file$9, 1318, 1, 54403);
    			attr_dev(path308, "fill", "#ad1519");
    			attr_dev(path308, "stroke", "#000");
    			attr_dev(path308, "stroke-width", ".4");
    			attr_dev(path308, "d", "M163 196.8c.6-.5 1.6-.4 2.4.3.7.6 1 1.5.4 2-.5.6-1.5.5-2.2-.2-.8-.6-1-1.6-.5-2m41-6.3c0-1.1.9-2 2-2s2.1.9 2.1 2c0 1-1 2-2 2a2 2 0 0 1-2.1-2");
    			add_location(path308, file$9, 1324, 1, 55072);
    			attr_dev(path309, "fill", "#005bbf");
    			attr_dev(path309, "stroke", "#000");
    			attr_dev(path309, "stroke-width", ".3");
    			attr_dev(path309, "d", "M201.8 160.6c0-2.2 1.9-4 4.3-4s4.2 1.8 4.2 4-1.9 4-4.3 4a4.1 4.1 0 0 1-4.2-4");
    			add_location(path309, file$9, 1330, 1, 55282);
    			attr_dev(path310, "fill", "#c8b100");
    			attr_dev(path310, "stroke", "#000");
    			attr_dev(path310, "stroke-width", ".3");
    			attr_dev(path310, "d", "M205 149.3v2.2h-2.4v2.2h2.3v6.3H202l-.2.6c0 .6.1 1.1.3 1.6h7.9c.2-.5.3-1 .3-1.6l-.2-.6h-2.8v-6.3h2.3v-2.2h-2.3v-2.2h-2.4z");
    			add_location(path310, file$9, 1336, 1, 55429);
    			attr_dev(path311, "fill", "#ccc");
    			attr_dev(path311, "d", "M206.5 330.6a82 82 0 0 1-35.5-8.2 22.7 22.7 0 0 1-12.8-20.4v-32h96.4v32a22.7 22.7 0 0 1-12.8 20.4 81 81 0 0 1-35.3 8.2");
    			add_location(path311, file$9, 1342, 1, 55621);
    			attr_dev(path312, "fill", "none");
    			attr_dev(path312, "stroke", "#000");
    			attr_dev(path312, "stroke-width", ".5");
    			attr_dev(path312, "d", "M206.5 330.6a82 82 0 0 1-35.5-8.2 22.7 22.7 0 0 1-12.8-20.4v-32h96.4v32a22.7 22.7 0 0 1-12.8 20.4 81 81 0 0 1-35.3 8.2z");
    			add_location(path312, file$9, 1346, 1, 55771);
    			attr_dev(path313, "fill", "#ccc");
    			attr_dev(path313, "d", "M206.3 270h48.3v-53.5h-48.3V270z");
    			add_location(path313, file$9, 1352, 1, 55958);
    			attr_dev(path314, "fill", "none");
    			attr_dev(path314, "stroke", "#000");
    			attr_dev(path314, "stroke-width", ".5");
    			attr_dev(path314, "d", "M206.3 270h48.3v-53.5h-48.3V270z");
    			add_location(path314, file$9, 1353, 1, 56017);
    			attr_dev(path315, "fill", "#ad1519");
    			attr_dev(path315, "d", "M206.3 302c0 12.6-10.7 22.9-24 22.9s-24.2-10.3-24.2-23v-32h48.2v32");
    			add_location(path315, file$9, 1354, 1, 56108);
    			attr_dev(path316, "fill", "#c8b100");
    			attr_dev(path316, "stroke", "#000");
    			attr_dev(path316, "stroke-width", ".5");
    			attr_dev(path316, "d", "M168.6 320.9c1.5.8 3.6 2 5.8 2.6l-.1-54.7h-5.7v52z");
    			add_location(path316, file$9, 1355, 1, 56204);
    			attr_dev(path317, "fill", "#c8b100");
    			attr_dev(path317, "stroke", "#000");
    			attr_dev(path317, "stroke-linejoin", "round");
    			attr_dev(path317, "stroke-width", ".5");
    			attr_dev(path317, "d", "M158 301.6a24.4 24.4 0 0 0 5.5 15v-47.5h-5.4v32.5z");
    			add_location(path317, file$9, 1361, 1, 56325);
    			attr_dev(path318, "fill", "#c7b500");
    			attr_dev(path318, "stroke", "#000");
    			attr_dev(path318, "stroke-width", ".5");
    			attr_dev(path318, "d", "M179.4 324.7a26.6 26.6 0 0 0 5.6 0v-55.9h-5.6v56z");
    			add_location(path318, file$9, 1368, 1, 56472);
    			attr_dev(path319, "fill", "#c8b100");
    			attr_dev(path319, "stroke", "#000");
    			attr_dev(path319, "stroke-width", ".5");
    			attr_dev(path319, "d", "M190 323.5a19 19 0 0 0 5.8-2.5v-52.2H190l-.1 54.7z");
    			add_location(path319, file$9, 1374, 1, 56592);
    			attr_dev(path320, "fill", "#ad1519");
    			attr_dev(path320, "d", "M158.1 270h48.2v-53.5H158V270z");
    			add_location(path320, file$9, 1380, 1, 56713);
    			attr_dev(path321, "fill", "none");
    			attr_dev(path321, "stroke", "#000");
    			attr_dev(path321, "stroke-width", ".5");
    			attr_dev(path321, "d", "M158.1 270h48.2v-53.5H158V270z");
    			add_location(path321, file$9, 1381, 1, 56773);
    			attr_dev(path322, "fill", "#c8b100");
    			attr_dev(path322, "stroke", "#000");
    			attr_dev(path322, "stroke-width", ".5");
    			attr_dev(path322, "d", "M201 316c2.4-2 4.6-6.8 5.4-12.2l.1-35H201l.1 47.3z");
    			add_location(path322, file$9, 1382, 1, 56862);
    			attr_dev(path323, "fill", "none");
    			attr_dev(path323, "stroke", "#000");
    			attr_dev(path323, "stroke-width", ".5");
    			attr_dev(path323, "d", "M206.3 302c0 12.6-10.7 22.9-24 22.9s-24.2-10.3-24.2-23v-32h48.2v32");
    			add_location(path323, file$9, 1388, 1, 56983);
    			attr_dev(path324, "fill", "#ad1519");
    			attr_dev(path324, "d", "M254.6 270v32c0 12.6-10.8 22.9-24.1 22.9s-24.2-10.3-24.2-23v-32h48.3");
    			add_location(path324, file$9, 1394, 1, 57117);
    			attr_dev(path325, "fill", "none");
    			attr_dev(path325, "stroke", "#000");
    			attr_dev(path325, "stroke-width", ".5");
    			attr_dev(path325, "d", "M254.6 270v32c0 12.6-10.8 22.9-24.1 22.9s-24.2-10.3-24.2-23v-32h48.3");
    			add_location(path325, file$9, 1395, 1, 57215);
    			attr_dev(path326, "fill", "#c8b100");
    			attr_dev(path326, "d", "m215.1 294.1.1.5c0 .6-.5 1-1.1 1a1 1 0 0 1-1.1-1v-.5h-1.5a2.5 2.5 0 0 0 1.8 2.9v3.9h1.6V297a2.6 2.6 0 0 0 1.7-1.6h4.4v-1.2h-6m21.8 0v1.2h-4a2.5 2.5 0 0 1-.3.6l4.6 5.2-1.2 1-4.6-5.3-.2.1v8.7h-1.6V297h-.2l-4.8 5.2-1.2-1 4.7-5.3a2.1 2.1 0 0 1-.2-.4h-4V294h13zm2.6 0v1.2h4.4c.3.8.9 1.4 1.7 1.6v3.9h1.6V297a2.5 2.5 0 0 0 1.8-2.4 2 2 0 0 0 0-.5h-1.6l.1.5c0 .6-.5 1-1 1-.7 0-1.2-.4-1.2-1a1 1 0 0 1 .1-.5h-5.9m-6.7 22.1a15.6 15.6 0 0 0 3.7-1l.8 1.4a17.6 17.6 0 0 1-4.3 1.2 2.6 2.6 0 0 1-2.6 2 2.6 2.6 0 0 1-2.5-2 17.5 17.5 0 0 1-4.6-1.2l.8-1.4c1.3.5 2.6.9 4 1a2.5 2.5 0 0 1 1.5-1.3v-6.7h1.6v6.7c.7.2 1.3.7 1.6 1.4zm-11-2.2-.8 1.4a16.6 16.6 0 0 1-3.6-3.1c-.9.2-1.8 0-2.5-.5a2.4 2.4 0 0 1-.3-3.5l.1-.1a15.3 15.3 0 0 1-1.3-4.8h1.7a13.1 13.1 0 0 0 1 4c.5 0 1 0 1.4.2l4.1-4.5 1.3 1-4.1 4.5c.5.9.5 2-.1 2.8a15.2 15.2 0 0 0 3.1 2.6zm-6-4.8c.3-.4 1-.5 1.5 0s.5 1 .1 1.4a1.2 1.2 0 0 1-1.6.1 1 1 0 0 1 0-1.5zm-2.2-4.5-1.6-.3-.3-4.3 1.7-.6v2.5c0 1 0 1.8.2 2.7zm1.4-5.3 1.7.4v2.2c0-.8.3 2.1.3 2.1l-1.7.6a14 14 0 0 1-.3-2.7v-2.6zm5.6 13.7a15.7 15.7 0 0 0 4.8 2.6l.4-1.6a13.7 13.7 0 0 1-4-2l-1.2 1m-.8 1.4a17.4 17.4 0 0 0 4.8 2.6l-1.2 1.1a18.7 18.7 0 0 1-4-2l.4-1.7m2.2-9.4 1.6.7 3-3.3-1-1.4-3.6 4m-1.3-1-1-1.4 3-3.3 1.6.7-3.6 4m18.1 9.9.8 1.4a16.7 16.7 0 0 0 3.6-3.1c.9.2 1.8 0 2.5-.5a2.4 2.4 0 0 0 .3-3.5l-.1-.1a15 15 0 0 0 1.3-4.8h-1.7a13.3 13.3 0 0 1-1 4 3 3 0 0 0-1.4.2l-4.1-4.5-1.3 1 4.1 4.5a2.4 2.4 0 0 0 .1 2.8 15 15 0 0 1-3.1 2.6zm6-4.8a1.2 1.2 0 0 0-1.5 0 1 1 0 0 0-.1 1.4 1.2 1.2 0 0 0 1.6.1 1 1 0 0 0 0-1.5zm2.2-4.5 1.6-.3.3-4.3-1.7-.6v2.5c0 1 0 1.9-.2 2.8zm-1.4-5.3-1.7.4v2.2c0-.8-.3 2.1-.3 2.1l1.7.6.3-2.7v-2.6m-5.6 13.7a15.7 15.7 0 0 1-4.8 2.6l-.4-1.6a13.7 13.7 0 0 0 4-2l1.2 1m.8 1.4a17.4 17.4 0 0 1-4.8 2.6l1.2 1.1a18.6 18.6 0 0 0 4-2l-.4-1.7m-2.2-9.4-1.6.7-2.9-3.3 1-1.4 3.5 4m1.3-1 1-1.4-3-3.3-1.6.7 3.6 4m-20.1-8.7.5 1.6h4.5l.5-1.6h-5.5m21.1 0-.5 1.6h-4.5l-.5-1.6h5.5m-11.6 21.9c0-.6.5-1 1.1-1a1 1 0 0 1 1.1 1c0 .6-.5 1-1 1a1.1 1.1 0 0 1-1.2-1zm1.9-7.8 1.7-.4v-4.3l-1.7-.5v5.2m-1.6 0-1.7-.4v-4.3l1.7-.5v5.2");
    			add_location(path326, file$9, 1401, 1, 57351);
    			attr_dev(path327, "fill", "#c8b100");
    			attr_dev(path327, "d", "M211.5 294.2c.2-1 1-1.6 1.8-2V287h1.6v5.3c.8.3 1.5.9 1.7 1.6h4.4v.3h-6a1.2 1.2 0 0 0-1-.6c-.4 0-.7.3-1 .6h-1.5m12.2 0v-.3h4.1a2.4 2.4 0 0 1 .2-.3l-5-5.7 1.2-1 5 5.6.2-.1V285h1.6v7.3h.3l4.9-5.5 1.2 1-4.9 5.5.3.6h4v.3h-13zm21.6 0a1.1 1.1 0 0 1 1-.6c.5 0 .8.3 1 .6h1.6c-.2-1-.9-1.6-1.8-2V287h-1.6v5.3c-.8.3-1.4.8-1.7 1.6h-4.4v.3h6m-30.2-15 6 6.8 1.3-1-6.1-6.7.3-.6h4.4V276h-4.4a2.6 2.6 0 0 0-2.5-1.7 2.6 2.6 0 0 0-2.7 2.5 2.5 2.5 0 0 0 1.8 2.4v5.2h1.6v-5.2h.3zm32 0v5.3h-1.7v-5.2a2.5 2.5 0 0 1-.4-.2l-6 6.8-1.3-1 6.2-6.9-.1-.3h-4.5V276h4.5a2.6 2.6 0 0 1 2.4-1.7 2.6 2.6 0 0 1 2.7 2.5 2.5 2.5 0 0 1-1.9 2.4zm-16.1 0v3.3h-1.7v-3.2a2.6 2.6 0 0 1-1.7-1.6h-4V276h4a2.6 2.6 0 0 1 2.5-1.7c1.2 0 2.2.7 2.5 1.7h4v1.6h-4a2.5 2.5 0 0 1-1.6 1.6zm-17.8 4-1.7.4v4.3l1.7.5v-5.2m1.6 0 1.7.4v4.3l-1.7.5v-5.2m30.6 0-1.7.4v4.3l1.7.5v-5.2m1.6 0 1.7.4v4.3l-1.7.5v-5.2m-25.5.8 1.6-.7 2.9 3.3-1 1.4-3.5-4m-1.3 1-1 1.4 3 3.3 1.6-.7-3.6-4m18.5-1.1-1.6-.7-3 3.3 1 1.4 3.6-4m1.2 1 1 1.4-3 3.3-1.5-.7 3.5-4m-20.3 9 .5-1.6h4.5l.5 1.6h-5.5m-6.7-17c0-.6.5-1 1.2-1a1 1 0 0 1 1 1c0 .6-.4 1-1 1a1.1 1.1 0 0 1-1.2-1zm12.1.8-.5 1.6h-4.5l-.5-1.6h5.5m0-1.6-.5-1.6h-4.5l-.5 1.6h5.5m15.7 17.8-.5-1.6h-4.5l-.5 1.6h5.5m4.4-17c0-.6.5-1 1.1-1a1 1 0 0 1 1.1 1c0 .6-.5 1-1 1a1.1 1.1 0 0 1-1.2-1zm-16.1 0c0-.6.5-1 1.1-1a1 1 0 0 1 1.1 1c0 .6-.5 1-1.1 1a1.1 1.1 0 0 1-1.1-1zm6.2.8.5 1.6h4.6l.5-1.6h-5.6m0-1.6.5-1.6h4.6l.5 1.6h-5.6m-5.9 5-1.7.5v4.3l1.7.5V281m1.7 0 1.6.5v4.3l-1.6.5V281");
    			add_location(path327, file$9, 1405, 1, 59390);
    			attr_dev(path328, "fill", "none");
    			attr_dev(path328, "stroke", "#c8b100");
    			attr_dev(path328, "stroke-width", ".3");
    			attr_dev(path328, "d", "M232.7 316.3a15.6 15.6 0 0 0 3.7-1.1l.8 1.4a17.6 17.6 0 0 1-4.3 1.2 2.6 2.6 0 0 1-2.6 2 2.6 2.6 0 0 1-2.5-2 17.5 17.5 0 0 1-4.6-1.2l.8-1.4c1.3.5 2.6.9 4 1a2.5 2.5 0 0 1 1.5-1.3v-6.7h1.6v6.7c.7.2 1.3.7 1.6 1.4zm-4.7-20.4a2.3 2.3 0 0 1-.2-.5h-4V294h4a2.6 2.6 0 0 1 .2-.4l-5-5.6 1.2-1 5 5.5a2.2 2.2 0 0 1 .2 0V285h1.7v7.3h.2l4.9-5.5 1.2 1-4.9 5.5.3.6h4v1.5h-4c0 .2-.2.4-.3.5l4.7 5.3-1.3 1-4.6-5.3-.2.1v8.7h-1.6V297l-.2-.1-4.8 5.3-1.2-1 4.7-5.3m-12.8-16.7 6 6.8 1.3-1-6.1-6.7.3-.6h4.4V276h-4.4a2.6 2.6 0 0 0-2.5-1.7 2.6 2.6 0 0 0-2.6 2.5 2.5 2.5 0 0 0 1.7 2.4v5.2h1.6v-5.2h.3zm6.5 34.8-.8 1.4a16.6 16.6 0 0 1-3.6-3.1c-.9.2-1.8 0-2.5-.5a2.4 2.4 0 0 1-.3-3.5l.1-.1a15.3 15.3 0 0 1-1.2-4.8h1.6a13.1 13.1 0 0 0 1 4c.5 0 1 0 1.4.2l4.1-4.5 1.3 1-4.1 4.5c.6.9.5 2-.1 2.8a15.2 15.2 0 0 0 3.1 2.6zm-8.4-13.1V297a2.5 2.5 0 0 1-1.8-2.4c0-1 .8-2 1.8-2.4V287h1.6v5.3c.8.2 1.5.8 1.7 1.6h4.4v1.5h-4.4a2.6 2.6 0 0 1-1.6 1.6v3.9h-1.7m2.3 8.3c.4-.4 1.1-.5 1.6 0s.5 1 .1 1.4a1.2 1.2 0 0 1-1.6.1 1 1 0 0 1 0-1.5zm-2-4.5-1.7-.3-.3-4.3 1.7-.6v2.5c0 1 0 1.8.3 2.7zm1.4-5.3 1.6.4v2.2c0-.8.3 2.1.3 2.1l-1.7.6-.3-2.7v-2.6zm5.5 13.7a15.7 15.7 0 0 0 4.8 2.6l.4-1.6a13.7 13.7 0 0 1-4-2l-1.2 1m-.8 1.4a17.4 17.4 0 0 0 4.8 2.6l-1.2 1.1a18.7 18.7 0 0 1-4-2l.4-1.7");
    			add_location(path328, file$9, 1409, 1, 60857);
    			attr_dev(path329, "fill", "none");
    			attr_dev(path329, "stroke", "#c8b100");
    			attr_dev(path329, "stroke-width", ".3");
    			attr_dev(path329, "d", "m221.9 305.1 1.6.7 3-3.3-1-1.4-3.6 4m-1.3-1-1-1.4 3-3.3 1.6.7-3.6 4m-7.6-9.5c0-.6.5-1 1-1 .7 0 1.2.5 1.2 1 0 .6-.5 1.1-1.1 1.1a1 1 0 0 1-1.1-1zm25.7 19.4.8 1.4a16.7 16.7 0 0 0 3.6-3.1c.9.2 1.8 0 2.6-.5a2.4 2.4 0 0 0 .2-3.5l-.1-.1a15 15 0 0 0 1.3-4.8h-1.7a13.3 13.3 0 0 1-1 4 3 3 0 0 0-1.4.2l-4.1-4.5-1.3 1 4.1 4.5a2.4 2.4 0 0 0 .1 2.8 15 15 0 0 1-3 2.6zm8.4-13.1V297a2.5 2.5 0 0 0 1.8-2.4c0-1-.7-2-1.8-2.4V287h-1.6v5.3c-.8.2-1.4.8-1.7 1.6h-4.4v1.5h4.4c.3.8.9 1.3 1.7 1.6v3.9h1.6zm-2.3 8.3a1.2 1.2 0 0 0-1.6 0 1 1 0 0 0-.1 1.4 1.2 1.2 0 0 0 1.6.1 1 1 0 0 0 0-1.5zm2-4.5 1.7-.3.3-4.3-1.7-.6v2.5c0 1 0 1.8-.2 2.7zm-1.3-5.3-1.7.4v2.2c0-.8-.3 2.1-.3 2.1l1.7.6.3-2.7v-2.6m1.6-20.1v5.2h-1.6v-5.2a2.3 2.3 0 0 1-.4-.2l-6 6.8-1.2-1 6-7v-.2h-4.5V276h4.4a2.6 2.6 0 0 1 2.5-1.7 2.6 2.6 0 0 1 2.6 2.5 2.5 2.5 0 0 1-1.8 2.4zm-16 0v3.2h-1.7v-3.2a2.6 2.6 0 0 1-1.7-1.6h-4V276h4c.4-1 1.3-1.7 2.5-1.7s2.2.7 2.5 1.7h4v1.6h-4a2.5 2.5 0 0 1-1.6 1.6zm8.8 33.8a15.7 15.7 0 0 1-4.8 2.6l-.4-1.6a13.7 13.7 0 0 0 4-2l1.2 1m.8 1.4a17.4 17.4 0 0 1-4.8 2.6l1.2 1.1a18.7 18.7 0 0 0 4-2l-.4-1.7m-27.4-31.4-1.7.5v4.3l1.7.5v-5.2m1.7 0 1.6.4v4.3l-1.6.5V283m30.5 0-1.7.5v4.3l1.7.5V283");
    			add_location(path329, file$9, 1415, 1, 62155);
    			attr_dev(path330, "fill", "none");
    			attr_dev(path330, "stroke", "#c8b100");
    			attr_dev(path330, "stroke-width", ".3");
    			attr_dev(path330, "d", "m247.1 283.1 1.7.5v4.3l-1.7.5V283m-8.6 22-1.6.7-2.9-3.3 1-1.4 3.5 4m1.3-1 1-1.4-3-3.3-1.6.7 3.6 4m-18.2-20 1.6-.7 3 3.3-1 1.4-3.6-4m-1.3 1-1 1.4 3 3.3 1.6-.7-3.6-4m18.5-1.1-1.6-.7-3 3.3 1 1.4 3.6-4m1.2 1 1 1.4-3 3.2-1.5-.6 3.5-4m-20.3 9 .5-1.6h4.5l.5 1.6h-5.5m0 1.5.5 1.6h4.5l.5-1.6h-5.5M213 277c0-.6.5-1 1.2-1 .6 0 1 .4 1 1s-.4 1-1 1a1 1 0 0 1-1.2-1zm12.1.8-.5 1.6h-4.5l-.5-1.6h5.5m0-1.6-.5-1.6h-4.5l-.5 1.6h5.5m20.1 18.5c0-.5.5-1 1.1-1 .6 0 1.1.5 1.1 1 0 .6-.5 1.1-1 1.1a1 1 0 0 1-1.2-1zm-4.4-.7-.5-1.6h-4.5l-.5 1.6h5.5m0 1.5-.5 1.6h-4.5l-.5-1.6h5.5m-11.6 21.9c0-.6.5-1 1.1-1 .6 0 1.1.4 1.1 1s-.5 1-1 1a1.1 1.1 0 0 1-1.2-1zm1.9-7.8 1.7-.4v-4.3l-1.7-.5v5.2m-1.6 0-1.7-.4v-4.3l1.7-.5v5.2m15.7-32.6c0-.6.5-1 1.1-1a1 1 0 0 1 1.1 1c0 .6-.5 1-1 1a1.1 1.1 0 0 1-1.2-1zm-16.1 0c0-.6.5-1 1.1-1a1 1 0 0 1 1.1 1c0 .6-.5 1-1 1a1.1 1.1 0 0 1-1.2-1zm6.2.8.5 1.6h4.6l.5-1.6h-5.5m0-1.6.4-1.6h4.6l.5 1.6h-5.5m-6 5-1.6.5v4.3l1.6.5V281m1.7 0 1.6.5v4.3l-1.6.5V281");
    			add_location(path330, file$9, 1421, 1, 63373);
    			attr_dev(path331, "fill", "#058e6e");
    			attr_dev(path331, "d", "M227.7 294.7a2.6 2.6 0 0 1 2.6-2.5 2.6 2.6 0 0 1 2.6 2.5 2.6 2.6 0 0 1-2.6 2.4c-1.4 0-2.6-1-2.6-2.4");
    			add_location(path331, file$9, 1427, 1, 64389);
    			attr_dev(path332, "fill", "#db4446");
    			attr_dev(path332, "d", "M230.9 229.7v-.6l.1-.3-2.3-.1a5.9 5.9 0 0 1-2.3-1.2c-.8-.7-1.1-1-1.6-1.2-1.3-.2-2.3.4-2.3.4s1 .4 1.7 1.3 1.5 1.3 1.8 1.4c.6.2 2.6 0 3.1.1l1.8.2");
    			add_location(path332, file$9, 1431, 1, 64523);
    			attr_dev(path333, "fill", "none");
    			attr_dev(path333, "stroke", "#000");
    			attr_dev(path333, "stroke-width", ".4");
    			attr_dev(path333, "d", "M230.9 229.7v-.6l.1-.3-2.3-.1a5.9 5.9 0 0 1-2.3-1.2c-.8-.7-1.1-1-1.6-1.2-1.3-.2-2.3.4-2.3.4s1 .4 1.7 1.3 1.5 1.3 1.8 1.4c.6.2 2.6 0 3.1.1l1.8.2z");
    			add_location(path333, file$9, 1435, 1, 64701);
    			attr_dev(path334, "fill", "#ed72aa");
    			attr_dev(path334, "stroke", "#000");
    			attr_dev(path334, "stroke-width", ".4");
    			attr_dev(path334, "d", "M238.1 227.5v1.4c.2.6-.1 1.2 0 1.5 0 .4.1.6.3.9l.2.9-.7-.5-.6-.4v1c.1.2.3.8.6 1.1l1 1.3c.2.5.1 1.4.1 1.4s-.4-.7-.8-.8l-1.2-.7s.7.8.7 1.5c0 .8-.3 1.6-.3 1.6s-.3-.7-.8-1.1l-1-.9s.4 1.2.4 2v2.3l-.9-1-1-.7c0-.2.5.6.6 1.1 0 .5.3 2.3 1.8 4.5 1 1.3 2.3 3.6 5.3 2.9 3-.8 1.9-4.8 1.3-6.7a16.8 16.8 0 0 1-1-4.6c0-.8.6-2.9.5-3.3a8 8 0 0 1 .2-3.1c.4-1.3.7-1.8.9-2.3.2-.6.4-.9.4-1.3l.1-1.3.7 1.3.1 1.5s.1-1 1-1.6c.8-.6 1.8-1.1 2-1.4.3-.3.3-.5.3-.5s0 1.8-.6 2.6l-1.7 2s.7-.3 1.2-.3h.9s-.6.4-1.4 1.6c-.8 1-.5 1.2-1 2.1-.6 1-1 1-1.7 1.5-1 .8-.5 4.2-.4 4.7.2.5 2 4.5 2 5.5s.2 3.2-1.5 4.6c-1.1 1-3 1-3.4 1.2-.4.3-1.2 1.1-1.2 2.8 0 1.7.6 2 1 2.4.6.5 1.2.2 1.3.6.2.3.2.5.5.7.2.2.3.4.2.8 0 .3-.8 1.1-1.1 1.7l-.8 2.4c0 .2-.1 1 .1 1.3 0 0 .9 1 .3 1.2-.4.2-.8-.2-1-.2l-.9.5c-.3-.1-.3-.3-.4-.8l-.1-.7c-.2 0-.3.2-.4.5 0 .2 0 .8-.3.8-.2 0-.5-.4-.8-.5-.2 0-.8-.2-.8-.4 0-.3.4-.9.7-1 .4 0 .8-.3.5-.5s-.5-.2-.7 0-.8 0-.7-.2v-.8c0-.2-.4-.5.1-.8.6-.3.8.2 1.4.1.6 0 .8-.3 1-.6.2-.3.2-1-.2-1.4-.4-.5-.7-.5-.9-.8l-.3-.9v2.2l-.7-.8c-.3-.3-.6-1.3-.6-1.3v1.3c0 .4.3.7.2.8-.1.1-.8-.7-1-.8a3.7 3.7 0 0 1-1-1l-.4-1.4a4.2 4.2 0 0 1 0-1.5l.4-1h-1.4c-.7 0-1.2-.3-1.5.2-.3.5-.2 1.5.2 2.8.3 1.2.5 1.9.4 2.1a3 3 0 0 1-.7.8h-.9a2.5 2.5 0 0 0-1.2-.3h-1.3l-1.1-.3c-.3.1-.8.3-.6.7.2.6-.2.7-.5.7l-.9-.2c-.4-.1-.9 0-.8-.4 0-.4.2-.4.4-.7.2-.3.2-.5 0-.5h-.6c-.2.2-.5.5-.8.4-.2-.1-.4-.4-.4-1s-.7-1.2 0-1.1c.5 0 1.3.4 1.4 0 .2-.3 0-.4-.2-.7s-.8-.4-.3-.7l.7-.5c.1-.2.4-.8.7-.6.6.2 0 .7.6 1.3.6.7 1 1 2 .8 1 0 1.3-.2 1.3-.5l-.1-1v-1s-.4.3-.5.6l-.4.8v-2a8 8 0 0 0-.2-.8l-.3.9-.1 1s-.7-.5-.5-1.5c.1-.7-.1-1.6.1-2 .2-.3.7-1.5 2-1.6h2.6l2-.3s-2.8-1.4-3.5-1.9a9.5 9.5 0 0 1-2-2l-.6-1.6s-.5 0-1 .3a5 5 0 0 0-1.2 1l-.7 1 .1-1.2v-.8s-.4 1.2-1 1.7l-1.4 1v-.8l.2-1s-.4.8-1.1 1c-.7 0-1.8 0-1.9.4 0 .5.2 1 0 1.4 0 .3-.4.5-.4.5l-.8-.4c-.4 0-.7.2-.7.2s-.3-.4-.2-.7c.1-.2.7-.6.5-.8l-.8.2c-.3.1-.8.3-.8-.2 0-.4.2-.7 0-1 0-.3 0-.5.2-.6l1.2-.1c0-.2-.2-.5-.8-.6-.6-.1-.8-.5-.5-.8.3-.2.3-.3.5-.6.1-.2.2-.7.7-.5.5.3.4.8 1 1a4 4 0 0 0 2-.2l1.5-1 1.5-1-1-.8c-.3-.3-.7-.9-1-1a8.3 8.3 0 0 0-1.8-.6 9 9 0 0 1-1.7-.5l.8-.3c.2-.2.6-.6.8-.6h.3-1.4c-.3-.1-1-.6-1.3-.6l-.8.1s.8-.4 1.4-.5l1-.1s-.9-.3-1.1-.6l-.6-1c-.2-.1-.3-.5-.6-.5l-1 .3c-.4 0-.6-.2-.6-.6l-.1-.5c-.2-.3-.6-.8-.2-1h1.4c0-.2-.5-.6-.8-.8-.4-.2-1-.5-.7-.8l.8-.5c.2-.3.3-1 .7-.7.4.2.8 1.2 1.1 1.1.3 0 .3-.8.3-1 0-.4 0-1 .2-.9.3 0 .5.4 1 .5.4 0 1-.1 1 .2 0 .3-.3.7-.6 1-.3.3-.4 1-.3 1.4.2.5.7 1.2 1.2 1.4.4.3 1.2.5 1.7.9.5.3 1.7 1.2 2.1 1.3l.8.4s.5-.2 1.1-.2c.7 0 2.1 0 2.6-.2.6-.2 1.3-.6 1-1-.1-.6-1.3-1-1.2-1.4 0-.4.5-.4 1.2-.4.8 0 1.8.1 2-1 .2-1 .2-1.5-.8-1.8-1-.2-1.8-.2-2-1-.2-.7-.4-.9-.2-1.1.3-.2.6-.3 1.4-.4.8 0 1.6 0 1.9-.2.2-.2.3-.7.6-.9.3-.2 1.4-.4 1.4-.4s1.4.7 2.7 1.7a15 15 0 0 1 2.2 2.1");
    			add_location(path334, file$9, 1441, 1, 64913);
    			attr_dev(path335, "d", "m228.1 226.8-.2-.6v-.3s.8 0 .7.3c0 .2-.2.2-.3.3l-.2.3");
    			add_location(path335, file$9, 1447, 1, 67654);
    			attr_dev(path336, "fill", "none");
    			attr_dev(path336, "stroke", "#000");
    			attr_dev(path336, "stroke-width", ".3");
    			attr_dev(path336, "d", "m228.1 226.8-.2-.6v-.3s.8 0 .7.3c0 .2-.2.2-.3.3l-.2.3z");
    			add_location(path336, file$9, 1448, 1, 67722);
    			attr_dev(path337, "d", "M232 225.4v-.4s.7 0 1 .3c.5.4.9 1 .9 1l-.8-.4h-.5l-.3-.1v-.3h-.3");
    			add_location(path337, file$9, 1454, 1, 67844);
    			attr_dev(path338, "fill", "none");
    			attr_dev(path338, "stroke", "#000");
    			attr_dev(path338, "stroke-width", ".1");
    			attr_dev(path338, "d", "M232 225.4v-.4s.7 0 1 .3c.5.4.9 1 .9 1l-.8-.4h-.5l-.3-.1v-.3h-.3z");
    			add_location(path338, file$9, 1455, 1, 67923);
    			attr_dev(path339, "fill", "none");
    			attr_dev(path339, "stroke", "#000");
    			attr_dev(path339, "stroke-width", ".3");
    			attr_dev(path339, "d", "m237.3 231.3-.4-.7a8 8 0 0 1-.3-.4");
    			add_location(path339, file$9, 1461, 1, 68056);
    			attr_dev(path340, "fill", "#db4446");
    			attr_dev(path340, "d", "M217.4 226.6s.5.4.8.4h.8s.2-.5.1-.8c-.2-1.2-1.2-1.4-1.2-1.4s.3.7.1 1a2 2 0 0 1-.6.8");
    			add_location(path340, file$9, 1462, 1, 68149);
    			attr_dev(path341, "fill", "none");
    			attr_dev(path341, "stroke", "#000");
    			attr_dev(path341, "stroke-width", ".4");
    			attr_dev(path341, "d", "M217.4 226.6s.5.4.8.4h.8s.2-.5.1-.8c-.2-1.2-1.2-1.4-1.2-1.4s.3.7.1 1a2 2 0 0 1-.6.8z");
    			add_location(path341, file$9, 1466, 1, 68267);
    			attr_dev(path342, "fill", "#db4446");
    			attr_dev(path342, "d", "M215.2 227.6s-.4-.7-1.3-.6c-.8 0-1.4.8-1.4.8h1.2c.3.3.4 1 .4 1l.7-.6a7.2 7.2 0 0 0 .4-.6");
    			add_location(path342, file$9, 1472, 1, 68419);
    			attr_dev(path343, "fill", "none");
    			attr_dev(path343, "stroke", "#000");
    			attr_dev(path343, "stroke-width", ".4");
    			attr_dev(path343, "d", "M215.2 227.6s-.4-.7-1.3-.6c-.8 0-1.4.8-1.4.8h1.2c.3.3.4 1 .4 1l.7-.6a7.2 7.2 0 0 0 .4-.6z");
    			add_location(path343, file$9, 1476, 1, 68542);
    			attr_dev(path344, "fill", "#db4446");
    			attr_dev(path344, "d", "M214.2 230.6s-.8.1-1.2.6c-.4.5-.3 1.3-.3 1.3s.4-.5.9-.5l1 .2-.1-.8-.3-.8");
    			add_location(path344, file$9, 1482, 1, 68699);
    			attr_dev(path345, "fill", "none");
    			attr_dev(path345, "stroke", "#000");
    			attr_dev(path345, "stroke-width", ".4");
    			attr_dev(path345, "d", "M214.2 230.6s-.8.1-1.2.6c-.4.5-.3 1.3-.3 1.3s.4-.5.9-.5l1 .2-.1-.8-.3-.8z");
    			add_location(path345, file$9, 1486, 1, 68806);
    			attr_dev(path346, "d", "m228.2 230.5.3-.5.3.5h-.7");
    			add_location(path346, file$9, 1492, 1, 68947);
    			attr_dev(path347, "fill", "none");
    			attr_dev(path347, "stroke", "#000");
    			attr_dev(path347, "stroke-width", ".3");
    			attr_dev(path347, "d", "m228.2 230.5.3-.5.3.5h-.7");
    			add_location(path347, file$9, 1493, 1, 68987);
    			attr_dev(path348, "d", "m229 230.5.3-.5.4.5h-.8");
    			add_location(path348, file$9, 1494, 1, 69071);
    			attr_dev(path349, "fill", "none");
    			attr_dev(path349, "stroke", "#000");
    			attr_dev(path349, "stroke-width", ".3");
    			attr_dev(path349, "d", "m229 230.5.3-.5.4.5h-.8");
    			add_location(path349, file$9, 1495, 1, 69109);
    			attr_dev(path350, "d", "m228.6 227.3.8.3-.7.4-.1-.6");
    			add_location(path350, file$9, 1496, 1, 69191);
    			attr_dev(path351, "fill", "none");
    			attr_dev(path351, "stroke", "#000");
    			attr_dev(path351, "stroke-width", ".3");
    			attr_dev(path351, "d", "m228.6 227.3.8.3-.7.4-.1-.6");
    			add_location(path351, file$9, 1497, 1, 69233);
    			attr_dev(path352, "d", "m229.5 227.6.7.2-.5.4-.2-.6");
    			add_location(path352, file$9, 1498, 1, 69319);
    			attr_dev(path353, "fill", "none");
    			attr_dev(path353, "stroke", "#000");
    			attr_dev(path353, "stroke-width", ".3");
    			attr_dev(path353, "d", "m229.5 227.6.7.2-.5.4-.2-.6");
    			add_location(path353, file$9, 1499, 1, 69361);
    			attr_dev(path354, "fill", "none");
    			attr_dev(path354, "stroke", "#000");
    			attr_dev(path354, "stroke-width", ".4");
    			attr_dev(path354, "d", "M224.2 233.7s-.7.2-1 .6c-.4.5-.3 1-.3 1s.6-.5 1.5-.3l1.2.3 1.3-.3s-.7.8-.7 1.3l.2 1.1c0 .7-.6 1.6-.6 1.6l1-.3a4.6 4.6 0 0 0 1.7-.8l.9-1s-.2 1 0 1.4l.2 1.6.8-.6c.2-.1.7-.4.9-.7l.3-1s0 .8.4 1.3l.6 1.6s.3-.8.6-1.1c.3-.4.7-.8.7-1a4.3 4.3 0 0 0-.1-.9l.4.8m-11 .6s.5-.8 1-1l1.1-.8.9-.4m1 5 1.3-.8a4 4 0 0 0 1-1");
    			add_location(path354, file$9, 1500, 1, 69447);
    			attr_dev(path355, "fill", "#db4446");
    			attr_dev(path355, "d", "M216.6 240.4s-.4-.5-1.1-.3c-.7 0-1.2.9-1.2.9s.6-.2 1-.1.6.4.6.4l.4-.4.3-.6");
    			add_location(path355, file$9, 1506, 1, 69819);
    			attr_dev(path356, "fill", "none");
    			attr_dev(path356, "stroke", "#000");
    			attr_dev(path356, "stroke-width", ".4");
    			attr_dev(path356, "d", "M216.6 240.4s-.4-.5-1.1-.3c-.7 0-1.2.9-1.2.9s.6-.2 1-.1.6.4.6.4l.4-.4.3-.6z");
    			add_location(path356, file$9, 1510, 1, 69928);
    			attr_dev(path357, "fill", "#db4446");
    			attr_dev(path357, "d", "M215.8 243.2s-.6 0-1.1.3c-.5.4-.5 1.2-.5 1.2s.4-.4.8-.3l.9.2v-.6c.2-.4-.1-.8-.1-.8");
    			add_location(path357, file$9, 1516, 1, 70071);
    			attr_dev(path358, "fill", "none");
    			attr_dev(path358, "stroke", "#000");
    			attr_dev(path358, "stroke-width", ".4");
    			attr_dev(path358, "d", "M215.8 243.2s-.6 0-1.1.3c-.5.4-.5 1.2-.5 1.2s.4-.4.8-.3l.9.2v-.6c.2-.4-.1-.8-.1-.8z");
    			add_location(path358, file$9, 1520, 1, 70188);
    			attr_dev(path359, "fill", "#db4446");
    			attr_dev(path359, "d", "M217.2 245.8s0 .8.3 1.3c.4.5 1.1.5 1.1.5l-.3-.7c0-.4.3-.8.3-.8s-.3-.3-.7-.3h-.7");
    			add_location(path359, file$9, 1526, 1, 70339);
    			attr_dev(path360, "fill", "none");
    			attr_dev(path360, "stroke", "#000");
    			attr_dev(path360, "stroke-width", ".4");
    			attr_dev(path360, "d", "M217.2 245.8s0 .8.3 1.3c.4.5 1.1.5 1.1.5l-.3-.7c0-.4.3-.8.3-.8s-.3-.3-.7-.3h-.7zm16 1.3s2 1.2 1.9 2.2c0 1-1 2.3-1 2.3");
    			add_location(path360, file$9, 1530, 1, 70453);
    			attr_dev(path361, "fill", "#db4446");
    			attr_dev(path361, "d", "M224.2 252.6s-.4-.6-1.1-.6c-.7 0-1.4.7-1.4.7s.8-.1 1 .2l.5.6.5-.3.5-.6");
    			add_location(path361, file$9, 1536, 1, 70638);
    			attr_dev(path362, "fill", "none");
    			attr_dev(path362, "stroke", "#000");
    			attr_dev(path362, "stroke-width", ".4");
    			attr_dev(path362, "d", "M224.2 252.6s-.4-.6-1.1-.6c-.7 0-1.4.7-1.4.7s.8-.1 1 .2l.5.6.5-.3.5-.6z");
    			add_location(path362, file$9, 1537, 1, 70738);
    			attr_dev(path363, "fill", "#db4446");
    			attr_dev(path363, "d", "M222.2 255.3s-1-.1-1.4.3c-.4.5-.4 1.3-.4 1.3s.6-.6 1-.5c.5 0 1 .3 1 .3v-.7l-.3-.7");
    			add_location(path363, file$9, 1543, 1, 70877);
    			attr_dev(path364, "fill", "none");
    			attr_dev(path364, "stroke", "#000");
    			attr_dev(path364, "stroke-width", ".4");
    			attr_dev(path364, "d", "M222.2 255.3s-1-.1-1.4.3c-.4.5-.4 1.3-.4 1.3s.6-.6 1-.5c.5 0 1 .3 1 .3v-.7l-.3-.7z");
    			add_location(path364, file$9, 1547, 1, 70993);
    			attr_dev(path365, "fill", "#db4446");
    			attr_dev(path365, "d", "M224 258.1s-.3.7 0 1.1c.3.5 1 .8 1 .8s-.3-.4-.2-.8c.1-.3.7-.8.7-.8l-1.4-.2");
    			add_location(path365, file$9, 1553, 1, 71143);
    			attr_dev(path366, "fill", "none");
    			attr_dev(path366, "stroke", "#000");
    			attr_dev(path366, "stroke-width", ".4");
    			attr_dev(path366, "d", "M224 258.1s-.3.7 0 1.1c.3.5 1 .8 1 .8s-.3-.4-.2-.8c.1-.3.7-.8.7-.8l-1.4-.2z");
    			add_location(path366, file$9, 1557, 1, 71252);
    			attr_dev(path367, "fill", "#db4446");
    			attr_dev(path367, "d", "M236 259.3s-.8-.2-1.2 0c-.5.3-.8 1.4-.8 1.4s.7-.6 1.2-.5c.5 0 1 .3 1 .3v-.8l-.2-.4");
    			add_location(path367, file$9, 1563, 1, 71395);
    			attr_dev(path368, "fill", "none");
    			attr_dev(path368, "stroke", "#000");
    			attr_dev(path368, "stroke-width", ".4");
    			attr_dev(path368, "d", "M236 259.3s-.8-.2-1.2 0c-.5.3-.8 1.4-.8 1.4s.7-.6 1.2-.5c.5 0 1 .3 1 .3v-.8l-.2-.4z");
    			add_location(path368, file$9, 1567, 1, 71512);
    			attr_dev(path369, "fill", "#db4446");
    			attr_dev(path369, "d", "M236.4 262.2s-.6.6-.4 1.1l.6 1s0-.7.2-1l1-.3-.7-.5a15.8 15.8 0 0 1-.7-.3");
    			add_location(path369, file$9, 1573, 1, 71663);
    			attr_dev(path370, "fill", "none");
    			attr_dev(path370, "stroke", "#000");
    			attr_dev(path370, "stroke-width", ".4");
    			attr_dev(path370, "d", "M236.4 262.2s-.6.6-.4 1.1l.6 1s0-.7.2-1l1-.3-.7-.5a15.8 15.8 0 0 1-.7-.3z");
    			add_location(path370, file$9, 1577, 1, 71770);
    			attr_dev(path371, "fill", "#db4446");
    			attr_dev(path371, "d", "M239.4 263s-.3.8.2 1.3c.6.5 1 .5 1 .5s-.3-.7-.2-1.1c.1-.5.5-.7.5-.7l-.8-.2-.7.3");
    			add_location(path371, file$9, 1583, 1, 71911);
    			attr_dev(path372, "fill", "none");
    			attr_dev(path372, "stroke", "#000");
    			attr_dev(path372, "stroke-width", ".4");
    			attr_dev(path372, "d", "M239.4 263s-.3.8.2 1.3c.6.5 1 .5 1 .5s-.3-.7-.2-1.1c.1-.5.5-.7.5-.7l-.8-.2-.7.3z");
    			add_location(path372, file$9, 1587, 1, 72025);
    			attr_dev(path373, "fill", "#ffd691");
    			attr_dev(path373, "stroke", "#000");
    			attr_dev(path373, "stroke-width", ".5");
    			attr_dev(path373, "d", "M208.8 316.4c2 .6 3 2 3 3.8 0 2.3-2.2 4-5 4-3 0-5.3-1.7-5.3-4 0-1.7 1-3.6 3-3.8l-.2-.4-.7-.7h1.2l.8.5.5-.7c.3-.4.6-.5.6-.5l.6.6.3.5.7-.4.8-.3s0 .4-.2.7l-.1.7");
    			add_location(path373, file$9, 1593, 1, 72173);
    			attr_dev(path374, "fill", "#058e6e");
    			attr_dev(path374, "stroke", "#000");
    			attr_dev(path374, "stroke-width", ".5");
    			attr_dev(path374, "d", "M206.3 326.7s-3.8-2.6-5.5-3c-2-.4-4.5 0-5.5 0 0 0 1.2.8 1.8 1.4.5.5 2.3 1.5 3.3 1.8 3 .8 6-.2 6-.2m1 .2s2.4-2.5 5-2.9c3-.4 5 .3 6.2.6l-1.5.8c-.5.3-2 1.5-4 1.6-2 0-4.4-.3-4.8-.2l-.9.1");
    			add_location(path374, file$9, 1599, 1, 72401);
    			attr_dev(path375, "fill", "#ad1519");
    			attr_dev(path375, "stroke", "#000");
    			attr_dev(path375, "stroke-width", ".5");
    			attr_dev(path375, "d", "M206.7 323.8a4.8 4.8 0 0 1 0-7.1 4.8 4.8 0 0 1 1.5 3.5 4.9 4.9 0 0 1-1.5 3.6");
    			add_location(path375, file$9, 1605, 1, 72654);
    			attr_dev(path376, "fill", "#058e6e");
    			attr_dev(path376, "stroke", "#000");
    			attr_dev(path376, "stroke-width", ".5");
    			attr_dev(path376, "d", "M205.7 329s.6-1.5.6-2.7l-.1-2.1h.8s.3 1.1.3 2l-.1 2.4-.7.1-.8.3");
    			add_location(path376, file$9, 1611, 1, 72801);
    			attr_dev(path377, "fill", "#fff");
    			attr_dev(path377, "d", "M254 190.7c0-.5.5-1 1-1 .6 0 1.1.5 1.1 1 0 .6-.5 1-1 1a1 1 0 0 1-1-1");
    			add_location(path377, file$9, 1617, 1, 72935);
    			attr_dev(path378, "fill", "none");
    			attr_dev(path378, "stroke", "#000");
    			attr_dev(path378, "stroke-width", ".4");
    			attr_dev(path378, "d", "M254 190.7c0-.5.5-1 1-1 .6 0 1.1.5 1.1 1 0 .6-.5 1-1 1a1 1 0 0 1-1-1z");
    			add_location(path378, file$9, 1618, 1, 73030);
    			attr_dev(path379, "fill", "#fff");
    			attr_dev(path379, "d", "M255.4 188.2c0-.6.5-1 1.1-1 .6 0 1 .4 1 1s-.4 1-1 1a1 1 0 0 1-1-1");
    			add_location(path379, file$9, 1624, 1, 73167);
    			attr_dev(path380, "fill", "none");
    			attr_dev(path380, "stroke", "#000");
    			attr_dev(path380, "stroke-width", ".4");
    			attr_dev(path380, "d", "M255.4 188.2c0-.6.5-1 1.1-1 .6 0 1 .4 1 1s-.4 1-1 1a1 1 0 0 1-1-1z");
    			add_location(path380, file$9, 1625, 1, 73259);
    			attr_dev(path381, "fill", "#fff");
    			attr_dev(path381, "d", "M256.4 185.2c0-.5.5-1 1-1 .6 0 1.1.5 1.1 1s-.5 1-1 1a1 1 0 0 1-1.1-1");
    			add_location(path381, file$9, 1631, 1, 73393);
    			attr_dev(path382, "fill", "none");
    			attr_dev(path382, "stroke", "#000");
    			attr_dev(path382, "stroke-width", ".4");
    			attr_dev(path382, "d", "M256.4 185.2c0-.5.5-1 1-1 .6 0 1.1.5 1.1 1s-.5 1-1 1a1 1 0 0 1-1.1-1z");
    			add_location(path382, file$9, 1632, 1, 73488);
    			attr_dev(path383, "fill", "#fff");
    			attr_dev(path383, "d", "M256.5 182c0-.5.5-1 1-1 .6 0 1.1.5 1.1 1 0 .6-.5 1-1 1a1 1 0 0 1-1-1");
    			add_location(path383, file$9, 1638, 1, 73625);
    			attr_dev(path384, "fill", "none");
    			attr_dev(path384, "stroke", "#000");
    			attr_dev(path384, "stroke-width", ".4");
    			attr_dev(path384, "d", "M256.5 182c0-.5.5-1 1-1 .6 0 1.1.5 1.1 1 0 .6-.5 1-1 1a1 1 0 0 1-1-1z");
    			add_location(path384, file$9, 1639, 1, 73720);
    			attr_dev(path385, "fill", "#fff");
    			attr_dev(path385, "d", "M255.7 179c0-.6.5-1 1-1 .7 0 1.2.4 1.2 1s-.5 1-1.1 1a1 1 0 0 1-1-1");
    			add_location(path385, file$9, 1645, 1, 73857);
    			attr_dev(path386, "fill", "none");
    			attr_dev(path386, "stroke", "#000");
    			attr_dev(path386, "stroke-width", ".4");
    			attr_dev(path386, "d", "M255.7 179c0-.6.5-1 1-1 .7 0 1.2.4 1.2 1s-.5 1-1.1 1a1 1 0 0 1-1-1z");
    			add_location(path386, file$9, 1646, 1, 73950);
    			attr_dev(path387, "fill", "#fff");
    			attr_dev(path387, "d", "M254.1 176.1c0-.5.5-1 1-1 .7 0 1.1.5 1.1 1s-.4 1-1 1a1 1 0 0 1-1-1");
    			add_location(path387, file$9, 1652, 1, 74085);
    			attr_dev(path388, "fill", "none");
    			attr_dev(path388, "stroke", "#000");
    			attr_dev(path388, "stroke-width", ".4");
    			attr_dev(path388, "d", "M254.1 176.1c0-.5.5-1 1-1 .7 0 1.1.5 1.1 1s-.4 1-1 1a1 1 0 0 1-1-1z");
    			add_location(path388, file$9, 1653, 1, 74178);
    			attr_dev(path389, "fill", "#fff");
    			attr_dev(path389, "d", "M252 173.8c0-.6.4-1 1-1s1 .4 1 1-.4 1-1 1a1 1 0 0 1-1-1");
    			add_location(path389, file$9, 1659, 1, 74313);
    			attr_dev(path390, "fill", "none");
    			attr_dev(path390, "stroke", "#000");
    			attr_dev(path390, "stroke-width", ".4");
    			attr_dev(path390, "d", "M252 173.8c0-.6.4-1 1-1s1 .4 1 1-.4 1-1 1a1 1 0 0 1-1-1z");
    			add_location(path390, file$9, 1660, 1, 74395);
    			attr_dev(path391, "fill", "#fff");
    			attr_dev(path391, "d", "M249.4 171.8c0-.5.5-1 1.1-1a1 1 0 0 1 0 2c-.6 0-1-.4-1-1");
    			add_location(path391, file$9, 1666, 1, 74519);
    			attr_dev(path392, "fill", "none");
    			attr_dev(path392, "stroke", "#000");
    			attr_dev(path392, "stroke-width", ".4");
    			attr_dev(path392, "d", "M249.4 171.8c0-.5.5-1 1.1-1a1 1 0 0 1 0 2c-.6 0-1-.4-1-1z");
    			add_location(path392, file$9, 1667, 1, 74602);
    			attr_dev(path393, "fill", "#fff");
    			attr_dev(path393, "d", "M246.5 170.3c0-.6.4-1 1-1s1 .4 1 1-.4 1-1 1a1 1 0 0 1-1-1");
    			add_location(path393, file$9, 1673, 1, 74727);
    			attr_dev(path394, "fill", "none");
    			attr_dev(path394, "stroke", "#000");
    			attr_dev(path394, "stroke-width", ".4");
    			attr_dev(path394, "d", "M246.5 170.3c0-.6.4-1 1-1s1 .4 1 1-.4 1-1 1a1 1 0 0 1-1-1z");
    			add_location(path394, file$9, 1674, 1, 74811);
    			attr_dev(path395, "fill", "#fff");
    			attr_dev(path395, "d", "M243.3 169.1c0-.5.5-1 1.1-1a1 1 0 0 1 0 2 1 1 0 0 1-1-1");
    			add_location(path395, file$9, 1680, 1, 74937);
    			attr_dev(path396, "fill", "none");
    			attr_dev(path396, "stroke", "#000");
    			attr_dev(path396, "stroke-width", ".4");
    			attr_dev(path396, "d", "M243.3 169.1c0-.5.5-1 1.1-1a1 1 0 0 1 0 2 1 1 0 0 1-1-1z");
    			add_location(path396, file$9, 1681, 1, 75019);
    			attr_dev(path397, "fill", "#fff");
    			attr_dev(path397, "d", "M239.9 168.5c0-.5.4-1 1-1s1 .5 1 1-.4 1-1 1a1 1 0 0 1-1-1");
    			add_location(path397, file$9, 1687, 1, 75143);
    			attr_dev(path398, "fill", "none");
    			attr_dev(path398, "stroke", "#000");
    			attr_dev(path398, "stroke-width", ".4");
    			attr_dev(path398, "d", "M239.9 168.5c0-.5.4-1 1-1s1 .5 1 1-.4 1-1 1a1 1 0 0 1-1-1z");
    			add_location(path398, file$9, 1688, 1, 75227);
    			attr_dev(path399, "fill", "#fff");
    			attr_dev(path399, "d", "M236.6 168.3c0-.5.4-1 1-1s1 .5 1 1-.4 1-1 1a1 1 0 0 1-1-1");
    			add_location(path399, file$9, 1694, 1, 75353);
    			attr_dev(path400, "fill", "none");
    			attr_dev(path400, "stroke", "#000");
    			attr_dev(path400, "stroke-width", ".4");
    			attr_dev(path400, "d", "M236.6 168.3c0-.5.4-1 1-1s1 .5 1 1-.4 1-1 1a1 1 0 0 1-1-1z");
    			add_location(path400, file$9, 1695, 1, 75437);
    			attr_dev(path401, "fill", "#fff");
    			attr_dev(path401, "d", "M233.3 168.5c0-.6.5-1 1-1 .7 0 1.1.4 1.1 1s-.4 1-1 1a1 1 0 0 1-1-1");
    			add_location(path401, file$9, 1701, 1, 75563);
    			attr_dev(path402, "fill", "none");
    			attr_dev(path402, "stroke", "#000");
    			attr_dev(path402, "stroke-width", ".4");
    			attr_dev(path402, "d", "M233.3 168.5c0-.6.5-1 1-1 .7 0 1.1.4 1.1 1s-.4 1-1 1a1 1 0 0 1-1-1z");
    			add_location(path402, file$9, 1702, 1, 75656);
    			attr_dev(path403, "fill", "#fff");
    			attr_dev(path403, "d", "M230.1 168.5c0-.6.5-1 1-1 .6 0 1.1.4 1.1 1s-.5 1-1 1a1 1 0 0 1-1.1-1");
    			add_location(path403, file$9, 1708, 1, 75791);
    			attr_dev(path404, "fill", "none");
    			attr_dev(path404, "stroke", "#000");
    			attr_dev(path404, "stroke-width", ".4");
    			attr_dev(path404, "d", "M230.1 168.5c0-.6.5-1 1-1 .6 0 1.1.4 1.1 1s-.5 1-1 1a1 1 0 0 1-1.1-1z");
    			add_location(path404, file$9, 1709, 1, 75886);
    			attr_dev(path405, "fill", "#fff");
    			attr_dev(path405, "stroke", "#000");
    			attr_dev(path405, "stroke-width", ".4");
    			attr_dev(path405, "d", "M231.7 171.2c0-.5.5-1 1-1 .7 0 1.1.5 1.1 1s-.4 1-1 1a1 1 0 0 1-1-1m.6 3.1c0-.6.4-1 1-1s1 .4 1 1c0 .5-.4 1-1 1a1 1 0 0 1-1-1m0 3c0-.5.6-1 1.1-1a1 1 0 0 1 0 2 1 1 0 0 1-1-1m-1 2.8c0-.5.5-1 1-1 .7 0 1.1.5 1.1 1 0 .6-.4 1-1 1a1 1 0 0 1-1-1m-1.9 2.6c0-.5.5-1 1-1 .7 0 1.2.5 1.2 1s-.5 1-1.1 1c-.6 0-1-.4-1-1");
    			add_location(path405, file$9, 1715, 1, 76023);
    			attr_dev(path406, "fill", "#fff");
    			attr_dev(path406, "d", "M227.6 166.5c0-.5.5-1 1.1-1a1 1 0 0 1 0 2 1 1 0 0 1-1-1");
    			add_location(path406, file$9, 1721, 1, 76392);
    			attr_dev(path407, "fill", "none");
    			attr_dev(path407, "stroke", "#000");
    			attr_dev(path407, "stroke-width", ".4");
    			attr_dev(path407, "d", "M227.6 166.5c0-.5.5-1 1.1-1a1 1 0 0 1 0 2 1 1 0 0 1-1-1z");
    			add_location(path407, file$9, 1722, 1, 76474);
    			attr_dev(path408, "fill", "#fff");
    			attr_dev(path408, "d", "M224.8 165c0-.6.4-1 1-1s1 .4 1 1-.4 1-1 1a1 1 0 0 1-1-1");
    			add_location(path408, file$9, 1728, 1, 76598);
    			attr_dev(path409, "fill", "none");
    			attr_dev(path409, "stroke", "#000");
    			attr_dev(path409, "stroke-width", ".4");
    			attr_dev(path409, "d", "M224.8 165c0-.6.4-1 1-1s1 .4 1 1-.4 1-1 1a1 1 0 0 1-1-1z");
    			add_location(path409, file$9, 1729, 1, 76680);
    			attr_dev(path410, "fill", "#fff");
    			attr_dev(path410, "d", "M221.6 164c0-.6.5-1 1-1 .6 0 1.1.4 1.1 1 0 .5-.5 1-1 1-.6 0-1.1-.5-1.1-1");
    			add_location(path410, file$9, 1735, 1, 76804);
    			attr_dev(path411, "fill", "none");
    			attr_dev(path411, "stroke", "#000");
    			attr_dev(path411, "stroke-width", ".4");
    			attr_dev(path411, "d", "M221.6 164c0-.6.5-1 1-1 .6 0 1.1.4 1.1 1 0 .5-.5 1-1 1-.6 0-1.1-.5-1.1-1z");
    			add_location(path411, file$9, 1736, 1, 76903);
    			attr_dev(path412, "fill", "#fff");
    			attr_dev(path412, "d", "M218.3 163.4c0-.5.5-1 1-1 .6 0 1.1.5 1.1 1s-.5 1-1 1a1 1 0 0 1-1.1-1");
    			add_location(path412, file$9, 1742, 1, 77044);
    			attr_dev(path413, "fill", "none");
    			attr_dev(path413, "stroke", "#000");
    			attr_dev(path413, "stroke-width", ".4");
    			attr_dev(path413, "d", "M218.3 163.4c0-.5.5-1 1-1 .6 0 1.1.5 1.1 1s-.5 1-1 1a1 1 0 0 1-1.1-1z");
    			add_location(path413, file$9, 1743, 1, 77139);
    			attr_dev(path414, "fill", "#fff");
    			attr_dev(path414, "d", "M215 163.5c0-.6.5-1 1.1-1 .6 0 1 .4 1 1 0 .5-.4 1-1 1a1 1 0 0 1-1-1");
    			add_location(path414, file$9, 1749, 1, 77276);
    			attr_dev(path415, "fill", "none");
    			attr_dev(path415, "stroke", "#000");
    			attr_dev(path415, "stroke-width", ".4");
    			attr_dev(path415, "d", "M215 163.5c0-.6.5-1 1.1-1 .6 0 1 .4 1 1 0 .5-.4 1-1 1a1 1 0 0 1-1-1z");
    			add_location(path415, file$9, 1750, 1, 77370);
    			attr_dev(path416, "fill", "#fff");
    			attr_dev(path416, "d", "M211.7 164c0-.5.5-1 1-1 .7 0 1.1.5 1.1 1s-.4 1-1 1a1 1 0 0 1-1-1");
    			add_location(path416, file$9, 1756, 1, 77506);
    			attr_dev(path417, "fill", "none");
    			attr_dev(path417, "stroke", "#000");
    			attr_dev(path417, "stroke-width", ".4");
    			attr_dev(path417, "d", "M211.7 164c0-.5.5-1 1-1 .7 0 1.1.5 1.1 1s-.4 1-1 1a1 1 0 0 1-1-1z");
    			add_location(path417, file$9, 1757, 1, 77597);
    			attr_dev(path418, "fill", "#fff");
    			attr_dev(path418, "d", "M208.6 165.1c0-.5.5-1 1-1 .6 0 1.1.5 1.1 1s-.5 1-1 1a1 1 0 0 1-1.1-1");
    			add_location(path418, file$9, 1763, 1, 77730);
    			attr_dev(path419, "fill", "none");
    			attr_dev(path419, "stroke", "#000");
    			attr_dev(path419, "stroke-width", ".4");
    			attr_dev(path419, "d", "M208.6 165.1c0-.5.5-1 1-1 .6 0 1.1.5 1.1 1s-.5 1-1 1a1 1 0 0 1-1.1-1z");
    			add_location(path419, file$9, 1764, 1, 77825);
    			attr_dev(path420, "fill", "#fff");
    			attr_dev(path420, "d", "M156 190.7c0-.5.4-1 1-1s1 .5 1 1c0 .6-.4 1-1 1a1 1 0 0 1-1-1");
    			add_location(path420, file$9, 1770, 1, 77962);
    			attr_dev(path421, "fill", "none");
    			attr_dev(path421, "stroke", "#000");
    			attr_dev(path421, "stroke-width", ".4");
    			attr_dev(path421, "d", "M156 190.7c0-.5.4-1 1-1s1 .5 1 1c0 .6-.4 1-1 1a1 1 0 0 1-1-1z");
    			add_location(path421, file$9, 1771, 1, 78049);
    			attr_dev(path422, "fill", "#fff");
    			attr_dev(path422, "d", "M154.5 188.2c0-.6.5-1 1-1 .6 0 1 .4 1 1s-.4 1-1 1a1 1 0 0 1-1-1");
    			add_location(path422, file$9, 1777, 1, 78178);
    			attr_dev(path423, "fill", "none");
    			attr_dev(path423, "stroke", "#000");
    			attr_dev(path423, "stroke-width", ".4");
    			attr_dev(path423, "d", "M154.5 188.2c0-.6.5-1 1-1 .6 0 1 .4 1 1s-.4 1-1 1a1 1 0 0 1-1-1z");
    			add_location(path423, file$9, 1778, 1, 78268);
    			attr_dev(path424, "fill", "#fff");
    			attr_dev(path424, "d", "M153.5 185.2c0-.5.5-1 1-1 .7 0 1.1.5 1.1 1s-.4 1-1 1a1 1 0 0 1-1-1");
    			add_location(path424, file$9, 1784, 1, 78400);
    			attr_dev(path425, "fill", "none");
    			attr_dev(path425, "stroke", "#000");
    			attr_dev(path425, "stroke-width", ".4");
    			attr_dev(path425, "d", "M153.5 185.2c0-.5.5-1 1-1 .7 0 1.1.5 1.1 1s-.4 1-1 1a1 1 0 0 1-1-1z");
    			add_location(path425, file$9, 1785, 1, 78493);
    			attr_dev(path426, "fill", "#fff");
    			attr_dev(path426, "d", "M153.4 182c0-.5.5-1 1-1 .6 0 1.1.5 1.1 1 0 .6-.5 1-1 1a1 1 0 0 1-1-1");
    			add_location(path426, file$9, 1791, 1, 78628);
    			attr_dev(path427, "fill", "none");
    			attr_dev(path427, "stroke", "#000");
    			attr_dev(path427, "stroke-width", ".4");
    			attr_dev(path427, "d", "M153.4 182c0-.5.5-1 1-1 .6 0 1.1.5 1.1 1 0 .6-.5 1-1 1a1 1 0 0 1-1-1z");
    			add_location(path427, file$9, 1792, 1, 78723);
    			attr_dev(path428, "fill", "#fff");
    			attr_dev(path428, "d", "M154.2 179c0-.6.5-1 1-1 .6 0 1 .4 1 1s-.4 1-1 1a1 1 0 0 1-1-1");
    			add_location(path428, file$9, 1798, 1, 78860);
    			attr_dev(path429, "fill", "none");
    			attr_dev(path429, "stroke", "#000");
    			attr_dev(path429, "stroke-width", ".4");
    			attr_dev(path429, "d", "M154.2 179c0-.6.5-1 1-1 .6 0 1 .4 1 1s-.4 1-1 1a1 1 0 0 1-1-1z");
    			add_location(path429, file$9, 1799, 1, 78948);
    			attr_dev(path430, "fill", "#fff");
    			attr_dev(path430, "d", "M155.8 176.1c0-.5.5-1 1-1 .6 0 1.1.5 1.1 1s-.5 1-1 1a1 1 0 0 1-1-1");
    			add_location(path430, file$9, 1805, 1, 79078);
    			attr_dev(path431, "fill", "none");
    			attr_dev(path431, "stroke", "#000");
    			attr_dev(path431, "stroke-width", ".4");
    			attr_dev(path431, "d", "M155.8 176.1c0-.5.5-1 1-1 .6 0 1.1.5 1.1 1s-.5 1-1 1a1 1 0 0 1-1-1z");
    			add_location(path431, file$9, 1806, 1, 79171);
    			attr_dev(path432, "fill", "#fff");
    			attr_dev(path432, "d", "M158 173.8c0-.6.4-1 1-1s1 .4 1 1-.4 1-1 1a1 1 0 0 1-1-1");
    			add_location(path432, file$9, 1812, 1, 79306);
    			attr_dev(path433, "fill", "none");
    			attr_dev(path433, "stroke", "#000");
    			attr_dev(path433, "stroke-width", ".4");
    			attr_dev(path433, "d", "M158 173.8c0-.6.4-1 1-1s1 .4 1 1-.4 1-1 1a1 1 0 0 1-1-1z");
    			add_location(path433, file$9, 1813, 1, 79388);
    			attr_dev(path434, "fill", "#fff");
    			attr_dev(path434, "d", "M160.5 171.8c0-.5.4-1 1-1s1 .5 1 1-.4 1-1 1a1 1 0 0 1-1-1");
    			add_location(path434, file$9, 1819, 1, 79512);
    			attr_dev(path435, "fill", "none");
    			attr_dev(path435, "stroke", "#000");
    			attr_dev(path435, "stroke-width", ".4");
    			attr_dev(path435, "d", "M160.5 171.8c0-.5.4-1 1-1s1 .5 1 1-.4 1-1 1a1 1 0 0 1-1-1z");
    			add_location(path435, file$9, 1820, 1, 79596);
    			attr_dev(path436, "fill", "#fff");
    			attr_dev(path436, "d", "M163.5 170.3c0-.6.4-1 1-1s1 .4 1 1-.4 1-1 1a1 1 0 0 1-1-1");
    			add_location(path436, file$9, 1826, 1, 79722);
    			attr_dev(path437, "fill", "none");
    			attr_dev(path437, "stroke", "#000");
    			attr_dev(path437, "stroke-width", ".4");
    			attr_dev(path437, "d", "M163.5 170.3c0-.6.4-1 1-1s1 .4 1 1-.4 1-1 1a1 1 0 0 1-1-1z");
    			add_location(path437, file$9, 1827, 1, 79806);
    			attr_dev(path438, "fill", "#fff");
    			attr_dev(path438, "d", "M166.6 169.1c0-.5.5-1 1-1a1 1 0 0 1 0 2 1 1 0 0 1-1-1");
    			add_location(path438, file$9, 1833, 1, 79932);
    			attr_dev(path439, "fill", "none");
    			attr_dev(path439, "stroke", "#000");
    			attr_dev(path439, "stroke-width", ".4");
    			attr_dev(path439, "d", "M166.6 169.1c0-.5.5-1 1-1a1 1 0 0 1 0 2 1 1 0 0 1-1-1z");
    			add_location(path439, file$9, 1834, 1, 80012);
    			attr_dev(path440, "fill", "#fff");
    			attr_dev(path440, "d", "M170 168.5c0-.5.5-1 1.1-1a1 1 0 0 1 0 2c-.6 0-1-.4-1-1");
    			add_location(path440, file$9, 1840, 1, 80134);
    			attr_dev(path441, "fill", "none");
    			attr_dev(path441, "stroke", "#000");
    			attr_dev(path441, "stroke-width", ".4");
    			attr_dev(path441, "d", "M170 168.5c0-.5.5-1 1.1-1a1 1 0 0 1 0 2c-.6 0-1-.4-1-1z");
    			add_location(path441, file$9, 1841, 1, 80215);
    			attr_dev(path442, "fill", "#fff");
    			attr_dev(path442, "d", "M173.4 168.3c0-.5.4-1 1-1s1 .5 1 1-.4 1-1 1a1 1 0 0 1-1-1");
    			add_location(path442, file$9, 1847, 1, 80338);
    			attr_dev(path443, "fill", "none");
    			attr_dev(path443, "stroke", "#000");
    			attr_dev(path443, "stroke-width", ".4");
    			attr_dev(path443, "d", "M173.4 168.3c0-.5.4-1 1-1s1 .5 1 1-.4 1-1 1a1 1 0 0 1-1-1z");
    			add_location(path443, file$9, 1848, 1, 80422);
    			attr_dev(path444, "fill", "#fff");
    			attr_dev(path444, "d", "M176.6 168.5c0-.6.5-1 1-1 .6 0 1.1.4 1.1 1s-.5 1-1 1a1 1 0 0 1-1.1-1");
    			add_location(path444, file$9, 1854, 1, 80548);
    			attr_dev(path445, "fill", "none");
    			attr_dev(path445, "stroke", "#000");
    			attr_dev(path445, "stroke-width", ".4");
    			attr_dev(path445, "d", "M176.6 168.5c0-.6.5-1 1-1 .6 0 1.1.4 1.1 1s-.5 1-1 1a1 1 0 0 1-1.1-1z");
    			add_location(path445, file$9, 1855, 1, 80643);
    			attr_dev(path446, "fill", "#fff");
    			attr_dev(path446, "d", "M179.8 168.5c0-.6.5-1 1-1 .7 0 1.2.4 1.2 1s-.5 1-1.1 1a1 1 0 0 1-1-1");
    			add_location(path446, file$9, 1861, 1, 80780);
    			attr_dev(path447, "fill", "none");
    			attr_dev(path447, "stroke", "#000");
    			attr_dev(path447, "stroke-width", ".4");
    			attr_dev(path447, "d", "M179.8 168.5c0-.6.5-1 1-1 .7 0 1.2.4 1.2 1s-.5 1-1.1 1a1 1 0 0 1-1-1z");
    			add_location(path447, file$9, 1862, 1, 80875);
    			attr_dev(path448, "fill", "#fff");
    			attr_dev(path448, "stroke", "#000");
    			attr_dev(path448, "stroke-width", ".4");
    			attr_dev(path448, "d", "M178.2 171.2c0-.5.5-1 1-1 .7 0 1.1.5 1.1 1s-.4 1-1 1a1 1 0 0 1-1-1m-.7 3.1c0-.6.4-1 1-1s1 .4 1 1c0 .5-.4 1-1 1a1 1 0 0 1-1-1m-.2 3c0-.5.5-1 1-1 .7 0 1.1.5 1.1 1s-.4 1-1 1a1 1 0 0 1-1-1m.9 2.8c0-.5.5-1 1-1 .6 0 1.1.5 1.1 1 0 .6-.5 1-1 1a1 1 0 0 1-1.1-1m1.8 2.6c0-.5.5-1 1-1a1 1 0 0 1 0 2 1 1 0 0 1-1-1");
    			add_location(path448, file$9, 1868, 1, 81012);
    			attr_dev(path449, "fill", "#fff");
    			attr_dev(path449, "d", "M182.3 166.5c0-.5.5-1 1-1a1 1 0 0 1 0 2 1 1 0 0 1-1-1");
    			add_location(path449, file$9, 1874, 1, 81380);
    			attr_dev(path450, "fill", "none");
    			attr_dev(path450, "stroke", "#000");
    			attr_dev(path450, "stroke-width", ".4");
    			attr_dev(path450, "d", "M182.3 166.5c0-.5.5-1 1-1a1 1 0 0 1 0 2 1 1 0 0 1-1-1z");
    			add_location(path450, file$9, 1875, 1, 81460);
    			attr_dev(path451, "fill", "#fff");
    			attr_dev(path451, "d", "M185.2 165c0-.6.4-1 1-1s1 .4 1 1-.4 1-1 1a1 1 0 0 1-1-1");
    			add_location(path451, file$9, 1881, 1, 81582);
    			attr_dev(path452, "fill", "none");
    			attr_dev(path452, "stroke", "#000");
    			attr_dev(path452, "stroke-width", ".4");
    			attr_dev(path452, "d", "M185.2 165c0-.6.4-1 1-1s1 .4 1 1-.4 1-1 1a1 1 0 0 1-1-1z");
    			add_location(path452, file$9, 1882, 1, 81664);
    			attr_dev(path453, "fill", "#fff");
    			attr_dev(path453, "d", "M188.3 164c0-.6.5-1 1-1 .7 0 1.1.4 1.1 1 0 .5-.4 1-1 1s-1-.5-1-1");
    			add_location(path453, file$9, 1888, 1, 81788);
    			attr_dev(path454, "fill", "none");
    			attr_dev(path454, "stroke", "#000");
    			attr_dev(path454, "stroke-width", ".4");
    			attr_dev(path454, "d", "M188.3 164c0-.6.5-1 1-1 .7 0 1.1.4 1.1 1 0 .5-.4 1-1 1s-1-.5-1-1z");
    			add_location(path454, file$9, 1889, 1, 81879);
    			attr_dev(path455, "fill", "#fff");
    			attr_dev(path455, "d", "M191.6 163.4c0-.5.5-1 1-1 .7 0 1.1.5 1.1 1s-.4 1-1 1a1 1 0 0 1-1-1");
    			add_location(path455, file$9, 1895, 1, 82012);
    			attr_dev(path456, "fill", "none");
    			attr_dev(path456, "stroke", "#000");
    			attr_dev(path456, "stroke-width", ".4");
    			attr_dev(path456, "d", "M191.6 163.4c0-.5.5-1 1-1 .7 0 1.1.5 1.1 1s-.4 1-1 1a1 1 0 0 1-1-1z");
    			add_location(path456, file$9, 1896, 1, 82105);
    			attr_dev(path457, "fill", "#fff");
    			attr_dev(path457, "d", "M194.9 163.5c0-.6.4-1 1-1s1 .4 1 1c0 .5-.4 1-1 1a1 1 0 0 1-1-1");
    			add_location(path457, file$9, 1902, 1, 82240);
    			attr_dev(path458, "fill", "none");
    			attr_dev(path458, "stroke", "#000");
    			attr_dev(path458, "stroke-width", ".4");
    			attr_dev(path458, "d", "M194.9 163.5c0-.6.4-1 1-1s1 .4 1 1c0 .5-.4 1-1 1a1 1 0 0 1-1-1z");
    			add_location(path458, file$9, 1903, 1, 82329);
    			attr_dev(path459, "fill", "#fff");
    			attr_dev(path459, "d", "M198.2 164c0-.5.5-1 1-1 .7 0 1.1.5 1.1 1s-.4 1-1 1a1 1 0 0 1-1-1");
    			add_location(path459, file$9, 1909, 1, 82460);
    			attr_dev(path460, "fill", "none");
    			attr_dev(path460, "stroke", "#000");
    			attr_dev(path460, "stroke-width", ".4");
    			attr_dev(path460, "d", "M198.2 164c0-.5.5-1 1-1 .7 0 1.1.5 1.1 1s-.4 1-1 1a1 1 0 0 1-1-1z");
    			add_location(path460, file$9, 1910, 1, 82551);
    			attr_dev(path461, "fill", "#fff");
    			attr_dev(path461, "d", "M201.3 165.1c0-.5.5-1 1-1 .7 0 1.1.5 1.1 1s-.4 1-1 1a1 1 0 0 1-1-1");
    			add_location(path461, file$9, 1916, 1, 82684);
    			attr_dev(path462, "fill", "none");
    			attr_dev(path462, "stroke", "#000");
    			attr_dev(path462, "stroke-width", ".4");
    			attr_dev(path462, "d", "M201.3 165.1c0-.5.5-1 1-1 .7 0 1.1.5 1.1 1s-.4 1-1 1a1 1 0 0 1-1-1z");
    			add_location(path462, file$9, 1917, 1, 82777);
    			attr_dev(path463, "fill", "#c8b100");
    			attr_dev(path463, "stroke", "#000");
    			attr_dev(path463, "stroke-width", ".4");
    			attr_dev(path463, "d", "M174.7 228.9h-1v-1h-1.5v3.6h1.6v2.5h-3.4v7h1.8v14.3h-3.5v7.3h27.2v-7.3h-3.5V241h1.8v-7h-3.4v-2.5h1.6V228h-1.6v.9h-.8v-1h-1.6v1h-1.1v-1h-1.6v3.6h1.6v2.5H184v-7.8h1.7v-3.5H184v.9h-1v-1h-1.5v1h-.9v-1H179v3.6h1.7v7.8h-3.3v-2.5h1.6V228h-1.6v.9h-.9v-1h-1.8v1zm-6 33.7H196m-27.3-1.8H196m-27.3-1.8H196m-27.3-1.7H196m-27.3-2H196m-23.8-1.6h20.2m-20.2-1.8h20.2m-20.2-2h20.2m-20.2-1.7h20.2m-20.2-1.8h20.2m-20.2-1.8h20.2m-20.2-1.7h20.2m-22-1.8h23.8m-23.8-1.8h23.8m-23.8-1.8h23.8m-23.8-1.8h23.8m-20.4-1.7h17m-10.2-1.8h3.4m-3.4-1.8h3.4m-3.4-1.8h3.4m-3.4-1.7h3.4m-5.1-2.2h6.8m-12 7.5h3.6m-5-2.2h6.6m-6.7 32.6v-1.8m0-1.8v-1.7m-1.8 1.7v1.8m3.4 0V259m1.7 3.6v-1.8m0-1.8v-1.7m0-2v-1.6m0-1.8v-2m-1.7 7.4v-2m-3.4 2v-2m7 0v2m1.5-2v-1.6m-5.1-1.8v1.8m3.5-1.8v1.8m3.3-1.8v1.8M179 252v-2m1.7-1.7v1.7m0-5.3v1.8m-1.7-3.6v1.8m1.7-3.5v1.7m-3.3-1.7v1.7m-3.5-1.7v1.7m-1.6-3.5v1.8m3.3-1.8v1.8m3.4-1.8v1.8m1.7-3.6v1.8m-3.3-1.8v1.8m-3.5-1.8v1.8m-1.6-3.6v1.8m6.7-1.8v1.8m-3.4-5.3v1.8m15.3-1.8h-3.5m5-2.2h-6.6m6.7 32.6v-1.8m0-1.8v-1.7m1.8 1.7v1.8m-3.4 0V259m-1.7 3.6v-1.8m0-1.8v-1.7m0-2v-1.6m0-1.8v-2m1.7 7.4v-2m3.4 2v-2m-7 0v2m-1.5-2v-1.6m5.1-1.8v1.8m-3.5-1.8v1.8m-3.3-1.8v1.8m1.7-1.8v-2m-1.7-1.7v1.7m0-5.3v1.8m1.7-3.6v1.8m-1.7-3.5v1.7m3.3-1.7v1.7m3.5-1.7v1.7m1.6-3.5v1.8m-3.3-1.8v1.8m-3.4-1.8v1.8m-1.7-3.6v1.8m3.3-1.8v1.8m3.5-1.8v1.8m1.6-3.6v1.8m-6.7-1.8v1.8m3.4-5.3v1.8m-7 18v-2m0-5.4v-1.8m0 5.4v-1.8m0-5.3v-1.8m0-1.8v-1.7m0-3.6v-1.8m0-1.7v-1.8m-8.3 4.6h3.5m3.3-5.3h3.4m3.3 5.3h3.5");
    			add_location(path463, file$9, 1923, 1, 82912);
    			attr_dev(path464, "fill", "#c8b100");
    			attr_dev(path464, "stroke", "#000");
    			attr_dev(path464, "stroke-width", ".4");
    			attr_dev(path464, "d", "M186.8 262.6v-4.7c0-.8-.4-3.5-4.6-3.5-4 0-4.4 2.7-4.4 3.5v4.7h9z");
    			add_location(path464, file$9, 1929, 1, 84429);
    			attr_dev(path465, "fill", "#c8b100");
    			attr_dev(path465, "stroke", "#000");
    			attr_dev(path465, "stroke-width", ".4");
    			attr_dev(path465, "d", "m179.3 258.2-2.2-.3c0-.9.2-2.2.9-2.6l2 1.5c-.3.2-.7 1-.7 1.4zm6 0 2.2-.3c0-.9-.2-2.2-.9-2.6l-2 1.5c.3.2.7 1 .7 1.4zm-2.2-2.3 1-2a5.3 5.3 0 0 0-2-.4l-1.7.4 1.1 2h1.6zm-4.2-5.5v-4.9c0-1.3-1-2.4-2.5-2.4s-2.4 1-2.4 2.4v4.9h4.9zm6.8 0v-4.9c0-1.3 1-2.4 2.5-2.4s2.4 1 2.4 2.4v4.9h-4.9zm-1.7-12 .4-4.4h-4.2l.2 4.4h3.6zm3.3 0-.4-4.4h4.4l-.5 4.4h-3.5zm-10 0 .2-4.4h-4.2l.5 4.4h3.5z");
    			add_location(path465, file$9, 1935, 1, 84564);
    			attr_dev(path466, "fill", "#0039f0");
    			attr_dev(path466, "d", "M185.3 262.6v-4c0-.7-.5-2.7-3.1-2.7-2.4 0-2.9 2-2.9 2.7v4h6zm-6.9-12.7v-4.2c0-1-.6-2.2-2-2.2s-2 1.1-2 2.2v4.3h4zm7.8 0v-4.2c0-1 .7-2.2 2-2.2s2 1.1 2 2.2v4.3h-4z");
    			add_location(path466, file$9, 1941, 1, 85006);
    			attr_dev(path467, "fill", "#ad1519");
    			attr_dev(path467, "d", "M190.8 269.8c0-9.7 7-17.6 15.6-17.6s15.6 7.9 15.6 17.6-7 17.5-15.6 17.5-15.6-7.8-15.6-17.5");
    			add_location(path467, file$9, 1945, 1, 85201);
    			attr_dev(path468, "fill", "none");
    			attr_dev(path468, "stroke", "#000");
    			attr_dev(path468, "stroke-width", ".6");
    			attr_dev(path468, "d", "M190.8 269.8c0-9.7 7-17.6 15.6-17.6s15.6 7.9 15.6 17.6-7 17.5-15.6 17.5-15.6-7.8-15.6-17.5z");
    			add_location(path468, file$9, 1949, 1, 85326);
    			attr_dev(path469, "fill", "#005bbf");
    			attr_dev(path469, "d", "M195.4 269.7c0-7 5-12.8 11-12.8s11 5.7 11 12.8c0 7.2-5 13-11 13s-11-5.8-11-13");
    			add_location(path469, file$9, 1955, 1, 85485);
    			attr_dev(path470, "fill", "none");
    			attr_dev(path470, "stroke", "#000");
    			attr_dev(path470, "stroke-width", ".6");
    			attr_dev(path470, "d", "M195.4 269.7c0-7 5-12.8 11-12.8s11 5.7 11 12.8c0 7.2-5 13-11 13s-11-5.8-11-13z");
    			add_location(path470, file$9, 1959, 1, 85597);
    			attr_dev(path471, "fill", "#c8b100");
    			attr_dev(path471, "d", "M201.2 260.9s-1.3 1.4-1.3 2.7a6 6 0 0 0 .6 2.4c-.2-.5-.8-.8-1.4-.8-.8 0-1.4.6-1.4 1.3l.2.8.5.9c.1-.3.5-.5 1-.5s1 .4 1 1a.9.9 0 0 1 0 .2h-1.2v1h1l-.8 1.5 1-.4.8.9.8-.9 1 .4-.7-1.5h1v-1h-1.1a.9.9 0 0 1 0-.3 1 1 0 0 1 1-1c.4 0 .7.3 1 .6l.4-1 .2-.7a1.4 1.4 0 0 0-1.4-1.3c-.7 0-1.2.3-1.4.9 0 0 .6-1.2.6-2.5s-1.4-2.7-1.4-2.7");
    			add_location(path471, file$9, 1965, 1, 85743);
    			attr_dev(path472, "fill", "none");
    			attr_dev(path472, "stroke", "#000");
    			attr_dev(path472, "stroke-linejoin", "round");
    			attr_dev(path472, "stroke-width", ".3");
    			attr_dev(path472, "d", "M201.2 260.9s-1.3 1.4-1.3 2.7a6 6 0 0 0 .6 2.4c-.2-.5-.8-.8-1.4-.8-.8 0-1.4.6-1.4 1.3l.2.8.5.9c.1-.3.5-.5 1-.5s1 .4 1 1a.9.9 0 0 1 0 .2h-1.2v1h1l-.8 1.5 1-.4.8.9.8-.9 1 .4-.7-1.5h1v-1h-1.1a.9.9 0 0 1 0-.3 1 1 0 0 1 1-1c.4 0 .7.3 1 .6l.4-1 .2-.7a1.4 1.4 0 0 0-1.4-1.3c-.7 0-1.2.3-1.4.9 0 0 .6-1.2.6-2.5s-1.4-2.7-1.4-2.7z");
    			add_location(path472, file$9, 1969, 1, 86096);
    			attr_dev(path473, "fill", "#c8b100");
    			attr_dev(path473, "d", "M199.2 269.9h4.1v-1h-4.1v1z");
    			add_location(path473, file$9, 1976, 1, 86509);
    			attr_dev(path474, "fill", "none");
    			attr_dev(path474, "stroke", "#000");
    			attr_dev(path474, "stroke-width", ".3");
    			attr_dev(path474, "d", "M199.2 269.9h4.1v-1h-4.1v1z");
    			add_location(path474, file$9, 1977, 1, 86566);
    			attr_dev(path475, "fill", "#c8b100");
    			attr_dev(path475, "d", "M211.4 260.9s-1.3 1.4-1.3 2.7c0 1.3.6 2.4.6 2.4-.2-.5-.7-.8-1.4-.8-.8 0-1.4.6-1.4 1.3l.2.8.5.9c.2-.3.5-.5 1-.5a1 1 0 0 1 1 1 .9.9 0 0 1 0 .2h-1.2v1h1l-.8 1.5 1-.4.8.9.8-.9 1 .4-.7-1.5h1v-1h-1.1a.8.8 0 0 1 0-.3 1 1 0 0 1 1-1c.4 0 .8.3 1 .6l.4-1 .2-.7a1.4 1.4 0 0 0-1.4-1.3c-.6 0-1.2.3-1.4.9 0 0 .6-1.2.6-2.5s-1.4-2.7-1.4-2.7");
    			add_location(path475, file$9, 1978, 1, 86652);
    			attr_dev(path476, "fill", "none");
    			attr_dev(path476, "stroke", "#000");
    			attr_dev(path476, "stroke-linejoin", "round");
    			attr_dev(path476, "stroke-width", ".3");
    			attr_dev(path476, "d", "M211.4 260.9s-1.3 1.4-1.3 2.7c0 1.3.6 2.4.6 2.4-.2-.5-.7-.8-1.4-.8-.8 0-1.4.6-1.4 1.3l.2.8.5.9c.2-.3.5-.5 1-.5a1 1 0 0 1 1 1 .9.9 0 0 1 0 .2h-1.2v1h1l-.8 1.5 1-.4.8.9.8-.9 1 .4-.7-1.5h1v-1h-1.1a.8.8 0 0 1 0-.3 1 1 0 0 1 1-1c.4 0 .8.3 1 .6l.4-1 .2-.7a1.4 1.4 0 0 0-1.4-1.3c-.6 0-1.2.3-1.4.9 0 0 .6-1.2.6-2.5s-1.4-2.7-1.4-2.7z");
    			add_location(path476, file$9, 1982, 1, 87010);
    			attr_dev(path477, "fill", "#c8b100");
    			attr_dev(path477, "d", "M209.4 269.9h4.1v-1h-4.1v1z");
    			add_location(path477, file$9, 1989, 1, 87428);
    			attr_dev(path478, "fill", "none");
    			attr_dev(path478, "stroke", "#000");
    			attr_dev(path478, "stroke-width", ".3");
    			attr_dev(path478, "d", "M209.4 269.9h4.1v-1h-4.1v1z");
    			add_location(path478, file$9, 1990, 1, 87485);
    			attr_dev(path479, "fill", "#c8b100");
    			attr_dev(path479, "d", "M206.3 269.6s-1.3 1.5-1.3 2.8.6 2.4.6 2.4c-.2-.5-.7-.9-1.4-.9-.8 0-1.4.6-1.4 1.4l.2.7.5 1c.1-.4.5-.6 1-.6a1 1 0 0 1 1 1 .9.9 0 0 1 0 .3h-1.2v1h1l-.8 1.5 1-.4.8.9.8-1 1 .5-.7-1.5h1v-1h-1.1a.9.9 0 0 1 0-.3 1 1 0 0 1 1-1c.4 0 .7.2.9.6l.5-1 .2-.7a1.4 1.4 0 0 0-1.4-1.4c-.7 0-1.2.4-1.4 1 0 0 .6-1.2.6-2.5s-1.4-2.7-1.4-2.7");
    			add_location(path479, file$9, 1991, 1, 87571);
    			attr_dev(path480, "fill", "none");
    			attr_dev(path480, "stroke", "#000");
    			attr_dev(path480, "stroke-linejoin", "round");
    			attr_dev(path480, "stroke-width", ".3");
    			attr_dev(path480, "d", "M206.3 269.6s-1.3 1.5-1.3 2.8.6 2.4.6 2.4c-.2-.5-.7-.9-1.4-.9-.8 0-1.4.6-1.4 1.4l.2.7.5 1c.1-.4.5-.6 1-.6a1 1 0 0 1 1 1 .9.9 0 0 1 0 .3h-1.2v1h1l-.8 1.5 1-.4.8.9.8-1 1 .5-.7-1.5h1v-1h-1.1a.9.9 0 0 1 0-.3 1 1 0 0 1 1-1c.4 0 .7.2.9.6l.5-1 .2-.7a1.4 1.4 0 0 0-1.4-1.4c-.7 0-1.2.4-1.4 1 0 0 .6-1.2.6-2.5s-1.4-2.7-1.4-2.7z");
    			add_location(path480, file$9, 1995, 1, 87922);
    			attr_dev(path481, "fill", "#c8b100");
    			attr_dev(path481, "d", "M204.3 278.6h4.1v-1h-4.1v1z");
    			add_location(path481, file$9, 2002, 1, 88333);
    			attr_dev(path482, "fill", "none");
    			attr_dev(path482, "stroke", "#000");
    			attr_dev(path482, "stroke-width", ".3");
    			attr_dev(path482, "d", "M204.3 278.6h4.1v-1h-4.1v1z");
    			add_location(path482, file$9, 2003, 1, 88390);
    			attr_dev(path483, "fill", "#c8b100");
    			attr_dev(path483, "d", "M237.6 223.4h-.3a1.5 1.5 0 0 1-.3.4c-.2.2-.6.2-.8 0a.5.5 0 0 1-.1-.4.5.5 0 0 1-.5 0c-.3-.1-.3-.5-.1-.7v-.5h-.3l-.1.2c-.2.3-.5.3-.7.2a.6.6 0 0 1 0-.2h-.3c-.5.2-.7-1-.7-1.2l-.2.2s.2.7.1 1.2c0 .6-.3 1.2-.3 1.2a9 9 0 0 1 2.9 1.6 9 9 0 0 1 2.2 2.3l1.2-.5c.6-.2 1.3-.2 1.3-.2l.2-.2c-.3 0-1.5.1-1.5-.4v-.2a.7.7 0 0 1-.2 0c-.2-.2-.2-.4 0-.7l.2-.1v-.3h-.3l-.2.1c-.2.3-.6.3-.8 0a.4.4 0 0 1-.1-.4.6.6 0 0 1-.5 0c-.2-.2-.3-.5 0-.8l.2-.3v-.3");
    			add_location(path483, file$9, 2004, 1, 88476);
    			attr_dev(path484, "fill", "none");
    			attr_dev(path484, "stroke", "#000");
    			attr_dev(path484, "stroke-width", ".3");
    			attr_dev(path484, "d", "M237.6 223.4h-.3a1.5 1.5 0 0 1-.3.4c-.2.2-.6.2-.8 0a.5.5 0 0 1-.1-.4.5.5 0 0 1-.5 0c-.3-.1-.3-.5-.1-.7v-.5h-.3l-.1.2c-.2.3-.5.3-.7.2a.6.6 0 0 1 0-.2h-.3c-.5.2-.7-1-.7-1.2l-.2.2s.2.7.1 1.2c0 .6-.3 1.2-.3 1.2a9 9 0 0 1 2.9 1.6 9 9 0 0 1 2.2 2.3l1.2-.5c.6-.2 1.3-.2 1.3-.2l.2-.2c-.3 0-1.5.1-1.5-.4v-.2a.7.7 0 0 1-.2 0c-.2-.2-.2-.4 0-.7l.2-.1v-.3h-.3l-.2.1c-.2.3-.6.3-.8 0a.4.4 0 0 1-.1-.4.6.6 0 0 1-.5 0c-.2-.2-.3-.5 0-.8l.2-.3v-.3z");
    			add_location(path484, file$9, 2008, 1, 88939);
    			attr_dev(path485, "d", "M235.4 224h.2v.3h-.1c-.1 0-.1-.2 0-.2");
    			add_location(path485, file$9, 2014, 1, 89436);
    			attr_dev(path486, "fill", "none");
    			attr_dev(path486, "stroke", "#000");
    			attr_dev(path486, "stroke-width", ".1");
    			attr_dev(path486, "d", "M235.4 224h.2v.3h-.1c-.1 0-.1-.2 0-.2z");
    			add_location(path486, file$9, 2015, 1, 89488);
    			attr_dev(path487, "d", "m236.3 224.8-.3-.2v-.2h.1l.4.3.3.2v.2h-.2l-.3-.3");
    			add_location(path487, file$9, 2016, 1, 89585);
    			attr_dev(path488, "fill", "none");
    			attr_dev(path488, "stroke", "#000");
    			attr_dev(path488, "stroke-width", ".1");
    			attr_dev(path488, "d", "m236.3 224.8-.3-.2v-.2h.1l.4.3.3.2v.2h-.2l-.3-.3");
    			add_location(path488, file$9, 2017, 1, 89648);
    			attr_dev(path489, "d", "m234.6 223.7-.2-.2s-.1 0 0-.1l.3.1.3.1v.2h-.1l-.3-.1");
    			add_location(path489, file$9, 2023, 1, 89764);
    			attr_dev(path490, "fill", "none");
    			attr_dev(path490, "stroke", "#000");
    			attr_dev(path490, "stroke-width", ".1");
    			attr_dev(path490, "d", "m234.6 223.7-.2-.2s-.1 0 0-.1l.3.1.3.1v.2h-.1l-.3-.1");
    			add_location(path490, file$9, 2024, 1, 89831);
    			attr_dev(path491, "d", "M233.7 223h.2v.2h-.2s-.1-.1 0-.2");
    			add_location(path491, file$9, 2030, 1, 89951);
    			attr_dev(path492, "fill", "none");
    			attr_dev(path492, "stroke", "#000");
    			attr_dev(path492, "stroke-width", ".1");
    			attr_dev(path492, "d", "M233.7 223h.2v.2h-.2s-.1-.1 0-.2z");
    			add_location(path492, file$9, 2031, 1, 89998);
    			attr_dev(path493, "d", "M237.3 225.5v-.2h-.3l.1.2h.2");
    			add_location(path493, file$9, 2032, 1, 90090);
    			attr_dev(path494, "fill", "none");
    			attr_dev(path494, "stroke", "#000");
    			attr_dev(path494, "stroke-width", ".1");
    			attr_dev(path494, "d", "M237.3 225.5v-.2h-.3l.1.2h.2z");
    			add_location(path494, file$9, 2033, 1, 90133);
    			attr_dev(path495, "d", "m237.9 226.2.2.2h.1c.1 0 0-.1 0-.2l-.2-.2-.2-.2h-.1v.2l.2.2");
    			add_location(path495, file$9, 2034, 1, 90221);
    			attr_dev(path496, "fill", "none");
    			attr_dev(path496, "stroke", "#000");
    			attr_dev(path496, "stroke-width", ".1");
    			attr_dev(path496, "d", "m237.9 226.2.2.2h.1c.1 0 0-.1 0-.2l-.2-.2-.2-.2h-.1v.2l.2.2");
    			add_location(path496, file$9, 2035, 1, 90295);
    			attr_dev(path497, "d", "M238.8 227v-.3h-.3v.2h.3");
    			add_location(path497, file$9, 2041, 1, 90422);
    			attr_dev(path498, "fill", "none");
    			attr_dev(path498, "stroke", "#000");
    			attr_dev(path498, "stroke-width", ".1");
    			attr_dev(path498, "d", "M238.8 227v-.3h-.3v.2h.3z");
    			add_location(path498, file$9, 2042, 1, 90461);
    			attr_dev(path499, "fill", "#c8b100");
    			attr_dev(path499, "d", "M236.2 221.1h-.6l-.1.9v.1h.2l.7-.5-.3-.5");
    			add_location(path499, file$9, 2043, 1, 90545);
    			attr_dev(path500, "fill", "none");
    			attr_dev(path500, "stroke", "#000");
    			attr_dev(path500, "stroke-width", ".3");
    			attr_dev(path500, "d", "M236.2 221.1h-.6l-.1.9v.1h.2l.7-.5-.3-.5");
    			add_location(path500, file$9, 2044, 1, 90615);
    			attr_dev(path501, "fill", "#c8b100");
    			attr_dev(path501, "d", "M234.6 221.6v.5l.9.1h.1v-.2l-.5-.7-.5.3");
    			add_location(path501, file$9, 2045, 1, 90714);
    			attr_dev(path502, "fill", "none");
    			attr_dev(path502, "stroke", "#000");
    			attr_dev(path502, "stroke-width", ".3");
    			attr_dev(path502, "d", "M234.6 221.6v.5l.9.1h.1v-.2l-.5-.7-.5.3");
    			add_location(path502, file$9, 2046, 1, 90783);
    			attr_dev(path503, "fill", "#c8b100");
    			attr_dev(path503, "d", "m236.4 222.6-.4.3-.6-.7v-.1h1.1v.5");
    			add_location(path503, file$9, 2047, 1, 90881);
    			attr_dev(path504, "fill", "none");
    			attr_dev(path504, "stroke", "#000");
    			attr_dev(path504, "stroke-width", ".3");
    			attr_dev(path504, "d", "m236.4 222.6-.4.3-.6-.7v-.1h1.1v.5");
    			add_location(path504, file$9, 2048, 1, 90945);
    			attr_dev(path505, "fill", "#c8b100");
    			attr_dev(path505, "d", "M235.3 222a.3.3 0 0 1 .4 0 .3.3 0 0 1 0 .3.3.3 0 0 1-.3 0 .3.3 0 0 1-.1-.3");
    			add_location(path505, file$9, 2049, 1, 91038);
    			attr_dev(path506, "fill", "none");
    			attr_dev(path506, "stroke", "#000");
    			attr_dev(path506, "stroke-width", ".3");
    			attr_dev(path506, "d", "M235.3 222a.3.3 0 0 1 .4 0 .3.3 0 0 1 0 .3.3.3 0 0 1-.3 0 .3.3 0 0 1-.1-.3z");
    			add_location(path506, file$9, 2053, 1, 91147);
    			attr_dev(path507, "fill", "#c8b100");
    			attr_dev(path507, "d", "m233.2 221.1-.2-.7-.4-.4s.4-.2.8.1c.4.3 0 .9 0 .9l-.2.1");
    			add_location(path507, file$9, 2059, 1, 91290);
    			attr_dev(path508, "fill", "none");
    			attr_dev(path508, "stroke", "#000");
    			attr_dev(path508, "stroke-width", ".3");
    			attr_dev(path508, "d", "m233.2 221.1-.2-.7-.4-.4s.4-.2.8.1c.4.3 0 .9 0 .9l-.2.1z");
    			add_location(path508, file$9, 2060, 1, 91375);
    			attr_dev(path509, "fill", "#c8b100");
    			attr_dev(path509, "d", "m234.2 221.4-.4.4-.6-.6v-.2h1v.4");
    			add_location(path509, file$9, 2066, 1, 91499);
    			attr_dev(path510, "fill", "none");
    			attr_dev(path510, "stroke", "#000");
    			attr_dev(path510, "stroke-width", ".3");
    			attr_dev(path510, "d", "m234.2 221.4-.4.4-.6-.6v-.2h1v.4");
    			add_location(path510, file$9, 2067, 1, 91561);
    			attr_dev(path511, "fill", "#c8b100");
    			attr_dev(path511, "d", "m233.1 221 .3-.1v.3c0 .2-.1.2-.2.2l-.1-.3");
    			add_location(path511, file$9, 2068, 1, 91652);
    			attr_dev(path512, "fill", "none");
    			attr_dev(path512, "stroke", "#000");
    			attr_dev(path512, "stroke-width", ".3");
    			attr_dev(path512, "d", "m233.1 221 .3-.1v.3c0 .2-.1.2-.2.2l-.1-.3z");
    			add_location(path512, file$9, 2069, 1, 91723);
    			attr_dev(path513, "fill", "#c8b100");
    			attr_dev(path513, "d", "M238.3 222.5h-.5l-.3.7v.2h.2l.8-.4-.2-.5");
    			add_location(path513, file$9, 2075, 1, 91833);
    			attr_dev(path514, "fill", "none");
    			attr_dev(path514, "stroke", "#000");
    			attr_dev(path514, "stroke-width", ".3");
    			attr_dev(path514, "d", "M238.3 222.5h-.5l-.3.7v.2h.2l.8-.4-.2-.5");
    			add_location(path514, file$9, 2076, 1, 91903);
    			attr_dev(path515, "fill", "#c8b100");
    			attr_dev(path515, "d", "M236.7 222.8v.5l.8.2h.1v-.2l-.4-.7-.5.2");
    			add_location(path515, file$9, 2077, 1, 92002);
    			attr_dev(path516, "fill", "none");
    			attr_dev(path516, "stroke", "#000");
    			attr_dev(path516, "stroke-width", ".3");
    			attr_dev(path516, "d", "M236.7 222.8v.5l.8.2h.1v-.2l-.4-.7-.5.2");
    			add_location(path516, file$9, 2078, 1, 92071);
    			attr_dev(path517, "fill", "#c8b100");
    			attr_dev(path517, "d", "m238.4 224-.5.2-.4-.7v-.2h.1l.9.2-.1.5");
    			add_location(path517, file$9, 2079, 1, 92169);
    			attr_dev(path518, "fill", "none");
    			attr_dev(path518, "stroke", "#000");
    			attr_dev(path518, "stroke-width", ".3");
    			attr_dev(path518, "d", "m238.4 224-.5.2-.4-.7v-.2h.1l.9.2-.1.5");
    			add_location(path518, file$9, 2080, 1, 92237);
    			attr_dev(path519, "fill", "#c8b100");
    			attr_dev(path519, "d", "M237.3 223.2h.4a.3.3 0 0 1 0 .4.3.3 0 0 1-.3 0 .3.3 0 0 1 0-.4");
    			add_location(path519, file$9, 2081, 1, 92334);
    			attr_dev(path520, "fill", "none");
    			attr_dev(path520, "stroke", "#000");
    			attr_dev(path520, "stroke-width", ".3");
    			attr_dev(path520, "d", "M237.3 223.2h.4a.3.3 0 0 1 0 .4.3.3 0 0 1-.3 0 .3.3 0 0 1 0-.4z");
    			add_location(path520, file$9, 2082, 1, 92426);
    			attr_dev(path521, "fill", "#c8b100");
    			attr_dev(path521, "d", "m240.2 224.3.1.5-.8.3h-.2v-.2l.4-.8.5.2");
    			add_location(path521, file$9, 2088, 1, 92557);
    			attr_dev(path522, "fill", "none");
    			attr_dev(path522, "stroke", "#000");
    			attr_dev(path522, "stroke-width", ".3");
    			attr_dev(path522, "d", "m240.2 224.3.1.5-.8.3h-.2v-.2l.4-.8.5.2");
    			add_location(path522, file$9, 2089, 1, 92626);
    			attr_dev(path523, "fill", "#c8b100");
    			attr_dev(path523, "d", "m240 225.8-.5.1-.3-.8v-.1h.2l.8.3-.1.5");
    			add_location(path523, file$9, 2090, 1, 92724);
    			attr_dev(path524, "fill", "none");
    			attr_dev(path524, "stroke", "#000");
    			attr_dev(path524, "stroke-width", ".3");
    			attr_dev(path524, "d", "m240 225.8-.5.1-.3-.8v-.1h.2l.8.3-.1.5");
    			add_location(path524, file$9, 2091, 1, 92792);
    			attr_dev(path525, "fill", "#c8b100");
    			attr_dev(path525, "d", "m238.6 224.3-.2.5.9.3h.1v-.1l-.3-.8-.5.1");
    			add_location(path525, file$9, 2092, 1, 92889);
    			attr_dev(path526, "fill", "none");
    			attr_dev(path526, "stroke", "#000");
    			attr_dev(path526, "stroke-width", ".3");
    			attr_dev(path526, "d", "m238.6 224.3-.2.5.9.3h.1v-.1l-.3-.8-.5.1");
    			add_location(path526, file$9, 2093, 1, 92959);
    			attr_dev(path527, "fill", "#c8b100");
    			attr_dev(path527, "d", "M239.5 225.2a.3.3 0 0 0 0-.3.3.3 0 0 0-.4 0 .3.3 0 0 0 0 .3.3.3 0 0 0 .4 0");
    			add_location(path527, file$9, 2094, 1, 93058);
    			attr_dev(path528, "fill", "none");
    			attr_dev(path528, "stroke", "#000");
    			attr_dev(path528, "stroke-width", ".3");
    			attr_dev(path528, "d", "M239.5 225.2a.3.3 0 0 0 0-.3.3.3 0 0 0-.4 0 .3.3 0 0 0 0 .3.3.3 0 0 0 .4 0z");
    			add_location(path528, file$9, 2098, 1, 93167);
    			attr_dev(path529, "fill", "#c8b100");
    			attr_dev(path529, "d", "M240.8 227h.8l.5.3s.1-.4-.3-.7c-.3-.3-.8.2-.8.2l-.2.2");
    			add_location(path529, file$9, 2104, 1, 93310);
    			attr_dev(path530, "fill", "none");
    			attr_dev(path530, "stroke", "#000");
    			attr_dev(path530, "stroke-width", ".3");
    			attr_dev(path530, "d", "M240.8 227h.8l.5.3s.1-.4-.3-.7c-.3-.3-.8.2-.8.2l-.2.2z");
    			add_location(path530, file$9, 2105, 1, 93393);
    			attr_dev(path531, "fill", "#c8b100");
    			attr_dev(path531, "d", "m240.3 226.1-.3.5.8.5v-.1h.2l-.1-1-.6.1");
    			add_location(path531, file$9, 2111, 1, 93515);
    			attr_dev(path532, "fill", "none");
    			attr_dev(path532, "stroke", "#000");
    			attr_dev(path532, "stroke-width", ".3");
    			attr_dev(path532, "d", "m240.3 226.1-.3.5.8.5v-.1h.2l-.1-1-.6.1");
    			add_location(path532, file$9, 2112, 1, 93584);
    			attr_dev(path533, "fill", "#c8b100");
    			attr_dev(path533, "d", "M241 227s.1-.1 0-.2h-.3c-.2 0-.2.1-.1.2h.3");
    			add_location(path533, file$9, 2113, 1, 93682);
    			attr_dev(path534, "fill", "none");
    			attr_dev(path534, "stroke", "#000");
    			attr_dev(path534, "stroke-width", ".3");
    			attr_dev(path534, "d", "M241 227s.1-.1 0-.2h-.3c-.2 0-.2.1-.1.2h.3zm38-21.9v.6h-2.4v-.6h1v-1.3h-.7v-.5h.6v-.6h.6v.6h.6v.6h-.6v1.2h1");
    			add_location(path534, file$9, 2114, 1, 93754);
    			attr_dev(path535, "fill", "none");
    			attr_dev(path535, "stroke", "#000");
    			attr_dev(path535, "stroke-width", "0");
    			attr_dev(path535, "d", "M134.4 217.1v-1.2m-.4 1.2v-1.2m-.2 1.2v-1.2m-.3 1.2v-1.2");
    			add_location(path535, file$9, 2120, 1, 93929);
    			attr_dev(path536, "fill", "none");
    			attr_dev(path536, "stroke", "#000");
    			attr_dev(path536, "stroke-width", ".1");
    			attr_dev(path536, "d", "M133.2 217.1v-1.2m-.5 1.1v-1m.2 1v-1m-.7 1v-1m.2 1v-1m-.9 1v-1m.2 1v-1m.3 1v-1m-.7 1v-1m-.3.9v-.8m-.1.8v-.8m-.5.7v-.6m.2.6v-.6m-.4.5v-.5m-.2.5v-.4m-.3.3v-.3m-.3.3v-.2");
    			add_location(path536, file$9, 2126, 1, 94052);
    			attr_dev(path537, "fill", "none");
    			attr_dev(path537, "stroke", "#000");
    			attr_dev(path537, "stroke-width", ".2");
    			attr_dev(path537, "d", "M129.2 216.6v-.2");
    			add_location(path537, file$9, 2132, 1, 94286);
    			attr_dev(path538, "fill", "none");
    			attr_dev(path538, "stroke", "#000");
    			attr_dev(path538, "stroke-width", "0");
    			attr_dev(path538, "d", "M135.7 217v-1m-.5 1v-1m-.4 1.2V216m143 1.1V216m-.4 1.1V216m-.3 1.1V216m-.3 1.2V216");
    			add_location(path538, file$9, 2133, 1, 94361);
    			attr_dev(path539, "fill", "none");
    			attr_dev(path539, "stroke", "#000");
    			attr_dev(path539, "stroke-width", ".1");
    			attr_dev(path539, "d", "M276.6 217.1V216m-.6 1v-1m.3 1v-1m-.8 1v-1m.3 1v-1m-.9 1v-1m.2 1v-1m.2 1v-1m-.6 1v-1m-.3.9v-.8m-.2.8v-.8m-.4.7v-.6m.2.6v-.6m-.5.6v-.6m-.2.5v-.4m-.3.4v-.4m-.2.3v-.2");
    			add_location(path539, file$9, 2139, 1, 94510);
    			attr_dev(path540, "fill", "none");
    			attr_dev(path540, "stroke", "#000");
    			attr_dev(path540, "stroke-width", ".2");
    			attr_dev(path540, "d", "M272.6 216.6v-.2");
    			add_location(path540, file$9, 2145, 1, 94741);
    			attr_dev(path541, "fill", "none");
    			attr_dev(path541, "stroke", "#000");
    			attr_dev(path541, "stroke-width", "0");
    			attr_dev(path541, "d", "M279.1 217v-1m-.6 1v-1m-.4 1.1V216");
    			add_location(path541, file$9, 2146, 1, 94816);
    			set_svg_attributes(svg, svg_data);
    			add_location(svg, file$9, 5, 0, 83);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path0);
    			append_dev(svg, path1);
    			append_dev(svg, path2);
    			append_dev(svg, path3);
    			append_dev(svg, path4);
    			append_dev(svg, path5);
    			append_dev(svg, path6);
    			append_dev(svg, path7);
    			append_dev(svg, path8);
    			append_dev(svg, path9);
    			append_dev(svg, path10);
    			append_dev(svg, path11);
    			append_dev(svg, path12);
    			append_dev(svg, path13);
    			append_dev(svg, path14);
    			append_dev(svg, path15);
    			append_dev(svg, path16);
    			append_dev(svg, path17);
    			append_dev(svg, path18);
    			append_dev(svg, path19);
    			append_dev(svg, path20);
    			append_dev(svg, path21);
    			append_dev(svg, path22);
    			append_dev(svg, path23);
    			append_dev(svg, path24);
    			append_dev(svg, path25);
    			append_dev(svg, path26);
    			append_dev(svg, path27);
    			append_dev(svg, path28);
    			append_dev(svg, path29);
    			append_dev(svg, path30);
    			append_dev(svg, path31);
    			append_dev(svg, path32);
    			append_dev(svg, path33);
    			append_dev(svg, path34);
    			append_dev(svg, path35);
    			append_dev(svg, path36);
    			append_dev(svg, path37);
    			append_dev(svg, path38);
    			append_dev(svg, path39);
    			append_dev(svg, path40);
    			append_dev(svg, path41);
    			append_dev(svg, path42);
    			append_dev(svg, path43);
    			append_dev(svg, path44);
    			append_dev(svg, path45);
    			append_dev(svg, path46);
    			append_dev(svg, path47);
    			append_dev(svg, path48);
    			append_dev(svg, path49);
    			append_dev(svg, path50);
    			append_dev(svg, path51);
    			append_dev(svg, path52);
    			append_dev(svg, path53);
    			append_dev(svg, path54);
    			append_dev(svg, path55);
    			append_dev(svg, path56);
    			append_dev(svg, path57);
    			append_dev(svg, path58);
    			append_dev(svg, path59);
    			append_dev(svg, path60);
    			append_dev(svg, path61);
    			append_dev(svg, path62);
    			append_dev(svg, path63);
    			append_dev(svg, path64);
    			append_dev(svg, path65);
    			append_dev(svg, path66);
    			append_dev(svg, path67);
    			append_dev(svg, path68);
    			append_dev(svg, path69);
    			append_dev(svg, path70);
    			append_dev(svg, path71);
    			append_dev(svg, path72);
    			append_dev(svg, path73);
    			append_dev(svg, path74);
    			append_dev(svg, path75);
    			append_dev(svg, path76);
    			append_dev(svg, path77);
    			append_dev(svg, path78);
    			append_dev(svg, path79);
    			append_dev(svg, path80);
    			append_dev(svg, path81);
    			append_dev(svg, path82);
    			append_dev(svg, path83);
    			append_dev(svg, path84);
    			append_dev(svg, path85);
    			append_dev(svg, path86);
    			append_dev(svg, path87);
    			append_dev(svg, path88);
    			append_dev(svg, path89);
    			append_dev(svg, path90);
    			append_dev(svg, path91);
    			append_dev(svg, path92);
    			append_dev(svg, path93);
    			append_dev(svg, path94);
    			append_dev(svg, path95);
    			append_dev(svg, path96);
    			append_dev(svg, path97);
    			append_dev(svg, path98);
    			append_dev(svg, path99);
    			append_dev(svg, path100);
    			append_dev(svg, path101);
    			append_dev(svg, path102);
    			append_dev(svg, path103);
    			append_dev(svg, path104);
    			append_dev(svg, path105);
    			append_dev(svg, path106);
    			append_dev(svg, path107);
    			append_dev(svg, path108);
    			append_dev(svg, path109);
    			append_dev(svg, path110);
    			append_dev(svg, path111);
    			append_dev(svg, path112);
    			append_dev(svg, path113);
    			append_dev(svg, path114);
    			append_dev(svg, path115);
    			append_dev(svg, path116);
    			append_dev(svg, path117);
    			append_dev(svg, path118);
    			append_dev(svg, path119);
    			append_dev(svg, path120);
    			append_dev(svg, path121);
    			append_dev(svg, path122);
    			append_dev(svg, path123);
    			append_dev(svg, path124);
    			append_dev(svg, path125);
    			append_dev(svg, path126);
    			append_dev(svg, path127);
    			append_dev(svg, path128);
    			append_dev(svg, path129);
    			append_dev(svg, path130);
    			append_dev(svg, path131);
    			append_dev(svg, path132);
    			append_dev(svg, path133);
    			append_dev(svg, path134);
    			append_dev(svg, path135);
    			append_dev(svg, path136);
    			append_dev(svg, path137);
    			append_dev(svg, path138);
    			append_dev(svg, path139);
    			append_dev(svg, path140);
    			append_dev(svg, path141);
    			append_dev(svg, path142);
    			append_dev(svg, path143);
    			append_dev(svg, path144);
    			append_dev(svg, path145);
    			append_dev(svg, path146);
    			append_dev(svg, path147);
    			append_dev(svg, path148);
    			append_dev(svg, path149);
    			append_dev(svg, path150);
    			append_dev(svg, path151);
    			append_dev(svg, path152);
    			append_dev(svg, path153);
    			append_dev(svg, path154);
    			append_dev(svg, path155);
    			append_dev(svg, path156);
    			append_dev(svg, path157);
    			append_dev(svg, path158);
    			append_dev(svg, path159);
    			append_dev(svg, path160);
    			append_dev(svg, path161);
    			append_dev(svg, path162);
    			append_dev(svg, path163);
    			append_dev(svg, path164);
    			append_dev(svg, path165);
    			append_dev(svg, path166);
    			append_dev(svg, path167);
    			append_dev(svg, path168);
    			append_dev(svg, path169);
    			append_dev(svg, path170);
    			append_dev(svg, path171);
    			append_dev(svg, path172);
    			append_dev(svg, path173);
    			append_dev(svg, path174);
    			append_dev(svg, path175);
    			append_dev(svg, path176);
    			append_dev(svg, path177);
    			append_dev(svg, path178);
    			append_dev(svg, path179);
    			append_dev(svg, path180);
    			append_dev(svg, path181);
    			append_dev(svg, path182);
    			append_dev(svg, path183);
    			append_dev(svg, path184);
    			append_dev(svg, path185);
    			append_dev(svg, path186);
    			append_dev(svg, path187);
    			append_dev(svg, path188);
    			append_dev(svg, path189);
    			append_dev(svg, path190);
    			append_dev(svg, path191);
    			append_dev(svg, path192);
    			append_dev(svg, path193);
    			append_dev(svg, path194);
    			append_dev(svg, path195);
    			append_dev(svg, path196);
    			append_dev(svg, path197);
    			append_dev(svg, path198);
    			append_dev(svg, path199);
    			append_dev(svg, path200);
    			append_dev(svg, path201);
    			append_dev(svg, path202);
    			append_dev(svg, path203);
    			append_dev(svg, path204);
    			append_dev(svg, path205);
    			append_dev(svg, path206);
    			append_dev(svg, path207);
    			append_dev(svg, path208);
    			append_dev(svg, path209);
    			append_dev(svg, path210);
    			append_dev(svg, path211);
    			append_dev(svg, path212);
    			append_dev(svg, path213);
    			append_dev(svg, path214);
    			append_dev(svg, path215);
    			append_dev(svg, path216);
    			append_dev(svg, path217);
    			append_dev(svg, path218);
    			append_dev(svg, path219);
    			append_dev(svg, path220);
    			append_dev(svg, path221);
    			append_dev(svg, path222);
    			append_dev(svg, path223);
    			append_dev(svg, path224);
    			append_dev(svg, path225);
    			append_dev(svg, path226);
    			append_dev(svg, path227);
    			append_dev(svg, path228);
    			append_dev(svg, path229);
    			append_dev(svg, path230);
    			append_dev(svg, path231);
    			append_dev(svg, path232);
    			append_dev(svg, path233);
    			append_dev(svg, path234);
    			append_dev(svg, path235);
    			append_dev(svg, path236);
    			append_dev(svg, path237);
    			append_dev(svg, path238);
    			append_dev(svg, path239);
    			append_dev(svg, path240);
    			append_dev(svg, path241);
    			append_dev(svg, path242);
    			append_dev(svg, path243);
    			append_dev(svg, path244);
    			append_dev(svg, path245);
    			append_dev(svg, path246);
    			append_dev(svg, path247);
    			append_dev(svg, path248);
    			append_dev(svg, path249);
    			append_dev(svg, path250);
    			append_dev(svg, path251);
    			append_dev(svg, path252);
    			append_dev(svg, path253);
    			append_dev(svg, path254);
    			append_dev(svg, path255);
    			append_dev(svg, path256);
    			append_dev(svg, path257);
    			append_dev(svg, path258);
    			append_dev(svg, path259);
    			append_dev(svg, path260);
    			append_dev(svg, path261);
    			append_dev(svg, path262);
    			append_dev(svg, path263);
    			append_dev(svg, path264);
    			append_dev(svg, path265);
    			append_dev(svg, path266);
    			append_dev(svg, path267);
    			append_dev(svg, path268);
    			append_dev(svg, path269);
    			append_dev(svg, path270);
    			append_dev(svg, path271);
    			append_dev(svg, path272);
    			append_dev(svg, path273);
    			append_dev(svg, path274);
    			append_dev(svg, path275);
    			append_dev(svg, path276);
    			append_dev(svg, path277);
    			append_dev(svg, path278);
    			append_dev(svg, path279);
    			append_dev(svg, path280);
    			append_dev(svg, path281);
    			append_dev(svg, path282);
    			append_dev(svg, path283);
    			append_dev(svg, path284);
    			append_dev(svg, path285);
    			append_dev(svg, path286);
    			append_dev(svg, path287);
    			append_dev(svg, path288);
    			append_dev(svg, path289);
    			append_dev(svg, path290);
    			append_dev(svg, path291);
    			append_dev(svg, path292);
    			append_dev(svg, path293);
    			append_dev(svg, path294);
    			append_dev(svg, path295);
    			append_dev(svg, path296);
    			append_dev(svg, path297);
    			append_dev(svg, path298);
    			append_dev(svg, path299);
    			append_dev(svg, path300);
    			append_dev(svg, path301);
    			append_dev(svg, path302);
    			append_dev(svg, path303);
    			append_dev(svg, path304);
    			append_dev(svg, path305);
    			append_dev(svg, path306);
    			append_dev(svg, path307);
    			append_dev(svg, path308);
    			append_dev(svg, path309);
    			append_dev(svg, path310);
    			append_dev(svg, path311);
    			append_dev(svg, path312);
    			append_dev(svg, path313);
    			append_dev(svg, path314);
    			append_dev(svg, path315);
    			append_dev(svg, path316);
    			append_dev(svg, path317);
    			append_dev(svg, path318);
    			append_dev(svg, path319);
    			append_dev(svg, path320);
    			append_dev(svg, path321);
    			append_dev(svg, path322);
    			append_dev(svg, path323);
    			append_dev(svg, path324);
    			append_dev(svg, path325);
    			append_dev(svg, path326);
    			append_dev(svg, path327);
    			append_dev(svg, path328);
    			append_dev(svg, path329);
    			append_dev(svg, path330);
    			append_dev(svg, path331);
    			append_dev(svg, path332);
    			append_dev(svg, path333);
    			append_dev(svg, path334);
    			append_dev(svg, path335);
    			append_dev(svg, path336);
    			append_dev(svg, path337);
    			append_dev(svg, path338);
    			append_dev(svg, path339);
    			append_dev(svg, path340);
    			append_dev(svg, path341);
    			append_dev(svg, path342);
    			append_dev(svg, path343);
    			append_dev(svg, path344);
    			append_dev(svg, path345);
    			append_dev(svg, path346);
    			append_dev(svg, path347);
    			append_dev(svg, path348);
    			append_dev(svg, path349);
    			append_dev(svg, path350);
    			append_dev(svg, path351);
    			append_dev(svg, path352);
    			append_dev(svg, path353);
    			append_dev(svg, path354);
    			append_dev(svg, path355);
    			append_dev(svg, path356);
    			append_dev(svg, path357);
    			append_dev(svg, path358);
    			append_dev(svg, path359);
    			append_dev(svg, path360);
    			append_dev(svg, path361);
    			append_dev(svg, path362);
    			append_dev(svg, path363);
    			append_dev(svg, path364);
    			append_dev(svg, path365);
    			append_dev(svg, path366);
    			append_dev(svg, path367);
    			append_dev(svg, path368);
    			append_dev(svg, path369);
    			append_dev(svg, path370);
    			append_dev(svg, path371);
    			append_dev(svg, path372);
    			append_dev(svg, path373);
    			append_dev(svg, path374);
    			append_dev(svg, path375);
    			append_dev(svg, path376);
    			append_dev(svg, path377);
    			append_dev(svg, path378);
    			append_dev(svg, path379);
    			append_dev(svg, path380);
    			append_dev(svg, path381);
    			append_dev(svg, path382);
    			append_dev(svg, path383);
    			append_dev(svg, path384);
    			append_dev(svg, path385);
    			append_dev(svg, path386);
    			append_dev(svg, path387);
    			append_dev(svg, path388);
    			append_dev(svg, path389);
    			append_dev(svg, path390);
    			append_dev(svg, path391);
    			append_dev(svg, path392);
    			append_dev(svg, path393);
    			append_dev(svg, path394);
    			append_dev(svg, path395);
    			append_dev(svg, path396);
    			append_dev(svg, path397);
    			append_dev(svg, path398);
    			append_dev(svg, path399);
    			append_dev(svg, path400);
    			append_dev(svg, path401);
    			append_dev(svg, path402);
    			append_dev(svg, path403);
    			append_dev(svg, path404);
    			append_dev(svg, path405);
    			append_dev(svg, path406);
    			append_dev(svg, path407);
    			append_dev(svg, path408);
    			append_dev(svg, path409);
    			append_dev(svg, path410);
    			append_dev(svg, path411);
    			append_dev(svg, path412);
    			append_dev(svg, path413);
    			append_dev(svg, path414);
    			append_dev(svg, path415);
    			append_dev(svg, path416);
    			append_dev(svg, path417);
    			append_dev(svg, path418);
    			append_dev(svg, path419);
    			append_dev(svg, path420);
    			append_dev(svg, path421);
    			append_dev(svg, path422);
    			append_dev(svg, path423);
    			append_dev(svg, path424);
    			append_dev(svg, path425);
    			append_dev(svg, path426);
    			append_dev(svg, path427);
    			append_dev(svg, path428);
    			append_dev(svg, path429);
    			append_dev(svg, path430);
    			append_dev(svg, path431);
    			append_dev(svg, path432);
    			append_dev(svg, path433);
    			append_dev(svg, path434);
    			append_dev(svg, path435);
    			append_dev(svg, path436);
    			append_dev(svg, path437);
    			append_dev(svg, path438);
    			append_dev(svg, path439);
    			append_dev(svg, path440);
    			append_dev(svg, path441);
    			append_dev(svg, path442);
    			append_dev(svg, path443);
    			append_dev(svg, path444);
    			append_dev(svg, path445);
    			append_dev(svg, path446);
    			append_dev(svg, path447);
    			append_dev(svg, path448);
    			append_dev(svg, path449);
    			append_dev(svg, path450);
    			append_dev(svg, path451);
    			append_dev(svg, path452);
    			append_dev(svg, path453);
    			append_dev(svg, path454);
    			append_dev(svg, path455);
    			append_dev(svg, path456);
    			append_dev(svg, path457);
    			append_dev(svg, path458);
    			append_dev(svg, path459);
    			append_dev(svg, path460);
    			append_dev(svg, path461);
    			append_dev(svg, path462);
    			append_dev(svg, path463);
    			append_dev(svg, path464);
    			append_dev(svg, path465);
    			append_dev(svg, path466);
    			append_dev(svg, path467);
    			append_dev(svg, path468);
    			append_dev(svg, path469);
    			append_dev(svg, path470);
    			append_dev(svg, path471);
    			append_dev(svg, path472);
    			append_dev(svg, path473);
    			append_dev(svg, path474);
    			append_dev(svg, path475);
    			append_dev(svg, path476);
    			append_dev(svg, path477);
    			append_dev(svg, path478);
    			append_dev(svg, path479);
    			append_dev(svg, path480);
    			append_dev(svg, path481);
    			append_dev(svg, path482);
    			append_dev(svg, path483);
    			append_dev(svg, path484);
    			append_dev(svg, path485);
    			append_dev(svg, path486);
    			append_dev(svg, path487);
    			append_dev(svg, path488);
    			append_dev(svg, path489);
    			append_dev(svg, path490);
    			append_dev(svg, path491);
    			append_dev(svg, path492);
    			append_dev(svg, path493);
    			append_dev(svg, path494);
    			append_dev(svg, path495);
    			append_dev(svg, path496);
    			append_dev(svg, path497);
    			append_dev(svg, path498);
    			append_dev(svg, path499);
    			append_dev(svg, path500);
    			append_dev(svg, path501);
    			append_dev(svg, path502);
    			append_dev(svg, path503);
    			append_dev(svg, path504);
    			append_dev(svg, path505);
    			append_dev(svg, path506);
    			append_dev(svg, path507);
    			append_dev(svg, path508);
    			append_dev(svg, path509);
    			append_dev(svg, path510);
    			append_dev(svg, path511);
    			append_dev(svg, path512);
    			append_dev(svg, path513);
    			append_dev(svg, path514);
    			append_dev(svg, path515);
    			append_dev(svg, path516);
    			append_dev(svg, path517);
    			append_dev(svg, path518);
    			append_dev(svg, path519);
    			append_dev(svg, path520);
    			append_dev(svg, path521);
    			append_dev(svg, path522);
    			append_dev(svg, path523);
    			append_dev(svg, path524);
    			append_dev(svg, path525);
    			append_dev(svg, path526);
    			append_dev(svg, path527);
    			append_dev(svg, path528);
    			append_dev(svg, path529);
    			append_dev(svg, path530);
    			append_dev(svg, path531);
    			append_dev(svg, path532);
    			append_dev(svg, path533);
    			append_dev(svg, path534);
    			append_dev(svg, path535);
    			append_dev(svg, path536);
    			append_dev(svg, path537);
    			append_dev(svg, path538);
    			append_dev(svg, path539);
    			append_dev(svg, path540);
    			append_dev(svg, path541);
    		},
    		p: function update(ctx, [dirty]) {
    			set_svg_attributes(svg, svg_data = get_spread_update(svg_levels, [
    				{ xmlns: "http://www.w3.org/2000/svg" },
    				{ id: "flag-icons-es" },
    				dirty & /*size*/ 1 && { width: /*size*/ ctx[0] },
    				dirty & /*size*/ 1 && { height: /*size*/ ctx[0] },
    				dirty & /*$$props*/ 4 && svg_class_value !== (svg_class_value = /*$$props*/ ctx[2].class) && { class: svg_class_value },
    				dirty & /*$$restProps*/ 8 && /*$$restProps*/ ctx[3],
    				dirty & /*ariaLabel*/ 2 && { "aria-label": /*ariaLabel*/ ctx[1] },
    				{ viewBox: "0 0 640 480" }
    			]));
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	const omit_props_names = ["size","ariaLabel"];
    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Es', slots, []);
    	let { size = '24' } = $$props;
    	let { ariaLabel = 'flag of es' } = $$props;

    	$$self.$$set = $$new_props => {
    		$$invalidate(2, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		$$invalidate(3, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ('size' in $$new_props) $$invalidate(0, size = $$new_props.size);
    		if ('ariaLabel' in $$new_props) $$invalidate(1, ariaLabel = $$new_props.ariaLabel);
    	};

    	$$self.$capture_state = () => ({ size, ariaLabel });

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(2, $$props = assign(assign({}, $$props), $$new_props));
    		if ('size' in $$props) $$invalidate(0, size = $$new_props.size);
    		if ('ariaLabel' in $$props) $$invalidate(1, ariaLabel = $$new_props.ariaLabel);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$props = exclude_internal_props($$props);
    	return [size, ariaLabel, $$props, $$restProps];
    }

    class Es extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { size: 0, ariaLabel: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Es",
    			options,
    			id: create_fragment$9.name
    		});
    	}

    	get size() {
    		throw new Error("<Es>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Es>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get ariaLabel() {
    		throw new Error("<Es>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ariaLabel(value) {
    		throw new Error("<Es>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelte-flag-icons/De.svelte generated by Svelte v3.49.0 */

    const file$8 = "node_modules/svelte-flag-icons/De.svelte";

    function create_fragment$8(ctx) {
    	let svg;
    	let path0;
    	let path1;
    	let path2;
    	let svg_class_value;

    	let svg_levels = [
    		{ xmlns: "http://www.w3.org/2000/svg" },
    		{ id: "flag-icons-de" },
    		{ width: /*size*/ ctx[0] },
    		{ height: /*size*/ ctx[0] },
    		{
    			class: svg_class_value = /*$$props*/ ctx[2].class
    		},
    		/*$$restProps*/ ctx[3],
    		{ "aria-label": /*ariaLabel*/ ctx[1] },
    		{ viewBox: "0 0 640 480" }
    	];

    	let svg_data = {};

    	for (let i = 0; i < svg_levels.length; i += 1) {
    		svg_data = assign(svg_data, svg_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			path2 = svg_element("path");
    			attr_dev(path0, "fill", "#ffce00");
    			attr_dev(path0, "d", "M0 320h640v160H0z");
    			add_location(path0, file$8, 15, 1, 264);
    			attr_dev(path1, "fill", "#000");
    			attr_dev(path1, "d", "M0 0h640v160H0z");
    			add_location(path1, file$8, 16, 1, 311);
    			attr_dev(path2, "fill", "#d00");
    			attr_dev(path2, "d", "M0 160h640v160H0z");
    			add_location(path2, file$8, 17, 1, 353);
    			set_svg_attributes(svg, svg_data);
    			add_location(svg, file$8, 5, 0, 83);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path0);
    			append_dev(svg, path1);
    			append_dev(svg, path2);
    		},
    		p: function update(ctx, [dirty]) {
    			set_svg_attributes(svg, svg_data = get_spread_update(svg_levels, [
    				{ xmlns: "http://www.w3.org/2000/svg" },
    				{ id: "flag-icons-de" },
    				dirty & /*size*/ 1 && { width: /*size*/ ctx[0] },
    				dirty & /*size*/ 1 && { height: /*size*/ ctx[0] },
    				dirty & /*$$props*/ 4 && svg_class_value !== (svg_class_value = /*$$props*/ ctx[2].class) && { class: svg_class_value },
    				dirty & /*$$restProps*/ 8 && /*$$restProps*/ ctx[3],
    				dirty & /*ariaLabel*/ 2 && { "aria-label": /*ariaLabel*/ ctx[1] },
    				{ viewBox: "0 0 640 480" }
    			]));
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	const omit_props_names = ["size","ariaLabel"];
    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('De', slots, []);
    	let { size = '24' } = $$props;
    	let { ariaLabel = 'flag of de' } = $$props;

    	$$self.$$set = $$new_props => {
    		$$invalidate(2, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		$$invalidate(3, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ('size' in $$new_props) $$invalidate(0, size = $$new_props.size);
    		if ('ariaLabel' in $$new_props) $$invalidate(1, ariaLabel = $$new_props.ariaLabel);
    	};

    	$$self.$capture_state = () => ({ size, ariaLabel });

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(2, $$props = assign(assign({}, $$props), $$new_props));
    		if ('size' in $$props) $$invalidate(0, size = $$new_props.size);
    		if ('ariaLabel' in $$props) $$invalidate(1, ariaLabel = $$new_props.ariaLabel);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$props = exclude_internal_props($$props);
    	return [size, ariaLabel, $$props, $$restProps];
    }

    class De extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { size: 0, ariaLabel: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "De",
    			options,
    			id: create_fragment$8.name
    		});
    	}

    	get size() {
    		throw new Error("<De>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<De>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get ariaLabel() {
    		throw new Error("<De>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ariaLabel(value) {
    		throw new Error("<De>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelte-flag-icons/Se.svelte generated by Svelte v3.49.0 */

    const file$7 = "node_modules/svelte-flag-icons/Se.svelte";

    function create_fragment$7(ctx) {
    	let svg;
    	let path0;
    	let path1;
    	let svg_class_value;

    	let svg_levels = [
    		{ xmlns: "http://www.w3.org/2000/svg" },
    		{ id: "flag-icons-se" },
    		{ width: /*size*/ ctx[0] },
    		{ height: /*size*/ ctx[0] },
    		{
    			class: svg_class_value = /*$$props*/ ctx[2].class
    		},
    		/*$$restProps*/ ctx[3],
    		{ "aria-label": /*ariaLabel*/ ctx[1] },
    		{ viewBox: "0 0 640 480" }
    	];

    	let svg_data = {};

    	for (let i = 0; i < svg_levels.length; i += 1) {
    		svg_data = assign(svg_data, svg_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			attr_dev(path0, "fill", "#005293");
    			attr_dev(path0, "d", "M0 0h640v480H0z");
    			add_location(path0, file$7, 15, 1, 264);
    			attr_dev(path1, "fill", "#fecb00");
    			attr_dev(path1, "d", "M176 0v192H0v96h176v192h96V288h368v-96H272V0h-96z");
    			add_location(path1, file$7, 16, 1, 309);
    			set_svg_attributes(svg, svg_data);
    			add_location(svg, file$7, 5, 0, 83);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path0);
    			append_dev(svg, path1);
    		},
    		p: function update(ctx, [dirty]) {
    			set_svg_attributes(svg, svg_data = get_spread_update(svg_levels, [
    				{ xmlns: "http://www.w3.org/2000/svg" },
    				{ id: "flag-icons-se" },
    				dirty & /*size*/ 1 && { width: /*size*/ ctx[0] },
    				dirty & /*size*/ 1 && { height: /*size*/ ctx[0] },
    				dirty & /*$$props*/ 4 && svg_class_value !== (svg_class_value = /*$$props*/ ctx[2].class) && { class: svg_class_value },
    				dirty & /*$$restProps*/ 8 && /*$$restProps*/ ctx[3],
    				dirty & /*ariaLabel*/ 2 && { "aria-label": /*ariaLabel*/ ctx[1] },
    				{ viewBox: "0 0 640 480" }
    			]));
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	const omit_props_names = ["size","ariaLabel"];
    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Se', slots, []);
    	let { size = '24' } = $$props;
    	let { ariaLabel = 'flag of se' } = $$props;

    	$$self.$$set = $$new_props => {
    		$$invalidate(2, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		$$invalidate(3, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ('size' in $$new_props) $$invalidate(0, size = $$new_props.size);
    		if ('ariaLabel' in $$new_props) $$invalidate(1, ariaLabel = $$new_props.ariaLabel);
    	};

    	$$self.$capture_state = () => ({ size, ariaLabel });

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(2, $$props = assign(assign({}, $$props), $$new_props));
    		if ('size' in $$props) $$invalidate(0, size = $$new_props.size);
    		if ('ariaLabel' in $$props) $$invalidate(1, ariaLabel = $$new_props.ariaLabel);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$props = exclude_internal_props($$props);
    	return [size, ariaLabel, $$props, $$restProps];
    }

    class Se extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { size: 0, ariaLabel: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Se",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get size() {
    		throw new Error("<Se>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Se>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get ariaLabel() {
    		throw new Error("<Se>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ariaLabel(value) {
    		throw new Error("<Se>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Boxes.svelte generated by Svelte v3.49.0 */
    const file$6 = "src/components/Boxes.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	child_ctx[8] = list;
    	child_ctx[9] = i;
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	return child_ctx;
    }

    // (6:12) { #if b.img }
    function create_if_block_5(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			attr_dev(img, "loading", "lazy");
    			if (!src_url_equal(img.src, img_src_value = /*b*/ ctx[7].img)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			attr_dev(img, "class", "svelte-ckqlq5");
    			add_location(img, file$6, 6, 12, 191);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*boxes*/ 2 && !src_url_equal(img.src, img_src_value = /*b*/ ctx[7].img)) {
    				attr_dev(img, "src", img_src_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(6:12) { #if b.img }",
    		ctx
    	});

    	return block;
    }

    // (14:12) { #if b.subtitles }
    function create_if_block_2(ctx) {
    	let each_1_anchor;
    	let each_value_1 = /*b*/ ctx[7].subtitles;
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*boxes*/ 2) {
    				each_value_1 = /*b*/ ctx[7].subtitles;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(14:12) { #if b.subtitles }",
    		ctx
    	});

    	return block;
    }

    // (16:20) { #if s.flag }
    function create_if_block_4(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			attr_dev(img, "loading", "lazy");
    			if (!src_url_equal(img.src, img_src_value = "./images/flags/" + /*s*/ ctx[10].flag.toLowerCase() + ".svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "flag");
    			attr_dev(img, "class", "flag svelte-ckqlq5");
    			attr_dev(img, "width", "640");
    			attr_dev(img, "height", "480");
    			add_location(img, file$6, 15, 35, 495);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*boxes*/ 2 && !src_url_equal(img.src, img_src_value = "./images/flags/" + /*s*/ ctx[10].flag.toLowerCase() + ".svg")) {
    				attr_dev(img, "src", img_src_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(16:20) { #if s.flag }",
    		ctx
    	});

    	return block;
    }

    // (18:101) { :else }
    function create_else_block(ctx) {
    	let t_value = /*s*/ ctx[10].name + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*boxes*/ 2 && t_value !== (t_value = /*s*/ ctx[10].name + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(18:101) { :else }",
    		ctx
    	});

    	return block;
    }

    // (18:24) { #if s.url }
    function create_if_block_3(ctx) {
    	let a;
    	let t_value = /*s*/ ctx[10].name + "";
    	let t;
    	let a_href_value;

    	const block = {
    		c: function create() {
    			a = element("a");
    			t = text(t_value);
    			attr_dev(a, "class", "box-url svelte-ckqlq5");
    			attr_dev(a, "target", "_blank");
    			attr_dev(a, "href", a_href_value = /*s*/ ctx[10].url);
    			add_location(a, file$6, 17, 37, 685);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*boxes*/ 2 && t_value !== (t_value = /*s*/ ctx[10].name + "")) set_data_dev(t, t_value);

    			if (dirty & /*boxes*/ 2 && a_href_value !== (a_href_value = /*s*/ ctx[10].url)) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(18:24) { #if s.url }",
    		ctx
    	});

    	return block;
    }

    // (14:31) {#each b.subtitles as s}
    function create_each_block_1$1(ctx) {
    	let div;
    	let t0;
    	let h4;
    	let t1_value = /*s*/ ctx[10].text + "";
    	let t1;
    	let t2;
    	let if_block0 = /*s*/ ctx[10].flag && create_if_block_4(ctx);

    	function select_block_type(ctx, dirty) {
    		if (/*s*/ ctx[10].url) return create_if_block_3;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block1 = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			h4 = element("h4");
    			if_block1.c();
    			t1 = text(t1_value);
    			t2 = space();
    			attr_dev(h4, "class", "svelte-ckqlq5");
    			add_location(h4, file$6, 16, 20, 642);
    			attr_dev(div, "class", "subtitle svelte-ckqlq5");
    			add_location(div, file$6, 14, 16, 437);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block0) if_block0.m(div, null);
    			append_dev(div, t0);
    			append_dev(div, h4);
    			if_block1.m(h4, null);
    			append_dev(h4, t1);
    			insert_dev(target, t2, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*s*/ ctx[10].flag) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_4(ctx);
    					if_block0.c();
    					if_block0.m(div, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block1) {
    				if_block1.p(ctx, dirty);
    			} else {
    				if_block1.d(1);
    				if_block1 = current_block_type(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(h4, t1);
    				}
    			}

    			if (dirty & /*boxes*/ 2 && t1_value !== (t1_value = /*s*/ ctx[10].text + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block0) if_block0.d();
    			if_block1.d();
    			if (detaching) detach_dev(t2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(14:31) {#each b.subtitles as s}",
    		ctx
    	});

    	return block;
    }

    // (25:12) { #if b.more }
    function create_if_block$1(ctx) {
    	let t0;
    	let p;
    	let t1_value = (/*b*/ ctx[7].showMore ? 'Show less' : 'Show more') + "";
    	let t1;
    	let mounted;
    	let dispose;
    	let if_block = /*b*/ ctx[7].showMore && create_if_block_1$1(ctx);

    	function click_handler() {
    		return /*click_handler*/ ctx[3](/*b*/ ctx[7], /*each_value*/ ctx[8], /*b_index*/ ctx[9]);
    	}

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			t0 = space();
    			p = element("p");
    			t1 = text(t1_value);
    			attr_dev(p, "class", "show-more");
    			add_location(p, file$6, 26, 16, 1085);
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, p, anchor);
    			append_dev(p, t1);

    			if (!mounted) {
    				dispose = listen_dev(p, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (/*b*/ ctx[7].showMore) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1$1(ctx);
    					if_block.c();
    					if_block.m(t0.parentNode, t0);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*boxes*/ 2 && t1_value !== (t1_value = (/*b*/ ctx[7].showMore ? 'Show less' : 'Show more') + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(p);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(25:12) { #if b.more }",
    		ctx
    	});

    	return block;
    }

    // (26:16) { #if b.showMore }
    function create_if_block_1$1(ctx) {
    	let p;
    	let raw_value = /*b*/ ctx[7].more + "";

    	const block = {
    		c: function create() {
    			p = element("p");
    			attr_dev(p, "class", "more");
    			add_location(p, file$6, 25, 35, 1025);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			p.innerHTML = raw_value;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*boxes*/ 2 && raw_value !== (raw_value = /*b*/ ctx[7].more + "")) p.innerHTML = raw_value;		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(26:16) { #if b.showMore }",
    		ctx
    	});

    	return block;
    }

    // (3:4) {#each boxes as b}
    function create_each_block$1(ctx) {
    	let div3;
    	let div0;
    	let t0;
    	let div1;
    	let h3;
    	let t1_value = /*b*/ ctx[7].title + "";
    	let t1;
    	let t2;
    	let t3;
    	let div2;
    	let p;
    	let raw_value = /*b*/ ctx[7].description + "";
    	let t4;
    	let t5;
    	let span0;
    	let t6;
    	let span1;
    	let t7;
    	let div3_class_value;
    	let if_block0 = /*b*/ ctx[7].img && create_if_block_5(ctx);
    	let if_block1 = /*b*/ ctx[7].subtitles && create_if_block_2(ctx);
    	let if_block2 = /*b*/ ctx[7].more && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div0 = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			div1 = element("div");
    			h3 = element("h3");
    			t1 = text(t1_value);
    			t2 = space();
    			if (if_block1) if_block1.c();
    			t3 = space();
    			div2 = element("div");
    			p = element("p");
    			t4 = space();
    			if (if_block2) if_block2.c();
    			t5 = space();
    			span0 = element("span");
    			t6 = space();
    			span1 = element("span");
    			t7 = space();
    			attr_dev(div0, "class", "box-img svelte-ckqlq5");
    			add_location(div0, file$6, 4, 8, 131);
    			attr_dev(h3, "class", "svelte-ckqlq5");
    			add_location(h3, file$6, 10, 12, 314);
    			attr_dev(div1, "class", "box-title");
    			add_location(div1, file$6, 9, 8, 278);
    			add_location(p, file$6, 23, 12, 933);
    			attr_dev(span0, "class", "fi fi-gr");
    			add_location(span0, file$6, 28, 12, 1230);
    			attr_dev(span1, "class", "fi fi-gr fis");
    			add_location(span1, file$6, 28, 43, 1261);
    			attr_dev(div2, "class", "box-description");
    			add_location(div2, file$6, 22, 8, 891);
    			attr_dev(div3, "class", div3_class_value = "" + (null_to_empty(/*b*/ ctx[7].flipped ? 'box flipped' : 'box') + " svelte-ckqlq5"));
    			add_location(div3, file$6, 3, 4, 73);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div0);
    			if (if_block0) if_block0.m(div0, null);
    			append_dev(div3, t0);
    			append_dev(div3, div1);
    			append_dev(div1, h3);
    			append_dev(h3, t1);
    			append_dev(div1, t2);
    			if (if_block1) if_block1.m(div1, null);
    			append_dev(div3, t3);
    			append_dev(div3, div2);
    			append_dev(div2, p);
    			p.innerHTML = raw_value;
    			append_dev(div2, t4);
    			if (if_block2) if_block2.m(div2, null);
    			append_dev(div2, t5);
    			append_dev(div2, span0);
    			append_dev(div2, t6);
    			append_dev(div2, span1);
    			append_dev(div3, t7);
    		},
    		p: function update(ctx, dirty) {
    			if (/*b*/ ctx[7].img) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_5(ctx);
    					if_block0.c();
    					if_block0.m(div0, null);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (dirty & /*boxes*/ 2 && t1_value !== (t1_value = /*b*/ ctx[7].title + "")) set_data_dev(t1, t1_value);

    			if (/*b*/ ctx[7].subtitles) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_2(ctx);
    					if_block1.c();
    					if_block1.m(div1, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (dirty & /*boxes*/ 2 && raw_value !== (raw_value = /*b*/ ctx[7].description + "")) p.innerHTML = raw_value;
    			if (/*b*/ ctx[7].more) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block$1(ctx);
    					if_block2.c();
    					if_block2.m(div2, t5);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (dirty & /*boxes*/ 2 && div3_class_value !== (div3_class_value = "" + (null_to_empty(/*b*/ ctx[7].flipped ? 'box flipped' : 'box') + " svelte-ckqlq5"))) {
    				attr_dev(div3, "class", div3_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(3:4) {#each boxes as b}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let h2;
    	let t0_value = /*titles*/ ctx[2][/*type*/ ctx[0]] + "";
    	let t0;
    	let t1;
    	let div;
    	let each_value = /*boxes*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			t0 = text(t0_value);
    			t1 = space();
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(h2, file$6, 0, 0, 0);
    			attr_dev(div, "class", "boxes");
    			add_location(div, file$6, 1, 0, 26);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			append_dev(h2, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*type*/ 1 && t0_value !== (t0_value = /*titles*/ ctx[2][/*type*/ ctx[0]] + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*boxes*/ 2) {
    				each_value = /*boxes*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Boxes', slots, []);
    	var _a;
    	let { type } = $$props;
    	const flagsComp = { It, Se, De, Es };

    	const titles = {
    		Education: 'Education',
    		Experience: 'Work Experiences',
    		Projects: 'Other Experiences'
    	};

    	const infos = {
    		Education: [
    			{
    				img: "./images/unitn.png",
    				title: "Attending Master's in Data Science",
    				subtitles: [
    					{
    						flag: "It",
    						name: "UniTn",
    						text: ", Trento, Italy | September 2021 - September 2023",
    						url: "https://www.unitn.it/"
    					}
    				],
    				description: "\
                I am currently attending a multidisciplinar Master degree in Trento in Data Science, with a minor in Sociology.\
                 ",
    				showMore: false,
    				more: "The complete list of courses I have taken:\
                <ul>\
                <li>Big Data Technologies</li>\
                <li>Data Mining</li>\
                <li>Data visualization</li>\
                <li>Foundations of Social and Psychological Science</li>\
                <li>Information, Knowledge and Service Management</li>\
                <li>introduction to Machine Learning</li>\
                <li>Law and Data</li>\
                <li>Professional English for Data Science</li>\
                <li>Statistical Learning</li>\
                <li>Statistical Methods</li>\
                </ul>\
                <br />\
                Courses I am currently attending:\
                <ul>\
                <li>Advanced social network analysisy</li>\
                <li>Digital social data</li>\
                <li>Geospatial analysis and representation for data science</li>\
                <li>Innovation and Entrepreneurship Basic</li>\
                <li>Social Dynamics Lab</li>\
                </ul>\
                "
    			},
    			{
    				img: "./images/unitn.png",
    				title: "Bachelor's in Computer Science",
    				subtitles: [
    					{
    						flag: 'It',
    						name: "University of Trento",
    						text: ", Trento, Italy | September 2018 - July 2022",
    						url: "https://www.unitn.it/"
    					}
    				],
    				description: "\
                I have taken courses in Software Engineering, Data Structures, Algorithms, and Programming and Mathematics.\
                I graduated in July 2022",
    				showMore: false,
    				more: "The complete list of courses I have taken:\
                <ul>\
                <li>Algorithms and Data Structures</li>\
                <li>Computer Programming 1</li>\
                <li>Programming Languages</li>\
                <li>Software Engineering 1 & 2</li>\
                <li>Formal Languages and Compilers</li>\
                <li>Geometry and Linear Algebra</li>\
                <li>Calculus 1</li>\
                <li>Probability and Statistics</li>\
                <li>Mathematical Foundations of Computer Science</li>\
                <li>Physics</li>\
                <li>Operating Systems</li>\
                <li>Logic</li>\
                <li>Databases</li>\
                <li>Networks</li>\
                <li>Computer Architectures</li>\
                <li>Human-Computer Interaction</li>\
                <li>Introduction to Computer and Network Security</li>\
                <li>Introduction to Web Programming</li>\
                <li>Social psychology</li>\
                <li>Introduction to Machine Learning</li>\
                </ul>\
                "
    			}
    		],
    		Experience: [
    			{
    				flipped: true,
    				img: "./images/wiki.webp",
    				title: "Data Science Internship",
    				subtitles: [
    					{
    						flag: 'Es',
    						name: "Eurecat",
    						text: ", Barcelona, Spain | January - June 2021",
    						url: "https://www.eurecat.org/"
    					}
    				],
    				description: "Analyzingc Reverts and edit wars on wikipedia ."
    			},
    			{
    				flipped: true,
    				img: "./images/unitn.png",
    				title: "Linguistic Center Division Test Center and Online Teaching",
    				subtitles: [
    					{
    						flag: 'It',
    						name: "UniTn",
    						text: ", Trento, Italy | July 2020 - july 2021"
    					}
    				],
    				description: "my role was to help teachers to handle online degrees on zoom"
    			},
    			{
    				flipped: true,
    				img: "./images/saf.jpg",
    				title: "Computer assistant",
    				subtitles: [
    					{
    						flag: 'It',
    						name: "SAF-GEST srl",
    						text: ", Rodengo Saiano, Italy | June 2020 - current"
    					}
    				],
    				description: "I give general help regarding all the computer activities of the company but I spend most of the time developing a system that allows companies to automatically generate electronic invoices for the revenue agency (agenzia delle entrate). This is not a full time job."
    			}
    		],
    		Projects: [
    			{
    				img: "./images/soi.jpg",
    				title: "School of Innovation",
    				subtitles: [
    					{
    						flag: 'It',
    						name: "SOI",
    						text: ", Trento, Italy | July 2022",
    						url: "https://www.soi.unitn.it"
    					}
    				],
    				description: "Extracurricolar program at Università di Trento focused on innovation and entrepreneurship, I'm following the courses: Empathy and innovation, From Idea to business idea. I also attend a challenge called \"design your future \" in collaboration with Muse a Museum in Trento where the goal is design a game to let children engage with syntehtic biology."
    			}
    		], // {
    		//     // img: "./images/fal.webp",
    		
    	}; //     title: "Company websites",
    	//     description: "Developed two websites to for local companies with php. I also took care of taking pictures and video to promote their products."
    	// },

    	// {
    	//     // img: "./images/kent.webp",
    	//     title: "Kent School of English",
    	//     subtitles: [ { flag: 'Gb', text: "Kent, United Kingdom | Semptember 2016" } ],
    	//     description: "I took a two week course in English at Kent School of English"
    	// }
    	const boxes = (_a = infos === null || infos === void 0
    	? void 0
    	: infos[type]) !== null && _a !== void 0
    	? _a
    	: [];

    	const writable_props = ['type'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Boxes> was created with unknown prop '${key}'`);
    	});

    	const click_handler = (b, each_value, b_index) => {
    		$$invalidate(1, each_value[b_index].showMore = !b.showMore, boxes);
    	};

    	$$self.$$set = $$props => {
    		if ('type' in $$props) $$invalidate(0, type = $$props.type);
    	};

    	$$self.$capture_state = () => ({
    		_a,
    		It,
    		Se,
    		De,
    		Es,
    		type,
    		flagsComp,
    		titles,
    		infos,
    		boxes
    	});

    	$$self.$inject_state = $$props => {
    		if ('_a' in $$props) _a = $$props._a;
    		if ('type' in $$props) $$invalidate(0, type = $$props.type);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [type, boxes, titles, click_handler];
    }

    class Boxes extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { type: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Boxes",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*type*/ ctx[0] === undefined && !('type' in props)) {
    			console.warn("<Boxes> was created without expected prop 'type'");
    		}
    	}

    	get type() {
    		throw new Error("<Boxes>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Boxes>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Skills.svelte generated by Svelte v3.49.0 */

    const file$5 = "src/components/Skills.svelte";

    function create_fragment$5(ctx) {
    	let h2;
    	let t1;
    	let div;
    	let h30;
    	let t3;
    	let p0;
    	let t5;
    	let h31;
    	let t7;
    	let p1;
    	let t9;
    	let h32;
    	let t11;
    	let p2;
    	let t13;
    	let h33;
    	let t15;
    	let p3;
    	let t17;
    	let h34;
    	let t19;
    	let p4;
    	let t21;
    	let h35;
    	let t23;
    	let p5;

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			h2.textContent = "Skills";
    			t1 = space();
    			div = element("div");
    			h30 = element("h3");
    			h30.textContent = "SOFT SKILLS:";
    			t3 = space();
    			p0 = element("p");
    			p0.textContent = "Critical thinking, Problem solving, Team work, Adaptability";
    			t5 = space();
    			h31 = element("h3");
    			h31.textContent = "PROGRAMMING LANGUAGES:";
    			t7 = space();
    			p1 = element("p");
    			p1.textContent = "Python, R,  Typescript, Javascript,";
    			t9 = space();
    			h32 = element("h3");
    			h32.textContent = "DATA SCIENCE:";
    			t11 = space();
    			p2 = element("p");
    			p2.textContent = "Pandas, Spark, Kafka, Geopandas, matplotlib";
    			t13 = space();
    			h33 = element("h3");
    			h33.textContent = "DATABASES:";
    			t15 = space();
    			p3 = element("p");
    			p3.textContent = "Postgtres, MongoDB, Sqlite";
    			t17 = space();
    			h34 = element("h3");
    			h34.textContent = "IT SOFTWARES:";
    			t19 = space();
    			p4 = element("p");
    			p4.textContent = "Linux, Git, Docker";
    			t21 = space();
    			h35 = element("h3");
    			h35.textContent = "CLOUD INFRASTRUCTURE:";
    			t23 = space();
    			p5 = element("p");
    			p5.textContent = "Google Cloud";
    			add_location(h2, file$5, 0, 0, 0);
    			attr_dev(h30, "class", "spacer svelte-18ifcb");
    			add_location(h30, file$5, 3, 4, 46);
    			attr_dev(p0, "class", "spacer svelte-18ifcb");
    			add_location(p0, file$5, 4, 4, 87);
    			attr_dev(h31, "class", "svelte-18ifcb");
    			add_location(h31, file$5, 6, 4, 176);
    			attr_dev(p1, "class", "svelte-18ifcb");
    			add_location(p1, file$5, 7, 4, 212);
    			attr_dev(h32, "class", "svelte-18ifcb");
    			add_location(h32, file$5, 9, 4, 262);
    			attr_dev(p2, "class", "svelte-18ifcb");
    			add_location(p2, file$5, 10, 4, 289);
    			attr_dev(h33, "class", "svelte-18ifcb");
    			add_location(h33, file$5, 12, 4, 348);
    			attr_dev(p3, "class", "svelte-18ifcb");
    			add_location(p3, file$5, 13, 4, 372);
    			attr_dev(h34, "class", "svelte-18ifcb");
    			add_location(h34, file$5, 15, 4, 413);
    			attr_dev(p4, "class", "svelte-18ifcb");
    			add_location(p4, file$5, 16, 4, 440);
    			attr_dev(h35, "class", "svelte-18ifcb");
    			add_location(h35, file$5, 18, 4, 473);
    			attr_dev(p5, "class", "svelte-18ifcb");
    			add_location(p5, file$5, 19, 4, 508);
    			attr_dev(div, "class", "skills svelte-18ifcb");
    			add_location(div, file$5, 1, 0, 16);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, h30);
    			append_dev(div, t3);
    			append_dev(div, p0);
    			append_dev(div, t5);
    			append_dev(div, h31);
    			append_dev(div, t7);
    			append_dev(div, p1);
    			append_dev(div, t9);
    			append_dev(div, h32);
    			append_dev(div, t11);
    			append_dev(div, p2);
    			append_dev(div, t13);
    			append_dev(div, h33);
    			append_dev(div, t15);
    			append_dev(div, p3);
    			append_dev(div, t17);
    			append_dev(div, h34);
    			append_dev(div, t19);
    			append_dev(div, p4);
    			append_dev(div, t21);
    			append_dev(div, h35);
    			append_dev(div, t23);
    			append_dev(div, p5);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Skills', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Skills> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Skills extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Skills",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/components/Else.svelte generated by Svelte v3.49.0 */

    const file$4 = "src/components/Else.svelte";

    function create_fragment$4(ctx) {
    	let h2;
    	let t1;
    	let div2;
    	let div1;
    	let h3;
    	let t3;
    	let div0;
    	let ul;
    	let li;

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			h2.textContent = "and more";
    			t1 = space();
    			div2 = element("div");
    			div1 = element("div");
    			h3 = element("h3");
    			h3.textContent = "Hackathon and Competitive Coding challenge";
    			t3 = space();
    			div0 = element("div");
    			ul = element("ul");
    			li = element("li");
    			li.textContent = "“NOI Hackathon” in Bolzano (2019) - Alexa voice recognition skill - 1st position";
    			add_location(h2, file$4, 0, 0, 0);
    			attr_dev(h3, "class", "svelte-1bbalib");
    			add_location(h3, file$4, 3, 8, 79);
    			attr_dev(li, "class", "svelte-1bbalib");
    			add_location(li, file$4, 6, 16, 196);
    			attr_dev(ul, "class", "svelte-1bbalib");
    			add_location(ul, file$4, 5, 12, 157);
    			add_location(div0, file$4, 4, 8, 139);
    			attr_dev(div1, "class", "something svelte-1bbalib");
    			add_location(div1, file$4, 2, 4, 47);
    			attr_dev(div2, "class", "somethings");
    			add_location(div2, file$4, 1, 0, 18);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, h3);
    			append_dev(div1, t3);
    			append_dev(div1, div0);
    			append_dev(div0, ul);
    			append_dev(ul, li);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Else', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Else> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Else extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Else",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/components/Projects.svelte generated by Svelte v3.49.0 */
    const file$3 = "src/components/Projects.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (7:12) { #each prjs.projects as p }
    function create_each_block_1(ctx) {
    	let a;
    	let p0;
    	let t0_value = /*p*/ ctx[4].name + "";
    	let t0;
    	let t1;
    	let p1;
    	let t2_value = /*p*/ ctx[4].description + "";
    	let t2;
    	let t3;

    	const block = {
    		c: function create() {
    			a = element("a");
    			p0 = element("p");
    			t0 = text(t0_value);
    			t1 = space();
    			p1 = element("p");
    			t2 = text(t2_value);
    			t3 = space();
    			attr_dev(p0, "class", "name svelte-rfo546");
    			add_location(p0, file$3, 8, 16, 273);
    			attr_dev(p1, "class", "description svelte-rfo546");
    			add_location(p1, file$3, 9, 16, 318);
    			attr_dev(a, "href", /*p*/ ctx[4].link);
    			attr_dev(a, "target", "”_blank”");
    			attr_dev(a, "class", "svelte-rfo546");
    			add_location(a, file$3, 7, 12, 220);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, p0);
    			append_dev(p0, t0);
    			append_dev(a, t1);
    			append_dev(a, p1);
    			append_dev(p1, t2);
    			append_dev(a, t3);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(7:12) { #each prjs.projects as p }",
    		ctx
    	});

    	return block;
    }

    // (3:4) {#each projects as prjs}
    function create_each_block(ctx) {
    	let div1;
    	let h3;
    	let t0_value = /*prjs*/ ctx[1].name + "";
    	let t0;
    	let t1;
    	let div0;
    	let t2;
    	let each_value_1 = /*prjs*/ ctx[1].projects;
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			h3 = element("h3");
    			t0 = text(t0_value);
    			t1 = space();
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			attr_dev(h3, "class", "svelte-rfo546");
    			add_location(h3, file$3, 4, 8, 117);
    			attr_dev(div0, "class", "list");
    			add_location(div0, file$3, 5, 8, 148);
    			attr_dev(div1, "class", "something svelte-rfo546");
    			add_location(div1, file$3, 3, 4, 85);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h3);
    			append_dev(h3, t0);
    			append_dev(div1, t1);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			append_dev(div1, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*projects*/ 1) {
    				each_value_1 = /*prjs*/ ctx[1].projects;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(3:4) {#each projects as prjs}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let h2;
    	let t1;
    	let div0;
    	let t2;
    	let div1;
    	let a;
    	let p;
    	let github;
    	let current;
    	let each_value = /*projects*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	github = new Github({ props: { size: "32" }, $$inline: true });

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			h2.textContent = "Personal Projects";
    			t1 = space();
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			div1 = element("div");
    			a = element("a");
    			p = element("p");
    			p.textContent = "And many more on my Github";
    			create_component(github.$$.fragment);
    			add_location(h2, file$3, 0, 0, 0);
    			attr_dev(div0, "class", "somethings");
    			add_location(div0, file$3, 1, 0, 27);
    			attr_dev(p, "class", "svelte-rfo546");
    			add_location(p, file$3, 18, 8, 544);
    			attr_dev(a, "href", "https://github.com/nicolatoscan");
    			attr_dev(a, "target", "_blank");
    			attr_dev(a, "class", "svelte-rfo546");
    			add_location(a, file$3, 17, 4, 477);
    			attr_dev(div1, "class", "more-github svelte-rfo546");
    			add_location(div1, file$3, 16, 0, 447);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div0, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			insert_dev(target, t2, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, a);
    			append_dev(a, p);
    			mount_component(github, a, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*projects*/ 1) {
    				each_value = /*projects*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(github.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(github.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div0);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div1);
    			destroy_component(github);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Projects', slots, []);

    	const projects = [
    		{
    			name: "Data Science",
    			projects: [
    				{
    					name: "Covid dashboard",
    					link: "https://github.com/alessiogandelli/covid-dashboard-unitn",
    					description: "University project of big data technologies, implemented using Kafka, Postgres, Kafka and mongodb"
    				},
    				{
    					name: "Computer Vision: image retriaval",
    					link: "https://github.com/alessiogandelli/machine-learning-unitn",
    					description: "I implemented a siamese network to find the most similar image from a gallery"
    				},
    				{
    					name: "Spotify network analysis",
    					link: "https://github.com/alessiogandelli/feat-network",
    					description: "Network analysis of spotify singers (in progress)"
    				},
    				{
    					name: "Wikipedia Revert analysis",
    					link: "https://github.com/WikiCommunityHealth/wikimedia-revert",
    					description: "Analysis of wikipedia revert"
    				},
    				{
    					name: "Geospatial ",
    					link: "",
    					description: "in progress"
    				},
    				{
    					name: "Attention analysis",
    					link: "",
    					description: "University project: Analyse phone sensors data to study the attetion that students give to their phone (in progress)"
    				},
    				{
    					name: "Twitter analysis",
    					link: "",
    					description: "University project: Analyse twitte data (in progress)"
    				}
    			]
    		},
    		{
    			name: "Telegram Bots",
    			projects: [
    				{
    					name: "Chess, pgn to url",
    					link: "https://github.com/alessiogandelli/import-chess-game-bot",
    					description: "A telegram bot that given a game in pgn format returns a url where you can visualise the game "
    				},
    				{
    					name: "Bottana translator",
    					link: "https://github.com/alessiogandelli/bottana",
    					description: "A telegram bot that uses Deepl api to translate messages in a group chat or sent directly to the bot "
    				}
    			]
    		},
    		{
    			name: "node module",
    			projects: [
    				{
    					name: "create-xml",
    					link: "https://github.com/alessiogandelli/create-xml-module",
    					description: "node module that collect data from ninox and generate a xml according to the format provided by the Italian financial ministry"
    				}
    			,]
    		}
    	];

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Projects> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Github, projects });
    	return [projects];
    }

    class Projects extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Projects",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* node_modules/svelte-material-icons/WeatherNight.svelte generated by Svelte v3.49.0 */

    const file$2 = "node_modules/svelte-material-icons/WeatherNight.svelte";

    function create_fragment$2(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "d", "M17.75,4.09L15.22,6.03L16.13,9.09L13.5,7.28L10.87,9.09L11.78,6.03L9.25,4.09L12.44,4L13.5,1L14.56,4L17.75,4.09M21.25,11L19.61,12.25L20.2,14.23L18.5,13.06L16.8,14.23L17.39,12.25L15.75,11L17.81,10.95L18.5,9L19.19,10.95L21.25,11M18.97,15.95C19.8,15.87 20.69,17.05 20.16,17.8C19.84,18.25 19.5,18.67 19.08,19.07C15.17,23 8.84,23 4.94,19.07C1.03,15.17 1.03,8.83 4.94,4.93C5.34,4.53 5.76,4.17 6.21,3.85C6.96,3.32 8.14,4.21 8.06,5.04C7.79,7.9 8.75,10.87 10.95,13.06C13.14,15.26 16.1,16.22 18.97,15.95M17.33,17.97C14.5,17.81 11.7,16.64 9.53,14.5C7.36,12.31 6.2,9.5 6.04,6.68C3.23,9.82 3.34,14.64 6.35,17.66C9.37,20.67 14.19,20.78 17.33,17.97Z");
    			attr_dev(path, "fill", /*color*/ ctx[2]);
    			add_location(path, file$2, 8, 59, 234);
    			attr_dev(svg, "width", /*width*/ ctx[0]);
    			attr_dev(svg, "height", /*height*/ ctx[1]);
    			attr_dev(svg, "viewBox", /*viewBox*/ ctx[3]);
    			add_location(svg, file$2, 8, 0, 175);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*color*/ 4) {
    				attr_dev(path, "fill", /*color*/ ctx[2]);
    			}

    			if (dirty & /*width*/ 1) {
    				attr_dev(svg, "width", /*width*/ ctx[0]);
    			}

    			if (dirty & /*height*/ 2) {
    				attr_dev(svg, "height", /*height*/ ctx[1]);
    			}

    			if (dirty & /*viewBox*/ 8) {
    				attr_dev(svg, "viewBox", /*viewBox*/ ctx[3]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('WeatherNight', slots, []);
    	let { size = "1em" } = $$props;
    	let { width = size } = $$props;
    	let { height = size } = $$props;
    	let { color = "currentColor" } = $$props;
    	let { viewBox = "0 0 24 24" } = $$props;
    	const writable_props = ['size', 'width', 'height', 'color', 'viewBox'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<WeatherNight> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('size' in $$props) $$invalidate(4, size = $$props.size);
    		if ('width' in $$props) $$invalidate(0, width = $$props.width);
    		if ('height' in $$props) $$invalidate(1, height = $$props.height);
    		if ('color' in $$props) $$invalidate(2, color = $$props.color);
    		if ('viewBox' in $$props) $$invalidate(3, viewBox = $$props.viewBox);
    	};

    	$$self.$capture_state = () => ({ size, width, height, color, viewBox });

    	$$self.$inject_state = $$props => {
    		if ('size' in $$props) $$invalidate(4, size = $$props.size);
    		if ('width' in $$props) $$invalidate(0, width = $$props.width);
    		if ('height' in $$props) $$invalidate(1, height = $$props.height);
    		if ('color' in $$props) $$invalidate(2, color = $$props.color);
    		if ('viewBox' in $$props) $$invalidate(3, viewBox = $$props.viewBox);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [width, height, color, viewBox, size];
    }

    class WeatherNight extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
    			size: 4,
    			width: 0,
    			height: 1,
    			color: 2,
    			viewBox: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "WeatherNight",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get size() {
    		throw new Error("<WeatherNight>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<WeatherNight>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get width() {
    		throw new Error("<WeatherNight>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set width(value) {
    		throw new Error("<WeatherNight>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get height() {
    		throw new Error("<WeatherNight>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set height(value) {
    		throw new Error("<WeatherNight>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<WeatherNight>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<WeatherNight>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get viewBox() {
    		throw new Error("<WeatherNight>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set viewBox(value) {
    		throw new Error("<WeatherNight>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelte-material-icons/WeatherSunny.svelte generated by Svelte v3.49.0 */

    const file$1 = "node_modules/svelte-material-icons/WeatherSunny.svelte";

    function create_fragment$1(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "d", "M12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,2L14.39,5.42C13.65,5.15 12.84,5 12,5C11.16,5 10.35,5.15 9.61,5.42L12,2M3.34,7L7.5,6.65C6.9,7.16 6.36,7.78 5.94,8.5C5.5,9.24 5.25,10 5.11,10.79L3.34,7M3.36,17L5.12,13.23C5.26,14 5.53,14.78 5.95,15.5C6.37,16.24 6.91,16.86 7.5,17.37L3.36,17M20.65,7L18.88,10.79C18.74,10 18.47,9.23 18.05,8.5C17.63,7.78 17.1,7.15 16.5,6.64L20.65,7M20.64,17L16.5,17.36C17.09,16.85 17.62,16.22 18.04,15.5C18.46,14.77 18.73,14 18.87,13.21L20.64,17M12,22L9.59,18.56C10.33,18.83 11.14,19 12,19C12.82,19 13.63,18.83 14.37,18.56L12,22Z");
    			attr_dev(path, "fill", /*color*/ ctx[2]);
    			add_location(path, file$1, 8, 59, 234);
    			attr_dev(svg, "width", /*width*/ ctx[0]);
    			attr_dev(svg, "height", /*height*/ ctx[1]);
    			attr_dev(svg, "viewBox", /*viewBox*/ ctx[3]);
    			add_location(svg, file$1, 8, 0, 175);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*color*/ 4) {
    				attr_dev(path, "fill", /*color*/ ctx[2]);
    			}

    			if (dirty & /*width*/ 1) {
    				attr_dev(svg, "width", /*width*/ ctx[0]);
    			}

    			if (dirty & /*height*/ 2) {
    				attr_dev(svg, "height", /*height*/ ctx[1]);
    			}

    			if (dirty & /*viewBox*/ 8) {
    				attr_dev(svg, "viewBox", /*viewBox*/ ctx[3]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('WeatherSunny', slots, []);
    	let { size = "1em" } = $$props;
    	let { width = size } = $$props;
    	let { height = size } = $$props;
    	let { color = "currentColor" } = $$props;
    	let { viewBox = "0 0 24 24" } = $$props;
    	const writable_props = ['size', 'width', 'height', 'color', 'viewBox'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<WeatherSunny> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('size' in $$props) $$invalidate(4, size = $$props.size);
    		if ('width' in $$props) $$invalidate(0, width = $$props.width);
    		if ('height' in $$props) $$invalidate(1, height = $$props.height);
    		if ('color' in $$props) $$invalidate(2, color = $$props.color);
    		if ('viewBox' in $$props) $$invalidate(3, viewBox = $$props.viewBox);
    	};

    	$$self.$capture_state = () => ({ size, width, height, color, viewBox });

    	$$self.$inject_state = $$props => {
    		if ('size' in $$props) $$invalidate(4, size = $$props.size);
    		if ('width' in $$props) $$invalidate(0, width = $$props.width);
    		if ('height' in $$props) $$invalidate(1, height = $$props.height);
    		if ('color' in $$props) $$invalidate(2, color = $$props.color);
    		if ('viewBox' in $$props) $$invalidate(3, viewBox = $$props.viewBox);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [width, height, color, viewBox, size];
    }

    class WeatherSunny extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			size: 4,
    			width: 0,
    			height: 1,
    			color: 2,
    			viewBox: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "WeatherSunny",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get size() {
    		throw new Error("<WeatherSunny>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<WeatherSunny>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get width() {
    		throw new Error("<WeatherSunny>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set width(value) {
    		throw new Error("<WeatherSunny>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get height() {
    		throw new Error("<WeatherSunny>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set height(value) {
    		throw new Error("<WeatherSunny>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<WeatherSunny>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<WeatherSunny>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get viewBox() {
    		throw new Error("<WeatherSunny>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set viewBox(value) {
    		throw new Error("<WeatherSunny>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.49.0 */
    const file = "src/App.svelte";

    // (5:4) { #if darkTheme }
    function create_if_block_1(ctx) {
    	let weathersunny;
    	let current;

    	weathersunny = new WeatherSunny({
    			props: { color: "#ffad6b", size: "32" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(weathersunny.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(weathersunny, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(weathersunny.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(weathersunny.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(weathersunny, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(5:4) { #if darkTheme }",
    		ctx
    	});

    	return block;
    }

    // (6:4) { #if !darkTheme }
    function create_if_block(ctx) {
    	let weathernight;
    	let current;

    	weathernight = new WeatherNight({
    			props: { color: "#ffad6b", size: "32" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(weathernight.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(weathernight, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(weathernight.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(weathernight.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(weathernight, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(6:4) { #if !darkTheme }",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div8;
    	let header;
    	let t0;
    	let div0;
    	let t1;
    	let t2;
    	let div1;
    	let about;
    	let t3;
    	let div2;
    	let boxes0;
    	let t4;
    	let div3;
    	let boxes1;
    	let t5;
    	let div4;
    	let skills;
    	let t6;
    	let div5;
    	let boxes2;
    	let t7;
    	let div6;
    	let projects;
    	let t8;
    	let div7;
    	let else_1;
    	let t9;
    	let footer;
    	let p;
    	let div8_class_value;
    	let current;
    	let mounted;
    	let dispose;
    	header = new Header({ $$inline: true });
    	let if_block0 = /*darkTheme*/ ctx[0] && create_if_block_1(ctx);
    	let if_block1 = !/*darkTheme*/ ctx[0] && create_if_block(ctx);
    	about = new About({ $$inline: true });

    	boxes0 = new Boxes({
    			props: { type: "Education" },
    			$$inline: true
    		});

    	boxes1 = new Boxes({
    			props: { type: "Experience" },
    			$$inline: true
    		});

    	skills = new Skills({ $$inline: true });

    	boxes2 = new Boxes({
    			props: { type: "Projects" },
    			$$inline: true
    		});

    	projects = new Projects({ $$inline: true });
    	else_1 = new Else({ $$inline: true });

    	const block = {
    		c: function create() {
    			div8 = element("div");
    			create_component(header.$$.fragment);
    			t0 = space();
    			div0 = element("div");
    			if (if_block0) if_block0.c();
    			t1 = space();
    			if (if_block1) if_block1.c();
    			t2 = space();
    			div1 = element("div");
    			create_component(about.$$.fragment);
    			t3 = space();
    			div2 = element("div");
    			create_component(boxes0.$$.fragment);
    			t4 = space();
    			div3 = element("div");
    			create_component(boxes1.$$.fragment);
    			t5 = space();
    			div4 = element("div");
    			create_component(skills.$$.fragment);
    			t6 = space();
    			div5 = element("div");
    			create_component(boxes2.$$.fragment);
    			t7 = space();
    			div6 = element("div");
    			create_component(projects.$$.fragment);
    			t8 = space();
    			div7 = element("div");
    			create_component(else_1.$$.fragment);
    			t9 = space();
    			footer = element("footer");
    			p = element("p");
    			p.textContent = "Last updated October 2022";
    			attr_dev(div0, "class", "theme-switch themed-icon svelte-k15a5p");
    			add_location(div0, file, 3, 2, 71);
    			attr_dev(div1, "id", "about-me");
    			attr_dev(div1, "class", "section svelte-k15a5p");
    			add_location(div1, file, 9, 2, 285);
    			attr_dev(div2, "id", "education");
    			attr_dev(div2, "class", "section svelte-k15a5p");
    			add_location(div2, file, 10, 2, 340);
    			attr_dev(div3, "id", "experiences");
    			attr_dev(div3, "class", "section svelte-k15a5p");
    			add_location(div3, file, 11, 2, 413);
    			attr_dev(div4, "id", "skills");
    			attr_dev(div4, "class", "section svelte-k15a5p");
    			add_location(div4, file, 12, 2, 489);
    			attr_dev(div5, "id", "other-experiences");
    			attr_dev(div5, "class", "section svelte-k15a5p");
    			add_location(div5, file, 13, 2, 543);
    			attr_dev(div6, "id", "projects");
    			attr_dev(div6, "class", "section svelte-k15a5p");
    			add_location(div6, file, 14, 2, 623);
    			attr_dev(div7, "id", "else");
    			attr_dev(div7, "class", "section svelte-k15a5p");
    			add_location(div7, file, 15, 2, 681);
    			attr_dev(p, "class", "svelte-k15a5p");
    			add_location(p, file, 19, 4, 748);
    			attr_dev(footer, "class", "svelte-k15a5p");
    			add_location(footer, file, 18, 2, 735);
    			attr_dev(div8, "class", div8_class_value = "" + (null_to_empty(/*darkTheme*/ ctx[0] ? 'main dark' : 'main light') + " svelte-k15a5p"));
    			add_location(div8, file, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div8, anchor);
    			mount_component(header, div8, null);
    			append_dev(div8, t0);
    			append_dev(div8, div0);
    			if (if_block0) if_block0.m(div0, null);
    			append_dev(div0, t1);
    			if (if_block1) if_block1.m(div0, null);
    			append_dev(div8, t2);
    			append_dev(div8, div1);
    			mount_component(about, div1, null);
    			append_dev(div8, t3);
    			append_dev(div8, div2);
    			mount_component(boxes0, div2, null);
    			append_dev(div8, t4);
    			append_dev(div8, div3);
    			mount_component(boxes1, div3, null);
    			append_dev(div8, t5);
    			append_dev(div8, div4);
    			mount_component(skills, div4, null);
    			append_dev(div8, t6);
    			append_dev(div8, div5);
    			mount_component(boxes2, div5, null);
    			append_dev(div8, t7);
    			append_dev(div8, div6);
    			mount_component(projects, div6, null);
    			append_dev(div8, t8);
    			append_dev(div8, div7);
    			mount_component(else_1, div7, null);
    			append_dev(div8, t9);
    			append_dev(div8, footer);
    			append_dev(footer, p);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div0, "click", /*changeTheme*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*darkTheme*/ ctx[0]) {
    				if (if_block0) {
    					if (dirty & /*darkTheme*/ 1) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_1(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div0, t1);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (!/*darkTheme*/ ctx[0]) {
    				if (if_block1) {
    					if (dirty & /*darkTheme*/ 1) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div0, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty & /*darkTheme*/ 1 && div8_class_value !== (div8_class_value = "" + (null_to_empty(/*darkTheme*/ ctx[0] ? 'main dark' : 'main light') + " svelte-k15a5p"))) {
    				attr_dev(div8, "class", div8_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(about.$$.fragment, local);
    			transition_in(boxes0.$$.fragment, local);
    			transition_in(boxes1.$$.fragment, local);
    			transition_in(skills.$$.fragment, local);
    			transition_in(boxes2.$$.fragment, local);
    			transition_in(projects.$$.fragment, local);
    			transition_in(else_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(about.$$.fragment, local);
    			transition_out(boxes0.$$.fragment, local);
    			transition_out(boxes1.$$.fragment, local);
    			transition_out(skills.$$.fragment, local);
    			transition_out(boxes2.$$.fragment, local);
    			transition_out(projects.$$.fragment, local);
    			transition_out(else_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div8);
    			destroy_component(header);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			destroy_component(about);
    			destroy_component(boxes0);
    			destroy_component(boxes1);
    			destroy_component(skills);
    			destroy_component(boxes2);
    			destroy_component(projects);
    			destroy_component(else_1);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let darkTheme = !(localStorage.getItem("darkTheme") === "false");

    	function changeTheme() {
    		$$invalidate(0, darkTheme = !darkTheme);
    		localStorage.setItem("darkTheme", darkTheme ? "true" : "false");
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Header,
    		About,
    		Boxes,
    		Skills,
    		Else,
    		Projects,
    		WeatherNight,
    		WeatherSunny,
    		darkTheme,
    		changeTheme
    	});

    	$$self.$inject_state = $$props => {
    		if ('darkTheme' in $$props) $$invalidate(0, darkTheme = $$props.darkTheme);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [darkTheme, changeTheme];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    var app = new App({
        target: document.body
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
