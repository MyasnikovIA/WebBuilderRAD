/* M2 CustomFilter — полоса фильтров. */
(function (global) {
    'use strict';
    var M2 = global.M2;

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

    M2.register({
        id: 'm2.customfilter', tagName: 'component', cmptype: 'CustomFilter',
        caption: 'CustomFilter (M2)', subCategory: 'Filters', category: 'M2',
        icon: 'images/icon.png', previewCss: ['css/preview.css'], attrs: {},

        create: function (doc) {
            var el = doc.createElement('component');
            el.setAttribute('cmptype', 'CustomFilter');
            el.setAttribute('name', 'cf' + Date.now().toString(36));
            el.setAttribute('dataset', '');
            el.appendChild(doc.createTextNode(
                JSON.stringify({ dataset: '', mode: 'horizontal', items: [] })
            ));
            return el;
        },

        preview: function (el, doc) {
            var wrap = doc.createElement('div');
            wrap.className = 'd3-preview d3-preview-m2-customfilter';
            var raw = getJson(el) || '';
            var data;
            try { data = JSON.parse(raw); } catch (e) { data = { items: [] }; }
            var items = (data && data.items) || [];
            var ul = doc.createElement('ul');
            ul.style.listStyle = 'none';
            ul.style.padding = '0';
            ul.style.margin = '0';
            if (items.length === 0) {
                var li = doc.createElement('li');
                li.textContent = '(no items)';
                li.style.color = '#999';
                li.style.fontStyle = 'italic';
                ul.appendChild(li);
            } else {
                for (var i = 0; i < items.length; i++) {
                    var it = items[i] || {};
                    var li2 = doc.createElement('li');
                    li2.textContent = it.caption || it.name || ('Item ' + (i + 1));
                    li2.style.display = 'inline-block';
                    li2.style.padding = '2px 6px';
                    li2.style.margin = '1px';
                    li2.style.background = '#eceff1';
                    li2.style.borderRadius = '3px';
                    ul.appendChild(li2);
                }
            }
            wrap.appendChild(ul);
            return wrap;
        },

        properties: [
            { type: 'separator', caption: 'D3 Base' },
            { name: 'name',    caption: 'Name',    type: 'string', attr: true },
            { name: 'dataset', caption: 'DataSet', type: 'string', attr: true },
            { type: 'separator', caption: 'CustomFilter' },
            { name: 'text', caption: 'JSON', type: 'code',
                get: getJson, set: setJson }
        ],
        events: [], styles: []
    });

})(window);