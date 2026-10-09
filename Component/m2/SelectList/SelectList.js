/* M2 SelectList — мастер-чекбокс. */
(function (global) {
    'use strict';
    var M2 = global.M2;

    M2.register({
        id: 'm2.selectlist', tagName: 'component', cmptype: 'SelectList',
        caption: 'SelectList (M2)', subCategory: 'Controls', category: 'M2',
        icon: 'images/icon.png', previewCss: ['css/preview.css'], attrs: {},

        create: function (doc) {
            var el = doc.createElement('component');
            el.setAttribute('cmptype', 'SelectList');
            el.setAttribute('name', '');
            el.setAttribute('dataset', '');
            el.setAttribute('state', '0');
            return el;
        },

        preview: function (el, doc) {
            var wrap = doc.createElement('span');
            wrap.className = 'd3-preview d3-preview-m2-selectlist';
            var st = parseInt(el.getAttribute('state'), 10) || 0;
            var inp = doc.createElement('input');
            inp.type = 'checkbox';
            inp.disabled = true;
            inp.checked = (st === 2);
            inp.indeterminate = (st === 1);
            wrap.appendChild(inp);
            return wrap;
        },

        properties: [
            { type: 'separator', caption: 'D3 Base' },
            { name: 'name',    caption: 'Name',    type: 'string',  attr: true },
            { name: 'enabled', caption: 'Enabled', type: 'boolean', attr: true },
            { name: 'visible', caption: 'Visible', type: 'boolean', attr: true },
            { type: 'separator', caption: 'SelectList' },
            { name: 'dataset',       caption: 'DataSet',        type: 'string',  attr: true },
            { name: 'fields',        caption: 'Fields (value,caption)', type: 'string', attr: true },
            { name: 'type',          caption: 'Type',           type: 'enum',    attr: true,
                values: ['', 'tree'] },
            { name: 'select_childs', caption: 'Select Childs',  type: 'boolean', attr: true },
            { name: 'usedom',        caption: 'Use DOM',        type: 'boolean', attr: true },
            { name: 'state',         caption: 'State (0/1/2)',  type: 'number',  attr: true }
        ],
        events: [], styles: []
    });

})(window);