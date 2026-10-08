/* cmpLabel — текстовый контрол (span).

   Серверный контрол: LabelCtrl.inc (class Label).
   Клиентский контрол: Label.js (D3Api.LabelCtrl).

   Серверный Show():
     <span class="label" …attrs… …events…
           [note="labelWithNote"]>before_caption + caption + after_caption + note</span>

   Особенности:
     - caption вставляется в HTML как есть (не escape);
     - specialchars="true" (по умолчанию) → клиент escape-ит caption
       через textContent → innerHTML;
     - format включает onformat="D3Api.LabelCtrl.format(this, {…}, arguments[0])";
     - note рендерится как <span class="labelNote">;
     - formated="true" → \n → <br/>, двойные пробелы → &nbsp;;
     - hide_empty → скрывает контрол, если caption пуст.

   В IDE: показываем caption + before/after + note в одном span.
   Format не применяется (это runtime). */
(function (global) {
    'use strict';
    var D3 = global.D3;
    var CS = global.CommonSchema;

    function getCaption(el) {
        return el.getAttribute('caption') || '';
    }
    function setCaption(el, v) {
        if (v == null || v === '') el.removeAttribute('caption');
        else el.setAttribute('caption', String(v));
    }

    D3.register({
        id: 'd3.label', tagName: 'cmpLabel', caption: 'Label',
        icon: 'images/icon.png',
        nameTemplate: 'label',
        previewCss: ['css/preview.css'],
        attrs: { name: '', caption: 'Label' },

        create: function (doc) {
            var el = doc.createElement('cmplabel');
            el.setAttribute('data-wb-tag', 'cmpLabel');
            el.setAttribute('name', '');
            el.setAttribute('caption', 'Label');
            return el;
        },

        preview: function (el, doc) {
            var span = doc.createElement('span');
            span.className = 'd3-preview d3-preview-label';

            /* visible / enabled */
            if (el.getAttribute('visible') === 'false') span.style.display = 'none';
            if (el.getAttribute('enabled') === 'false') span.classList.add('ctrl_disable');

            /* hide_empty: скрываем, если caption пуст и атрибут задан */
            var cap = getCaption(el);
            var hideEmpty = el.getAttribute('hide_empty') !== null;
            if (hideEmpty && !cap) {
                span.style.display = 'none';
                return span;
            }

            /* before_caption + caption + after_caption */
            var before = el.getAttribute('before_caption') || '';
            var after  = el.getAttribute('after_caption')  || '';
            var specialchars = el.getAttribute('specialchars');
            var useText = (specialchars === null) || (specialchars === 'true');

            /* Собираем текстовый узел. Если specialchars=false — пробуем
               интерпретировать как HTML (innerHTML). Иначе — textContent. */
            var content = before + cap + after;
            if (content) {
                if (useText) {
                    span.appendChild(doc.createTextNode(content));
                } else {
                    try { span.innerHTML = content; }
                    catch (e) { span.textContent = content; }
                }
            } else {
                span.appendChild(doc.createTextNode('\u00A0')); /* &nbsp; */
            }

            /* note: <span class="labelNote"> под текстом */
            var note = el.getAttribute('note');
            if (note) {
                span.classList.add('d3-preview-label-withnote');

                var noteEl = doc.createElement('span');
                noteEl.className = 'labelNote';

                var style = '';
                var off = el.getAttribute('note_offset');
                var sz  = el.getAttribute('note_size');
                if (off) style += 'bottom:' + off + ';';
                if (sz)  style += 'font-size:' + sz + ';';
                if (style) noteEl.setAttribute('style', style);

                noteEl.textContent = note;
                span.appendChild(noteEl);

                /* note_width задаёт min-width на корне */
                var nw = el.getAttribute('note_width');
                if (nw) span.style.minWidth = nw;
            }

            /* Пробрасываем width/height со cmpLabel */
            var w = el.getAttribute('width');
            var h = el.getAttribute('height');
            if (w) span.style.width = w;
            if (h) span.style.minHeight = h;

            return span;
        },

        /* ---------------- Properties ---------------- */
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
            { name: 'enabled', caption: 'Enabled', type: 'boolean', attr: true },
            { name: 'visible', caption: 'Visible', type: 'boolean', attr: true },
            { name: 'hint',    caption: 'Hint',    type: 'string',  attr: true },
            { name: 'width',   caption: 'Width',   type: 'string',  attr: true },
            { name: 'height',  caption: 'Height',  type: 'string',  attr: true },

            /* --- Caption --- */
            { type: 'separator', caption: 'Caption' },
            {
                name: 'caption', caption: 'Caption (HTML)', type: 'code',
                get: function (el) { return getCaption(el); },
                set: function (el, v) { setCaption(el, v); }
            },
            { name: 'before_caption', caption: 'Before Caption', type: 'string', attr: true },
            { name: 'after_caption',  caption: 'After Caption',  type: 'string', attr: true },
            { name: 'specialchars',   caption: 'SpecialChars (escape HTML)', type: 'boolean', attr: true },
            { name: 'formated',       caption: 'Formated (\\n → <br>, &nbsp;)', type: 'boolean', attr: true },
            { name: 'nonbsp',         caption: 'No &nbsp;',      type: 'boolean', attr: true },
            { name: 'hide_empty',     caption: 'Hide Empty',     type: 'boolean', attr: true },

            /* --- Format --- */
            { type: 'separator', caption: 'Format' },
            { name: 'format',   caption: 'Format',   type: 'string', attr: true },
            { name: 'onformat', caption: 'OnFormat', type: 'code',   attr: true },

            /* --- Note --- */
            { type: 'separator', caption: 'Note (подпись под текстом)' },
            { name: 'note',        caption: 'Note',        type: 'string', attr: true },
            { name: 'note_offset', caption: 'Note Offset', type: 'string', attr: true },
            { name: 'note_size',   caption: 'Note Size',   type: 'string', attr: true },
            { name: 'note_width',  caption: 'Note Width',  type: 'string', attr: true }
        ],

        /* ---------------- Events ---------------- */
        events: [
            { name: 'onclick',    caption: 'OnClick',    type: 'code' },
            { name: 'ondblclick', caption: 'OnDblClick', type: 'code' },
            { name: 'onmousedown', caption: 'OnMouseDown', type: 'code' },
            { name: 'onmouseup',   caption: 'OnMouseUp',   type: 'code' },
            { name: 'onmouseover', caption: 'OnMouseOver', type: 'code' },
            { name: 'onmouseout',  caption: 'OnMouseOut',  type: 'code' }
        ],

        /* ---------------- Styles ---------------- */
        styles: CS.STYLE_FIELDS.slice()
    });

})(window);