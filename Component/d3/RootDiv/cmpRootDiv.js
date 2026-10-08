/* Корневой <div> — служебный, создаётся через Canvas.setRootType('div'). */
(function (global) {
    'use strict';
    var R = global.ComponentRegistry;
    var S = global.CommonSchema;

    R.register({
        id: 'd3.rootdiv', category: 'D3', caption: 'RootDiv',
        tagName: 'div', hidden: true,
        folder: 'RootDiv',
        iconUrl: (function () {
            var base = window.location.href.replace(/[?#].*$/, '').replace(/[^\/]*$/, '');
            return base + 'Component/d3/RootDiv/images/icon.png';
        })(),
        create: function (doc) {
            var el = doc.createElement('div');
            el.setAttribute('class', 'formBackground');
            return el;
        },
        schema: {
            properties: [
                { name: 'id',    caption: 'Id',    type: 'string', attr: true },
                { name: 'class', caption: 'Class', type: 'string', attr: true }
            ],
            styles: S.STYLE_FIELDS.slice(),
            events: S.EVENT_FIELDS.slice()
        }
    });

})(window);