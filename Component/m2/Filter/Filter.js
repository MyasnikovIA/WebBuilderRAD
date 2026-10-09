/* M2 Filter — контейнер фильтра. */
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
    function setJson(el, v) {
        var kids = el.childNodes;
        for (var i = kids.length - 1; i >= 0; i--) {
            if (kids[i].nodeType === 3) el.removeChild(kids[i]);
        }
        el.insertBefore(el.ownerDocument.createTextNode(v == null ? '' : String(v)), el.firstChild);
    }

    M2.register({
        id: 'm2.filter', tagName: 'component', cmptype: 'Filter',
        caption: 'Filter (M2)', subCategory: 'Filters', category: 'M2',
        icon: 'images/icon.png', previewCss: ['css/preview.css'], attrs: {},

        create: function (doc) {
            var el = doc.createElement('component');
            el.setAttribute('cmptype', 'Filter');
            el.setAttribute('name', '');
            el.setAttribute('dataset', '');
            return el;
        },
        preview: null,

        properties: [
            { type: 'separator', caption: 'D3 Base' },
            { name: 'name',    caption: 'Name',    type: 'string',  attr: true },
            { name: 'enabled', caption: 'Enabled', type: 'boolean', attr: true },
            { name: 'visible', caption: 'Visible', type: 'boolean', attr: true },
            { name: 'width',   caption: 'Width',   type: 'string',  attr: true },
            { type: 'separator', caption: 'Filter' },
            { name: 'dataset', caption: 'DataSet', type: 'string', attr: true },
            { name: 'jsonoptions', caption: 'JSON Options', type: 'code',
                get: getJson, set: setJson }
        ],
        events: [], styles: []
    });

})(window);