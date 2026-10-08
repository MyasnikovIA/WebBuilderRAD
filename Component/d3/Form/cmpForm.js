/* cmpForm — корневой контейнер D3-страницы.

   Серверный контрол: FormCtrl.inc (class Form extends Base).
   Клиентский контрол: Form.js (D3Api.FormCtrl).

   Серверный Show():
     <div class="…" …events… …attrs…>innerText</div>

   Клиентский режим sized=true добавляет:
     - класс formSized на <div>,
     - класс formSizedContainer на контейнер формы,
     - сиблинг <div class="formFrame"> с caption и кнопкой закрытия.

   В IDE:
     - unique + hidden — компонент не показывается в палитре,
       создаётся через Canvas.setRootType('cmpForm'),
     - chrome фрейма (caption + X) рисуется через CSS-псевдоэлементы
       на cmpform[sized="true"] — в сохранённый XML ничего не добавляется,
     - preview() возвращает null: превью-узел не нужен. */
(function (global) {
    'use strict';
    var D3 = global.D3;
    var CS = global.CommonSchema;

    D3.register({
        id: 'd3.form', tagName: 'cmpForm', caption: 'Form',
        unique: true, hidden: true,
        icon: 'images/icon.png',
        nameTemplate: 'Form',
        previewCss: ['css/preview.css'],
        attrs: { 'class': 'd3form formBackground' },

        create: function (doc) {
            var el = doc.createElement('cmpform');
            el.setAttribute('data-wb-tag', 'cmpForm');
            el.setAttribute('data-cmptype', 'd3.form');
            el.setAttribute('class', 'd3form formBackground');
            el.setAttribute('name', '');
            return el;
        },

        /* Chrome рисуем через CSS на cmpform[sized="true"] — preview-узел
           не нужен. Возвращаем null, чтобы Canvas._renderPreview не
           добавлял лишний [data-wb-preview="1"]-элемент. */
        preview: null,

        /* ---------------- Properties ---------------- */
        properties: [
            /* --- HTML --- */
            { type: 'separator', caption: 'HTML attributes' },
            { name: 'id',    caption: 'Id',    type: 'string', attr: true },
            { name: 'class', caption: 'Class', type: 'string', attr: true },
            { name: 'style', caption: 'Style', type: 'string', attr: true },

            /* --- D3 Base --- */
            { type: 'separator', caption: 'D3 Base' },
            { name: 'name',    caption: 'Name',    type: 'string',  attr: true },
            { name: 'caption', caption: 'Caption', type: 'string',  attr: true },
            { name: 'sized',   caption: 'Sized (фрейм)', type: 'boolean', attr: true },
            { name: 'width',   caption: 'Width',   type: 'string',  attr: true },
            { name: 'height',  caption: 'Height',  type: 'string',  attr: true }
        ],

        /* ---------------- Events ---------------- */
        events: [
            { name: 'oncreate',         caption: 'OnCreate',         type: 'code' },
            { name: 'onform_dominsert', caption: 'OnFormDOMInsert',  type: 'code' },
            { name: 'onform_domremove', caption: 'OnFormDOMRemove',  type: 'code' },
            { name: 'onform_destroy',   caption: 'OnFormDestroy',    type: 'code' },
            { name: 'onformcaption',    caption: 'OnFormCaption',    type: 'code' },
            { name: 'onResize',         caption: 'OnResize',         type: 'code' }
        ],

        /* ---------------- Styles ---------------- */
        styles: CS.STYLE_FIELDS.slice()
    });

})(window);