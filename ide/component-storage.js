/* ComponentStorage — CRUD пользовательской палитры компонентов в LocalStorage.

   Модель:
     { version:2, folders:{…}, components:{…} }

   Поля компонента:
     id, name, cmptype, tagName, icon, description,
     html, js, css, previewIdeHtml,
     jsLibs, cssLibs,
     customProperties:[
       { name, caption, type, values, unit, fieldType, fieldUrl, fieldPredefined }
     ],
     folderId

   Уникальность: по cmptype (если не задан — по name). */
(function (global) {
    'use strict';
    var KEY = 'wb.userPalette';

    function emptyModel() { return { version: 2, folders: {}, components: {} }; }

    function readAll() {
        try {
            var raw = localStorage.getItem(KEY);
            if (!raw) return emptyModel();
            var o = JSON.parse(raw);
            if (!o || typeof o !== 'object') return emptyModel();
            if (!o.folders) o.folders = {};
            if (!o.components) o.components = {};
            o.version = 2;
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

    function normalizeComponent(src) {
        src = src || {};
        var props = Array.isArray(src.customProperties) ? src.customProperties : [];
        var out = [];
        for (var i = 0; i < props.length; i++) out.push(normalizeProp(props[i]));
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

        /* enum → values[] */
        if (p.type === 'enum' && p.values) {
            out.values = String(p.values).split(',').map(function (s) { return s.trim(); })
                .filter(function (s) { return s !== ''; });
        }

        /* length → suggest по единице измерения */
        if (p.type === 'length' && p.unit) {
            out.suggest = [p.unit];
        }

        /* FIELD TYPE — как открывать редактор/просмотр значения */
        if (p.fieldType === 'url' && p.fieldUrl) {
            out.type = 'custom-editor-url';
            out.editorUrl = p.fieldUrl;
        } else if (p.fieldType === 'predefined' && p.fieldPredefined) {
            switch (p.fieldPredefined) {
                case 'text':
                    out.type = 'text'; break;
                case 'code-editor-xml':
                    out.type = 'code-editor'; out.language = 'xml'; break;
                case 'code-editor-js':
                    out.type = 'code-editor'; out.language = 'javascript'; break;
                case 'code-editor-css':
                    out.type = 'code-editor'; out.language = 'css'; break;
                case 'code-editor-json':
                    out.type = 'code-editor'; out.language = 'json'; break;
                case 'code-editor-sql':
                    out.type = 'code-editor'; out.language = 'sql'; break;
                case 'image-preview':
                    out.type = 'FILE'; break;
                case 'file-picker':
                    out.type = 'FILE'; break;
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

        /* Поиск компонента по cmptype (уникальный ключ). */
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
            /* Уникальность: если cmptype уже занят — перезаписываем. */
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
            model.version = 2;
            return writeAll(model);
        },

        /* ---------- merge с контролем уникальности по cmptype ----------
           Возвращает Promise<{ imported, overwritten, skipped }>. */
        mergeWithConfirmation: function (model) {
            var self = this;
            return new Promise(function (resolve) {
                if (!model || typeof model !== 'object') {
                    resolve({ imported: 0, overwritten: 0, skipped: 0 });
                    return;
                }
                var m = readAll();
                var stats = { imported: 0, overwritten: 0, skipped: 0 };

                /* Папки — сначала создаём с маппингом id. */
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

                    /* Контроль уникальности по cmptype. */
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
                        /* Если id уже занят — создаём новый. */
                        if (m.components[c.id]) c.id = uid('cmp');
                        m.components[c.id] = c;
                        stats.imported++;
                    }
                }

                writeAll(m);
                resolve(stats);
            });
        },

        /* ---------- построение def для ComponentRegistry ---------- */
        toDef: function (c) {
            if (!c) return null;
            var tagName = (c.tagName || 'div').toLowerCase();

            /* Схема Inspector — из пользовательских свойств. */
            var props = [
                { type: 'separator', caption: 'Component (Tool Palette)' },
                { name: 'data-wb-user-comp', caption: 'Component ID', type: 'string', attr: true, readOnly: true },
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
                preview: null,
                iconUrl: c.icon || '',
                create: function (doc) {
                    var el = doc.createElement(tagName);
                    el.setAttribute('data-wb-user-comp', c.id);
                    if (c.cmptype) el.setAttribute('cmptype', c.cmptype);

                    /* CSS-ресурсы. */
                    if (c.cssLibs && c.cssLibs.length) {
                        for (var i = 0; i < c.cssLibs.length; i++) {
                            var lib = c.cssLibs[i];
                            var href = lib.value;
                            if (lib.type === 'project' && global.ProjectResolver) {
                                try { href = global.ProjectResolver.resolve(lib.value); } catch (e) {}
                            }
                            if (!href) continue;
                            var link = doc.createElement('link');
                            link.rel = 'stylesheet';
                            link.href = href;
                            link.setAttribute('data-wb-user-comp-asset', c.id);
                            el.appendChild(link);
                        }
                    }
                    if (c.css) {
                        var st = doc.createElement('style');
                        st.setAttribute('data-wb-user-comp-style', c.id);
                        st.textContent = c.css;
                        el.appendChild(st);
                    }

                    /* Разметка — PreViewIDE(html). */
                    var html = c.previewIdeHtml || c.html || '';
                    var holder = doc.createElement('div');
                    holder.setAttribute('data-wb-user-comp-content', '1');
                    holder.innerHTML = html;
                    el.appendChild(holder);

                    /* JS-ресурсы. */
                    if (c.jsLibs && c.jsLibs.length) {
                        for (var j = 0; j < c.jsLibs.length; j++) {
                            var jlib = c.jsLibs[j];
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
                    if (c.js) {
                        var sc2 = doc.createElement('script');
                        sc2.setAttribute('data-wb-user-comp-script', c.id);
                        sc2.textContent = c.js;
                        el.appendChild(sc2);
                    }
                    return el;
                },
                schema: {
                    properties: props,
                    styles: [],
                    events: []
                }
            };
        },

        /* Публичные хелперы (для ComponentTab). */
        buildCustomInspectorField: buildCustomInspectorField
    };

    global.ComponentStorage = ComponentStorage;
})(window);