/* cmpInfoBox — информационная плашка.

   Серверный контрол: InfoBoxCtrl.inc (class InfoBox).
   Клиентский контрол: InfoBox.js (D3Api.InfoBoxCtrl).

   Серверный Show():
     <div class="infobox_Ctrl [modifier]" …attrs… …events…>
       <div class="infobox_Ctrl_icon_container [class_icon_container]">
         <i class="infobox_Ctrl_icon [class_icon]"></i>
       </div>
       <div class="infobox_Ctrl_text [class_text]">
         caption (с \n → <br>)
       </div>
     </div>

   Модификаторы (через class="error" / "success" / "warning"):
     .error   — красный (#a40028)
     .success — зелёный (#079A2D)
     .warning — жёлтая рамка, чёрный текст (#feee33)

   Атрибуты:
     caption               — текст (с поддержкой HTML и \n → <br>).
     class                 — модификатор (error | success | warning) и/или стили.
     class_icon            — дополнительный класс на <i> (например, fa-иконка).
     class_icon_container  — дополнительный класс на контейнере иконки.
     class_text            — дополнительный класс на текстовом блоке.

   В IDE: видна вся плашка целиком: иконка-плейсхолдер + текст caption
   с учётом модификатора. */
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

    /* Извлекаем модификатор из class: error / success / warning */
    function parseModifier(cls) {
        if (!cls) return '';
        var parts = String(cls).split(/\s+/);
        if (parts.indexOf('error') >= 0) return 'error';
        if (parts.indexOf('success') >= 0) return 'success';
        if (parts.indexOf('warning') >= 0) return 'warning';
        return '';
    }

    /* Преобразует \n в <br> и возвращает HTML-строку для вставки. */
    function captionToHtml(cap) {
        var s = String(cap == null ? '' : cap);
        /* Сначала экранируем, потом восстанавливаем \n → <br>.
           Это близко к серверному str_ireplace('\n', '<br>', caption). */
        return s.replace(/\\n/g, '<br/>').replace(/\n/g, '<br/>');
    }

    D3.register({
        id: 'd3.infobox', tagName: 'cmpInfoBox', caption: 'InfoBox',
        icon: 'images/icon.png',
        previewCss: ['css/preview.css'],
        attrs: {
            name: '',
            caption: 'Информационное сообщение'
        },

        create: function (doc) {
            var el = doc.createElement('cmpinfobox');
            el.setAttribute('data-wb-tag', 'cmpInfoBox');
            el.setAttribute('name', '');
            el.setAttribute('caption', 'Информационное сообщение');
            return el;
        },

        preview: function (el, doc) {
            var cls = el.getAttribute('class') || '';
            var mod = parseModifier(cls);

            var wrap = doc.createElement('div');
            wrap.className = 'd3-preview d3-preview-infobox';
            if (mod) wrap.classList.add('d3-preview-infobox-' + mod);

            /* Иконка-контейнер */
            var ic = doc.createElement('div');
            ic.className = 'd3-preview-infobox-icon';
            var iconCls = el.getAttribute('class_icon') || '';
            /* Пытаемся понять, какая иконка нужна, по class_icon. */
            var glyph = 'i';
            if (/check|success|ok/i.test(iconCls))      glyph = '\u2713';   /* ✓ */
            else if (/warn|excl/i.test(iconCls))        glyph = '!';
            else if (/times|close|error|cancel/i.test(iconCls)) glyph = '\u2715'; /* ✕ */
            else if (/info/i.test(iconCls))             glyph = 'i';
            var span = doc.createElement('span');
            span.className = 'd3-preview-infobox-icon-glyph';
            span.textContent = glyph;
            ic.appendChild(span);
            wrap.appendChild(ic);

            /* Текстовый блок */
            var tx = doc.createElement('div');
            tx.className = 'd3-preview-infobox-text';
            var cap = getCaption(el);
            tx.innerHTML = captionToHtml(cap) || '<span class="d3-preview-infobox-empty">(empty)</span>';
            wrap.appendChild(tx);

            if (el.getAttribute('visible') === 'false') wrap.style.display = 'none';
            if (el.getAttribute('enabled') === 'false') wrap.classList.add('ctrl_disable');

            /* Пробрасываем width/height со cmpInfoBox на preview-узел,
               чтобы настройки в инспекторе визуально применялись. */
            var w = el.getAttribute('width');
            var h = el.getAttribute('height');
            if (w) wrap.style.width = w;
            if (h) wrap.style.minHeight = h;

            return wrap;
        },

        /* ---------------- Properties ---------------- */
        properties: [
            /* --- HTML --- */
            { type: 'separator', caption: 'HTML attributes' },
            { name: 'id',    caption: 'Id',    type: 'string', attr: true },
            { name: 'class', caption: 'Class (error | success | warning)', type: 'string', attr: true },
            { name: 'style', caption: 'Style', type: 'string', attr: true },
            { name: 'title', caption: 'Title', type: 'string', attr: true },

            /* --- D3 Base --- */
            { type: 'separator', caption: 'D3 Base' },
            { name: 'name',    caption: 'Name',    type: 'string',  attr: true },
            { name: 'enabled', caption: 'Enabled', type: 'boolean', attr: true },
            { name: 'visible', caption: 'Visible', type: 'boolean', attr: true },
            { name: 'hint',    caption: 'Hint',    type: 'string',  attr: true },
            { name: 'width',   caption: 'Width',   type: 'string',  attr: true },
            { name: 'height',  caption: 'Height',  type: 'string',  attr: true },

            /* --- InfoBox --- */
            { type: 'separator', caption: 'InfoBox' },
            {
                name: 'caption',
                caption: 'Caption (HTML, \\n → <br>)',
                type: 'code',
                get: function (el) { return getCaption(el); },
                set: function (el, v) { setCaption(el, v); }
            },
            { name: 'class_icon',           caption: 'Icon Class',           type: 'string', attr: true },
            { name: 'class_icon_container', caption: 'Icon Container Class', type: 'string', attr: true },
            { name: 'class_text',           caption: 'Text Class',           type: 'string', attr: true }
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