/* cmpTabSheet — отдельная закладка внутри cmpPageControl.

   Серверный контрол: PageControlCtrl.inc (class TabSheet extends BaseCtrl).
   Клиентский контрол: PageControl.js (D3Api.TabSheetCtrl).

   Серверный Show() пишет в родительский PageControl:
     - в button[]:  <li class="ctrl_pageControlTabBtn tab<i>_<uniqid>"
                         pageindex="<i>" cmptype="TabSheet" …>
                       <a class="centerTB" cont="tabcaption">caption</a>
                     </li>
     - в content[]: <div cont="page<i>_<uniqid>"
                         class="ctrl_pageControlTabPage page<i>_<uniqid>">…дети…</div>

   Сервер сам навешивает onclick="D3Api.PageControlCtrl.showTab(this);".

   Атрибуты:
     name          — имя закладки. Если не задано, сервер генерирует
                     <parent_name>_TabSheet<index>.
     caption       — текст на табе.
     active        — 'true' — эта закладка активна при открытии.
     pageindex     — индекс (0..N-1), вычисляется сервером по порядку.
     visible       — показывать ли таб (и соответствующую страницу).
     button_class  — доп. CSS-класс на <li> таба.
     content_class — доп. CSS-класс на <div> страницы.

   parentOnly: cmppagecontrol.

   В IDE: preview = null — визуализируется только внутри родителя,
   в дереве отображается отдельным узлом. */
(function (global) {
    'use strict';
    var D3 = global.D3;
    var CS = global.CommonSchema;

    D3.register({
        id: 'd3.tabsheet', tagName: 'cmpTabSheet', caption: 'TabSheet',
        parentOnly: 'cmppagecontrol',
        icon: 'images/icon.png',
        nameTemplate: 'tabSheet',
        previewCss: ['css/preview.css'],
        attrs: { name: '', caption: 'Tab' },

        create: function (doc) {
            var el = doc.createElement('cmptabsheet');
            el.setAttribute('data-wb-tag', 'cmpTabSheet');
            el.setAttribute('name', '');
            el.setAttribute('caption', 'Tab');
            return el;
        },

        /* Внутри PageControl визуализируется родителем (preview
           сканирует детей и рисует общий каркас). Отдельный preview
           не нужен. */
        preview: null,

        /* ---------------- Properties ---------------- */
        properties: [
            /* --- HTML --- */
            { type: 'separator', caption: 'HTML attributes' },
            { name: 'id',    caption: 'Id',    type: 'string', attr: true },
            { name: 'class', caption: 'Class', type: 'string', attr: true },
            { name: 'style', caption: 'Style', type: 'string', attr: true },
            { name: 'title', caption: 'Title', type: 'string', attr: true },

            /* --- D3 Base --- */
            { type: 'separator', caption: 'D3 Base' },
            { name: 'name',    caption: 'Name',    type: 'string',  attr: true },
            { name: 'enabled', caption: 'Enabled', type: 'boolean', attr: true },
            { name: 'visible', caption: 'Visible', type: 'boolean', attr: true },
            { name: 'hint',    caption: 'Hint',    type: 'string',  attr: true },

            /* --- TabSheet --- */
            { type: 'separator', caption: 'TabSheet' },
            { name: 'caption',       caption: 'Caption',       type: 'string',  attr: true },
            { name: 'active',        caption: 'Active',        type: 'boolean', attr: true },
            { name: 'button_class',  caption: 'Button Class',  type: 'string',  attr: true },
            { name: 'content_class', caption: 'Content Class', type: 'string',  attr: true }
        ],

        /* ---------------- Events ---------------- */
        events: [
            { name: 'onclick',      caption: 'OnClick',      type: 'code' },
            { name: 'ondblclick',   caption: 'OnDblClick',   type: 'code' },
            { name: 'onmouseover',  caption: 'OnMouseOver',  type: 'code' },
            { name: 'onmouseout',   caption: 'OnMouseOut',   type: 'code' }
        ],

        /* ---------------- Styles ---------------- */
        styles: CS.STYLE_FIELDS.slice()
    });

})(window);