/* cmpImage — изображение.

   Серверный контрол: ImageCtrl.inc (class Image).
   Клиентский контрол: Image.js (D3Api.ImageCtrl).

   Серверный Show():
     <img class="D3Image" …attrs… tabindex="…" />
     (+ class ctrl_hidden, если src пуст)

   Клиентский setSource:
     если lob="true" — src = '-file_lob?mtype=' + mtype + '&id=' + value
     иначе          — src = value
     пустой src → добавляется класс ctrl_hidden

   Атрибуты:
     src      — источник (URL, id lob-файла, data-URL, путь к файлу проекта).
     lob      — 'true' — источник через -file_lob (БД).
     mtype    — MIME-тип для lob-режима.
     tabindex — tabindex.
     alt      — альтернативный текст (стандартный HTML, сервер передаёт как есть).

   В IDE: видимый компонент; в canvas показывается реальная картинка
   (или плейсхолдер, если src пуст).
   Поле src использует тип 'FILE' — можно выбрать файл из текущего
   проекта или ввести путь вручную. */
(function (global) {
    'use strict';
    var D3 = global.D3;
    var CS = global.CommonSchema;

    function getSrc(el) {
        return el.getAttribute('src') || '';
    }
    function setSrc(el, v) {
        if (v == null || v === '') el.removeAttribute('src');
        else el.setAttribute('src', String(v));
    }

    /* Плейсхолдер — inline-SVG, если src пуст. */
    var PLACEHOLDER =
        'data:image/svg+xml;utf8,' +
        encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80">' +
            '<rect width="100%" height="100%" fill="#eceff1"/>' +
            '<text x="50%" y="50%" text-anchor="middle" dy=".3em" ' +
            'fill="#90a4ae" font-family="Segoe UI, sans-serif" font-size="12">IMG</text>' +
            '</svg>'
        );

    D3.register({
        id: 'd3.image', tagName: 'cmpImage', caption: 'Image',
        subCategory: 'Display',
        icon: 'images/icon.png',
        nameTemplate: 'image',
        previewCss: ['css/preview.css'],
        attrs: { name: '', src: '' },

        create: function (doc) {
            var el = doc.createElement('cmpimage');
            el.setAttribute('data-wb-tag', 'cmpImage');
            el.setAttribute('name', '');
            el.setAttribute('src', '');
            return el;
        },

        preview: function (el, doc) {
            var img = doc.createElement('img');
            img.className = 'd3-preview-image';
            img.alt = el.getAttribute('alt') || '';

            var src = getSrc(el);
            var lob = el.getAttribute('lob') === 'true';
            var mtype = el.getAttribute('mtype') || '';

            /* В lob-режиме реальной картинки в IDE нет — показываем плейсхолдер. */
            if (!src || lob) {
                img.src = PLACEHOLDER;
                img.classList.add('d3-preview-image-placeholder');
            } else {
                img.src = src;
            }

            /* Пробрасываем CSS-стили (width, height, border…), заданные
               на cmpImage через инспектор. */
            var style = el.getAttribute('style');
            if (style) img.setAttribute('style', style);

            /* Если заданы width/height как атрибуты — тоже пробрасываем. */
            var w = el.getAttribute('width');
            var h = el.getAttribute('height');
            if (w) img.setAttribute('width', w);
            if (h) img.setAttribute('height', h);

            if (el.getAttribute('visible') === 'false') img.style.display = 'none';

            return img;
        },

        /* ---------------- Properties ---------------- */
        properties: [
            /* --- HTML --- */
            { type: 'separator', caption: 'HTML attributes' },
            { name: 'id',       caption: 'Id',       type: 'string', attr: true },
            { name: 'class',    caption: 'Class',    type: 'string', attr: true },
            { name: 'style',    caption: 'Style',    type: 'string', attr: true },
            { name: 'title',    caption: 'Title',    type: 'string', attr: true },
            { name: 'alt',      caption: 'Alt',      type: 'string', attr: true },
            { name: 'tabindex', caption: 'TabIndex', type: 'number', attr: true },

            /* --- D3 Base --- */
            { type: 'separator', caption: 'D3 Base' },
            { name: 'name',    caption: 'Name',    type: 'string',  attr: true },
            {
                name: 'src', caption: 'Src (файл проекта или URL)',
                type: 'FILE', attr: true,
                get: function (el) { return getSrc(el); },
                set: function (el, v) { setSrc(el, v); }
            },
            {
                name: 'value', caption: 'Value (alias Src)',
                type: 'FILE', attr: true,
                get: function (el) { return getSrc(el); },
                set: function (el, v) { setSrc(el, v); }
            },
            { name: 'enabled', caption: 'Enabled', type: 'boolean', attr: true },
            { name: 'visible', caption: 'Visible', type: 'boolean', attr: true },
            { name: 'hint',    caption: 'Hint',    type: 'string',  attr: true },
            { name: 'width',   caption: 'Width',   type: 'string',  attr: true },
            { name: 'height',  caption: 'Height',  type: 'string',  attr: true },

            /* --- Image --- */
            { type: 'separator', caption: 'Image' },
            { name: 'lob',   caption: 'LOB (хранить в БД)', type: 'boolean', attr: true },
            { name: 'mtype', caption: 'MIME Type',          type: 'string',  attr: true }
        ],

        /* ---------------- Events ---------------- */
        events: [
            { name: 'onclick',    caption: 'OnClick',    type: 'code' },
            { name: 'ondblclick', caption: 'OnDblClick', type: 'code' },
            { name: 'onload',     caption: 'OnLoad',     type: 'code' },
            { name: 'onerror',    caption: 'OnError',    type: 'code' },
            { name: 'onmousedown', caption: 'OnMouseDown', type: 'code' },
            { name: 'onmouseup',   caption: 'OnMouseUp',   type: 'code' },
            { name: 'onmouseover', caption: 'OnMouseOver', type: 'code' },
            { name: 'onmouseout',  caption: 'OnMouseOut',  type: 'code' }
        ],

        /* ---------------- Styles ---------------- */
        styles: CS.STYLE_FIELDS.slice()
    });

})(window);