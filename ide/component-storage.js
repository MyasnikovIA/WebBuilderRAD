/* ComponentStorage — пользовательская палитра компонентов + генерация
   фоновых библиотек core.js / <cmptype>.js / <cmptype>.css.

   Модель палитры (localStorage 'wb.userPalette', version 5):
     components['<id>'] = {
       id, name, cmptype, tagName, icon, description,
       previewIdeHtml,               — editor-only preview на сцене
       html,                         — алиас previewIdeHtml (для совместимости)
       js, css,                      — пользовательский код → lib/<cmptype>.{js,css}
       jsLibs, cssLibs,              — внешние ресурсы
       customProperties, customEvents,
       nestingMode, nestingRules,
       folderId
     }

   В проекте (project.files) фоновые файлы помечаются `_system: 'wb-lib'`
   и по пути начинаются на 'lib/wb-component/'. ProjectTree их не показывает.

   ВАЖНО: HTML-разметка компонента (previewIdeHtml / html) встраивается
   в <cmptype>.js как поле `html` в дефе, который регистрируется через
   WbComponent.register(). Рантайм attach() рендерит эту разметку внутрь
   элемента [data-wb-user-comp], если он ещё пуст. Так экспортированная
   HTML-страница может показать компонент без хранения разметки в самом
   HTML-файле.

   ------------------------------------------------------------------
   Palette Layout (localStorage 'wb.paletteLayout', version 1):

     Раскладка дерева палитры компонентов (единое дерево для стандартных
     и пользовательских компонентов).

     {
       version: 1,
       initialized: true|false,
       folders: {
         '<id>': { id, name, parentId, position, kind: 'user' | 'category' }
       },
       items: {
         'b:<defId>':  { folderId, position },   — built-in компонент
         'u:<cmpId>':  { folderId, position }    — user-компонент
       }
     }

     itemId:
       'b:' + def.id — стандартный (D3/M2/HTML)
       'u:' + c.id   — пользовательский */
(function (global) {
    'use strict';
    var KEY = 'wb.userPalette';
    var PALETTE_KEY = 'wb.paletteLayout';

    var LIB_DIR = 'lib/wb-component/';
    var CORE_FILE = LIB_DIR + 'core.js';

    /* ------------------------------------------------------------------
       Фоновый runtime (core.js). Вставляется в проект один раз.
       Не содержит ничего про конкретные компоненты — только реестр,
       attach-логику (с рендером def.html), observer. */
    var CORE_LIBRARY_SOURCE = [
        '/* WbComponent core — автогенерация. Не редактировать вручную. */',
        '(function(g){',
        'if (g.WbComponent && g.WbComponent._bootstrapped) return;',
        'var WbComponent = {',
        '    _bootstrapped: true,',
        '    _defs: {},',
        '    _registry: {},',
        '    _byCmptype: {},',
        '    _pending: [],',
        '    register: function(def){',
        '        if(!def || !def.cmptype) return;',
        '        this._defs[def.cmptype] = def;',
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
        '    }',
        '};',
        'g.WbComponent = WbComponent;',
        '',
        'function resolveFn(name){',
        '    if(!name) return null;',
        '    var parts = String(name).split("."), obj = g;',
        '    for(var i=0;i<parts.length;i++){ if(!obj) return null; obj = obj[parts[i]]; }',
        '    return typeof obj==="function" ? obj : null;',
        '}',
        '',
        'function hasRealContent(el){',
        '    if(!el || !el.childNodes) return false;',
        '    for(var i=0;i<el.childNodes.length;i++){',
        '        var c = el.childNodes[i];',
        '        if(c.nodeType === 1) return true;',
        '        if(c.nodeType === 3 && c.nodeValue && c.nodeValue.replace(/\\s+/g,"") !== "") return true;',
        '    }',
        '    return false;',
        '}',
        '',
        'function attach(el, def){',
        '    if(el._wbComponent) return el._wbComponent;',
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
        '    if(def.html && !hasRealContent(el)){',
        '        try { el.innerHTML = def.html; } catch(e){ console.error("[WbComponent] render html", def.cmptype, e); }',
        '    }',
        '    WbComponent._register(instance);',
        '    return instance;',
        '}',
        '',
        'function init(){',
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
        return {
            id:             src.id || uid('cmp'),
            name:           src.name || 'Component',
            cmptype:        src.cmptype || '',
            tagName:        src.tagName || 'div',
            icon:           src.icon || '',
            description:    src.description || '',
            html:           previewHtml,
            previewIdeHtml: previewHtml,
            js:             src.js || '',
            css:            src.css || '',
            jsLibs:         Array.isArray(src.jsLibs)  ? src.jsLibs  : [],
            cssLibs:        Array.isArray(src.cssLibs) ? src.cssLibs : [],
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

        /* ---------- folders (старая модель — оставлена для совместимости) ---------- */
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

        createComponent: function (def) {
            var m = readAll();
            var c = normalizeComponent(def);
            if (c.cmptype) {
                var existing = this.findByCmptype(c.cmptype);
                if (existing) { c.id = existing.id; c.folderId = c.folderId || existing.folderId; }
            }
            m.components[c.id] = c;
            writeAll(m);

            /* Отражаем новый компонент в раскладке палитры. */
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
            var norm = normalizeComponent(Object.assign({}, m.components[id], patch));
            norm.id = id;
            m.components[id] = norm;
            return writeAll(m);
        },
        deleteComponent: function (id) {
            var m = readAll();
            if (!m.components[id]) return false;
            delete m.components[id];
            writeAll(m);

            /* Удаляем placement из раскладки. */
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

                /* Синхронизируем новые компоненты с раскладкой. */
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
            var def = {
                id: c.id,
                cmptype: c.cmptype,
                name: c.name,
                html: html,
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
            if (c.cssLibs && c.cssLibs.length) {
                for (var i = 0; i < c.cssLibs.length; i++) {
                    var lib = c.cssLibs[i];
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
           syncProjectLibraries */
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
                        used[cd.cmptype] = {
                            id: cd.id || ('inline:' + cd.cmptype),
                            name: cd.name || cd.cmptype,
                            cmptype: cd.cmptype,
                            html: html,
                            previewIdeHtml: html,
                            customProperties: cd.customProperties || [],
                            customEvents:     cd.customEvents || [],
                            js:   cd.js  || '',
                            css:  cd.css || '',
                            jsLibs:  cd.jsLibs  || [],
                            cssLibs: cd.cssLibs || []
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

                create: function (doc) {
                    var el = doc.createElement(tagName);
                    el.setAttribute('data-wb-user-comp', c.id);
                    if (c.cmptype) el.setAttribute('cmptype', c.cmptype);
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

                schema: { properties: props, styles: [], events: [] }
            };
        },

        /* ============================================================
           Palette Layout — раскладка дерева палитры.
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

        /* Первичная инициализация раскладки.

           Создаёт:
             • папки-категории из ComponentRegistry.categoryTree()
               (kind: 'category') с устойчивыми id 'cat:<path>';
             • placements для всех built-in компонентов;
             • переносит существующие ComponentStorage.folders и folderId
               в layout (kind: 'user'). */
        ensurePaletteInitialized: function (registry) {
            var m = _readLayout();
            if (m.initialized) {
                this._syncUserComponentsToLayout(m);
                return m;
            }

            /* 1. Перенос существующих пользовательских папок. */
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

            /* 2. Категории/подкатегории из реестра — как kind:'category'. */
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

            /* 3. Placements для built-in компонентов. */
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

            /* 4. Placements для user-компонентов — по их folderId. */
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

        /* Удаляет папку. Содержимое (компоненты и подпапки) поднимается
           в родительскую папку. */
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

        /* Перемещает папку внутрь newParentId. Возвращает false при цикле. */
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