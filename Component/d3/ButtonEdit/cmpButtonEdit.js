/* cmpButtonEdit — поле ввода с кнопкой выбора из справочника.

   Три режима:
     kind="normal"    — <input> + кнопка выбора + опц. очистка
     kind="multiline" — <textarea> + кнопка выбора + опц. очистка
     kind="tagged"    — контейнер тегов (cmpTagItem) + кнопка выбора + опц. очистка

   Ссылка: ButtonEditCtrl.inc / ButtonEdit.js */
(function (global) {
    'use strict';
    var D3 = global.D3;
    var CS = global.CommonSchema;

    D3.register({
        id: 'd3.buttonedit', tagName: 'cmpButtonEdit', caption: 'ButtonEdit',
        subCategory: 'Controls',
        icon: 'images/icon.png',
        nameTemplate: 'buttonEdit',
        previewCss: ['css/preview.css'],
        attrs: { name: '', kind: 'normal', width: '200px' },

        preview: function (el, doc) {
            var kind        = el.getAttribute('kind') || 'normal';
            var readonly    = el.getAttribute('readonly') === 'true';
            var clearbutton = el.getAttribute('clearbutton') === 'true';
            var enabled     = el.getAttribute('enabled') !== 'false';
            var visible     = el.getAttribute('visible') !== 'false';
            var width       = el.getAttribute('width') || '';
            var height      = el.getAttribute('height') || '';
            var placeholder = el.getAttribute('placeholder') || '';
            var value       = el.getAttribute('value') || '';
            var guideTitle  = el.getAttribute('button_guide_title') || 'Выбрать из справочника';

            var wrap = doc.createElement('span');
            wrap.className = 'd3-preview d3-preview-buttonedit kind-' + kind;
            if (!enabled) wrap.classList.add('ctrl_disable');
            if (!visible) wrap.style.display = 'none';
            if (width)  wrap.style.width  = /^\d+$/.test(width)  ? width  + 'px' : width;
            if (height) wrap.style.height = /^\d+$/.test(height) ? height + 'px' : height;

            /* Content */
            var content = doc.createElement('span');
            content.className = 'ctrl_ButtonEdit_Cell ctrl_ButtonEdit_Content ctrl_ButtonEdit_Bg';

            if (kind === 'multiline') {
                var ta = doc.createElement('textarea');
                ta.value = value;
                ta.placeholder = placeholder;
                if (readonly) ta.readOnly = true;
                content.appendChild(ta);
            } else if (kind === 'tagged') {
                var cont = doc.createElement('div');
                cont.className = 'ctrl_ButtonEdit_TagsContainer';
                /* Показать существующие дочерние cmpTagItem как превью */
                var childItems = el.children;
                var shown = 0;
                for (var i = 0; i < childItems.length; i++) {
                    var it = childItems[i];
                    if (!it.tagName || it.tagName.toLowerCase() !== 'cmptagitem') continue;
                    var tag = doc.createElement('span');
                    tag.className = 'ctrl_TagItem';
                    var cap = doc.createElement('span');
                    cap.setAttribute('cont', 'caption');
                    cap.textContent = it.getAttribute('caption') || it.getAttribute('value') || '—';
                    tag.appendChild(cap);
                    if (!readonly && enabled) {
                        var x = doc.createElement('span');
                        x.className = 'ctrl_TagItem_ButClear';
                        x.title = 'Удалить';
                        tag.appendChild(x);
                    }
                    cont.appendChild(tag);
                    shown++;
                }
                if (shown === 0) {
                    var empty = doc.createElement('span');
                    empty.className = 'ctrl_ButtonEdit_EmptyHint';
                    empty.textContent = '(tagged)';
                    cont.appendChild(empty);
                }
                content.appendChild(cont);
            } else {
                var inp = doc.createElement('input');
                inp.type = 'text';
                inp.value = value;
                inp.placeholder = placeholder;
                if (readonly) inp.readOnly = true;
                content.appendChild(inp);
            }
            wrap.appendChild(content);

            /* Guide button */
            var guide = doc.createElement('span');
            guide.className = 'ctrl_ButtonEdit_Cell ctrl_ButtonEdit_Guide ctrl_ButtonEdit_Bg';
            var gbtn = doc.createElement('span');
            gbtn.className = 'ctrl_ButtonEdit_ButGuide';
            gbtn.title = guideTitle;
            guide.appendChild(gbtn);
            wrap.appendChild(guide);

            /* Clear button */
            if (clearbutton) {
                var clear = doc.createElement('span');
                clear.className = 'ctrl_ButtonEdit_Cell ctrl_ButtonEdit_Clear';
                var cbtn = doc.createElement('span');
                cbtn.className = 'ctrl_ButtonEdit_ButClear';
                cbtn.title = 'Очистить поле';
                var cicon = doc.createElement('span');
                cicon.className = 'ctrl_ButtonEdit_ButClearIcon';
                cbtn.appendChild(cicon);
                clear.appendChild(cbtn);
                wrap.appendChild(clear);
            }

            return wrap;
        },

        properties: [
            /* --- HTML --- */
            { type: 'separator', caption: 'HTML attributes' },
            { name: 'id',       caption: 'Id',       type: 'string', attr: true },
            { name: 'class',    caption: 'Class',    type: 'string', attr: true },
            { name: 'style',    caption: 'Style',    type: 'string', attr: true },
            { name: 'title',    caption: 'Title',    type: 'string', attr: true },
            { name: 'tabindex', caption: 'TabIndex', type: 'number', attr: true },

            /* --- D3 Base --- */
            { type: 'separator', caption: 'D3 Base' },
            { name: 'name',    caption: 'Name',    type: 'string',  attr: true },
            { name: 'value',   caption: 'Value',   type: 'string',  attr: true },
            { name: 'caption', caption: 'Caption', type: 'string',  attr: true },
            { name: 'enabled', caption: 'Enabled', type: 'boolean', attr: true, default: true },
            { name: 'visible', caption: 'Visible', type: 'boolean', attr: true, default: true },
            { name: 'hint',    caption: 'Hint',    type: 'string',  attr: true },
            { name: 'width',   caption: 'Width',   type: 'string',  attr: true },
            { name: 'height',  caption: 'Height',  type: 'string',  attr: true },

            /* --- ButtonEdit --- */
            { type: 'separator', caption: 'ButtonEdit' },
            { name: 'kind',        caption: 'Kind',        type: 'enum',    attr: true,
                values: ['normal','multiline','tagged'] },
            { name: 'placeholder', caption: 'Placeholder', type: 'string',  attr: true },
            { name: 'readonly',    caption: 'ReadOnly',    type: 'boolean', attr: true },
            { name: 'clearbutton', caption: 'ClearButton', type: 'boolean', attr: true },
            { name: 'wrap',        caption: 'Wrap',        type: 'boolean', attr: true },
            { name: 'items_name',           caption: 'ItemsName',         type: 'string', attr: true },
            { name: 'items_repeatername',   caption: 'ItemsRepeaterName', type: 'string', attr: true },
            { name: 'button_guide_class',   caption: 'GuideClass',        type: 'string', attr: true },
            { name: 'button_guide_title',   caption: 'GuideTitle',        type: 'string', attr: true }
        ],

        /* ---------------- Events ---------------- */
        events: [
            { name: 'onchange',         caption: 'OnChange',        type: 'code' },
            { name: 'onbuttonclick',    caption: 'OnButtonClick',   type: 'code' },
            { name: 'onclearbtnclick',  caption: 'OnClearBtnClick', type: 'code' },
            { name: 'onvalidate',       caption: 'OnValidate',      type: 'code' },
            { name: 'onfocus',          caption: 'OnFocus',         type: 'code' },
            { name: 'onblur',           caption: 'OnBlur',          type: 'code' },
            { name: 'onclick',          caption: 'OnClick',         type: 'code' },
            { name: 'ondblclick',       caption: 'OnDblClick',      type: 'code' },
            { name: 'onmousedown',      caption: 'OnMouseDown',     type: 'code' },
            { name: 'onmouseup',        caption: 'OnMouseUp',       type: 'code' },
            { name: 'onkeydown',        caption: 'OnKeyDown',       type: 'code' },
            { name: 'onkeyup',          caption: 'OnKeyUp',         type: 'code' },
            { name: 'onkeypress',       caption: 'OnKeyPress',      type: 'code' }
        ],

        /* ---------------- Styles ---------------- */
        styles: CS.STYLE_FIELDS.slice()
    });

})(window);