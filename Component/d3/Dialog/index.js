/* cmpDialog — модальное диалоговое окно.

   Серверный контрол: DialogCtrl.inc (class Dialog).
   Клиентский контрол: Dialog.js (D3Api.DialogCtrl).

   Серверный Show() собирает:
     <div>
       <div name="X_background" class="dialogCtrl-background"></div>
       <div name="X" class="dialogCtrl ...">
         <div class="dialogCtrl-caption">  <cmpLabel name="X_caption"/>  </div>
         <div class="dialogCtrl-text">     <cmpLabel name="X_text"/>     </div>
         <!-- сюда попадает SetInnerText: дочерние компоненты -->
         <div class="dialogCtrl-buttons">
           <cmpButton name="X_agreeOk" .../>
           <cmpButton name="X_agreeCancel" .../>
         </div>
       </div>
     </div>

   В IDE визуальный «каркас» строится в create() с маркерами data-wb-ide="1":
   эти узлы видны в canvas, но не сериализуются и не появляются в дереве.
   Пользовательские дети, добавленные через палитру, встают между шапкой
   и кнопками благодаря flex-свойству order (см. preview.css). */
(function (global) {
    'use strict';
    var D3 = global.D3;
    var CS = global.CommonSchema;

    function mkChrome(doc, cls, part, text) {
        var d = doc.createElement('div');
        d.className = cls;
        d.setAttribute('data-wb-ide', '1');
        d.setAttribute('data-part', part);
        if (text != null) d.textContent = text;
        return d;
    }

    D3.register({
        id: 'd3.dialog', tagName: 'cmpDialog', caption: 'Dialog',
        icon: 'images/icon.png',
        nameTemplate: 'dialog',
        previewCss: ['css/preview.css'],
        attrs: {
            name: '',
            caption: 'Заголовок',
            content: 'Содержимое диалога',
            agree_caption: 'Да',
            cancel_caption: 'Нет',
            show_buttons: 'true'
        },

        create: function (doc) {
            var el = doc.createElement('cmpdialog');
            el.setAttribute('data-wb-tag', 'cmpDialog');
            el.setAttribute('name', '');
            el.setAttribute('caption', 'Заголовок');
            el.setAttribute('content', 'Содержимое диалога');
            el.setAttribute('agree_caption', 'Да');
            el.setAttribute('cancel_caption', 'Нет');
            el.setAttribute('show_buttons', 'true');

            /* ---- header: caption + text ---- */
            var header = mkChrome(doc, 'd3-preview-dialog-header', 'header');
            header.appendChild(mkChrome(doc, 'd3-preview-dialog-caption', 'caption', 'Заголовок'));
            header.appendChild(mkChrome(doc, 'd3-preview-dialog-text',    'text',    'Содержимое диалога'));
            el.appendChild(header);

            /* ---- footer: buttons ---- */
            var footer = mkChrome(doc, 'd3-preview-dialog-footer', 'footer');
            var okBtn = doc.createElement('span');
            okBtn.className = 'd3-preview-dialog-btn';
            okBtn.textContent = 'Да';
            var cancelBtn = doc.createElement('span');
            cancelBtn.className = 'd3-preview-dialog-btn';
            cancelBtn.textContent = 'Нет';
            footer.appendChild(okBtn);
            footer.appendChild(cancelBtn);
            el.appendChild(footer);

            return el;
        },

        /* Всё, что нужно показать, собрано в create(). Preview не нужен. */
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
            { name: 'enabled', caption: 'Enabled', type: 'boolean', attr: true },
            { name: 'visible', caption: 'Visible', type: 'boolean', attr: true },
            { name: 'hint',    caption: 'Hint',    type: 'string',  attr: true },
            { name: 'width',   caption: 'Width',   type: 'string',  attr: true },
            { name: 'height',  caption: 'Height',  type: 'string',  attr: true },

            /* --- Dialog --- */
            { type: 'separator', caption: 'Dialog' },
            { name: 'caption',        caption: 'Caption',        type: 'string',  attr: true },
            { name: 'content',        caption: 'Content',        type: 'string',  attr: true },
            { name: 'show_buttons',   caption: 'Show Buttons',   type: 'boolean', attr: true },
            { name: 'agree',          caption: 'Agree handler',  type: 'string',  attr: true },
            { name: 'agree_caption',  caption: 'Agree Caption',  type: 'string',  attr: true },
            { name: 'agree_primary',  caption: 'Agree Primary',  type: 'boolean', attr: true },
            { name: 'cancel',         caption: 'Cancel handler', type: 'string',  attr: true },
            { name: 'cancel_caption', caption: 'Cancel Caption', type: 'string',  attr: true },
            { name: 'align',          caption: 'Align',          type: 'enum',    attr: true,
                values: ['', 'left', 'center', 'right'] },
            { name: 'loading',        caption: 'Loading',        type: 'boolean', attr: true },
            { name: 'loading_icon',   caption: 'Loading Icon',   type: 'string',  attr: true }
        ],

        /* ---------------- Events ---------------- */
        events: [
            { name: 'onclick',    caption: 'OnClick',    type: 'code' },
            { name: 'ondblclick', caption: 'OnDblClick', type: 'code' }
        ],

        /* ---------------- Styles ---------------- */
        styles: CS.STYLE_FIELDS.slice()
    });

})(window);