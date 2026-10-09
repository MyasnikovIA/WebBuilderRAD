/* M2 Image — <component cmptype="Image">. */
(function (global) {
    'use strict';
    var M2 = global.M2;
    var CS = global.CommonSchema;

    var PLACEHOLDER =
        'data:image/svg+xml;utf8,' +
        encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80">' +
            '<rect width="100%" height="100%" fill="#eceff1"/>' +
            '<text x="50%" y="50%" text-anchor="middle" dy=".3em" ' +
            'fill="#90a4ae" font-family="Segoe UI, sans-serif" font-size="12">IMG</text>' +
            '</svg>'
        );

    M2.register({
        id: 'm2.image',
        tagName: 'component',
        cmptype: 'Image',
        caption: 'Image (M2)',
        subCategory: 'Display',
        category: 'M2',
        icon: 'images/icon.png',
        previewCss: ['css/preview.css'],
        attrs: {},

        create: function (doc) {
            var el = doc.createElement('component');
            el.setAttribute('cmptype', 'Image');
            el.setAttribute('name', '');
            el.setAttribute('src', '');
            return el;
        },

        preview: function (el, doc) {
            var img = doc.createElement('img');
            var src = el.getAttribute('src') || '';
            img.src = src || PLACEHOLDER;
            img.alt = el.getAttribute('alt') || '';
            var w = el.getAttribute('width');
            var h = el.getAttribute('height');
            if (w) img.setAttribute('width', w);
            if (h) img.setAttribute('height', h);
            return img;
        },

        properties: [
            { type: 'separator', caption: 'HTML attributes' },
            { name: 'id',    caption: 'Id',    type: 'string', attr: true },
            { name: 'class', caption: 'Class', type: 'string', attr: true },
            { name: 'style', caption: 'Style', type: 'string', attr: true },
            { name: 'alt',   caption: 'Alt',   type: 'string', attr: true },

            { type: 'separator', caption: 'D3 Base' },
            { name: 'name',    caption: 'Name',    type: 'string',  attr: true },
            { name: 'enabled', caption: 'Enabled', type: 'boolean', attr: true },
            { name: 'visible', caption: 'Visible', type: 'boolean', attr: true },
            { name: 'hint',    caption: 'Hint',    type: 'string',  attr: true },
            { name: 'width',   caption: 'Width',   type: 'string',  attr: true },
            { name: 'height',  caption: 'Height',  type: 'string',  attr: true },

            { type: 'separator', caption: 'Image' },
            { name: 'src',   caption: 'Src',   type: 'string',  attr: true },
            { name: 'lob',   caption: 'LOB',   type: 'boolean', attr: true },
            { name: 'mtype', caption: 'MIME',  type: 'string',  attr: true }
        ],

        events: CS.EVENT_FIELDS.slice(),
        styles: CS.STYLE_FIELDS.slice()
    });

})(window);