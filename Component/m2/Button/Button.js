/* M2 Button — компонент <component cmptype="Button">.

   Поле icon имеет тип FILE — картинка выбирается из текущего проекта
   или вводится как URL вручную. */
(function (global) {
    'use strict';
    var M2 = global.M2;
    var CS = global.CommonSchema;

    M2.register({
        id: 'm2.button',
        tagName: 'component',
        cmptype: 'Button',
        caption: 'Button (M2)',
        subCategory: 'Controls',
        category: 'M2',
        icon: 'images/icon.png',
        previewCss: ['css/preview.css'],
        attrs: {},

        create: function (doc) {
            var el = doc.createElement('component');
            el.setAttribute('cmptype', 'Button');
            el.setAttribute('caption', 'Button');
            return el;
        },

        preview: function (el, doc) {
            var wrap = doc.createElement('div');
            wrap.className = 'd3-preview d3-preview-m2-button';
            if (el.getAttribute('type') === 'primary') wrap.classList.add('primary');
            if (el.getAttribute('type') === 'micro')   wrap.classList.add('micro');
            if (el.getAttribute('enabled') === 'false') wrap.classList.add('ctrl_disable');
            if (el.getAttribute('onlyicon') === 'true') wrap.classList.add('onlyicon');

            var w = el.getAttribute('width');
            var h = el.getAttribute('height');
            if (w) wrap.style.width  = /^\d+$/.test(w) ? w + 'px' : w;
            if (h) wrap.style.height = /^\d+$/.test(h) ? h + 'px' : h;

            var imgMap = global.D3.getImages ? global.D3.getImages(el) : {};
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
            capDiv.textContent = el.getAttribute('caption') || '';
            wrap.appendChild(capDiv);
            return wrap;
        },

        properties: [
            { type: 'separator', caption: 'HTML attributes' },
            { name: 'id',       caption: 'Id',       type: 'string', attr: true },
            { name: 'class',    caption: 'Class',    type: 'string', attr: true },
            { name: 'style',    caption: 'Style',    type: 'string', attr: true },
            { name: 'title',    caption: 'Title',    type: 'string', attr: true },
            { name: 'tabindex', caption: 'TabIndex', type: 'number', attr: true },

            { type: 'separator', caption: 'D3 Base' },
            { name: 'name',     caption: 'Name',     type: 'string',  attr: true },
            { name: 'enabled',  caption: 'Enabled',  type: 'boolean', attr: true },
            { name: 'visible',  caption: 'Visible',  type: 'boolean', attr: true },
            { name: 'hint',     caption: 'Hint',     type: 'string',  attr: true },

            { type: 'separator', caption: 'Button' },
            { name: 'caption',    caption: 'Caption',    type: 'string',  attr: true },
            { name: 'type',       caption: 'Type',       type: 'enum',    attr: true,
                values: ['', 'primary', 'micro'] },
            { name: 'width',      caption: 'Width',      type: 'string',  attr: true },
            { name: 'height',     caption: 'Height',     type: 'string',  attr: true },
            { name: 'icon',       caption: 'Icon (файл проекта или URL)', type: 'FILE', attr: true },
            { name: 'background', caption: 'Background', type: 'string',  attr: true },
            { name: 'popupmenu',  caption: 'PopupMenu',  type: 'string',  attr: true },
            { name: 'onlyicon',   caption: 'OnlyIcon',   type: 'boolean', attr: true },
            { name: 'nominwidth', caption: 'NoMinWidth', type: 'boolean', attr: true }
        ],

        events: CS.EVENT_FIELDS.slice(),

        styles: CS.STYLE_FIELDS.slice()
    });

})(window);