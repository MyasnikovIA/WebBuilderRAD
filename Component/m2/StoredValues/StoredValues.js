/* M2 StoredValues — сохранённые значения параметров формы. */
(function (global) {
    'use strict';
    var M2 = global.M2;

    M2.register({
        id: 'm2.storedvalues', tagName: 'component', cmptype: 'StoredValues',
        caption: 'StoredValues (M2)', subCategory: 'Controls', category: 'M2',
        icon: 'images/icon.png', previewCss: ['css/preview.css'], attrs: {},

        create: function (doc) {
            var el = doc.createElement('component');
            el.setAttribute('cmptype', 'StoredValues');
            el.setAttribute('name', '');
            el.setAttribute('entity_name', '');
            el.setAttribute('params', '');
            return el;
        },

        preview: function (el, doc) {
            var wrap = doc.createElement('div');
            wrap.className = 'd3-preview d3-preview-m2-storedvalues';
            wrap.style.border = '1px solid #ccc';
            wrap.style.borderRadius = '3px';
            wrap.style.padding = '6px';
            wrap.style.background = '#f9f9f9';
            var head = doc.createElement('div');
            head.textContent = '▾ Сохраненные значения';
            head.style.fontWeight = 'bold';
            head.style.marginBottom = '4px';
            wrap.appendChild(head);
            var row = doc.createElement('div');
            row.innerHTML =
                '<select disabled style="width:60%"><option>(выбрать)</option></select> ' +
                '<label style="margin-left:6px"><input type="checkbox" disabled>По-умолчанию</label>';
            wrap.appendChild(row);
            var btns = doc.createElement('div');
            btns.style.marginTop = '4px';
            btns.innerHTML = '<button disabled>Сохранить</button> <button disabled>✕</button>';
            wrap.appendChild(btns);
            return wrap;
        },

        properties: [
            { type: 'separator', caption: 'D3 Base' },
            { name: 'name',    caption: 'Name',    type: 'string',  attr: true },
            { name: 'enabled', caption: 'Enabled', type: 'boolean', attr: true },
            { name: 'visible', caption: 'Visible', type: 'boolean', attr: true },
            { name: 'width',   caption: 'Width',   type: 'string',  attr: true },
            { type: 'separator', caption: 'StoredValues' },
            { name: 'entity_name', caption: 'Entity Name', type: 'string', attr: true },
            { name: 'params',      caption: 'Params',      type: 'string', attr: true }
        ],
        events: [], styles: []
    });

})(window);