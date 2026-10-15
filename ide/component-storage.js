/* ComponentStorage — пользовательская палитра компонентов + генерация
   фоновых библиотек core.js / <cmptype>.js / <cmptype>.css.

   Модель палитры (localStorage 'wb.userPalette', version 5):
     components['<id>'] = {
       id, name, cmptype, tagName, icon, description,
       previewIdeHtml,               — editor-only preview на сцене
       html,                         — алиас previewIdeHtml
       js, css,                      — пользовательский код
       jsLibs, cssLibs,              — внешние ресурсы
       customProperties, customEvents,
       nestingMode, nestingRules,
       folderId
     }

   В проекте (project.files) фоновые файлы помечаются `_system: 'wb-lib'`
   и по пути начинаются на 'lib/wb-component/'. ProjectTree их не показывает.

   HTML-разметка компонента (previewIdeHtml / html) встраивается
   в <cmptype>.js как поле `html` в дефе, который регистрируется через
   WbComponent.register(). Рантайм attach() рендерит эту разметку внутрь
   элемента [data-wb-user-comp], если он ещё пуст. Также в деф попадают
   jsLibs / cssLibs — core.js подгружает их лениво (один раз на URL).

   ------------------------------------------------------------------
   Автокоррекция libs:

     При нормализации компонента (normalizeComponent) автоматически
     проверяется соответствие URL и его массива:
       • если URL заканчивается на .css и лежит в jsLibs → переносится
         в cssLibs;
       • если URL заканчивается на .js и лежит в cssLibs → переносится
         в jsLibs.

     Это защита от старых project.json / corrupted localStorage, где
     CSS и JS были смешаны. Без неё <link href="…jquery-ui.js"> или
     <script src="…jquery-ui.css"> ломают runtime (браузер пытается
     выполнить CSS как JS: "Uncaught SyntaxError: Unexpected token '.'").

   ------------------------------------------------------------------
   Palette Layout (localStorage 'wb.paletteLayout', version 1):

     {
       version: 1,
       initialized: true|false,
       folders: {
         '<id>': { id, name, parentId, position, kind: 'user' | 'category' }
       },
       items: {
         'b:<defId>':  { folderId, position },
         'u:<cmpId>':  { folderId, position }
       }
     } */
(function (global) {
    'use strict';
    var KEY = 'wb.userPalette';
    var PALETTE_KEY = 'wb.paletteLayout';

    var LIB_DIR = 'lib/wb-component/';
    var CORE_FILE = LIB_DIR + 'core.js';

    /* ------------------------------------------------------------------
       Фоновый runtime (core.js). Вставляется в проект один раз.

       Помимо реестра / attach / observer теперь содержит:
         • WbComponent.applyLibs(def) — подгружает <link> / <script>
           для def.jsLibs / def.cssLibs в <head> документа (по одному
           разу на URL, с флагом data-wb-user-comp-asset, чтобы теги
           были видны только рантайму, но не пользовательскому коду). */
    var CORE_LIBRARY_SOURCE = [
        '/* WbComponent core — автогенерация. Не редактировать вручную. */',
        '(function(g){',
        'if (g.WbComponent && g.WbComponent._bootstrapped) return;',

        '/* -------- инжект CSS для обёртки контента ---------------------- */',
        'function ensureCoreStyles(){',
        '    var s = document.getElementById("wb-component-core-styles");',
        '    if (s) {',
        '        if (s.getAttribute("data-wb-ide") !== "1") s.setAttribute("data-wb-ide", "1");',
        '        if (s.getAttribute("data-wb-comp-asset") !== "1") s.setAttribute("data-wb-comp-asset", "1");',
        '        return;',
        '    }',
        '    s = document.createElement("style");',
        '    s.id = "wb-component-core-styles";',
        '    s.setAttribute("data-wb-ide", "1");',
        '    s.setAttribute("data-wb-comp-asset", "1");',
        '    s.textContent =',
        '        "[data-wb-user-comp]{position:relative;overflow:hidden;box-sizing:border-box;}" +',
        '        ".wb-user-comp-preview{display:block;position:absolute;left:0;top:0;" +',
        '        "width:auto;height:auto;box-sizing:border-box;transform-origin:0 0;}";',
        '    (document.head || document.documentElement).appendChild(s);',
        '}',

        'var WbComponent = {',
        '    _bootstrapped: true,',
        '    _defs: {},',
        '    _registry: {},',
        '    _byCmptype: {},',
        '    _pending: [],',
        '    _libsLoaded: {},',
        '    register: function(def){',
        '        if(!def || !def.cmptype) return;',
        '        this._defs[def.cmptype] = def;',
        '        try { this.applyLibs(def); } catch(e){ console.error("[WbComponent] applyLibs", def.cmptype, e); }',
        '        for(var i=0;i<this._pending.length;i++){',
        '            var p = this._pending[i];',
        '            if(p.ct === def.cmptype){',
        '                try { attach(p.el, def); } catch(e){ console.error("[WbComponent] attach", def.cmptype, e); }',
        '                this._pending.splice(i,1); i--;',
        '            }',
        '        }',
        '    },',
        '    _register: function(i){ this._registry[i.id]=i; if(i.cmptype) this._byCmptype[i.cmptype]=i; },',
        '    _unregister: function(i){ delete this._registry[i.id]; if(i.cmptype && this._byCmptype[i.cmptype]===i) delete this._byCmptype[i.cmptype]; },',
        '    get: function(k){',
        '        if(!k) return null;',
        '        if(typeof k==="string") return this._registry[k] || this._byCmptype[k] || null;',
        '        if(k.nodeType===1) return k._wbComponent || null;',
        '        return null;',
        '    },',
        '    all: function(ct){',
        '        var out=[],k;',
        '        if(!ct){ for(k in this._registry) if(this._registry.hasOwnProperty(k)) out.push(this._registry[k]); return out; }',
        '        for(k in this._registry) if(this._registry[k].cmptype===ct) out.push(this._registry[k]);',
        '        return out;',
        '    },',
        '    applyLibs: function(def){',
        '        if(!def) return;',
        '        var head = document.head || document.getElementsByTagName("head")[0];',
        '        if(!head) return;',
        '        var cssList = def.cssLibs || [];',
        '        for(var i=0;i<cssList.length;i++){',
        '            var lib = cssList[i];',
        '            var url = lib && (typeof lib === "string" ? lib : lib.value);',
        '            var typ = lib && lib.type ? lib.type : "url";',
        '            if(!url || typ === "project") continue;',
        '            if(/\\.js(\\?|#|$)/i.test(url)) continue;',
        '            if(this._libsLoaded["css:"+url]) continue;',
        '            this._libsLoaded["css:"+url] = true;',
        '            var link = document.createElement("link");',
        '            link.rel = "stylesheet";',
        '            link.href = url;',
        '            link.setAttribute("data-wb-user-comp-asset", "1");',
        '            head.appendChild(link);',
        '        }',
        '        var jsList = def.jsLibs || [];',
        '        for(var j=0;j<jsList.length;j++){',
        '            var libj = jsList[j];',
        '            var urlj = libj && (typeof libj === "string" ? libj : libj.value);',
        '            var typj = libj && libj.type ? libj.type : "url";',
        '            if(!urlj || typj === "project") continue;',
        '            if(/\\.css(\\?|#|$)/i.test(urlj)) continue;',
        '            if(this._libsLoaded["js:"+urlj]) continue;',
        '            this._libsLoaded["js:"+urlj] = true;',
        '            var script = document.createElement("script");',
        '            script.src = urlj;',
        '            script.async = false;',
        '            script.setAttribute("data-wb-user-comp-asset", "1");',
        '            head.appendChild(script);',
        '        }',
        '    }',
        '};',
        'g.WbComponent = WbComponent;',

        'function resolveFn(name){',
        '    if(!name) return null;',
        '    var parts = String(name).split("."), obj = g;',
        '    for(var i=0;i<parts.length;i++){ if(!obj) return null; obj = obj[parts[i]]; }',
        '    return typeof obj==="function" ? obj : null;',
        '}',

        'function hasRealContent(el){',
        '    if(!el || !el.childNodes) return false;',
        '    for(var i=0;i<el.childNodes.length;i++){',
        '        var c = el.childNodes[i];',
        '        if(c.nodeType === 1) return true;',
        '        if(c.nodeType === 3 && c.nodeValue && c.nodeValue.replace(/\\s+/g,"") !== "") return true;',
        '    }',
        '    return false;',
        '}',

        '/* ===============================================================',
        '   applyContentScale',
        '',
        '   Повторяет логику Canvas._applyUserComponentTransform, но',
        '   выполняется в рантайме. Временно обнуляет размер контейнера,',
        '   измеряет union bbox детей обёртки, восстанавливает контейнер',
        '   и применяет transform: scale(sx, sy) translate(-minL, -minT)',
        '   с transform-origin: 0 0 — так содержимое заполняет контейнер',
        '   и масштабируется вместе с ним.',
        '   =============================================================== */',
        'function applyContentScale(el, wrap){',
        '    if(!el || !wrap) return;',
        '    var savedW = el.style.width;',
        '    var savedH = el.style.height;',
        '    var savedL = el.style.left;',
        '    var savedT = el.style.top;',
        '    var savedPos = el.style.position;',
        '',
        '    /* 1. Сброс прошлого transform и размеров обёртки. */',
        '    wrap.style.transform = "";',
        '    wrap.style.transformOrigin = "0 0";',
        '    wrap.style.left = "0px";',
        '    wrap.style.top = "0px";',
        '    wrap.style.width = "auto";',
        '    wrap.style.height = "auto";',
        '',
        '    /* 2. Временно обнуляем контейнер — обёртка с width:100%/',
        '          height:100% сожмётся, position:absolute дети дадут',
        '          корректные extents. */',
        '    el.style.width = "0px";',
        '    el.style.height = "0px";',
        '    void el.offsetWidth;',
        '',
        '    var wrapRect = wrap.getBoundingClientRect();',
        '    var minLeft = Infinity, minTop = Infinity;',
        '    var maxRight = 0, maxBottom = 0;',
        '    var kids = wrap.querySelectorAll("*");',
        '    for(var i=0;i<kids.length;i++){',
        '        var kr = kids[i].getBoundingClientRect();',
        '        if(kr.width === 0 && kr.height === 0) continue;',
        '        var left   = kr.left   - wrapRect.left;',
        '        var top    = kr.top    - wrapRect.top;',
        '        var right  = kr.right  - wrapRect.left;',
        '        var bottom = kr.bottom - wrapRect.top;',
        '        if(left   < minLeft)   minLeft   = left;',
        '        if(top    < minTop)    minTop    = top;',
        '        if(right  > maxRight)  maxRight  = right;',
        '        if(bottom > maxBottom) maxBottom = bottom;',
        '    }',
        '    if(!isFinite(minLeft)) minLeft = 0;',
        '    if(!isFinite(minTop))  minTop  = 0;',
        '',
        '    /* 3. Восстанавливаем размеры и позицию контейнера. */',
        '    el.style.width  = savedW;',
        '    el.style.height = savedH;',
        '    el.style.left   = savedL;',
        '    el.style.top    = savedT;',
        '    el.style.position = savedPos;',
        '',
        '    var natW = Math.max(1, Math.ceil(maxRight  - minLeft));',
        '    var natH = Math.max(1, Math.ceil(maxBottom - minTop));',
        '    if(maxRight  < 1) natW = el.offsetWidth  || 1;',
        '    if(maxBottom < 1) natH = el.offsetHeight || 1;',
        '',
        '    el.__wbNaturalW = natW;',
        '    el.__wbNaturalH = natH;',
        '    el.__wbNaturalLeft = minLeft;',
        '    el.__wbNaturalTop  = minTop;',
        '',
        '    /* 4. Фиксируем размер обёртки и применяем transform. */',
        '    wrap.style.width  = natW + "px";',
        '    wrap.style.height = natH + "px";',
        '',
        '    /* Размер берём из рендера, а не из inline-строки — иначе',
        '       при наличии max-width (или min-width) scale окажется',
        '       шире контейнера, и overflow:hidden обрежет содержимое. */',
        '    var cw = el.offsetWidth  || parseFloat(el.style.width)  || natW;',
        '    var ch = el.offsetHeight || parseFloat(el.style.height) || natH;',
        '    var sx = cw / natW;',
        '    var sy = ch / natH;',
        '    wrap.style.transform = "scale(" + sx + "," + sy + ") translate(" +',
        '                           (-minLeft) + "px," + (-minTop) + "px)";',
        '}',

        'function observeResize(el, wrap){',
        '    if(!g.ResizeObserver) return;',
        '    if(el.__wbResizeObserver) return;',
        '    var ro = new g.ResizeObserver(function(){ applyContentScale(el, wrap); });',
        '    ro.observe(el);',
        '    el.__wbResizeObserver = ro;',
        '}',

        'function attach(el, def){',
        '    if(el._wbComponent) return el._wbComponent;',
        '    ensureCoreStyles();',
        '    var instance = {',
        '        id: def.id, cmptype: def.cmptype, name: def.name, el: el,',
        '        _handlers: {},',
        '        get: function(name){ return el.getAttribute(name) || ""; },',
        '        set: function(name, v){ el.setAttribute(name, v); },',
        '        on: function(name, h){ (this._handlers[name]=this._handlers[name]||[]).push(h); return this; },',
        '        off: function(name, h){ var l=this._handlers[name]; if(!l) return this; var i=l.indexOf(h); if(i>=0) l.splice(i,1); return this; },',
        '        emit: function(name, data){',
        '            var l = this._handlers[name] || [];',
        '            for(var i=0;i<l.length;i++){',
        '                try { l[i]({ type: name, data: data, component: this, el: el }); }',
        '                catch(e){ console.error("[WbComponent]", name, e); }',
        '            }',
        '            try {',
        '                var ce = new CustomEvent("wb-component-event", { detail: { name: name, data: data } });',
        '                el.dispatchEvent(ce);',
        '            } catch(e){}',
        '        }',
        '    };',
        '    var props = def.customProperties || [];',
        '    for(var i=0;i<props.length;i++){',
        '        (function(p){',
        '            try {',
        '                Object.defineProperty(instance, p.name, {',
        '                    get: function(){ return el.getAttribute(p.name) || ""; },',
        '                    set: function(v){ el.setAttribute(p.name, v); },',
        '                    enumerable: true, configurable: true',
        '                });',
        '            } catch(e){}',
        '        })(props[i]);',
        '    }',
        '    if(g.MutationObserver){',
        '        var mo = new g.MutationObserver(function(muts){',
        '            for(var m=0;m<muts.length;m++){',
        '                var mu = muts[m];',
        '                if(mu.type !== "attributes") continue;',
        '                var pn = mu.attributeName, pdef = null;',
        '                for(var k=0;k<props.length;k++) if(props[k].name===pn){ pdef=props[k]; break; }',
        '                if(!pdef || !pdef.onChangeFunc) continue;',
        '                var fn = resolveFn(pdef.onChangeFunc);',
        '                if(!fn) continue;',
        '                try {',
        '                    fn.call(instance, {',
        '                        name: pn,',
        '                        value: el.getAttribute(pn),',
        '                        oldValue: mu.oldValue,',
        '                        component: instance,',
        '                        el: el',
        '                    });',
        '                } catch(e){ console.error("[WbComponent] onChange", pdef.onChangeFunc, e); }',
        '            }',
        '        });',
        '        mo.observe(el, { attributes: true, attributeOldValue: true });',
        '        instance._observer = mo;',
        '    }',
        '    var evs = def.customEvents || [];',
        '    for(var j=0;j<evs.length;j++){',
        '        (function(ev){',
        '            if(!ev.handlerFunc) return;',
        '            el.addEventListener(ev.name, function(e){',
        '                var fn = resolveFn(ev.handlerFunc);',
        '                if(!fn) return;',
        '                try {',
        '                    fn.call(instance, {',
        '                        type: ev.name, originalEvent: e,',
        '                        component: instance, el: el,',
        '                        data: e && e.detail',
        '                    });',
        '                } catch(ex){ console.error("[WbComponent] on", ev.handlerFunc, ex); }',
        '            }, false);',
        '        })(evs[j]);',
        '    }',
        '    el._wbComponent = instance;',
        '',
        '    /* Инжект html в обёртку + масштабирование под размер контейнера. */',
        '    if(def.html){',
        '        var real = hasRealContent(el);',
        '        var existingWrap = el.querySelector(":scope > .wb-user-comp-preview");',
        '        if(!real && !existingWrap){',
        '            try {',
        '                var wrap = document.createElement("div");',
        '                wrap.className = "wb-user-comp-preview";',
        '                wrap.setAttribute("data-wb-preview", "1");',
        '                wrap.innerHTML = def.html;',
        '                el.appendChild(wrap);',
        '                applyContentScale(el, wrap);',
        '                observeResize(el, wrap);',
        '            } catch(e){ console.error("[WbComponent] render html", def.cmptype, e); }',
        '        } else if(existingWrap){',
        '            applyContentScale(el, existingWrap);',
        '            observeResize(el, existingWrap);',
        '        }',
        '    }',
        '',
        '    WbComponent._register(instance);',
        '    return instance;',
        '}',

        'function init(){',
        '    ensureCoreStyles();',
        '    var els = document.querySelectorAll("[data-wb-user-comp]");',
        '    for(var i=0;i<els.length;i++){',
        '        var el = els[i];',
        '        var ct = el.getAttribute("cmptype") || "";',
        '        var def = WbComponent._defs[ct] || null;',
        '        if(!def){ WbComponent._pending.push({ el: el, ct: ct }); continue; }',
        '        try { attach(el, def); } catch(e){ console.error("[WbComponent] attach", ct, e); }',
        '    }',
        '}',
        'WbComponent._attach = attach;',
        'WbComponent._init = init;',
        'WbComponent._hasRealContent = hasRealContent;',
        'WbComponent._applyContentScale = applyContentScale;',
        'if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, false);',
        'else init();',
        'if(g.MutationObserver){',
        '    var bodyObs = new g.MutationObserver(function(muts){',
        '        for(var i=0;i<muts.length;i++){',
        '            if(muts[i].addedNodes && muts[i].addedNodes.length){ setTimeout(init, 0); return; }',
        '        }',
        '    });',
        '    try { bodyObs.observe(document.documentElement, { childList: true, subtree: true }); } catch(e){}',
        '}',
        '})(window);'
    ].join('\n');

    /* ------------------------------------------------------------------
       Хелперы модели палитры компонентов. */
    function emptyModel() { return { version: 5, folders: {}, components: {} }; }

    function readAll() {
        try {
            var raw = localStorage.getItem(KEY);
            if (!raw) return emptyModel();
            var o = JSON.parse(raw);
            if (!o || typeof o !== 'object') return emptyModel();
            if (!o.folders) o.folders = {};
            if (!o.components) o.components = {};
            o.version = 5;
            return o;
        } catch (e) { return emptyModel(); }
    }
    function writeAll(o) {
        try { localStorage.setItem(KEY, JSON.stringify(o)); return true; }
        catch (e) { console.error('[ComponentStorage]', e); return false; }
    }
    function uid(p) {
        return (p || 'id') + '_' + Date.now().toString(36) + '_' +
            Math.random().toString(36).slice(2, 8);
    }
    function safeName(s) {
        return String(s || 'component').replace(/[^A-Za-z0-9_.-]/g, '_');
    }

    /* ------------------------------------------------------------------
       Хелперы раскладки палитры (wb.paletteLayout). */
    function _emptyLayout() {
        return { version: 1, initialized: false, folders: {}, items: {} };
    }
    function _readLayout() {
        try {
            var raw = localStorage.getItem(PALETTE_KEY);
            if (!raw) return _emptyLayout();
            var o = JSON.parse(raw);
            if (!o || typeof o !== 'object') return _emptyLayout();
            if (!o.folders) o.folders = {};
            if (!o.items) o.items = {};
            o.version = 1;
            return o;
        } catch (e) { return _emptyLayout(); }
    }
    function _writeLayout(o) {
        try { localStorage.setItem(PALETTE_KEY, JSON.stringify(o)); return true; }
        catch (e) { console.error('[ComponentStorage/layout]', e); return false; }
    }
    function _maxPositionInFolder(m, folderId) {
        var max = 0;
        for (var iid in m.items) {
            if (!m.items.hasOwnProperty(iid)) continue;
            if ((m.items[iid].folderId || '') === (folderId || '')) {
                if (m.items[iid].position > max) max = m.items[iid].position;
            }
        }
        for (var fid in m.folders) {
            if (!m.folders.hasOwnProperty(fid)) continue;
            if ((m.folders[fid].parentId || '') === (folderId || '')) {
                if (m.folders[fid].position > max) max = m.folders[fid].position;
            }
        }
        return max;
    }

    /* ------------------------------------------------------------------
       Нормализация одной записи lib-а.
         • строка → { type: 'url', value };
         • объект → { type, value } (все прочие поля отбрасываются). */
    function normalizeLibEntry(entry) {
        if (!entry) return null;
        if (typeof entry === 'string') {
            return { type: 'url', value: entry };
        }
        return {
            type: entry.type || 'url',
            value: entry.value || ''
        };
    }
    function normalizeLibsArray(arr) {
        var out = [];
        if (!Array.isArray(arr)) return out;
        for (var i = 0; i < arr.length; i++) {
            var e = normalizeLibEntry(arr[i]);
            if (e && e.value) out.push(e);
        }
        return out;
    }

    /* ------------------------------------------------------------------
       Разносим libs по правильным массивам:
         • URL, заканчивающийся на .css, не может быть <script> —
           переносим в cssLibs;
         • URL, заканчивающийся на .js, не может быть <link> —
           переносим в jsLibs.

       Возвращает { jsLibs, cssLibs } в каноническом виде.
       Защищает от старых project.json / corrupted localStorage, где
       CSS и JS были смешаны. */
    function splitLibsByUrl(jsLibs, cssLibs) {
        var inJs  = normalizeLibsArray(jsLibs);
        var inCss = normalizeLibsArray(cssLibs);
        var outJs  = [];
        var outCss = [];
        var i, e;

        for (i = 0; i < inJs.length; i++) {
            e = inJs[i];
            if (/\.css(\?|#|$)/i.test(e.value)) outCss.push(e);
            else outJs.push(e);
        }
        for (i = 0; i < inCss.length; i++) {
            e = inCss[i];
            if (/\.js(\?|#|$)/i.test(e.value)) outJs.push(e);
            else outCss.push(e);
        }
        return { jsLibs: outJs, cssLibs: outCss };
    }

    function normalizeProp(p) {
        p = p || {};
        return {
            name:            p.name || '',
            caption:         p.caption || p.name || '',
            type:            p.type || 'string',
            values:          p.values || '',
            unit:            p.unit || '',
            fieldType:       p.fieldType || 'none',
            fieldUrl:        p.fieldUrl || '',
            fieldPredefined: p.fieldPredefined || '',
            onChangeFunc:    p.onChangeFunc || ''
        };
    }
    function normalizeEvent(e) {
        e = e || {};
        return { name: e.name || '', caption: e.caption || e.name || '', handlerFunc: e.handlerFunc || '' };
    }
    function normalizeRule(r) {
        r = r || {};
        return { kind: (r.kind === 'cmptype') ? 'cmptype' : 'tag', value: r.value || '' };
    }
    function normalizeComponent(src) {
        src = src || {};
        var props = Array.isArray(src.customProperties) ? src.customProperties : [];
        var outProps = [];
        for (var i = 0; i < props.length; i++) outProps.push(normalizeProp(props[i]));
        var evs = Array.isArray(src.customEvents) ? src.customEvents : [];
        var outEvs = [];
        for (var k = 0; k < evs.length; k++) { var ev = normalizeEvent(evs[k]); if (ev.name) outEvs.push(ev); }
        var rules = Array.isArray(src.nestingRules) ? src.nestingRules : [];
        var outRules = [];
        for (var r = 0; r < rules.length; r++) { var nr = normalizeRule(rules[r]); if (nr.value) outRules.push(nr); }
        var mode = src.nestingMode;
        if (mode !== 'none' && mode !== 'list' && mode !== 'all') mode = 'all';

        var previewHtml = src.previewIdeHtml || src.html || '';

        /* Автокоррекция jsLibs / cssLibs по расширению URL. */
        var split = splitLibsByUrl(src.jsLibs, src.cssLibs);

        /* visible: bool, default true. Явный false → false, всё прочее → true. */
        var visible = (src.visible === false) ? false : true;

        return {
            id:             src.id || uid('cmp'),
            name:           src.name || 'Component',
            cmptype:        src.cmptype || '',
            tagName:        src.tagName || 'div',
            icon:           src.icon || '',
            description:    src.description || '',
            visible:        visible,
            html:           previewHtml,
            previewIdeHtml: previewHtml,
            js:             src.js || '',
            css:            src.css || '',
            jsLibs:         split.jsLibs,
            cssLibs:        split.cssLibs,
            customProperties: outProps,
            customEvents:     outEvs,
            nestingMode:      mode,
            nestingRules:     outRules,
            folderId:         src.folderId || ''
        };
    }

    function buildCustomInspectorField(p) {
        var out = {
            name: p.name, caption: p.caption || p.name,
            attr: true, type: p.type || 'string', _user: true
        };
        if (p.type === 'enum' && p.values) {
            out.values = String(p.values).split(',').map(function (s) { return s.trim(); })
                .filter(function (s) { return s !== ''; });
        }
        if (p.type === 'length' && p.unit) out.suggest = [p.unit];
        if (p.fieldType === 'url' && p.fieldUrl) {
            out.type = 'custom-editor-url'; out.editorUrl = p.fieldUrl;
        } else if (p.fieldType === 'predefined' && p.fieldPredefined) {
            switch (p.fieldPredefined) {
                case 'text':              out.type = 'text'; break;
                case 'code-editor-xml':   out.type = 'code-editor'; out.language = 'xml'; break;
                case 'code-editor-js':    out.type = 'code-editor'; out.language = 'javascript'; break;
                case 'code-editor-css':   out.type = 'code-editor'; out.language = 'css'; break;
                case 'code-editor-json':  out.type = 'code-editor'; out.language = 'json'; break;
                case 'code-editor-sql':   out.type = 'code-editor'; out.language = 'sql'; break;
                case 'image-preview':     out.type = 'FILE'; break;
                case 'file-picker':       out.type = 'FILE'; break;
            }
        }
        return out;
    }

    var ComponentStorage = {
        read: function () { return readAll(); },
        save: function (m) { return writeAll(m); },
        uid: uid,
        LIB_DIR: LIB_DIR,
        CORE_FILE: CORE_FILE,
        CORE_SOURCE: CORE_LIBRARY_SOURCE,
        isLibPath: function (path) {
            return String(path || '').indexOf(LIB_DIR) === 0;
        },

        /* ---------- folders (старая модель) ---------- */
        listFolders: function () {
            var m = readAll(), out = [];
            for (var k in m.folders) if (m.folders.hasOwnProperty(k)) out.push(m.folders[k]);
            return out;
        },
        getFolder: function (id) { return readAll().folders[id] || null; },
        createFolder: function (name, parentId) {
            var m = readAll(), id = uid('fld');
            m.folders[id] = { id: id, name: name || 'Folder', parentId: parentId || '' };
            writeAll(m);
            return m.folders[id];
        },
        renameFolder: function (id, name) {
            var m = readAll();
            if (!m.folders[id]) return false;
            m.folders[id].name = String(name);
            return writeAll(m);
        },
        deleteFolder: function (id) {
            var m = readAll();
            if (!m.folders[id]) return false;
            for (var k in m.folders) if (m.folders[k].parentId === id) m.folders[k].parentId = '';
            for (var c in m.components) if (m.components[c].folderId === id) m.components[c].folderId = '';
            delete m.folders[id];
            return writeAll(m);
        },

        /* ---------- components ---------- */
        listComponents: function () {
            var m = readAll(), out = [];
            for (var k in m.components) if (m.components.hasOwnProperty(k)) out.push(m.components[k]);
            return out;
        },
        getComponent: function (id) { return readAll().components[id] || null; },

        findByCmptype: function (ct) {
            if (!ct) return null;
            var list = this.listComponents();
            for (var i = 0; i < list.length; i++) {
                if (list[i].cmptype && list[i].cmptype === ct) return list[i];
            }
            return null;
        },

        /* Возвращает { jsLibs, cssLibs } компонента в нормализованном виде. */
        getComponentLibs: function (compOrId) {
            var c = typeof compOrId === 'string' ? this.getComponent(compOrId) : compOrId;
            if (!c) return { jsLibs: [], cssLibs: [] };
            var split = splitLibsByUrl(c.jsLibs, c.cssLibs);
            return split;
        },

        createComponent: function (def) {
            var m = readAll();
            var c = normalizeComponent(def);
            if (c.cmptype) {
                var existing = this.findByCmptype(c.cmptype);
                if (existing) { c.id = existing.id; c.folderId = c.folderId || existing.folderId; }
            }
            m.components[c.id] = c;
            writeAll(m);

            try {
                var L = _readLayout();
                var itemId = 'u:' + c.id;
                if (!L.items[itemId]) {
                    var fId = c.folderId || '';
                    if (fId && !L.folders[fId]) fId = '';
                    L.items[itemId] = { folderId: fId, position: _maxPositionInFolder(L, fId) + 1 };
                    _writeLayout(L);
                }
            } catch (e) { /* ignore */ }

            return c;
        },
        updateComponent: function (id, patch) {
            var m = readAll();
            if (!m.components[id]) return false;
            var merged = Object.assign({}, m.components[id], patch);
            /* patch может содержать jsLibs / cssLibs — normalizeComponent
               приведёт их к канонической форме и разложит по правильным
               массивам. */
            var norm = normalizeComponent(merged);
            norm.id = id;
            m.components[id] = norm;
            return writeAll(m);
        },
        deleteComponent: function (id) {
            var m = readAll();
            if (!m.components[id]) return false;
            delete m.components[id];
            writeAll(m);

            try {
                var L = _readLayout();
                var itemId = 'u:' + id;
                if (L.items[itemId]) { delete L.items[itemId]; _writeLayout(L); }
            } catch (e) { /* ignore */ }

            return true;
        },

        replaceAll: function (model) {
            if (!model || typeof model !== 'object') return false;
            if (!model.folders) model.folders = {};
            if (!model.components) model.components = {};
            model.version = 5;
            return writeAll(model);
        },

        mergeWithConfirmation: function (model) {
            var self = this;
            return new Promise(function (resolve) {
                if (!model || typeof model !== 'object') { resolve({ imported: 0, overwritten: 0, skipped: 0 }); return; }
                var m = readAll();
                var stats = { imported: 0, overwritten: 0, skipped: 0 };

                var map = {};
                var folders = model.folders || {};
                for (var fk in folders) {
                    if (!folders.hasOwnProperty(fk)) continue;
                    var f = folders[fk];
                    var newId = m.folders[fk] ? uid('fld') : fk;
                    map[fk] = newId;
                    m.folders[newId] = { id: newId, name: f.name || 'Folder', parentId: f.parentId || '' };
                }
                for (var fk2 in folders) {
                    if (!folders.hasOwnProperty(fk2)) continue;
                    var target = m.folders[map[fk2]];
                    if (target && target.parentId && map[target.parentId]) target.parentId = map[target.parentId];
                }

                var comps = model.components || {};
                for (var ck in comps) {
                    if (!comps.hasOwnProperty(ck)) continue;
                    var c = normalizeComponent(comps[ck]);
                    c.folderId = c.folderId && map[c.folderId] ? map[c.folderId] : (c.folderId || '');

                    var dup = c.cmptype ? self.findByCmptype(c.cmptype) : null;
                    if (dup) {
                        var ok = global.confirm(
                            'Компонент с cmptype="' + c.cmptype + '" уже существует (' +
                            dup.name + ').\n\nПерезаписать его?');
                        if (ok) { c.id = dup.id; m.components[c.id] = c; stats.overwritten++; }
                        else    { stats.skipped++; }
                    } else {
                        if (m.components[c.id]) c.id = uid('cmp');
                        m.components[c.id] = c;
                        stats.imported++;
                    }
                }
                writeAll(m);

                try {
                    var L = _readLayout();
                    for (var cid in m.components) {
                        if (!m.components.hasOwnProperty(cid)) continue;
                        var itemId = 'u:' + cid;
                        if (L.items[itemId]) continue;
                        var fId = m.components[cid].folderId || '';
                        if (fId && !L.folders[fId]) fId = '';
                        L.items[itemId] = { folderId: fId, position: _maxPositionInFolder(L, fId) + 1 };
                    }
                    _writeLayout(L);
                } catch (e) { /* ignore */ }

                resolve(stats);
            });
        },

        /* ---------- вложенность ---------- */
        canNest: function (uc, childTag, childCmptype) {
            if (!uc) return true;
            var mode = uc.nestingMode || 'all';
            if (mode === 'none') return false;
            if (mode === 'all')  return true;
            if (mode === 'list') {
                var rules = uc.nestingRules || [];
                var ct  = String(childCmptype || '').trim();
                var tag = String(childTag || '').toLowerCase();
                for (var i = 0; i < rules.length; i++) {
                    var r = rules[i];
                    if (!r || !r.value) continue;
                    if (r.kind === 'tag' && tag && String(r.value).toLowerCase() === tag) return true;
                    if (r.kind === 'cmptype' && ct && String(r.value) === ct) return true;
                }
                return false;
            }
            return true;
        },
        findUserCompAncestor: function (el, stopAt) {
            var cur = el;
            while (cur && cur !== stopAt) {
                if (cur.getAttribute && cur.getAttribute('data-wb-user-comp')) return cur;
                cur = cur.parentNode;
            }
            return null;
        },

        /* ------------------------------------------------------------------
           Генерация per-cmptype .js. */
        _buildCmptypeJs: function (c) {
            var html = c.previewIdeHtml || c.html || '';
            var split = splitLibsByUrl(c.jsLibs, c.cssLibs);
            var def = {
                id: c.id,
                cmptype: c.cmptype,
                name: c.name,
                html: html,
                jsLibs:  split.jsLibs,
                cssLibs: split.cssLibs,
                customProperties: c.customProperties || [],
                customEvents:     c.customEvents     || []
            };
            var s = '';
            s += '/* WbComponent: ' + c.name + ' (' + c.cmptype + ') — автогенерация. */\n';
            s += '(function(g){\n';
            s += '    var WbComponent = g.WbComponent;\n';
            s += '    if (!WbComponent) { console.error("[WbComponent] core.js не загружен для ' +
                String(c.cmptype || '').replace(/"/g, '\\"') + '"); return; }\n';
            s += '    WbComponent.register(' + JSON.stringify(def, null, 4) + ');\n';
            s += '})(window);\n';
            if (c.js) {
                s += '\n/* --- user code --- */\n';
                s += c.js;
                s += '\n';
            }
            return s;
        },

        /* ------------------------------------------------------------------
           Генерация per-cmptype .css. */
        _buildCmptypeCss: function (c) {
            var parts = [];
            parts.push('/* WbComponent: ' + c.name + ' (' + c.cmptype + ') — автогенерация. */');
            var split = splitLibsByUrl(c.jsLibs, c.cssLibs);
            if (split.cssLibs && split.cssLibs.length) {
                for (var i = 0; i < split.cssLibs.length; i++) {
                    var lib = split.cssLibs[i];
                    if (lib && lib.value) parts.push('@import url("' + lib.value + '");');
                }
            }
            if (c.css) {
                parts.push('/* --- user css --- */');
                parts.push(c.css);
            }
            return parts.join('\n') + '\n';
        },

        /* ------------------------------------------------------------------
           syncProjectLibraries

           Собирает cmptype из:
             1) [data-wb-user-comp]-элементов на сцене;
             2) активной ComponentTab (Root: component).

           Обновляет lib/wb-component/{core.js,<cmptype>.js,<cmptype>.css}.
           jsLibs / cssLibs попадают в <cmptype>.js — рантайм подгружает
           их лениво в браузере через WbComponent.applyLibs(). */
        syncProjectLibraries: function (project, canvas) {
            if (!project) return;
            if (!project.files) project.files = {};

            var keys = Object.keys(project.files);
            for (var i = 0; i < keys.length; i++) {
                if (keys[i].indexOf(LIB_DIR) === 0) delete project.files[keys[i]];
            }

            var used = {};

            if (canvas && canvas.getDoc) {
                var doc = canvas.getDoc();
                if (doc) {
                    var els = doc.querySelectorAll('[data-wb-user-comp]');
                    for (var k = 0; k < els.length; k++) {
                        var cid = els[k].getAttribute('data-wb-user-comp');
                        var uc = this.getComponent(cid);
                        if (uc && uc.cmptype) used[uc.cmptype] = uc;
                    }
                }
            }

            if (global.App && global.App._componentMode &&
                global.componentTab && global.componentTab.getFormData) {
                try {
                    var cd = global.componentTab.getFormData();
                    if (cd && cd.cmptype) {
                        var html = cd.previewIdeHtml || cd.html || '';
                        var split = splitLibsByUrl(cd.jsLibs, cd.cssLibs);
                        used[cd.cmptype] = {
                            id: cd.id || ('inline:' + cd.cmptype),
                            name: cd.name || cd.cmptype,
                            cmptype: cd.cmptype,
                            html: html,
                            previewIdeHtml: html,
                            jsLibs:  split.jsLibs,
                            cssLibs: split.cssLibs,
                            customProperties: cd.customProperties || [],
                            customEvents:     cd.customEvents || [],
                            js:   cd.js  || '',
                            css:  cd.css || ''
                        };
                    }
                } catch (e) { /* ignore */ }
            }

            var cts = Object.keys(used);
            if (!cts.length) return;

            project.files[CORE_FILE] = {
                kind: 'text',
                _system: 'wb-lib',
                content: CORE_LIBRARY_SOURCE
            };

            for (var m = 0; m < cts.length; m++) {
                var ct = cts[m];
                var comp = used[ct];
                var safeCt = safeName(ct);

                project.files[LIB_DIR + safeCt + '.js'] = {
                    kind: 'text',
                    _system: 'wb-lib',
                    content: this._buildCmptypeJs(comp)
                };
                project.files[LIB_DIR + safeCt + '.css'] = {
                    kind: 'text',
                    _system: 'wb-lib',
                    content: this._buildCmptypeCss(comp)
                };
            }
        },

        /* ---------- Собрать <head>-теги для запуска ---------- */
        buildLibHeadTags: function (project) {
            if (!project || !project.files) return '';
            var cts = {};
            var files = project.files;
            for (var p in files) {
                if (!files.hasOwnProperty(p)) continue;
                if (p.indexOf(LIB_DIR) !== 0) continue;
                if (p === CORE_FILE) continue;
                var mm = p.match(/^lib\/wb-component\/(.+)\.(js|css)$/);
                if (!mm) continue;
                cts[mm[1]] = true;
            }
            var list = Object.keys(cts);
            if (!list.length) return '';

            var out = [];
            for (var i = 0; i < list.length; i++) {
                var ct = list[i];
                var cssPath = LIB_DIR + ct + '.css';
                if (files[cssPath]) {
                    out.push('<link rel="stylesheet" href="' + cssPath + '">');
                }
            }
            out.push('<script src="' + CORE_FILE + '"></script>');
            for (var j = 0; j < list.length; j++) {
                var ct2 = list[j];
                var jsPath = LIB_DIR + ct2 + '.js';
                if (files[jsPath]) {
                    out.push('<script src="' + jsPath + '"></script>');
                }
            }
            return out.join('\n');
        },

        /* Возвращает плоский список {url, kind} для всех внешних libs
           (js + css), использованных user-компонентами в проекте. */
        collectExternalLibs: function (project) {
            var out = { js: [], css: [] };
            var seenJs = {}, seenCss = {};
            if (!project) return out;

            var used = {};
            var canvas = global.IDE && global.IDE._canvas;
            if (canvas && canvas.getDoc) {
                var doc = canvas.getDoc();
                if (doc) {
                    var els = doc.querySelectorAll('[data-wb-user-comp]');
                    for (var i = 0; i < els.length; i++) {
                        var cid = els[i].getAttribute('data-wb-user-comp');
                        var uc = this.getComponent(cid);
                        if (uc && uc.cmptype) used[uc.cmptype] = uc;
                    }
                }
            }
            if (global.App && global.App._componentMode &&
                global.componentTab && global.componentTab.getFormData) {
                try {
                    var cd = global.componentTab.getFormData();
                    if (cd && cd.cmptype) {
                        var split = splitLibsByUrl(cd.jsLibs, cd.cssLibs);
                        used[cd.cmptype] = split;
                    }
                } catch (e) { /* ignore */ }
            }

            for (var ct in used) {
                if (!used.hasOwnProperty(ct)) continue;
                var comp = used[ct];
                var cssLibs = comp.cssLibs || [];
                for (var c = 0; c < cssLibs.length; c++) {
                    var u = cssLibs[c].value;
                    if (!u || seenCss[u]) continue;
                    seenCss[u] = true;
                    out.css.push(u);
                }
                var jsLibs = comp.jsLibs || [];
                for (var j = 0; j < jsLibs.length; j++) {
                    var uj = jsLibs[j].value;
                    if (!uj || seenJs[uj]) continue;
                    seenJs[uj] = true;
                    out.js.push(uj);
                }
            }
            return out;
        },

        /* ---------- Определение def для ComponentRegistry ---------- */
        toDef: function (c) {
            if (!c) return null;
            var tagName = (c.tagName || 'div').toLowerCase();

            var props = [
                { type: 'separator', caption: 'Component (Tool Palette)' },
                { name: 'data-wb-user-comp', caption: 'Component ID',   type: 'string', attr: true, readOnly: true },
                { name: 'cmptype',           caption: 'Component Type', type: 'string', attr: true }
            ];
            var userProps = c.customProperties || [];
            if (userProps.length) {
                props.push({ type: 'separator', caption: 'Component Properties' });
                for (var i = 0; i < userProps.length; i++) {
                    props.push(buildCustomInspectorField(userProps[i]));
                }
            }

            var split = splitLibsByUrl(c.jsLibs, c.cssLibs);

            return {
                id: 'user:' + c.id,
                caption: c.name || c.id,
                tagName: tagName,
                category: 'User',
                subCategory: 'User Palette',
                userComponent: c,
                locked: true,
                nestingMode:  c.nestingMode  || 'all',
                nestingRules: c.nestingRules || [],
                iconUrl: c.icon || '',
                jsLibs:  split.jsLibs,
                cssLibs: split.cssLibs,

                create: function (doc) {
                    var el = doc.createElement(tagName);
                    el.setAttribute('data-wb-user-comp', c.id);
                    if (c.cmptype) el.setAttribute('cmptype', c.cmptype);

                    /* Дефолтные размеры. Без них пустой <div> рендерится
                       как блок с width=auto (на всю ширину body) и
                       height=0. Рамка ресайза вокруг такого элемента
                       вырождается в «полоску», а содержимое preview
                       обрезается. Пользователь может потом тянуть за
                       углы — _makeAbsolute + _applyBox перезапишут стиль. */
                    if (!el.style.width)  el.style.width  = '200px';
                    if (!el.style.height) el.style.height = '100px';

                    return el;
                },

                preview: function (el, doc) {
                    var content = c.previewIdeHtml || c.html || '';
                    if (!content) return null;
                    var wrap = doc.createElement('div');
                    wrap.className = 'wb-user-comp-preview';
                    wrap.innerHTML = content;
                    return wrap;
                },

                schema: {
                    properties: props,
                    /* Стандартные STYLE_FIELDS / EVENT_FIELDS — чтобы
                       на вкладках Styles и Events были все обычные
                       CSS-свойства и DOM-события. Пользователь может
                       переопределить их так же, как у любого элемента;
                       пользовательские customProperties / customEvents
                       из определения компонента остаются на вкладке
                       Properties в разделе «Component Properties». */
                    styles: (global.CommonSchema && global.CommonSchema.STYLE_FIELDS)
                        ? global.CommonSchema.STYLE_FIELDS.slice() : [],
                    events: (global.CommonSchema && global.CommonSchema.EVENT_FIELDS)
                        ? global.CommonSchema.EVENT_FIELDS.slice() : []
                }
            };
        },

        /* ============================================================
           Palette Layout.
           ============================================================ */
        readPaletteLayout: function () { return _readLayout(); },
        savePaletteLayout: function (l) { return _writeLayout(l); },

        getPaletteFolder: function (id) {
            return _readLayout().folders[id] || null;
        },
        listPaletteFolders: function () {
            var m = _readLayout(), out = [];
            for (var k in m.folders) if (m.folders.hasOwnProperty(k)) out.push(m.folders[k]);
            return out;
        },

        ensurePaletteInitialized: function (registry) {
            var m = _readLayout();
            if (m.initialized) {
                this._syncUserComponentsToLayout(m);
                return m;
            }

            var legacy = readAll();
            for (var fid in legacy.folders) {
                if (!legacy.folders.hasOwnProperty(fid)) continue;
                if (m.folders[fid]) continue;
                var f = legacy.folders[fid];
                m.folders[fid] = {
                    id: fid,
                    name: f.name || 'Folder',
                    parentId: f.parentId || '',
                    position: 0,
                    kind: 'user'
                };
            }

            if (registry && registry.categoryTree) {
                var tree = registry.categoryTree();
                for (var i = 0; i < tree.length; i++) {
                    var node = tree[i];
                    var catId = 'cat:' + node.name;
                    if (!m.folders[catId]) {
                        m.folders[catId] = {
                            id: catId, name: node.name, parentId: '',
                            position: i, kind: 'category'
                        };
                    }
                    for (var j = 0; j < node.subcategories.length; j++) {
                        var sub = node.subcategories[j];
                        var subId = 'cat:' + node.name + '/' + sub.name;
                        if (!m.folders[subId]) {
                            m.folders[subId] = {
                                id: subId, name: sub.name, parentId: catId,
                                position: j, kind: 'category'
                            };
                        }
                    }
                }
            }

            if (registry && registry.all) {
                var all = registry.all();
                for (var k = 0; k < all.length; k++) {
                    var def = all[k];
                    if (def.hidden) continue;
                    var itemId = 'b:' + def.id;
                    if (m.items[itemId]) continue;
                    var folderId = '';
                    if (def.subCategory) folderId = 'cat:' + def.category + '/' + def.subCategory;
                    else if (def.category) folderId = 'cat:' + def.category;
                    if (folderId && !m.folders[folderId]) folderId = '';
                    m.items[itemId] = { folderId: folderId, position: k };
                }
            }

            this._syncUserComponentsToLayout(m);

            m.initialized = true;
            _writeLayout(m);
            return m;
        },

        _syncUserComponentsToLayout: function (m) {
            m = m || _readLayout();
            var comps = readAll().components || {};
            var changed = false;
            for (var cid in comps) {
                if (!comps.hasOwnProperty(cid)) continue;
                var itemId = 'u:' + cid;
                if (m.items[itemId]) continue;
                var c = comps[cid];
                var fId = c.folderId || '';
                if (fId && !m.folders[fId]) fId = '';
                m.items[itemId] = { folderId: fId, position: 0 };
                changed = true;
            }
            if (changed) _writeLayout(m);
            return m;
        },

        createPaletteFolder: function (name, parentId) {
            var m = _readLayout();
            var id = uid('pfld');
            m.folders[id] = {
                id: id,
                name: String(name || 'Folder'),
                parentId: parentId || '',
                position: _maxPositionInFolder(m, parentId) + 1,
                kind: 'user'
            };
            _writeLayout(m);
            return id;
        },

        renamePaletteFolder: function (id, name) {
            var m = _readLayout();
            if (!m.folders[id]) return false;
            m.folders[id].name = String(name);
            return _writeLayout(m);
        },

        deletePaletteFolder: function (id) {
            var m = _readLayout();
            var f = m.folders[id];
            if (!f) return false;
            var newParent = f.parentId || '';

            for (var fid in m.folders) {
                if (!m.folders.hasOwnProperty(fid)) continue;
                if (m.folders[fid].parentId === id) {
                    m.folders[fid].parentId = newParent;
                }
            }
            for (var iid in m.items) {
                if (!m.items.hasOwnProperty(iid)) continue;
                if (m.items[iid].folderId === id) {
                    m.items[iid].folderId = newParent;
                }
            }
            delete m.folders[id];
            return _writeLayout(m);
        },

        movePaletteFolder: function (id, newParentId) {
            var m = _readLayout();
            if (!m.folders[id]) return false;
            newParentId = newParentId || '';
            if (newParentId === id) return false;
            if (newParentId && !m.folders[newParentId]) return false;

            var cur = newParentId;
            while (cur) {
                if (cur === id) return false;
                cur = m.folders[cur] ? m.folders[cur].parentId : '';
            }

            m.folders[id].parentId = newParentId;
            m.folders[id].position = _maxPositionInFolder(m, newParentId) + 1;
            return _writeLayout(m);
        },

        setItemPlacement: function (itemId, folderId, position) {
            var m = _readLayout();
            if (!itemId) return false;
            folderId = folderId || '';
            if (folderId && !m.folders[folderId]) folderId = '';
            m.items[itemId] = {
                folderId: folderId,
                position: (position == null) ? _maxPositionInFolder(m, folderId) + 1 : position
            };
            return _writeLayout(m);
        },

        clearItemPlacement: function (itemId) {
            var m = _readLayout();
            if (!m.items[itemId]) return false;
            delete m.items[itemId];
            return _writeLayout(m);
        },

        getItemPlacement: function (itemId) {
            return _readLayout().items[itemId] || null;
        },

        listItemsInFolder: function (folderId) {
            var m = _readLayout(), out = [];
            for (var iid in m.items) {
                if (!m.items.hasOwnProperty(iid)) continue;
                if ((m.items[iid].folderId || '') === (folderId || '')) out.push(iid);
            }
            return out;
        },

        buildCustomInspectorField: buildCustomInspectorField
    };

    global.ComponentStorage = ComponentStorage;
})(window);