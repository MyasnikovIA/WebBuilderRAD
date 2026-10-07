/* cmpButton — кнопка. */
(function (global) {
    'use strict';
    var D3 = global.D3;

    D3.register({
        id: 'd3.button', tagName: 'cmpButton', caption: 'Button',
        attrs: { caption: 'Button' },
        preview: function (el, doc) {
            var b = doc.createElement('button');
            b.type = 'button';
            b.className = 'd3-preview d3-preview-button';
            b.textContent = el.getAttribute('caption') || '';
            return b;
        },
        properties: [
            { name: 'name',       caption: 'Name',        type: 'string', attr: true },
            { name: 'caption',    caption: 'Caption',     type: 'string', attr: true },
            { name: 'onclick',    caption: 'OnClick',     type: 'string', attr: true },
            { name: 'popupmenu',  caption: 'PopupMenu',   type: 'string', attr: true },
            { name: 'icon',       caption: 'Icon',        type: 'string', attr: true },
            { name: 'background', caption: 'Background',  type: 'string', attr: true },
            { name: 'type',       caption: 'Type',        type: 'string', attr: true }
        ]
    });

})(window);