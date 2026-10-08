/* cmpPopupMenu — контекстное меню.

   Серверный контрол: PopupMenuCtrl.inc (class PopupMenu extends BaseCtrl).
   Клиентский контрол: PopupMenu.js (D3Api.PopupMenuCtrl).

   Серверный Show() собирает:
     <div class="popupMenu" tabindex="0" cont="menu" …attrs…>
       <div class="item waittext">Подождите...</div>
       …дети: PopupItem / PopupGroupItem…
       <div class="popupGroupItem" cont="groupitem" name="additionalMainMenu" cmptype="PopupGroupItem"></div>
       <div class="popupGroupItem" cont="groupitem" name="system" cmptype="PopupGroupItem" separator="before"></div>
     </div>

   В рантайме меню скрыто (display:none) до вызова show(coords).
   Показывается как fixed-элемент рядом с координатами клика.

   Дети: cmpPopupItem, cmpPopupGroupItem.

   Атрибуты:
     name           — имя меню (для getControl).
     popupobject    — имя контрола, к которому привязано меню (правый клик по нему открывает меню).
     popupobject_var — то же, но через переменную.
     join_menu      — имя меню, в которое вливаются пункты этого меню.
     join_group     — имя группы внутри join_menu для вливания.
     onpopup_action — имя Action, вызываемого перед показом (waitAction).
     autopopup      — 'true' — меню автозаполняемое (используется AutoPopupMenu).

   В IDE: невидимый в рантайме, но в canvas отображается как «скелет» меню —
   панель с пунктами. */
(function (global) {
    'use strict';
    var D3 = global.D3;
    var CS = global.CommonSchema;

    D3.register({
        id: 'd3.popupmenu', tagName: 'cmpPopupMenu', caption: 'PopupMenu',
        icon: 'images/icon.png',
        previewCss: ['css/preview.css'],
        attrs: { name: '' },

        create: function (doc) {
            var el = doc.createElement('cmppopupmenu');
            el.setAttribute('data-wb-tag', 'cmpPopupMenu');
            el.setAttribute('name', '');
            return el;
        },

        preview: function (el, doc) {
            var wrap = doc.createElement('div');
            wrap.className = 'd3-preview d3-preview-popupmenu';
            if (el.getAttribute('visible') === 'false') wrap.style.display = 'none';
            if (el.getAttribute('enabled') === 'false') wrap.classList.add('ctrl_disable');

            /* Собираем видимые дети PopupItem / PopupGroupItem для отображения. */
            var kids = el.children;
            var hasVisibleChildren = false;
            for (var i = 0; i < kids.length; i++) {
                var t = kids[i].tagName ? kids[i].tagName.toLowerCase() : '';
                if (t !== 'cmppopupitem' && t !== 'cmppopupgroupitem') continue;
                var cap = kids[i].getAttribute('caption');
                var vis = kids[i].getAttribute('visible') !== 'false';
                if (vis) hasVisibleChildren = true;
                if (!cap && t === 'cmppopupitem') continue;

                if (t === 'cmppopupitem' && cap === '-') {
                    var sep = doc.createElement('div');
                    sep.className = 'd3-preview-popupitem d3-preview-popupitem-separator';
                    wrap.appendChild(sep);
                } else {
                    var item = doc.createElement('div');
                    item.className = 'd3-preview-popupitem';
                    if (!vis) item.classList.add('disabled');
                    var label = doc.createElement('span');
                    label.textContent = cap || '(item)';
                    item.appendChild(label);
                    wrap.appendChild(item);
                }
            }

            if (!hasVisibleChildren) {
                var empty = doc.createElement('div');
                empty.className = 'd3-preview-popupmenu-empty';
                empty.textContent = '(no items)';
                wrap.appendChild(empty);
            }

            /* Подпись «menu» в углу, чтобы отличать от обычного списка. */
            var badge = doc.createElement('div');
            badge.className = 'd3-preview-popupmenu-badge';
            badge.textContent = 'menu';
            wrap.appendChild(badge);

            /* Пробрасываем width / height. */
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
            { name: 'class', caption: 'Class', type: 'string', attr: true },
            { name: 'style', caption: 'Style', type: 'string', attr: true },

            /* --- D3 Base --- */
            { type: 'separator', caption: 'D3 Base' },
            { name: 'name',    caption: 'Name',    type: 'string',  attr: true },
            { name: 'enabled', caption: 'Enabled', type: 'boolean', attr: true },
            { name: 'visible', caption: 'Visible', type: 'boolean', attr: true },
            { name: 'hint',    caption: 'Hint',    type: 'string',  attr: true },

            /* --- PopupMenu --- */
            { type: 'separator', caption: 'PopupMenu' },
            { name: 'popupobject',     caption: 'Popup Object',     type: 'string',  attr: true },
            { name: 'popupobject_var', caption: 'Popup Object Var', type: 'string',  attr: true },
            { name: 'join_menu',       caption: 'Join Menu',        type: 'string',  attr: true },
            { name: 'join_group',      caption: 'Join Group',       type: 'string',  attr: true },
            { name: 'onpopup_action',  caption: 'OnPopup Action',   type: 'string',  attr: true },
            { name: 'autopopup',       caption: 'Auto Popup',       type: 'boolean', attr: true }
        ],

        /* ---------------- Events ---------------- */
        events: [
            { name: 'onpopup',    caption: 'OnPopup',    type: 'code' },
            { name: 'onitem_add', caption: 'OnItemAdd',  type: 'code' },
            { name: 'onitem_delete', caption: 'OnItemDelete', type: 'code' },
            { name: 'onclick',    caption: 'OnClick',    type: 'code' },
            { name: 'ondblclick', caption: 'OnDblClick', type: 'code' }
        ],

        /* ---------------- Styles ---------------- */
        styles: CS.STYLE_FIELDS.slice()
    });

})(window);