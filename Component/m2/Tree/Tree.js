/* M2 Tree — <component cmptype="Tree">. */
(function (global) {
    'use strict';
    var M2 = global.M2;
    var CS = global.CommonSchema;

    M2.register({
        id: 'm2.tree',
        tagName: 'component',
        cmptype: 'Tree',
        caption: 'Tree (M2)',
        subCategory: 'Grids',
        category: 'M2',
        icon: 'images/icon.png',
        previewCss: ['css/preview.css'],
        attrs: {},

        create: function (doc) {
            var el = doc.createElement('component');
            el.setAttribute('cmptype', 'Tree');
            el.setAttribute('name', '');
            el.setAttribute('caption', 'Tree');
            return el;
        },

        preview: function (el, doc) {
            var wrap = doc.createElement('div');
            wrap.className = 'd3-preview d3-preview-m2-tree';
            var cap = doc.createElement('div');
            cap.textContent = el.getAttribute('caption') || 'Tree';
            cap.style.fontWeight = 'bold';
            cap.style.background = '#eee';
            cap.style.padding = '4px';
            wrap.appendChild(cap);
            ['▾ Root', '  • Child 1', '  ▸ Child 2', '▸ Other root'].forEach(function (line) {
                var div = doc.createElement('div');
                div.textContent = line;
                div.style.padding = '2px 6px';
                div.style.fontFamily = 'Consolas, monospace';
                div.style.fontSize = '11px';
                wrap.appendChild(div);
            });
            return wrap;
        },

        properties: [
            { type: 'separator', caption: 'HTML attributes' },
            { name: 'id',    caption: 'Id',    type: 'string', attr: true },
            { name: 'class', caption: 'Class', type: 'string', attr: true },
            { name: 'style', caption: 'Style', type: 'string', attr: true },

            { type: 'separator', caption: 'D3 Base' },
            { name: 'name',    caption: 'Name',    type: 'string',  attr: true },
            { name: 'caption', caption: 'Caption', type: 'string',  attr: true },
            { name: 'enabled', caption: 'Enabled', type: 'boolean', attr: true },
            { name: 'visible', caption: 'Visible', type: 'boolean', attr: true },
            { name: 'hint',    caption: 'Hint',    type: 'string',  attr: true },
            { name: 'width',   caption: 'Width',   type: 'string',  attr: true },
            { name: 'height',  caption: 'Height',  type: 'string',  attr: true },

            { type: 'separator', caption: 'Tree' },
            { name: 'dataset',     caption: 'DataSet',     type: 'string', attr: true },
            { name: 'keyfield',    caption: 'KeyField',    type: 'string', attr: true },
            { name: 'parentfield', caption: 'ParentField', type: 'string', attr: true },
            { name: 'childsfield', caption: 'ChildsField', type: 'string', attr: true }
        ],

        events: CS.EVENT_FIELDS.slice(),
        styles: CS.STYLE_FIELDS.slice()
    });

})(window);