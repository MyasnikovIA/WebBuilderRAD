/* cmpExpander — раскрывающийся контейнер.

   Серверный контрол: ExpanderCtrl.inc (class Expander).
   Клиентский контрол: Expander.js (D3Api.ExpanderCtrl).

   Серверный Show() собирает:
     <div tabindex="1" class="ctrl_expander [show] [mode] [turn]" hgt="..." wdt="...">
       <div class="expander_content">…дети…</div>
       <a cmpparse="Expander" cont="zoneClick" class="expander_zone_click">
         <span class="caption_cont" cont="captionCont">Caption</span>
       </a>
     </div>

   Атрибуты:
     mode          — 'horizontal' (по умолчанию) | 'vertical'
     turn          — 'true' — зона клика снизу/справа
     value         — 'true' — раскрыт; 'false' — свёрнут
     hgt / wdt     — высота/ширина в раскрытом состоянии
     caption       — заголовок
     caption_show  — заголовок свёрнутого состояния (перекрывает caption)
     caption_hide  — заголовок раскрытого состояния

   В IDE зона клика рендерится через preview(): она помечается
   data-wb-preview="1", не сериализуется и не появляется в дереве.
   Пользовательские дети добавляются прямо в корень — CSS отступом
   освобождает для них место под зоной. */
(function (global) {
    'use strict';
    var D3 = global.D3;
    var CS = global.CommonSchema;

    /* Текст заголовка с учётом caption_show / caption_hide. */
    function captionFor(el) {
        var expanded = el.getAttribute('value') === 'true';
        var cs = el.getAttribute('caption_show');
        var ch = el.getAttribute('caption_hide');
        if (cs || ch) {
            return expanded ? (ch || '') : (cs || '');
        }
        return el.getAttribute('caption') || '';
    }

    D3.register({
        id: 'd3.expander', tagName: 'cmpExpander', caption: 'Expander',
        icon: 'images/icon.png',
        nameTemplate: 'expander',
        previewCss: ['css/preview.css'],
        attrs: {
            name: '',
            value: 'false',
            mode: 'horizontal',
            caption: 'Заголовок',
            caption_show: 'Развернуть',
            caption_hide: 'Свернуть'
        },

        create: function (doc) {
            var el = doc.createElement('cmpexpander');
            el.setAttribute('data-wb-tag', 'cmpExpander');
            el.setAttribute('name', '');
            el.setAttribute('value', 'false');
            el.setAttribute('mode', 'horizontal');
            el.setAttribute('caption', 'Заголовок');
            el.setAttribute('caption_show', 'Развернуть');
            el.setAttribute('caption_hide', 'Свернуть');
            return el;
        },

        preview: function (el, doc) {
            var zone = doc.createElement('div');
            zone.className = 'd3-preview d3-preview-expander-zone';
            zone.setAttribute('data-part', 'zone');
            zone.textContent = captionFor(el);
            return zone;
        },

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
            { name: 'value',   caption: 'Value (expanded)', type: 'boolean', attr: true },
            { name: 'enabled', caption: 'Enabled', type: 'boolean', attr: true },
            { name: 'visible', caption: 'Visible', type: 'boolean', attr: true },
            { name: 'hint',    caption: 'Hint',    type: 'string',  attr: true },
            { name: 'width',   caption: 'Width',   type: 'string',  attr: true },
            { name: 'height',  caption: 'Height',  type: 'string',  attr: true },

            /* --- Expander --- */
            { type: 'separator', caption: 'Expander' },
            { name: 'mode',         caption: 'Mode', type: 'enum', attr: true,
                values: ['horizontal', 'vertical'] },
            { name: 'turn',         caption: 'Turn', type: 'boolean', attr: true },
            { name: 'caption',      caption: 'Caption',      type: 'string', attr: true },
            { name: 'caption_show', caption: 'Caption (collapsed)', type: 'string', attr: true },
            { name: 'caption_hide', caption: 'Caption (expanded)',  type: 'string', attr: true },
            { name: 'hgt',          caption: 'Height (expanded)',   type: 'string', attr: true },
            { name: 'wdt',          caption: 'Width (expanded)',    type: 'string', attr: true }
        ],

        /* ---------------- Events ---------------- */
        events: [
            { name: 'onclick',  caption: 'OnClick',  type: 'code' },
            { name: 'onchange', caption: 'OnChange', type: 'code' }
        ],

        /* ---------------- Styles ---------------- */
        styles: CS.STYLE_FIELDS.slice()
    });

})(window);