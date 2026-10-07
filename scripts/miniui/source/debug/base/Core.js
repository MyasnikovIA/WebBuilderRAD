/* Ядро IDE: шина событий, реестр, схемы, история, модальное окно. */
(function (global) {
    'use strict';

    /* ---------- EventBus ---------- */
    function EventBus() { this._h = {}; }
    EventBus.prototype.on  = function (n, fn) { (this._h[n] = this._h[n] || []).push(fn); return this; };
    EventBus.prototype.off = function (n, fn) {
        var l = this._h[n]; if (!l) return this;
        if (!fn) { delete this._h[n]; return this; }
        for (var i = l.length - 1; i >= 0; i--) if (l[i] === fn) l.splice(i, 1);
        return this;
    };
    EventBus.prototype.emit = function (n, p) {
        var l = this._h[n]; if (!l) return this;
        for (var i = 0; i < l.length; i++) { try { l[i](p); } catch (e) { console.error('[EventBus]', n, e); } }
        return this;
    };
    var bus = new EventBus();

    /* ---------- ComponentRegistry ---------- */
    var _byId = {}, _byCat = {};
    var ComponentRegistry = {
        register: function (def) {
            if (!def || !def.id) throw new Error('Component requires "id"');
            if (_byId[def.id]) throw new Error('Duplicate component id: ' + def.id);
            def.categories = def.categories || (def.category ? [def.category] : ['General']);
            def.tagName = (def.tagName || 'div').toLowerCase();
            _byId[def.id] = def;
            for (var i = 0; i < def.categories.length; i++) {
                var c = def.categories[i];
                (_byCat[c] = _byCat[c] || []).push(def);
            }
            return def;
        },
        get: function (id) { return _byId[id]; },
        all: function () { var r = []; for (var k in _byId) if (_byId.hasOwnProperty(k)) r.push(_byId[k]); return r; },
        categories: function () {
            var r = [];
            for (var k in _byCat) if (_byCat.hasOwnProperty(k)) r.push({ name: k, components: _byCat[k] });
            return r;
        },
        match: function (el) {
            if (!el || el.nodeType !== 1) return null;
            var ct = el.getAttribute && el.getAttribute('data-cmptype');
            if (ct && _byId[ct]) return _byId[ct];
            var tag = el.tagName.toLowerCase();
            var list = ComponentRegistry.all();
            for (var i = 0; i < list.length; i++) if (!list[i].cmptype && list[i].tagName === tag) return list[i];
            return _byId['html.generic'] || null;
        }
    };

    /* ---------- CommonSchema ---------- */
    var STYLE_FIELDS = [
        { name: 'display',         caption: 'Display',        type: 'enum',   values: ['', 'block','inline','inline-block','flex','inline-flex','grid','none'] },
        { name: 'position',        caption: 'Position',       type: 'enum',   values: ['', 'static','relative','absolute','fixed','sticky'] },
        { name: 'width',           caption: 'Width',          type: 'length' },
        { name: 'height',          caption: 'Height',         type: 'length' },
        { name: 'minWidth',        caption: 'Min Width',      type: 'length' },
        { name: 'minHeight',       caption: 'Min Height',     type: 'length' },
        { name: 'maxWidth',        caption: 'Max Width',      type: 'length' },
        { name: 'maxHeight',       caption: 'Max Height',     type: 'length' },
        { name: 'top',             caption: 'Top',            type: 'length' },
        { name: 'left',            caption: 'Left',           type: 'length' },
        { name: 'right',           caption: 'Right',          type: 'length' },
        { name: 'bottom',          caption: 'Bottom',         type: 'length' },
        { name: 'margin',          caption: 'Margin',         type: 'string' },
        { name: 'padding',         caption: 'Padding',        type: 'string' },
        { name: 'backgroundColor', caption: 'Background',     type: 'color' },
        { name: 'color',           caption: 'Text Color',     type: 'color' },
        { name: 'fontFamily',      caption: 'Font Family',    type: 'string' },
        { name: 'fontSize',        caption: 'Font Size',      type: 'length' },
        { name: 'fontWeight',      caption: 'Font Weight',    type: 'enum',   values: ['', 'normal','bold','100','200','300','400','500','600','700','800','900'] },
        { name: 'fontStyle',       caption: 'Font Style',     type: 'enum',   values: ['', 'normal','italic','oblique'] },
        { name: 'textAlign',       caption: 'Text Align',     type: 'enum',   values: ['', 'left','right','center','justify'] },
        { name: 'textDecoration',  caption: 'Text Decoration',type: 'enum',   values: ['', 'none','underline','overline','line-through'] },
        { name: 'lineHeight',      caption: 'Line Height',    type: 'string' },
        { name: 'border',          caption: 'Border',         type: 'string' },
        { name: 'borderRadius',    caption: 'Border Radius',  type: 'length' },
        { name: 'boxShadow',       caption: 'Box Shadow',     type: 'string' },
        { name: 'opacity',         caption: 'Opacity',        type: 'number' },
        { name: 'overflow',        caption: 'Overflow',       type: 'enum',   values: ['', 'visible','hidden','scroll','auto'] },
        { name: 'zIndex',          caption: 'Z-Index',        type: 'number' },
        { name: 'cursor',          caption: 'Cursor',         type: 'enum',   values: ['', 'default','pointer','text','move','crosshair','not-allowed','wait','help'] }
    ];
    var EVENT_FIELDS = [
        { name: 'onclick',      caption: 'OnClick',      type: 'code' },
        { name: 'ondblclick',   caption: 'OnDblClick',   type: 'code' },
        { name: 'onmousedown',  caption: 'OnMouseDown',  type: 'code' },
        { name: 'onmouseup',    caption: 'OnMouseUp',    type: 'code' },
        { name: 'onmouseover',  caption: 'OnMouseOver',  type: 'code' },
        { name: 'onmouseout',   caption: 'OnMouseOut',   type: 'code' },
        { name: 'onmousemove',  caption: 'OnMouseMove',  type: 'code' },
        { name: 'onkeydown',    caption: 'OnKeyDown',    type: 'code' },
        { name: 'onkeyup',      caption: 'OnKeyUp',      type: 'code' },
        { name: 'onkeypress',   caption: 'OnKeyPress',   type: 'code' },
        { name: 'onchange',     caption: 'OnChange',     type: 'code' },
        { name: 'oninput',      caption: 'OnInput',      type: 'code' },
        { name: 'onfocus',      caption: 'OnFocus',      type: 'code' },
        { name: 'onblur',       caption: 'OnBlur',       type: 'code' }
    ];
    var PROPERTY_FIELDS = [
        { name: 'id',          caption: 'Id',    type: 'string', attr: true },
        { name: 'className',   caption: 'Class', type: 'string' },
        { name: 'title',       caption: 'Title', type: 'string', attr: true },
        { name: 'textContent', caption: 'Text',  type: 'text' }
    ];
    var CommonSchema = {
        STYLE_FIELDS: STYLE_FIELDS,
        EVENT_FIELDS: EVENT_FIELDS,
        PROPERTY_FIELDS: PROPERTY_FIELDS,
        defaultSchema: function () {
            return { properties: PROPERTY_FIELDS.slice(), styles: STYLE_FIELDS.slice(), events: EVENT_FIELDS.slice() };
        }
    };

    /* ---------- History ---------- */
    var History = (function () {
        var MAX = 100, stack = [], idx = -1, suspended = false, canvas = null;
        return {
            attach: function (c) {
                canvas = c;
                bus.on('canvas:changed', function () { History.push(); });
                bus.on('canvas:ready',   function () { History.reset(); });
            },
            reset: function () { stack = []; idx = -1; History.push(); },
            push: function () {
                if (suspended || !canvas) return;
                var html = canvas.getBody().innerHTML;
                if (idx >= 0 && stack[idx] === html) return;
                stack = stack.slice(0, idx + 1);
                stack.push(html);
                if (stack.length > MAX) stack.shift();
                idx = stack.length - 1;
                bus.emit('history:changed', History.state());
            },
            undo: function () { if (idx <= 0) return; idx--; History._apply(stack[idx]); },
            redo: function () { if (idx >= stack.length - 1) return; idx++; History._apply(stack[idx]); },
            state: function () { return { canUndo: idx > 0, canRedo: idx < stack.length - 1 }; },
            _apply: function (html) {
                suspended = true;
                canvas.getBody().innerHTML = html;
                suspended = false;
                bus.emit('canvas:refreshed');
                bus.emit('canvas:changed');
                bus.emit('history:changed', History.state());
            }
        };
    })();

    /* ---------- Modal (MiniUI mini-window) ---------- */
    var Modal = (function () {
        var win = null, bodyEl = null, onOk = null;
        function ensure() {
            if (win) return;
            win = mini.get('wb-window');
            bodyEl = document.getElementById('wb-window-body');
        }
        return {
            open: function (opts) {
                ensure();
                win.setTitle(opts.title || '');
                bodyEl.innerHTML = '';
                if (typeof opts.content === 'string') bodyEl.innerHTML = opts.content;
                else if (opts.content) bodyEl.appendChild(opts.content);
                onOk = opts.onOk || null;
                win.show();
                var mask = win.el.querySelector('.mini-mask');
                if (mask) mask.remove();
            },
            ok:     function () { var f = onOk; Modal.close(); if (f) f(); },
            cancel: function () { Modal.close(); },
            close:  function () { ensure(); win.hide(); bodyEl.innerHTML = ''; onOk = null; }
        };
    })();

    global.IDE = {
        bus: bus,
        Registry: ComponentRegistry,
        Schema: CommonSchema,
        History: History,
        Modal: Modal
    };
    global.EventBus = bus;
    global.ComponentRegistry = ComponentRegistry;
    global.CommonSchema = CommonSchema;
    global.History = History;
    global.Modal = Modal;

})(window);