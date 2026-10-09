/* M2 InfoBox — <component cmptype="InfoBox">. */
(function (global) {
    'use strict';
    var M2 = global.M2;
    var CS = global.CommonSchema;

    function parseModifier(cls) {
        if (!cls) return '';
        var parts = String(cls).split(/\s+/);
        if (parts.indexOf('error') >= 0) return 'error';
        if (parts.indexOf('success') >= 0) return 'success';
        if (parts.indexOf('warning') >= 0) return 'warning';
        return '';
    }

    M2.register({
        id: 'm2.infobox',
        tagName: 'component',
        cmptype: 'InfoBox',
        caption: 'InfoBox (M2)',
        subCategory: 'Display',
        category: 'M2',
        icon: 'images/icon.png',
        previewCss: ['css/preview.css'],
        attrs: {},

        create: function (doc) {
            var el = doc.createElement('component');
            el.setAttribute('cmptype', 'InfoBox');
            el.setAttribute('caption', 'Информационное сообщение');
            return el;
        },

        preview: function (el, doc) {
            var mod = parseModifier(el.getAttribute('class'));
            var wrap = doc.createElement('div');
            wrap.className = 'd3-preview d3-preview-m2-infobox';
            wrap.style.display = 'flex';
            wrap.style.alignItems = 'center';
            wrap.style.gap = '8px';
            wrap.style.padding = '8px 12px';
            wrap.style.borderRadius = '4px';
            wrap.style.border = '1px solid #90caf9';
            wrap.style.background = '#e3f2fd';
            wrap.style.color = '#0d47a1';
            if (mod === 'error')   { wrap.style.background = '#ffebee'; wrap.style.borderColor = '#ef9a9a'; wrap.style.color = '#b71c1c'; }
            if (mod === 'success') { wrap.style.background = '#e8f5e9'; wrap.style.borderColor = '#a5d6a7'; wrap.style.color = '#1b5e20'; }
            if (mod === 'warning') { wrap.style.background = '#fffde7'; wrap.style.borderColor = '#fff59d'; wrap.style.color = '#f57f17'; }
            var ic = doc.createElement('span');
            ic.textContent = 'i';
            ic.style.fontWeight = 'bold';
            ic.style.fontSize = '14px';
            wrap.appendChild(ic);
            var tx = doc.createElement('span');
            tx.textContent = el.getAttribute('caption') || '(empty)';
            wrap.appendChild(tx);
            return wrap;
        },

        properties: [
            { type: 'separator', caption: 'HTML attributes' },
            { name: 'id',    caption: 'Id',    type: 'string', attr: true },
            { name: 'class', caption: 'Class (error | success | warning)', type: 'string', attr: true },
            { name: 'style', caption: 'Style', type: 'string', attr: true },

            { type: 'separator', caption: 'D3 Base' },
            { name: 'name',    caption: 'Name',    type: 'string',  attr: true },
            { name: 'enabled', caption: 'Enabled', type: 'boolean', attr: true },
            { name: 'visible', caption: 'Visible', type: 'boolean', attr: true },
            { name: 'hint',    caption: 'Hint',    type: 'string',  attr: true },
            { name: 'width',   caption: 'Width',   type: 'string',  attr: true },

            { type: 'separator', caption: 'InfoBox' },
            { name: 'caption', caption: 'Caption', type: 'string', attr: true }
        ],

        events: CS.EVENT_FIELDS.slice(),
        styles: CS.STYLE_FIELDS.slice()
    });

})(window);