/* M2 PageControl — <component cmptype="PageControl">. Контейнер закладок. */
(function (global) {
    'use strict';
    var M2 = global.M2;
    var CS = global.CommonSchema;

    M2.register({
        id: 'm2.pagecontrol',
        tagName: 'component',
        cmptype: 'PageControl',
        caption: 'PageControl (M2)',
        subCategory: 'Containers',
        category: 'M2',
        icon: 'images/icon.png',
        previewCss: ['css/preview.css'],
        attrs: {},

        create: function (doc) {
            var el = doc.createElement('component');
            el.setAttribute('cmptype', 'PageControl');
            el.setAttribute('name', '');
            return el;
        },

        preview: function (el, doc) {
            var wrap = doc.createElement('div');
            wrap.className = 'd3-preview d3-preview-m2-pagecontrol';
            wrap.style.border = '1px solid #ccc';
            wrap.style.padding = '4px';
            var tabs = doc.createElement('div');
            tabs.style.display = 'flex';
            tabs.style.gap = '2px';
            ['Tab1', 'Tab2'].forEach(function (t, i) {
                var s = doc.createElement('span');
                s.textContent = t;
                s.style.padding = '2px 8px';
                s.style.border = '1px solid #ccc';
                s.style.background = (i === 0) ? '#fff' : '#e0e0e0';
                s.style.borderBottom = (i === 0) ? '1px solid #fff' : '1px solid #ccc';
                tabs.appendChild(s);
            });
            wrap.appendChild(tabs);
            var body = doc.createElement('div');
            body.textContent = '(page content)';
            body.style.color = '#999';
            body.style.padding = '6px';
            wrap.appendChild(body);
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
            { name: 'height',  caption: 'Height',  type: 'string',  attr: true }
        ],

        events: CS.EVENT_FIELDS.slice(),
        styles: CS.STYLE_FIELDS.slice()
    });

})(window);