/* M2 Form — корневой контейнер <div cmptype="Form">.

   В M2-нотации форма — это обычный div с атрибутом cmptype="Form".
   Данный компонент служит определением для IDE: он не появляется
   в палитре (hidden: true), но Inspector использует его схему,
   когда выделен корень M2-формы.

   Атрибуты:
     name, caption, class, title, window_size.

   События:
     oncreate, onshow, onclose. */
(function (global) {
    'use strict';
    var M2 = global.M2;
    var CS = global.CommonSchema;

    M2.register({
        id: 'm2.form',
        tagName: 'div',
        cmptype: 'Form',
        caption: 'Form (M2)',
        subCategory: 'Containers',
        category: 'M2',
        icon: 'images/icon.png',
        previewCss: ['css/preview.css'],
        hidden: true,
        attrs: {},

        create: function (doc) {
            var el = doc.createElement('div');
            el.setAttribute('cmptype', 'Form');
            return el;
        },

        /* Корневой контейнер — preview не нужен. */
        preview: null,

        properties: [
            /* --- HTML --- */
            { type: 'separator', caption: 'HTML attributes' },
            { name: 'id',    caption: 'Id',    type: 'string', attr: true },
            { name: 'class', caption: 'Class', type: 'string', attr: true },
            { name: 'style', caption: 'Style', type: 'string', attr: true },
            { name: 'title', caption: 'Title', type: 'string', attr: true },

            /* --- Form (M2) --- */
            { type: 'separator', caption: 'Form (M2)' },
            { name: 'name',        caption: 'Name',        type: 'string', attr: true },
            { name: 'caption',     caption: 'Caption',     type: 'string', attr: true },
            { name: 'window_size', caption: 'Window Size', type: 'string', attr: true }
        ],

        events: [
            {
                name: 'oncreate',
                caption: 'OnCreate',
                type: 'code',
                template:     'Form.{name} = function(dom) {\n    \n};',
                callTemplate: 'Form.{name}(this);'
            },
            {
                name: 'onshow',
                caption: 'OnShow',
                type: 'code',
                template:     'Form.{name} = function(dom) {\n    \n};',
                callTemplate: 'Form.{name}(this);'
            },
            {
                name: 'onclose',
                caption: 'OnClose',
                type: 'code',
                template:     'Form.{name} = function(dom) {\n    \n};',
                callTemplate: 'Form.{name}(this);'
            }
        ],

        styles: CS.STYLE_FIELDS.slice()
    });

})(window);