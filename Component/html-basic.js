(function (global) {
    'use strict';
    var R = ComponentRegistry, S = CommonSchema;
    function schema(extra) {
        var b = S.defaultSchema();
        if (extra) b.properties = extra.concat(b.properties);
        return b;
    }

    R.register({ id: 'html.div', category: 'HTML', caption: 'Div', tagName: 'div',
        create: function (doc) {
            var el = doc.createElement('div');
            el.textContent = 'Div';
            el.style.minWidth = '60px'; el.style.minHeight = '24px';
            el.style.padding = '4px';
            return el;
        }, schema: schema() });

    R.register({ id: 'html.span', category: 'HTML', caption: 'Span', tagName: 'span',
        create: function (doc) { var el = doc.createElement('span'); el.textContent = 'Span'; return el; },
        schema: schema() });

    R.register({ id: 'html.p', category: 'HTML', caption: 'Paragraph', tagName: 'p',
        create: function (doc) { var el = doc.createElement('p'); el.textContent = 'Paragraph'; return el; },
        schema: schema() });

    R.register({ id: 'html.h1', category: 'HTML', caption: 'H1', tagName: 'h1',
        create: function (doc) { var el = doc.createElement('h1'); el.textContent = 'Heading 1'; return el; },
        schema: schema() });

    R.register({ id: 'html.h2', category: 'HTML', caption: 'H2', tagName: 'h2',
        create: function (doc) { var el = doc.createElement('h2'); el.textContent = 'Heading 2'; return el; },
        schema: schema() });

    R.register({ id: 'html.a', category: 'HTML', caption: 'Link', tagName: 'a',
        create: function (doc) { var el = doc.createElement('a'); el.href = '#'; el.textContent = 'Link'; return el; },
        schema: schema([
            { name: 'href',   caption: 'Href',   type: 'string', attr: true },
            { name: 'target', caption: 'Target', type: 'enum', attr: true, values: ['', '_self','_blank','_parent','_top'] }
        ]) });

    R.register({ id: 'html.hr', category: 'HTML', caption: 'HR', tagName: 'hr',
        create: function (doc) { return doc.createElement('hr'); },
        schema: { properties: [], styles: S.STYLE_FIELDS.slice(), events: S.EVENT_FIELDS.slice() } });

    R.register({ id: 'html.br', category: 'HTML', caption: 'BR', tagName: 'br',
        create: function (doc) { return doc.createElement('br'); },
        schema: { properties: [], styles: [], events: [] } });

    R.register({ id: 'html.generic', category: 'Internal', caption: 'Generic', hidden: true, tagName: '*',
        schema: S.defaultSchema() });
})(window);