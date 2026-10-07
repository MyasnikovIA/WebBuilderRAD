(function (global) {
    'use strict';
    var R = ComponentRegistry, S = CommonSchema;
    function schema(extra) {
        var b = S.defaultSchema();
        if (extra) b.properties = extra.concat(b.properties);
        return b;
    }

    R.register({ id: 'media.img', category: 'Media', caption: 'Image', tagName: 'img',
        create: function (doc) {
            var el = doc.createElement('img');
            el.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80"><rect width="100%" height="100%" fill="%23ddd"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23666" font-size="12">IMG</text></svg>';
            el.alt = 'Image';
            return el;
        }, schema: schema([
            { name: 'src',    caption: 'Src',    type: 'string', attr: true },
            { name: 'alt',    caption: 'Alt',    type: 'string', attr: true },
            { name: 'width',  caption: 'Width',  type: 'number', attr: true },
            { name: 'height', caption: 'Height', type: 'number', attr: true }
        ]) });

    R.register({ id: 'media.video', category: 'Media', caption: 'Video', tagName: 'video',
        create: function (doc) {
            var el = doc.createElement('video');
            el.controls = true;
            el.style.width = '240px';
            el.style.background = '#000';
            return el;
        }, schema: schema([
            { name: 'src',      caption: 'Src',      type: 'string', attr: true },
            { name: 'controls', caption: 'Controls', type: 'boolean' },
            { name: 'autoplay', caption: 'Autoplay', type: 'boolean' },
            { name: 'loop',     caption: 'Loop',     type: 'boolean' },
            { name: 'muted',    caption: 'Muted',    type: 'boolean' }
        ]) });

    R.register({ id: 'media.audio', category: 'Media', caption: 'Audio', tagName: 'audio',
        create: function (doc) { var el = doc.createElement('audio'); el.controls = true; return el; },
        schema: schema([
            { name: 'src',      caption: 'Src',      type: 'string', attr: true },
            { name: 'controls', caption: 'Controls', type: 'boolean' },
            { name: 'loop',     caption: 'Loop',     type: 'boolean' },
            { name: 'muted',    caption: 'Muted',    type: 'boolean' }
        ]) });

    R.register({ id: 'media.iframe', category: 'Media', caption: 'IFrame', tagName: 'iframe',
        create: function (doc) {
            var el = doc.createElement('iframe');
            el.style.width = '320px'; el.style.height = '180px';
            el.style.border = '1px solid #999';
            return el;
        }, schema: schema([
            { name: 'src',             caption: 'Src',            type: 'string', attr: true },
            { name: 'width',           caption: 'Width',          type: 'number', attr: true },
            { name: 'height',          caption: 'Height',         type: 'number', attr: true },
            { name: 'allowfullscreen', caption: 'Allow Fullscreen', type: 'boolean' }
        ]) });
})(window);