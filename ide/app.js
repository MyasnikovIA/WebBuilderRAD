/* Точка сборки + команды приложения. */
(function (global, $) {
    'use strict';

    $(function () {

        mini.parse();

        var domTree   = new DomTree(document.getElementById('wb-domtree'));
        var palette   = new Palette(document.getElementById('wb-palette'));
        var inspector = new Inspector(document.getElementById('wb-right') || document.body);

        var canvas    = new Canvas(document.getElementById('wb-canvas'));
        History.attach(canvas);

        var clipboard = null;

        EventBus.on('palette:selected', function (e) { canvas.setPending(e.component); });

        EventBus.on('command:delete', function () { App.cmd('delete'); });
        EventBus.on('command:move',   function (e) { moveSel(e.dx, e.dy, e.resize); });
        EventBus.on('command:undo',   function ()  { History.undo(); });
        EventBus.on('command:redo',   function ()  { History.redo(); });

        /* Контекстное меню сцены (ПКМ по элементу в iframe) */
        EventBus.on('contextmenu:element', function (e) {
            var menu = mini.get('wb-contextmenu');
            menu.showAtPos(e.x, e.y);
        });

        /* Контекстное меню дерева (ПКМ по узлу Structure) */
        EventBus.on('contextmenu:tree', function (e) {
            var menu = mini.get('wb-treemenu');
            menu.showAtPos(e.x, e.y);
        });
        /* Скрыть любое открытое контекстное меню */
        EventBus.on('contextmenu:hide', function () {
            var m1 = mini.get('wb-contextmenu');
            if (m1) m1.hide();
            var m2 = mini.get('wb-treemenu');
            if (m2) m2.hide();
        });

        EventBus.on('canvas:selection:reset', function () {
            var t = document.getElementById('wb-inspector-target');
            if (t) t.textContent = '—';
        });

        $(document).keydown(function (e) {
            if (canvas.designMode && document.activeElement === canvas.iframe) return;

            if (e.ctrlKey && e.keyCode === 90) { History.undo(); e.preventDefault(); }
            else if (e.ctrlKey && e.keyCode === 89) { History.redo(); e.preventDefault(); }
            else if (e.ctrlKey && e.keyCode === 67) { App.cmd('copy');  e.preventDefault(); }
            else if (e.ctrlKey && e.keyCode === 88) { App.cmd('cut');   e.preventDefault(); }
            else if (e.ctrlKey && e.keyCode === 86) { App.cmd('paste'); e.preventDefault(); }
            else if (e.keyCode === 46) { App.cmd('delete'); }
        });

        function moveSel(dx, dy, resize) {
            var el = canvas.getSelected();
            var body = canvas.getBody();
            if (!el || !body || el === body) return;
            var st = el.style;
            if (!st.position || st.position === 'static') {
                var r = el.getBoundingClientRect();
                var br = body.getBoundingClientRect();
                st.position = 'absolute';
                st.left   = Math.round(r.left - br.left) + 'px';
                st.top    = Math.round(r.top  - br.top)  + 'px';
                st.width  = Math.round(r.width)  + 'px';
                st.height = Math.round(r.height) + 'px';
            }
            if (resize) {
                st.width  = ((parseFloat(st.width)  || 0) + dx) + 'px';
                st.height = ((parseFloat(st.height) || 0) + dy) + 'px';
            } else {
                st.left = ((parseFloat(st.left) || 0) + dx) + 'px';
                st.top  = ((parseFloat(st.top)  || 0) + dy) + 'px';
            }
            EventBus.emit('canvas:changed');
            EventBus.emit('selection:changed', { element: el });
        }

        function cleanClone(node) {
            if (!node || node.nodeType !== 1) return;
            node.classList.remove('wb-selected', 'wb-hover');
            if (node.classList.length === 0) node.removeAttribute('class');
            node.removeAttribute('data-wb-editable');
            var kids = node.querySelectorAll('.wb-selected, .wb-hover, [data-wb-editable]');
            for (var i = 0; i < kids.length; i++) {
                kids[i].classList.remove('wb-selected', 'wb-hover');
                if (kids[i].classList.length === 0) kids[i].removeAttribute('class');
                kids[i].removeAttribute('data-wb-editable');
            }
        }

        function parseHtmlWithCdata(html) {
            var SENT_O = '\u0001WB_CDATA_OPEN\u0001';
            var SENT_C = '\u0001WB_CDATA_CLOSE\u0001';

            var prepared = String(html)
                .replace(/<!\[CDATA\[/g, SENT_O)
                .replace(/\]\]>/g, SENT_C);

            var tmp = document.createElement('div');
            tmp.innerHTML = prepared;

            (function walk(n) {
                if (n.nodeType === 3) {
                    if (n.nodeValue && n.nodeValue.indexOf('\u0001WB_CDATA_') >= 0) {
                        n.nodeValue = n.nodeValue
                            .split(SENT_O).join('<![CDATA[')
                            .split(SENT_C).join(']]>');
                    }
                } else if (n.nodeType === 1) {
                    for (var i = 0; i < n.childNodes.length; i++) walk(n.childNodes[i]);
                }
            })(tmp);

            return tmp.firstChild || null;
        }

        var CMP_TAGS = {
            'cmpaction':    'cmpAction',
            'cmpactionvar': 'cmpActionVar',
            'cmpdataset':   'cmpDataSet',
            'cmpdatasetvar':'cmpDataSetVar'
        };

        function restoreCmpTags(root) {
            if (!root || root.nodeType !== 1) return;
            var lower = root.tagName.toLowerCase();
            if (CMP_TAGS[lower]) {
                root.setAttribute('data-wb-tag', CMP_TAGS[lower]);
            }
            var kids = root.children;
            for (var i = 0; i < kids.length; i++) restoreCmpTags(kids[i]);
        }

        /* Проверка: можно ли положить клон с описанием def внутрь node */
        function fitsParent(def, node) {
            if (!def || !def.parentOnly) return true;
            var t = node;
            while (t) {
                if (t.tagName && t.tagName.toLowerCase() === def.parentOnly) return true;
                t = t.parentNode;
            }
            return false;
        }

        var App = {
            cmd: function (action) { if (App[action]) App[action](); },

            new: function () {
                if (!confirm('Очистить холст?')) return;
                clipboard = null;
                canvas.reset();
            },

            save: function () {
                var html = canvas.cleanHtml();
                var ta = document.createElement('textarea');
                ta.className = 'wb-code-editor';
                ta.value = html;
                Modal.open({
                    title: 'Result HTML — Ctrl+A / Ctrl+C',
                    content: ta,
                    onOk: function () { try { ta.focus(); ta.select(); document.execCommand('copy'); } catch (e) {} }
                });
            },

            undo: function () { History.undo(); },
            redo: function () { History.redo(); },

            copy: function () {
                var el = canvas.getSelected();
                if (!el) return;
                if (el === canvas.getHtml() || el === canvas.getHead() || el === canvas.getBody()) return;
                clipboard = el.cloneNode(true);
            },
            cut: function () {
                var el = canvas.getSelected();
                if (!el) return;
                if (el === canvas.getHtml() || el === canvas.getHead() || el === canvas.getBody()) return;
                clipboard = el.cloneNode(true);
                el.parentNode.removeChild(el);
                EventBus.emit('canvas:changed');
            },
            paste: function () {
                var el = canvas.getSelected();
                if (!el || !clipboard) return;
                if (el === canvas.getHtml()) return;

                /* Проверка parentOnly */
                var clipDef = ComponentRegistry.match(clipboard);
                if (clipDef && clipDef.parentOnly) {
                    if (el.tagName.toLowerCase() !== clipDef.parentOnly) {
                        alert('Component ' + clipDef.caption +
                            ' can only be placed inside <' + clipDef.parentOnly + '>');
                        return;
                    }
                }

                var c = clipboard.cloneNode(true);
                cleanClone(c);

                var tagLower = el.tagName.toLowerCase();
                if (tagLower === 'head') {
                    var headTags = { meta:1, link:1, script:1, style:1, title:1, base:1, noscript:1, template:1 };
                    if (!headTags[c.tagName.toLowerCase()]) return;
                    el.appendChild(c);
                } else {
                    el.appendChild(c);
                }

                EventBus.emit('canvas:changed');
                canvas.select(c);
            },
            pasteAfter: function () {
                var el = canvas.getSelected();
                if (!el || !clipboard) return;
                if (el === canvas.getHtml() || !el.parentNode) return;

                /* Проверка parentOnly для вставки соседом */
                var clipDef = ComponentRegistry.match(clipboard);
                if (clipDef && clipDef.parentOnly) {
                    var parent = el.parentNode;
                    if (!parent || !parent.tagName ||
                        parent.tagName.toLowerCase() !== clipDef.parentOnly) {
                        alert('Component ' + clipDef.caption +
                            ' can only be placed inside <' + clipDef.parentOnly + '>');
                        return;
                    }
                }

                var c = clipboard.cloneNode(true);
                cleanClone(c);
                el.parentNode.insertBefore(c, el.nextSibling);
                EventBus.emit('canvas:changed');
                canvas.select(c);
            },
            duplicate: function () {
                var el = canvas.getSelected();
                if (!el) return;
                if (el === canvas.getHtml() || el === canvas.getHead() || el === canvas.getBody()) return;
                if (!el.parentNode) return;
                var c = el.cloneNode(true);
                cleanClone(c);
                el.parentNode.insertBefore(c, el.nextSibling);
                EventBus.emit('canvas:changed');
                canvas.select(c);
            },
            delete: function () {
                var el = canvas.getSelected();
                if (!el) return;
                if (el === canvas.getHtml()) return;
                el.parentNode.removeChild(el);
                EventBus.emit('canvas:changed');
            },

            editText: function () {
                var el = canvas.getSelected();
                if (!el) return;
                var t = prompt('Текст элемента:', el.textContent || '');
                if (t === null) return;
                el.textContent = t;
                EventBus.emit('canvas:changed');
                EventBus.emit('selection:changed', { element: el });
            },

            editHtml: function () {
                var el = canvas.getSelected();
                if (!el) return;

                var isCmp = el.hasAttribute && el.hasAttribute('data-wb-tag');

                var ta = document.createElement('textarea');
                ta.className = 'wb-code-editor';

                if (isCmp) {
                    ta.value = canvas._formatNode(el, 0).replace(/\n$/, '');
                } else {
                    var clone = el.cloneNode(true);
                    cleanClone(clone);
                    ta.value = clone.outerHTML;
                }

                Modal.open({
                    title: 'Edit HTML — ' + canvas._formatTagName(el),
                    content: ta,
                    onOk: function () {
                        try {
                            var nw = parseHtmlWithCdata(ta.value);
                            if (!nw) return;
                            cleanClone(nw);
                            restoreCmpTags(nw);
                            el.parentNode.replaceChild(nw, el);
                            EventBus.emit('canvas:changed');
                            canvas.select(nw);
                        } catch (ex) { alert('Некорректный HTML: ' + ex.message); }
                    }
                });
            },

            editInnerHtml: function () {
                var el = canvas.getSelected();
                if (!el) return;
                var ta = document.createElement('textarea');
                ta.className = 'wb-code-editor';
                ta.value = el.innerHTML;
                Modal.open({
                    title: 'Edit InnerHTML — ' + el.tagName.toLowerCase(),
                    content: ta,
                    onOk: function () {
                        el.innerHTML = ta.value;
                        EventBus.emit('canvas:changed');
                        EventBus.emit('selection:changed', { element: el });
                    }
                });
            },

            designMode: function () { canvas.toggleDesignMode(); },

            front: function () {
                var el = canvas.getSelected();
                if (el && el.parentNode) el.parentNode.appendChild(el);
            },
            back: function () {
                var el = canvas.getSelected();
                if (el && el.parentNode && el.parentNode.firstChild)
                    el.parentNode.insertBefore(el, el.parentNode.firstChild);
            }
        };

        global.App = App;
    });
})(window, jQuery);