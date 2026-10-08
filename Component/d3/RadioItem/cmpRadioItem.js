/* cmpRadioItem — отдельная радиокнопка внутри cmpRadioGroup.

   Серверный контрол: RadioGroupCtrl.inc (class RadioItem extends BaseCtrl).
   Клиентский контрол: RadioGroup.js (D3Api.RadioItemCtrl).

   Серверный Show():
     <div class="ctrl_radioitem" …attrs…>
       <input value="…" type="radio" name="<parent_name>"
              [readonly] [disabled] [checked]
              onmousedown="return false;"
              onchange="D3Api.stopEvent(event);"/>
       <span cont="caption">…caption…</span>
     </div>

   Состояние `state` формируется сервером в __construct:
     - readonly="true"    → input readonly + disabled
     - enabled="false"    → input readonly + disabled
     - parent.readonly    → input readonly + disabled
     - value == parent.value → input checked

   Атрибуты:
     name     — имя элемента (для getControl).
     value    — значение радиокнопки.
     caption  — подпись.
     checked  — 'true' — выбрана при открытии.
     enabled  — 'false' — заблокирована.
     readonly — 'true' — только для чтения.

   parentOnly: cmpradiogroup.

   В IDE: preview = null — визуализируется родителем. */
(function (global) {
    'use strict';
    var D3 = global.D3;
    var CS = global.CommonSchema;

    D3.register({
        id: 'd3.radioitem', tagName: 'cmpRadioItem', caption: 'RadioItem',
        parentOnly: 'cmpradiogroup',
        icon: 'images/icon.png',
        nameTemplate: 'radioItem',
        previewCss: ['css/preview.css'],
        attrs: { name: '', value: '', caption: '' },

        create: function (doc) {
            var el = doc.createElement('cmpradioitem');
            el.setAttribute('data-wb-tag', 'cmpRadioItem');
            el.setAttribute('name', '');
            el.setAttribute('value', '');
            el.setAttribute('caption', '');
            return el;
        },

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

            /* --- RadioItem --- */
            { type: 'separator', caption: 'RadioItem' },
            { name: 'value',    caption: 'Value',    type: 'string',  attr: true },
            { name: 'caption',  caption: 'Caption',  type: 'string',  attr: true },
            { name: 'checked',  caption: 'Checked',  type: 'boolean', attr: true },
            { name: 'readonly', caption: 'ReadOnly', type: 'boolean', attr: true }
        ],

        /* ---------------- Events ---------------- */
        events: [
            { name: 'onclick',     caption: 'OnClick',     type: 'code' },
            { name: 'ondblclick',  caption: 'OnDblClick',  type: 'code' },
            { name: 'onmouseover', caption: 'OnMouseOver', type: 'code' },
            { name: 'onmouseout',  caption: 'OnMouseOut',  type: 'code' }
        ],

        /* ---------------- Styles ---------------- */
        styles: CS.STYLE_FIELDS.slice()
    });

})(window);