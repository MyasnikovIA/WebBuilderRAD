/* Head-элементы, а также уникальные head и body. */
(function (global) {
    'use strict';
    var R = ComponentRegistry, S = CommonSchema;

    function sch(extra) {
        var b = S.defaultSchema();
        if (extra) b.properties = extra.concat(b.properties);
        return b;
    }

    /* ============================================================
       Document: HEAD и BODY — уникальные корневые компоненты.
       ============================================================ */
    R.register({
        id: 'html.head', category: 'Document', caption: 'HEAD', tagName: 'head',
        unique: true, rootLevel: true,
        create: function (doc) { return doc.createElement('head'); },
        schema: S.defaultSchema()
    });

    R.register({
        id: 'html.body', category: 'Document', caption: 'BODY', tagName: 'body',
        unique: true, rootLevel: true,
        create: function (doc) { return doc.createElement('body'); },
        schema: S.defaultSchema()
    });

    /* ============================================================
       Head-элементы.
       headOnly: true — только meta, title, base, noscript, template.
       script/style/link могут находиться в любом блоке (body, div и т.п.).
       ============================================================ */
    R.register({
        id: 'html.meta', category: 'Head', caption: 'Meta', tagName: 'meta',
        headOnly: true,
        create: function (doc) {
            var el = doc.createElement('meta');
            el.setAttribute('name', 'description');
            el.setAttribute('content', '');
            return el;
        },
        schema: sch([
            { name: 'name',      caption: 'Name',       type: 'string', attr: true },
            { name: 'content',   caption: 'Content',    type: 'string', attr: true },
            { name: 'charset',   caption: 'Charset',    type: 'string', attr: true },
            { name: 'httpEquiv', caption: 'http-equiv', type: 'string', attr: true }
        ])
    });

    R.register({
        id: 'html.title', category: 'Head', caption: 'Title', tagName: 'title',
        headOnly: true,
        create: function (doc) {
            var el = doc.createElement('title');
            el.textContent = 'Document title';
            return el;
        },
        schema: sch()
    });

    /* Link — может быть в head и в body (например, rel="preload", itemprop) */
    R.register({
        id: 'html.link', category: 'Head', caption: 'Link', tagName: 'link',
        create: function (doc) {
            var el = doc.createElement('link');
            el.rel = 'stylesheet';
            el.href = '';
            return el;
        },
        schema: sch([
            { name: 'rel',    caption: 'Rel',    type: 'string', attr: true },
            { name: 'href',   caption: 'Href',   type: 'string', attr: true },
            { name: 'type',   caption: 'Type',   type: 'string', attr: true },
            { name: 'media',  caption: 'Media',  type: 'string', attr: true },
            { name: 'sizes',  caption: 'Sizes',  type: 'string', attr: true }
        ])
    });

    /* Style — может быть в head и в body (scoped/inline-стили) */
    R.register({
        id: 'html.style', category: 'Head', caption: 'Style', tagName: 'style',
        create: function (doc) {
            var el = doc.createElement('style');
            el.textContent = '/* CSS */';
            return el;
        },
        schema: sch([{ name: 'media', caption: 'Media', type: 'string', attr: true }])
    });

    /* Script — может быть в head и в body */
    R.register({
        id: 'html.script', category: 'Head', caption: 'Script', tagName: 'script',
        create: function (doc) {
            var el = doc.createElement('script');
            el.textContent = '// JS';
            return el;
        },
        schema: sch([
            { name: 'src',   caption: 'Src',   type: 'string', attr: true },
            { name: 'type',  caption: 'Type',  type: 'string', attr: true },
            { name: 'async', caption: 'Async', type: 'boolean' },
            { name: 'defer', caption: 'Defer', type: 'boolean' }
        ])
    });

    R.register({
        id: 'html.base', category: 'Head', caption: 'Base', tagName: 'base',
        headOnly: true,
        create: function (doc) { return doc.createElement('base'); },
        schema: sch([
            { name: 'href',   caption: 'Href',   type: 'string', attr: true },
            { name: 'target', caption: 'Target', type: 'string', attr: true }
        ])
    });

    R.register({
        id: 'html.noscript', category: 'Head', caption: 'NoScript', tagName: 'noscript',
        headOnly: true,
        create: function (doc) {
            var el = doc.createElement('noscript');
            el.textContent = 'JavaScript отключён';
            return el;
        },
        schema: sch()
    });

    R.register({
        id: 'html.template', category: 'Head', caption: 'Template', tagName: 'template',
        headOnly: true,
        create: function (doc) {
            var el = doc.createElement('template');
            el.innerHTML = '<span>шаблон</span>';
            return el;
        },
        schema: sch()
    });

})(window);