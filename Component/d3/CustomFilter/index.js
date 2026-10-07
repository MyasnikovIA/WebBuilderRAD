/* cmpCustomFilter — полоса фильтров (горизонтальная / вертикальная).

   Серверный контрол: CustomFilterCtrl.inc (class CustomFilter).
   Клиентский контрол: CustomFilter.js (D3Api.CustomFilterCtrl).

   Серверный код выводит:
     <div class="ctrl_CustomFilter">
       <ul><li repeat="0" repeatername="repeater_<name>" ...></li></ul>
       <textarea style="display:none">JSON</textarea>
     </div>

   JSON внутри textarea:
     { dataset: 'dsName', mode: 'horizontal'|'vertical',
       items: [ { caption, fields: [{field, value}], style } ] }

   В IDE: содержимое JSON хранится как прямой текст элемента (без обёртки),
   а превью строит <ul><li> по этому JSON. При сохранении IDE отдаёт
   атрибуты + JSON текстом — ровно то, что серверный SetInnerText ждёт. */
(function (global) {
    'use strict';
    var D3 = global.D3;
    var CS = global.CommonSchema;

    /* ---------- JSON в тексте элемента ---------- */

    function getJson(el) {
        var out = '';
        var kids = el.childNodes;
        for (var i = 0; i < kids.length; i++) {
            if (kids[i].nodeType === 3) out += kids[i].nodeValue;
        }
        return out;
    }

    function setJson(el, text) {
        var kids = el.childNodes;
        for (var i = kids.length - 1; i >= 0; i--) {
            if (kids[i].nodeType === 3) el.removeChild(kids[i]);
        }
        el.insertBefore(el.ownerDocument.createTextNode(text == null ? '' : String(text)), el.firstChild);
    }

    function parseJson(el) {
        var raw = getJson(el) || '';
        try { return JSON.parse(raw); } catch (e) { return null; }
    }

    /* ---------- Регистрация ---------- */

    D3.register({
        id: 'd3.customfilter', tagName: 'cmpCustomFilter', caption: 'CustomFilter',
        icon: 'images/icon.png',
        previewCss: ['css/preview.css'],
        attrs: { name: '', dataset: '' },

        create: function (doc) {
            var el = doc.createElement('cmpcustomfilter');
            el.setAttribute('data-wb-tag', 'cmpCustomFilter');
            el.setAttribute('name', 'cf' + Date.now().toString(36));
            el.setAttribute('dataset', '');

            /* Дефолтный JSON — как у _getDefaultParams() в CustomFilter.js */
            var defaults = { dataset: '', mode: 'horizontal', items: [] };
            el.appendChild(doc.createTextNode(JSON.stringify(defaults)));
            return el;
        },

        preview: function (el, doc) {
            var wrap = doc.createElement('div');
            wrap.className = 'd3-preview d3-preview-customfilter';

            var data = parseJson(el) || { mode: 'horizontal', items: [] };
            var mode = data.mode === 'vertical' ? 'vertical' : 'horizontal';
            wrap.classList.add(mode);

            var ul = doc.createElement('ul');
            var items = data.items || [];

            if (items.length === 0) {
                var empty = doc.createElement('li');
                empty.textContent = '(no items)';
                empty.style.color = '#999';
                empty.style.fontStyle = 'italic';
                empty.style.cursor = 'default';
                ul.appendChild(empty);
            } else {
                for (var i = 0; i < items.length; i++) {
                    var it = items[i] || {};
                    var li = doc.createElement('li');
                    li.textContent = it.caption || it.name || ('Item ' + (i + 1));
                    if (it.style) li.style.cssText = it.style;
                    ul.appendChild(li);
                }
            }
            wrap.appendChild(ul);
            return wrap;
        },

        /* ---------------- Properties ---------------- */
        properties: [
            /* --- HTML --- */
            { type: 'separator', caption: 'HTML attributes' },
            { name: 'id',    caption: 'Id',    type: 'string', attr: true },
            { name: 'class', caption: 'Class', type: 'string', attr: true },
            { name: 'style', caption: 'Style', type: 'string', attr: true },

            /* --- D3 Base --- */
            { type: 'separator', caption: 'D3 Base' },
            { name: 'name',    caption: 'Name',    type: 'string', attr: true },
            { name: 'dataset', caption: 'DataSet', type: 'string', attr: true },

            /* --- CustomFilter (JSON-содержимое) --- */
            { type: 'separator', caption: 'CustomFilter' },
            {
                name: 'text',
                caption: 'JSON (dataset, mode, items)',
                type: 'code',
                get: function (el) { return getJson(el); },
                set: function (el, v) { setJson(el, v); }
            }
        ],

        /* ---------------- Events ---------------- */
        events: [
            { name: 'onclick', caption: 'OnClick', type: 'code' }
        ],

        /* ---------------- Styles ---------------- */
        styles: CS.STYLE_FIELDS.slice()
    });

})(window);