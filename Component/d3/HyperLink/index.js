/* cmpHyperLink — ссылка. */
(function (global) {
    'use strict';
    var D3 = global.D3;

    D3.register({
        id: 'd3.hyperlink', tagName: 'cmpHyperLink', caption: 'HyperLink',
        icon: 'images/icon.png',
        attrs: { caption: 'Link' },
        preview: function (el, doc) {
            var a = doc.createElement('a');
            a.href = 'javascript:void(0)';
            a.className = 'd3-preview d3-preview-link';
            a.textContent = el.getAttribute('caption') || '';
            return a;
        },
        properties: [
            { name: 'caption', caption: 'Caption', type: 'string', attr: true },
            { name: 'onclick', caption: 'OnClick', type: 'string', attr: true }
        ]
    });

})(window);