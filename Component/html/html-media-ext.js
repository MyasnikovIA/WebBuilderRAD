/* Дополнительные медиа-элементы. */
(function (global) {
    'use strict';
    var R = ComponentRegistry, S = CommonSchema;

    function sch(extra) {
        var b = S.defaultSchema();
        if (extra) b.properties = extra.concat(b.properties);
        return b;
    }

    R.register({
        id: 'media.picture', category: 'HTML', subCategory: 'Media', caption: 'Picture', tagName: 'picture',
        create: function (doc) {
            var el = doc.createElement('picture');
            var img = doc.createElement('img');
            img.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80"><rect width="100%" height="100%" fill="%23ddd"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23666" font-size="12">PIC</text></svg>';
            img.alt = 'Picture';
            el.appendChild(img);
            return el;
        },
        schema: sch()
    });

    R.register({
        id: 'media.source', category: 'HTML', subCategory: 'Media', caption: 'Source', tagName: 'source',
        create: function (doc) {
            var el = doc.createElement('source');
            el.src = '';
            el.type = 'image/png';
            return el;
        },
        schema: sch([
            { name: 'src',    caption: 'Src',    type: 'string', attr: true },
            { name: 'srcset', caption: 'SrcSet', type: 'string', attr: true },
            { name: 'type',   caption: 'Type',   type: 'string', attr: true },
            { name: 'media',  caption: 'Media',  type: 'string', attr: true }
        ])
    });

    R.register({
        id: 'media.track', category: 'HTML', subCategory: 'Media', caption: 'Track', tagName: 'track',
        create: function (doc) {
            var el = doc.createElement('track');
            el.kind = 'captions';
            el.label = 'Русский';
            el.srclang = 'ru';
            return el;
        },
        schema: sch([
            { name: 'kind',     caption: 'Kind',     type: 'string', attr: true },
            { name: 'label',    caption: 'Label',    type: 'string', attr: true },
            { name: 'srclang',  caption: 'Srclang',  type: 'string', attr: true },
            { name: 'src',      caption: 'Src',      type: 'string', attr: true },
            { name: 'default',  caption: 'Default',  type: 'boolean' }
        ])
    });

    R.register({
        id: 'media.embed', category: 'HTML', subCategory: 'Media', caption: 'Embed', tagName: 'embed',
        create: function (doc) {
            var el = doc.createElement('embed');
            el.type = 'text/html';
            el.width = 320; el.height = 180;
            el.style.border = '1px solid #999';
            el.style.background = '#f5f5f5';
            return el;
        },
        schema: sch([
            { name: 'src',    caption: 'Src',    type: 'string', attr: true },
            { name: 'type',   caption: 'Type',   type: 'string', attr: true },
            { name: 'width',  caption: 'Width',  type: 'number', attr: true },
            { name: 'height', caption: 'Height', type: 'number', attr: true }
        ])
    });

    R.register({
        id: 'media.object', category: 'HTML', subCategory: 'Media', caption: 'Object', tagName: 'object',
        create: function (doc) {
            var el = doc.createElement('object');
            el.type = 'text/html';
            el.width = 320; el.height = 180;
            el.style.border = '1px solid #999';
            el.style.background = '#f5f5f5';
            el.textContent = 'Object';
            return el;
        },
        schema: sch([
            { name: 'data',   caption: 'Data',   type: 'string', attr: true },
            { name: 'type',   caption: 'Type',   type: 'string', attr: true },
            { name: 'width',  caption: 'Width',  type: 'number', attr: true },
            { name: 'height', caption: 'Height', type: 'number', attr: true }
        ])
    });

    R.register({
        id: 'media.param', category: 'HTML', subCategory: 'Media', caption: 'Param', tagName: 'param',
        create: function (doc) {
            var el = doc.createElement('param');
            el.name = 'name';
            el.value = 'value';
            return el;
        },
        schema: sch([
            { name: 'name',  caption: 'Name',  type: 'string', attr: true },
            { name: 'value', caption: 'Value', type: 'string', attr: true }
        ])
    });

    R.register({
        id: 'media.canvas', category: 'HTML', subCategory: 'Media', caption: 'Canvas', tagName: 'canvas',
        create: function (doc) {
            var el = doc.createElement('canvas');
            el.width = 320; el.height = 180;
            el.style.border = '1px solid #999';
            el.style.background = '#fff';
            return el;
        },
        schema: sch([
            { name: 'width',  caption: 'Width',  type: 'number', attr: true },
            { name: 'height', caption: 'Height', type: 'number', attr: true }
        ])
    });

    R.register({
        id: 'media.svg', category: 'HTML', subCategory: 'Media', caption: 'SVG', tagName: 'svg',
        create: function (doc) {
            var wrap = doc.createElement('div');
            wrap.innerHTML =
                '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">' +
                '<circle cx="60" cy="60" r="50" fill="#e3f2fd" stroke="#1e88e5" stroke-width="2"/>' +
                '<text x="60" y="66" text-anchor="middle" font-family="Arial" font-size="16" fill="#1565c0">SVG</text>' +
                '</svg>';
            return wrap.firstChild;
        },
        schema: sch([
            { name: 'viewBox', caption: 'viewBox', type: 'string', attr: true },
            { name: 'width',   caption: 'Width',   type: 'number', attr: true },
            { name: 'height',  caption: 'Height',  type: 'number', attr: true }
        ])
    });

    R.register({
        id: 'media.map', category: 'HTML', subCategory: 'Media', caption: 'Map', tagName: 'map',
        create: function (doc) {
            var el = doc.createElement('map');
            el.name = 'imagemap';
            return el;
        },
        schema: sch([{ name: 'name', caption: 'Name', type: 'string', attr: true }])
    });

    R.register({
        id: 'media.area', category: 'HTML', subCategory: 'Media', caption: 'Area', tagName: 'area',
        create: function (doc) {
            var el = doc.createElement('area');
            el.shape = 'rect';
            el.coords = '0,0,100,100';
            el.href = '#';
            return el;
        },
        schema: sch([
            { name: 'shape',  caption: 'Shape',  type: 'string', attr: true },
            { name: 'coords', caption: 'Coords', type: 'string', attr: true },
            { name: 'href',   caption: 'Href',   type: 'string', attr: true },
            { name: 'alt',    caption: 'Alt',    type: 'string', attr: true }
        ])
    });

})(window);