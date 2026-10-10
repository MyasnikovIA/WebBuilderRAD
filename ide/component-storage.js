/* ComponentStorage — CRUD пользовательской палитры компонентов в LocalStorage.

   Модель:
     { version:3, folders:{…}, components:{…} }

   Правила вложенности (nesting):
     nestingMode:  'all' | 'list' | 'none'
     nestingRules: [ { kind:'tag'|'cmptype', value:'…' } ]

   Сервисные узлы компонента (не видны в дереве и cleanHtml, но работают):
     <link   data-wb-user-comp-asset="<id>">
     <style  data-wb-user-comp-style="<id>">
     <script data-wb-user-comp-script="<id>">
     <script src="…" data-wb-user-comp-asset="<id>">

   Preview-контент компонента (PreViewIDE(html)) вставляется через
   _renderPreview как отдельный узел с data-wb-preview="1" — он
   виден только в редакторе и не сериализуется. */
(function (global) {
    'use strict';
    var KEY = 'wb.userPalette';

    function emptyModel() { return { version: 3, folders: {}, components: {} }; }

    function readAll() {
        try {
            var raw = localStorage.getItem(KEY);
            if (!raw) return emptyModel();
            var o = JSON.parse(raw);
            if (!o || typeof o !== 'object') return emptyModel();
            if (!o.folders) o.folders = {};
            if (!o.components) o.components = {};
            o.version = 3;
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
            fieldPredefined: p.fieldPredefined || ''
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
        var out = [];
        for (var i = 0; i < props.length; i++) out.push(normalizeProp(props[i]));

        var rules = Array.isArray(src.nestingRules) ? src.nestingRules : [];
        var nrules = [];
        for (var j = 0; j < rules.length; j++) {
            var r = normalizeRule(rules[j]);
            if (r.value) nrules.push(r);
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
            customProperties: out,
            nestingMode:    mode,
            nestingRules:   nrules,
            folderId:       src.folderId || ''
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
            model.version = 3;
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

        /* ---------- Проверка правил вложенности ----------
           uc — компонент; childTag, childCmptype — характеристики вставляемого.
           Возвращает true, если вложение разрешено. */
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

        /* Найти ближайший родительский user-component. */
        findUserCompAncestor: function (el, stopAt) {
            var cur = el;
            while (cur && cur !== stopAt) {
                if (cur.getAttribute && cur.getAttribute('data-wb-user-comp')) return cur;
                cur = cur.parentNode;
            }
            return null;
        },

        /* ---------- Инъекция служебных CSS/JS в элемент компонента ---------- */
        injectAssets: function (el, c, doc) {
            if (!el || !c || !doc) return;

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
            if (c.js) {
                var sc2 = doc.createElement('script');
                sc2.setAttribute('data-wb-user-comp-script', c.id);
                sc2.textContent = c.js;
                el.appendChild(sc2);
            }
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

                /* Правила вложенности — пробрасываем на def, чтобы
                   canvas-insert / dom-tree могли быстро их читать. */
                nestingMode:  c.nestingMode  || 'all',
                nestingRules: c.nestingRules || [],

                iconUrl: c.icon || '',

                /* Создание корневого элемента.
                   Preview-контент НЕ добавляем здесь — его вставит
                   Canvas._renderPreview через def.preview(). */
                create: function (doc) {
                    var el = doc.createElement(tagName);
                    el.setAttribute('data-wb-user-comp', c.id);
                    if (c.cmptype) el.setAttribute('cmptype', c.cmptype);
                    global.ComponentStorage.injectAssets(el, c, doc);
                    return el;
                },

                /* Preview-хук: возвращает узел с PreViewIDE(html).
                   Canvas отметит его data-wb-preview="1" — это
                   editor-only содержимое, не попадает в cleanHtml. */
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