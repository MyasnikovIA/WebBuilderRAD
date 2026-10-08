/* FormJSON — конвертация формы в JSON-структуру и обратно.

   JSON-формат (версия 1):

   {
     "version": 1,
     "root": {
       "tag": "cmpForm",
       "attrs": { "caption": "Alert's Example", "class": "d3form formBackground" },
       "children": [
         { "comment": "Примеры вызова окна предупреждения" },
         { "tag": "cmpScript", "attrs": {}, "cdata": "\nForm.onCreate = function() { … };\n" },
         { "tag": "cmpButton", "attrs": { "caption": "Show Alert 1", "onclick": "Form.showAlert1();" } },
         { "tag": "cmpButton", "attrs": { "caption": "Show Alert 2" } },
         { "tag": "span", "attrs": {}, "children": [
             { "text": "Hello" }
         ]}
       ]
     }
   }

   Узлы:
     { tag, attrs?, children?, cdata? }   — элемент;
     { text: "..." }                       — текстовый узел;
     { comment: "..." }                    — HTML-комментарий.

   Служебные атрибуты (data-wb-*, data-cmptype, cmptype) в JSON не попадают.
   Служебные узлы (data-wb-preview, data-wb-ide, data-wb-comp-asset) в JSON не попадают.
   Служебные классы (wb-selected, wb-hover, wb-moving) из class вычищаются.

   CDATA-контейнеры (cmpScript, cmpAction, cmpDataSet, cmpSubAction,
   cmpServerScript, cmpRepeaterStyler, cmpStatGridColumnHeader) хранятся
   в поле cdata.

   При десериализации:
     - {comment:"…"} → <cmpcomment data-wb-tag="cmpComment">…</cmpcomment>;
     - {text:"…"}    → текстовый узел;
     - {cdata:"…"}   → текстовый узел "<![CDATA[…]]>";
     - {tag:"…"}     → элемент с восстановленным data-wb-tag. */
(function (global, $) {
    'use strict';

    /* Атрибуты, которые НЕ сохраняются в JSON — это служебные маркеры IDE. */
    var SERVICE_ATTRS = {
        'data-wb-tag':        1,
        'data-cmptype':       1,
        'data-wb-preview':    1,
        'data-wb-ide':        1,
        'data-wb-root':       1,
        'data-wb-comp-asset': 1,
        'data-wb-editable':   1,
        'cmptype':            1
    };

    /* Теги, содержимое которых хранится как CDATA (SQL / JS / JSON). */
    var CDATA_CONTAINERS = {
        cmpaction:                 1,
        cmpdataset:                1,
        cmpscript:                 1,
        cmpsubaction:              1,
        cmprepeaterstyler:         1,
        cmpserverscript:           1,
        cmpstatgridcolumnheader:   1
    };

    /* Служебные классы IDE — вычищаем из class при сериализации. */
    var SERVICE_CLASSES = { 'wb-selected': 1, 'wb-hover': 1, 'wb-moving': 1 };

    var FormJSON = {};

    /* ============================================================
       Сериализация canvas → объект
       ============================================================ */

    FormJSON.toObject = function (canvas) {
        if (!canvas) return null;
        var html = canvas.getHtml();
        if (!html) return null;

        var root = (canvas.getRootContainer && canvas.getRootContainer()) || canvas.getBody();
        if (!root) return null;

        var node = FormJSON._serializeEl(root, canvas);
        if (!node) return null;

        return {
            version: 1,
            root: node
        };
    };

    FormJSON._serializeEl = function (el, canvas) {
        if (!el || el.nodeType !== 1) return null;

        var tag = canvas._formatTagName ? canvas._formatTagName(el)
            : el.tagName.toLowerCase();
        var tagLower = el.tagName.toLowerCase();

        /* Комментарий — компактный узел. */
        if (tag === 'cmpComment' || tagLower === 'cmpcomment') {
            return { comment: el.textContent || '' };
        }

        var node = { tag: tag };

        /* Атрибуты. */
        var attrs = {};
        var a = el.attributes;
        for (var i = 0; i < a.length; i++) {
            var name = a[i].name;
            if (SERVICE_ATTRS[name]) continue;

            var val = a[i].value == null ? '' : String(a[i].value);

            if (name === 'class') {
                var parts = val.split(/\s+/).filter(function (c) {
                    return c && !SERVICE_CLASSES[c];
                });
                if (parts.length === 0) continue;
                attrs[name] = parts.join(' ');
            } else {
                attrs[name] = val;
            }
        }
        for (var k in attrs) {
            if (attrs.hasOwnProperty(k)) { node.attrs = attrs; break; }
        }

        /* CDATA-контейнеры: сохраняем тело CDATA. */
        if (CDATA_CONTAINERS[tagLower]) {
            var raw = el.textContent || '';
            var cm = raw.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
            node.cdata = cm ? cm[1] : raw;
            return node;
        }

        /* Дети. */
        var children = [];
        for (var j = 0; j < el.childNodes.length; j++) {
            var c = el.childNodes[j];

            if (c.nodeType === 1) {
                if (c.getAttribute && c.getAttribute('data-wb-preview') === '1') continue;
                if (c.getAttribute && c.getAttribute('data-wb-ide') === '1') continue;
                if (c.getAttribute && c.getAttribute('data-wb-comp-asset') === '1') continue;
                if (c.tagName && c.tagName.toLowerCase() === 'wb-cdata') continue;

                var childNode = FormJSON._serializeEl(c, canvas);
                if (childNode) children.push(childNode);

            } else if (c.nodeType === 3) {
                var t = c.nodeValue || '';
                if (t.trim() === '') continue;
                if (/<!\[CDATA\[/.test(t)) continue;
                children.push({ text: t.replace(/\s+/g, ' ').trim() });

            } else if (c.nodeType === 8) {
                children.push({ comment: c.nodeValue || '' });
            }
        }
        if (children.length) node.children = children;

        return node;
    };

    /* ============================================================
       Десериализация объект → DOM-элемент
       ============================================================ */

    FormJSON._deserializeEl = function (node, doc, CMP_TAGS) {
        if (!node) return null;

        /* Комментарий. */
        if (node.comment != null) {
            var c = doc.createElement('cmpcomment');
            c.setAttribute('data-wb-tag', 'cmpComment');
            c.textContent = String(node.comment);
            return c;
        }

        /* Текстовый узел. */
        if (node.text != null) {
            return doc.createTextNode(String(node.text));
        }

        if (!node.tag) return null;

        var tagRaw = String(node.tag);
        var tagLower = tagRaw.toLowerCase();
        var el = doc.createElement(tagLower);

        /* Восстанавливаем data-wb-tag. */
        var wbTag = tagRaw;
        if (CMP_TAGS && CMP_TAGS[tagLower]) wbTag = CMP_TAGS[tagLower];
        el.setAttribute('data-wb-tag', wbTag);

        /* Атрибуты. */
        if (node.attrs) {
            for (var k in node.attrs) {
                if (!node.attrs.hasOwnProperty(k)) continue;
                if (SERVICE_ATTRS[k]) continue;
                el.setAttribute(k, node.attrs[k]);
            }
        }

        /* CDATA. */
        if (node.cdata != null) {
            el.appendChild(doc.createTextNode('<![CDATA[' + node.cdata + ']]>'));
            return el;
        }

        /* Дети. */
        if (node.children && node.children.length) {
            for (var i = 0; i < node.children.length; i++) {
                var ch = FormJSON._deserializeEl(node.children[i], doc, CMP_TAGS);
                if (ch) el.appendChild(ch);
            }
        }

        return el;
    };

    /* Преобразовать JSON-объект в строку HTML, пригодную для canvas.loadHtml. */
    FormJSON.toHtml = function (data, canvas) {
        if (!data || !data.root) return '';
        if (typeof data.version === 'number' && data.version !== 1) {
            throw new Error('Unsupported version: ' + data.version);
        }

        var doc;
        try {
            doc = document.implementation.createHTMLDocument('');
        } catch (e) {
            doc = document;
        }

        var CMP_TAGS = (canvas && canvas.CMP_TAGS) || null;
        var el = FormJSON._deserializeEl(data.root, doc, CMP_TAGS);
        if (!el) return '';

        /* Если есть canvas._formatNode — используем его сериализацию
           (умеет CDATA, camelCase, самоуплотнение тегов). */
        if (canvas && canvas._formatNode) {
            var clone = el.cloneNode(true);
            return String(canvas._formatNode(clone, 0)).replace(/\n$/, '');
        }

        /* Fallback. */
        var tmp = doc.createElement('div');
        tmp.appendChild(el);
        return tmp.innerHTML;
    };

    /* ============================================================
       Команды: сохранить / загрузить JSON через модальные окна.
       ============================================================ */

    /* Сохранить форму: открыть модальное окно с JSON-текстом (Ctrl+A / Ctrl+C). */
    FormJSON.save = function (canvas) {
        if (!canvas) return;

        var data = FormJSON.toObject(canvas);
        if (!data) { alert('Нечего сохранять.'); return; }

        var json;
        try {
            json = JSON.stringify(data, null, 2);
        } catch (ex) {
            alert('Ошибка сериализации JSON: ' + ex.message);
            return;
        }

        var ta = document.createElement('textarea');
        ta.className = 'wb-code-editor';
        ta.value = json;
        ta.style.width = '100%';
        ta.style.height = '100%';
        ta.style.boxSizing = 'border-box';

        global.Modal.open({
            title: 'Form JSON — Ctrl+A / Ctrl+C',
            content: ta,
            onOk: function () {
                try { ta.focus(); ta.select(); document.execCommand('copy'); } catch (e) {}
            }
        });
    };

    /* Загрузить форму из JSON: открыть редактор, распарсить, применить к canvas. */
    FormJSON.load = function (canvas) {
        if (!canvas) return;

        var editor = new global.CodeEditor({ value: '', language: 'json' });

        global.Modal.open({
            title: 'Load Form JSON — вставьте JSON и нажмите OK',
            content: editor.el,
            onOk: function () {
                var text = editor.getValue();
                if (!text || !text.replace(/\s+/g, '')) {
                    alert('Пустой JSON.');
                    return;
                }

                var data;
                try {
                    data = JSON.parse(text);
                } catch (ex) {
                    alert('Некорректный JSON: ' + ex.message);
                    return;
                }

                var html;
                try {
                    html = FormJSON.toHtml(data, canvas);
                } catch (ex) {
                    alert('Ошибка сборки HTML: ' + ex.message);
                    return;
                }

                if (!html || !html.replace(/\s+/g, '')) {
                    alert('Пустой результат.');
                    return;
                }

                try {
                    canvas.loadHtml(html);
                } catch (ex) {
                    alert('Ошибка загрузки в canvas: ' + ex.message);
                }
            }
        });

        setTimeout(function () { editor.focus(); }, 50);
    };

    global.FormJSON = FormJSON;
})(window, jQuery);