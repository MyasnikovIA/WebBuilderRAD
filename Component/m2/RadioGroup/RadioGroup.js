/* M2 RadioGroup — <component cmptype="RadioGroup">. */
(function (global) {
    'use strict';
    var M2 = global.M2;
    var CS = global.CommonSchema;

    M2.register({
        id: 'm2.radiogroup',
        tagName: 'component',
        cmptype: 'RadioGroup',
        caption: 'RadioGroup (M2)',
        subCategory: 'Controls',
        category: 'M2',
        icon: 'images/icon.png',
        previewCss: ['css/preview.css'],
        attrs: {},

        create: function (doc) {
            var el = doc.createElement('component');
            el.setAttribute('cmptype', 'RadioGroup');
            el.setAttribute('name', '');
            el.setAttribute('mode', 'vertical');
            return el;
        },

        preview: function (el, doc) {
            var wrap = doc.createElement('div');
            wrap.className = 'd3-preview d3-preview-m2-radiogroup';
            var mode = el.getAttribute('mode') === 'gorizontal' ? 'gorizontal' : 'vertical';
            if (mode === 'gorizontal') wrap.style.display = 'flex';
            ['A', 'B', 'C'].forEach(function (cap, i) {
                var lbl = doc.createElement('label');
                if (mode === 'gorizontal') lbl.style.marginRight = '8px';
                else lbl.style.display = 'block';
                var inp = doc.createElement('input');
                inp.type = 'radio';
                inp.disabled = true;
                inp.name = 'preview_' + (el.getAttribute('name') || 'rg');
                inp.checked = (i === 0);
                lbl.appendChild(inp);
                var s = doc.createElement('span');
                s.textContent = cap;
                lbl.appendChild(s);
                wrap.appendChild(lbl);
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
            { name: 'enabled', caption: 'Enabled', type: 'boolean', attr: true },
            { name: 'visible', caption: 'Visible', type: 'boolean', attr: true },
            { name: 'hint',    caption: 'Hint',    type: 'string',  attr: true },
            { name: 'width',   caption: 'Width',   type: 'string',  attr: true },

            { type: 'separator', caption: 'RadioGroup' },
            { name: 'value',    caption: 'Value',    type: 'string',  attr: true },
            { name: 'mode',     caption: 'Mode',     type: 'enum',    attr: true,
                values: ['vertical', 'gorizontal'] },
            { name: 'readonly', caption: 'ReadOnly', type: 'boolean', attr: true }
        ],

        events: CS.EVENT_FIELDS.slice(),
        styles: CS.STYLE_FIELDS.slice()
    });

})(window);