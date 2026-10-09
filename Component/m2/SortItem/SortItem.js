/* M2 SortItem — индикатор сортировки. */
(function (global) {
    'use strict';
    var M2 = global.M2;

    M2.register({
        id: 'm2.sortitem', tagName: 'component', cmptype: 'SortItem',
        caption: 'SortItem (M2)', subCategory: 'Filters', category: 'M2',
        icon: 'images/icon.png', previewCss: ['css/preview.css'], attrs: {},

        create: function (doc) {
            var el = doc.createElement('component');
            el.setAttribute('cmptype', 'SortItem');
            el.setAttribute('name', '');
            el.setAttribute('field', '');
            el.setAttribute('refreshdataset', '');
            return el;
        },

        preview: function (el, doc) {
            var order = parseInt(el.getAttribute('sortorder'), 10) || 0;
            var wrap = doc.createElement('span');
            wrap.className = 'd3-preview d3-preview-m2-sortitem';
            var arrow = order > 0 ? '▲' : (order < 0 ? '▼' : '⇅');
            wrap.textContent = arrow;
            wrap.style.fontSize = '11px';
            wrap.style.color = order === 0 ? '#888' : '#1e88e5';
            if (el.getAttribute('field')) {
                wrap.title = 'field: ' + el.getAttribute('field');
            }
            return wrap;
        },

        properties: [
            { type: 'separator', caption: 'D3 Base' },
            { name: 'name',    caption: 'Name',    type: 'string',  attr: true },
            { name: 'enabled', caption: 'Enabled', type: 'boolean', attr: true },
            { name: 'visible', caption: 'Visible', type: 'boolean', attr: true },
            { type: 'separator', caption: 'SortItem' },
            { name: 'field',          caption: 'Field',          type: 'string', attr: true },
            { name: 'refreshdataset', caption: 'Refresh DataSet', type: 'string', attr: true },
            { name: 'sortorder',      caption: 'Sort Order',      type: 'number', attr: true },
            { name: 'constant',       caption: 'Constant',        type: 'boolean', attr: true }
        ],
        events: [], styles: []
    });

})(window);