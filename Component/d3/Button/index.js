/* cmpButton — кнопка.

   Поля разделены по категориям (в Object Inspector видны как заголовки-разделители):
     HTML attributes — стандартные атрибуты любого HTML-элемента
     D3 Base         — базовые атрибуты контрола D3 (см. BaseCtrl.inc)
     Button          — специфичные атрибуты кнопки (см. ButtonCtrl.inc)

   Все on*** живут во вкладке Events — редактор открывает код.
   Стили (.ctrl_button, .primary, .ctrl_disable, .onlyicon) — во вкладке Styles.

   Превью использует:
     images/icon.png         — иконка палитры (16×16)
     css/preview.css         — стиль платформенной кнопки */
(function (global) {
    'use strict';
    var D3 = global.D3;
    var CS = global.CommonSchema;

    D3.register({
        id: 'd3.button', tagName: 'cmpButton', caption: 'Button',
        icon: 'images/icon.png',
        previewCss: ['css/preview.css'],
        attrs: { caption: 'Button' },

        preview: function (el, doc) {
            var wrap = doc.createElement('div');
            wrap.className = 'd3-preview d3-preview-button';

            var type = el.getAttribute('type');
            if (type === 'primary') wrap.classList.add('primary');
            if (type === 'micro')   wrap.classList.add('micro');
            if (el.getAttribute('enabled') === 'false') wrap.classList.add('ctrl_disable');
            if (el.getAttribute('onlyicon') === 'true') wrap.classList.add('onlyicon');

            wrap.setAttribute('tabindex', el.getAttribute('tabindex') || '0');

            var w = el.getAttribute('width');
            var h = el.getAttribute('height');
            if (w) wrap.style.width  = /^\d+$/.test(w) ? w + 'px' : w;
            if (h) wrap.style.height = /^\d+$/.test(h) ? h + 'px' : h;

            var imgMap = D3.getImages ? D3.getImages(el) : {};
            var iconSrc = el.getAttribute('icon') || imgMap.icon || '';
            if (iconSrc) {
                var iconDiv = doc.createElement('div');
                iconDiv.className = 'btn_icon';
                var img = doc.createElement('img');
                img.src = iconSrc;
                img.alt = '';
                img.className = 'btn_icon_img';
                iconDiv.appendChild(img);
                wrap.appendChild(iconDiv);
            }

            var capDiv = doc.createElement('div');
            var capCls = 'btn_caption btn_center';
            if (el.getAttribute('nominwidth') !== 'true') capCls += ' minwidth';
            capDiv.className = capCls;
            if (el.getAttribute('popupmenu')) capDiv.style.display = 'inline-block';
            capDiv.textContent = el.getAttribute('caption') || '';
            wrap.appendChild(capDiv);

            if (el.getAttribute('popupmenu')) {
                var arrow = doc.createElement('i');
                arrow.className = 'fas fa-angle-down d3-preview-button-arrow';
                wrap.appendChild(arrow);
            }
            return wrap;
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
            { name: 'name',     caption: 'Name',     type: 'string',  attr: true },
            { name: 'enabled',  caption: 'Enabled',  type: 'boolean', attr: true, default: true },
            { name: 'visible',  caption: 'Visible',  type: 'boolean', attr: true, default: true },
            { name: 'hint',     caption: 'Hint',     type: 'string',  attr: true },

            /* --- Button --- */
            { type: 'separator', caption: 'Button' },
            { name: 'caption',    caption: 'Caption',    type: 'string',  attr: true },
            { name: 'type',       caption: 'Type',       type: 'enum',    attr: true,
                values: ['', 'primary', 'micro'] },
            { name: 'width',      caption: 'Width',      type: 'string',  attr: true },
            { name: 'height',     caption: 'Height',     type: 'string',  attr: true },
            { name: 'icon',       caption: 'Icon',       type: 'string',  attr: true },
            { name: 'background', caption: 'Background', type: 'string',  attr: true },
            { name: 'popupmenu',  caption: 'PopupMenu',  type: 'string',  attr: true },
            { name: 'onlyicon',   caption: 'OnlyIcon',   type: 'boolean', attr: true },
            { name: 'nominwidth', caption: 'NoMinWidth', type: 'boolean', attr: true }
        ],

        /* ---------------- Events ---------------- */
        events: CS.EVENT_FIELDS.slice(),

        /* ---------------- Styles ---------------- */
        styles: CS.STYLE_FIELDS.slice()
    });

})(window);