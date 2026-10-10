/* ComponentStorage — CRUD пользовательской палитры компонентов в LocalStorage.

   Модель:
     { version:4, folders:{…}, components:{…} }

   Поля компонента:
     id, name, cmptype, tagName, icon, description,
     html, js, css, previewIdeHtml,
     jsLibs, cssLibs,
     customProperties: [
       { name, caption, type, values, unit,
         fieldType, fieldUrl, fieldPredefined,
         onChangeFunc }                       ← JS-функция, вызываемая при изменении
     ],
     customEvents: [
       { name, caption, handlerFunc }         ← пользовательские события + их обработчик
     ],
     nestingMode, nestingRules,
     folderId

   Runtime: каждый экземпляр компонента получает объект el._wbComponent,
   который также регистрируется в window.WbComponent. Доступ:
     var c = WbComponent.get('my.component');   // по cmptype
     var c = WbComponent.get('cmp_xxx');        // по id
     var c = WbComponent.get(el);               // по DOM-элементу

   Инстанс предоставляет:
     c.get(name) / c.set(name, value) — доступ к атрибуту-свойству
     c.<propertyName>                 — accessor (get/set через атрибут)
     c.on(event, handler)             — подписка на событие
     c.off(event, handler)
     c.emit(event, data)              — вызвать событие
     c.el                             — корневой элемент
*/
(function (global) {
    'use strict';
    var KEY = 'wb.userPalette';

    function emptyModel() { return { version: 4, folders: {}, components: {} }; }

    function readAll() {
        try {
            var raw = localStorage.getItem(KEY);
            if (!raw) return emptyModel();
            var o = JSON.parse(raw);
            if (!o || typeof o !== 'object') return emptyModel();
            if (!o.folders) o.folders = {};
            if (!o.components) o.components = {};
            o.version = 4;
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
        return {
            name:        e.name || '',
            caption:     e.caption || e.name || '',
            handlerFunc: e.handlerFunc || ''
        };
    }

    function normalizeRule(r) {
        r = r || {};
        var kind = (r.kind === 'cmptype') ? 'cmptype' : 'tag';
        return { kind: kind, value: r.value || '' };
    }

    function normalizeComponent(src) {
        src = src || {};

        var props = Array.isArray(src.customProperties) ? src.customProperties : [];
        var outProps = [];
        for (var i = 0; i < props.length; i++) outProps.push(normalizeProp(props[i]));

        var evs = Array.isArray(src.customEvents) ? src.customEvents : [];
        var outEvs = [];
        for (var k = 0; k < evs.length; k++) {
            var ev = normalizeEvent(evs[k]);
            if (ev.name) outEvs.push(ev);
        }

        var rules = Array.isArray(src.nestingRules) ? src.nestingRules : [];
        var outRules = [];
        for (var r = 0; r < rules.length; r++) {
            var nr = normalizeRule(rules[r]);
            if (nr.value) outRules.push(nr);
        }

        var mode = src.nestingMode;
        if (mode !== 'none' && mode !== 'list' && mode !== 'all') mode = 'all';

        return {
            id:             src.id || uid('cmp'),
            name:           src.name || 'Component',
            cmptype:        src.cmptype || '',
            tagName:        src.tagName || 'div',
            icon:           src.icon || '',
            description:    src.description || '',
            html:           src.html || '',
            js:             src.js || '',
            css:            src.css || '',
            previewIdeHtml: src.previewIdeHtml || '',
            jsLibs:         Array.isArray(src.jsLibs)  ? src.jsLibs  : [],
            cssLibs:        Array.isArray(src.cssLibs) ? src.cssLibs : [],
            customProperties: outProps,
            customEvents:     outEvs,
            nestingMode:      mode,
            nestingRules:     outRules,
            folderId:         src.folderId || ''
        };
    }

    /* ---------- Трансляция user-property → inspector-field ---------- */
    function buildCustomInspectorField(p) {
        var out = {
            name:    p.name,
            caption: p.caption || p.name,
            attr:    true,
            type:    p.type || 'string',
            _user:   true
        };
        if (p.type === 'enum' && p.values) {
            out.values = String(p.values).split(',').map(function (s) { return s.trim(); })
                .filter(function (s) { return s !== ''; });
        }
        if (p.type === 'length' && p.unit) {
            out.suggest = [p.unit];
        }
        if (p.fieldType === 'url' && p.fieldUrl) {
            out.type = 'custom-editor-url';
            out.editorUrl = p.fieldUrl;
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

    /* ---------- Runtime-бутстрап ----------
       Вставляется один раз на документ. Определяет window.WbComponent,
       сканирует DOM и вешает инстансы на все [data-wb-user-comp].
       Наблюдает за DOM — подхватывает позже добавленные компоненты. */
    var BOOTSTRAP_CODE = [
        '(function(g){',
        'if (g.WbComponent && g.WbComponent._bootstrapped) return;',

        'var WbComponent = {',
        '    _bootstrapped: true,',
        '    _registry: {},',
        '    _byCmptype: {},',
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

        'function resolveFn(name){',
        '    if(!name) return null;',
        '    var parts = String(name).split("."), obj = g;',
        '    for(var i=0;i<parts.length;i++){ if(!obj) return null; obj = obj[parts[i]]; }',
        '    return typeof obj==="function" ? obj : null;',
        '}',

        'function attach(el, c){',
        '    if(el._wbComponent) return el._wbComponent;',
        '    var instance = {',
        '        id: c.id,',
        '        cmptype: c.cmptype,',
        '        name: c.name,',
        '        el: el,',
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

        /* Свойства-аксессоры */
        '    var props = c.customProperties || [];',
        '    for(var i=0;i<props.length;i++){',
        '        (function(p){',
        '            try {',
        '                Object.defineProperty(instance, p.name, {',
        '                    get: function(){ return el.getAttribute(p.name) || ""; },',
        '                    set: function(v){ el.setAttribute(p.name, v); },',
        '                    enumerable: true,',
        '                    configurable: true',
        '                });',
        '            } catch(e){}',
        '        })(props[i]);',
        '    }',

        /* MutationObserver — onChange для свойств */
        '    if(g.MutationObserver){',
        '        var mo = new g.MutationObserver(function(muts){',
        '            for(var m=0;m<muts.length;m++){',
        '                var mu = muts[m];',
        '                if(mu.type !== "attributes") continue;',
        '                var pn = mu.attributeName;',
        '                var pdef = null;',
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

        /* Custom events — вешаем слушатели на корневой элемент */
        '    var evs = c.customEvents || [];',
        '    for(var j=0;j<evs.length;j++){',
        '        (function(ev){',
        '            if(!ev.handlerFunc) return;',
        '            el.addEventListener(ev.name, function(e){',
        '                var fn = resolveFn(ev.handlerFunc);',
        '                if(!fn) return;',
        '                try {',
        '                    fn.call(instance, {',
        '                        type: ev.name,',
        '                        originalEvent: e,',
        '                        component: instance,',
        '                        el: el,',
        '                        data: e && e.detail',
        '                    });',
        '                } catch(ex){ console.error("[WbComponent] on", ev.handlerFunc, ex); }',
        '            }, false);',
        '        })(evs[j]);',
        '    }',

        '    el._wbComponent = instance;',
        '    WbComponent._register(instance);',
        '    return instance;',
        '}',

        'function loadPalette(){',
        '    try { var raw = g.localStorage.getItem("wb.userPalette"); return raw ? JSON.parse(raw) : null; }',
        '    catch(e){ return null; }',
        '}',

        'function init(){',
        '    var model = loadPalette();',
        '    if(!model || !model.components) return;',
        '    var comps = model.components;',
        '    var els = document.querySelectorAll("[data-wb-user-comp]");',
        '    for(var i=0;i<els.length;i++){',
        '        var el = els[i];',
        '        var cid = el.getAttribute("data-wb-user-comp");',
        '        var c = comps[cid];',
        '        if(!c) continue;',
        '        try { attach(el, c); } catch(e){ console.error("[WbComponent] attach", cid, e); }',
        '    }',
        '}',

        'WbComponent._attach = attach;',
        'WbComponent._init = init;',
        'WbComponent.loadPalette = loadPalette;',

        'if(document.readyState === "loading"){',
        '    document.addEventListener("DOMContentLoaded", init, false);',
        '} else {',
        '    init();',
        '}',

        /* Ре-скан при добавлении узлов */
        'if(g.MutationObserver){',
        '    var bodyObs = new g.MutationObserver(function(muts){',
        '        for(var i=0;i<muts.length;i++){',
        '            if(muts[i].addedNodes && muts[i].addedNodes.length){',
        '                setTimeout(init, 0);',
        '                return;',
        '            }',
        '        }',
        '    });',
        '    try { bodyObs.observe(document.documentElement, { childList: true, subtree: true }); } catch(e){}',
        '}',

        '})(window);'
    ].join('\n');

    var ComponentStorage = {
        read: function () { return readAll(); },
        save: function (m) { return writeAll(m); },
        uid: uid,

        /* ---------- folders ---------- */
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
                if (existing) {
                    c.id = existing.id;
                    c.folderId = c.folderId || existing.folderId;
                }
            }
            m.components[c.id] = c;
            writeAll(m);
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
            return writeAll(m);
        },

        replaceAll: function (model) {
            if (!model || typeof model !== 'object') return false;
            if (!model.folders) model.folders = {};
            if (!model.components) model.components = {};
            model.version = 4;
            return writeAll(model);
        },

        mergeWithConfirmation: function (model) {
            var self = this;
            return new Promise(function (resolve) {
                if (!model || typeof model !== 'object') {
                    resolve({ imported: 0, overwritten: 0, skipped: 0 });
                    return;
                }
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
                            dup.name + ').\n\nПерезаписать его?'
                        );
                        if (ok) {
                            c.id = dup.id;
                            m.components[c.id] = c;
                            stats.overwritten++;
                        } else {
                            stats.skipped++;
                        }
                    } else {
                        if (m.components[c.id]) c.id = uid('cmp');
                        m.components[c.id] = c;
                        stats.imported++;
                    }
                }

                writeAll(m);
                resolve(stats);
            });
        },

        /* ---------- Проверка правил вложенности ---------- */
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
                    if (r.kind === 'tag' && tag &&
                        String(r.value).toLowerCase() === tag) return true;
                    if (r.kind === 'cmptype' && ct &&
                        String(r.value) === ct) return true;
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

        /* ---------- Runtime-бутстрап ---------- */
        ensureRuntimeBootstrap: function (doc) {
            if (!doc) return;
            if (doc.querySelector('script[data-wb-user-comp-bootstrap="1"]')) return;
            var sc = doc.createElement('script');
            sc.setAttribute('data-wb-user-comp-bootstrap', '1');
            sc.textContent = BOOTSTRAP_CODE;
            var head = doc.head || doc.documentElement;
            if (head) head.insertBefore(sc, head.firstChild);
        },

        /* ---------- Инъекция служебных CSS/JS в элемент ---------- */
        injectAssets: function (el, c, doc) {
            if (!el || !c || !doc) return;

            /* Сначала — runtime-бутстрап. */
            this.ensureRuntimeBootstrap(doc);

            /* Удаляем старые сервисные узлы. */
            var toRemove = [];
            for (var i = 0; i < el.children.length; i++) {
                var ch = el.children[i];
                if (!ch.getAttribute) continue;
                if (ch.getAttribute('data-wb-user-comp-asset') != null ||
                    ch.getAttribute('data-wb-user-comp-style') != null ||
                    ch.getAttribute('data-wb-user-comp-script') != null) {
                    toRemove.push(ch);
                }
            }
            for (var j = 0; j < toRemove.length; j++) {
                if (toRemove[j].parentNode) toRemove[j].parentNode.removeChild(toRemove[j]);
            }

            /* CSS-ресурсы. */
            if (c.cssLibs && c.cssLibs.length) {
                for (var k = 0; k < c.cssLibs.length; k++) {
                    var lib = c.cssLibs[k];
                    var href = lib.value;
                    if (lib.type === 'project' && global.ProjectResolver) {
                        try { href = global.ProjectResolver.resolve(lib.value); } catch (e) {}
                    }
                    if (!href) continue;
                    var link = doc.createElement('link');
                    link.rel = 'stylesheet';
                    link.href = href;
                    link.setAttribute('data-wb-user-comp-asset', c.id);
                    el.insertBefore(link, el.firstChild);
                }
            }
            if (c.css) {
                var st = doc.createElement('style');
                st.setAttribute('data-wb-user-comp-style', c.id);
                st.textContent = c.css;
                el.insertBefore(st, el.firstChild);
            }
            /* Встроенный JS. */
            if (c.js) {
                var sc2 = doc.createElement('script');
                sc2.setAttribute('data-wb-user-comp-script', c.id);
                sc2.textContent = c.js;
                el.appendChild(sc2);
            }
            /* JS-ресурсы. */
            if (c.jsLibs && c.jsLibs.length) {
                for (var m = 0; m < c.jsLibs.length; m++) {
                    var jlib = c.jsLibs[m];
                    var src = jlib.value;
                    if (jlib.type === 'project' && global.ProjectResolver) {
                        try { src = global.ProjectResolver.resolve(jlib.value); } catch (e) {}
                    }
                    if (!src) continue;
                    var sc = doc.createElement('script');
                    sc.src = src;
                    sc.setAttribute('data-wb-user-comp-asset', c.id);
                    el.appendChild(sc);
                }
            }
        },

        /* ---------- построение def для ComponentRegistry ---------- */
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
                    global.ComponentStorage.injectAssets(el, c, doc);
                    return el;
                },

                preview: function (el, doc) {
                    global.ComponentStorage.injectAssets(el, c, doc);
                    var content = c.previewIdeHtml || c.html || '';
                    if (!content) return null;
                    var wrap = doc.createElement('div');
                    wrap.className = 'wb-user-comp-preview';
                    wrap.innerHTML = content;
                    return wrap;
                },

                schema: {
                    properties: props,
                    styles: [],
                    events: []
                }
            };
        },

        buildCustomInspectorField: buildCustomInspectorField
    };

    global.ComponentStorage = ComponentStorage;
})(window);