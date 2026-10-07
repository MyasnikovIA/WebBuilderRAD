/* cmpButton — кнопка.
   Превью использует картинки из папки images/:
     images/icon.png          — иконка палитры
     images/preview.png       — опциональная подложка превью
   Дополнительно может нести служебный узел <wb-images> с пользовательскими
   картинками (см. core.js / imagesProp в будущих модулях). */
(function (global) {
    'use strict';
    var D3 = global.D3;

    D3.register({
        id: 'd3.button', tagName: 'cmpButton', caption: 'Button',
        icon: 'images/icon.png',
        attrs: { caption: 'Button' },

        preview: function (el, doc) {
            var b = doc.createElement('button');
            b.type = 'button';

            var cls = 'd3-preview d3-preview-button';
            var type = el.getAttribute('type');
            if (type === 'primary') cls += ' d3-preview-button-primary';
            if (type === 'micro')   cls += ' d3-preview-button-micro';
            if (el.getAttribute('enabled') === 'false') cls += ' d3-preview-button-disabled';
            b.className = cls;

            var src = el.getAttribute('icon') || '';
            if (src) {
                var img = doc.createElement('img');
                img.src = src;
                img.alt = '';
                img.className = 'd3-preview-button-icon';
                b.appendChild(img);
            }

            if (el.getAttribute('onlyicon') !== 'true') {
                var span = doc.createElement('span');
                span.className = 'd3-preview-button-caption';
                span.textContent = el.getAttribute('caption') || '';
                b.appendChild(span);
            }
            return b;
        },

        properties: [
            { name: 'name',        caption: 'Name',        type: 'string',  attr: true },
            { name: 'caption',     caption: 'Caption',     type: 'string',  attr: true },
            { name: 'type',        caption: 'Type',        type: 'enum',    attr: true,
                values: ['', 'primary', 'micro'] },
            { name: 'width',       caption: 'Width',       type: 'string',  attr: true },
            { name: 'height',      caption: 'Height',      type: 'string',  attr: true },
            { name: 'icon',        caption: 'Icon',        type: 'string',  attr: true },
            { name: 'background',  caption: 'Background',  type: 'string',  attr: true },
            { name: 'popupmenu',   caption: 'PopupMenu',   type: 'string',  attr: true },
            { name: 'onlyicon',    caption: 'OnlyIcon',    type: 'boolean', attr: true },
            { name: 'nominwidth',  caption: 'NoMinWidth',  type: 'boolean', attr: true },
            { name: 'enabled',     caption: 'Enabled',     type: 'boolean', attr: true },
            { name: 'visible',     caption: 'Visible',     type: 'boolean', attr: true },
            { name: 'hint',        caption: 'Hint',        type: 'string',  attr: true },
            { name: 'onclick',     caption: 'OnClick',     type: 'string',  attr: true },
            { name: 'ondblclick',  caption: 'OnDblClick',  type: 'string',  attr: true },
            { name: 'onmousedown', caption: 'OnMouseDown', type: 'string',  attr: true },
            { name: 'onmouseup',   caption: 'OnMouseUp',   type: 'string',  attr: true },
            { name: 'onkeydown',   caption: 'OnKeyDown',   type: 'string',  attr: true },
            { name: 'onkeyup',     caption: 'OnKeyUp',     type: 'string',  attr: true },
            { name: 'onkeypress',  caption: 'OnKeyPress',  type: 'string',  attr: true },
            { name: 'onfocus',     caption: 'OnFocus',     type: 'string',  attr: true },
            { name: 'onblur',      caption: 'OnBlur',      type: 'string',  attr: true }
        ]
    });

})(window);