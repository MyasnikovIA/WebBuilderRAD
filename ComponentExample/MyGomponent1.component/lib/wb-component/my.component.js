/* WbComponent: MyComponent (my.component) — автогенерация. */
(function(g){
    var WbComponent = g.WbComponent;
    if (!WbComponent) { console.error("[WbComponent] core.js не загружен для my.component"); return; }
    WbComponent.register({
    "id": "inline:my.component",
    "cmptype": "my.component",
    "name": "MyComponent",
    "html": "<div class=\"formBackground\">\n    <button class=\"ui-button ui-widget ui-corner-all\" style=\"position: absolute; left: 47px; top: 98px; width: 342px; height: 65px;\">A button element</button>\n</div>",
    "jsLibs": [
        {
            "type": "url",
            "value": "https://code.jquery.com/jquery-3.7.1.js"
        },
        {
            "type": "url",
            "value": "https://code.jquery.com/ui/1.14.2/jquery-ui.js"
        }
    ],
    "cssLibs": [
        {
            "type": "url",
            "value": "https://code.jquery.com/ui/1.14.2/themes/base/jquery-ui.css"
        }
    ],
    "customProperties": [
        {
            "name": "caption",
            "caption": "caption",
            "type": "string",
            "values": "",
            "unit": "",
            "fieldType": "none",
            "fieldUrl": "",
            "fieldPredefined": "",
            "onChangeFunc": "onMyComponentCaptionChange"
        }
    ],
    "customEvents": [
        {
            "name": "captionchange",
            "caption": "Caption Change",
            "handlerFunc": "onMyComponentOnChangeCaption"
        }
    ]
});
})(window);

/* --- user code --- */
(function (g) {
    'use strict';

    /* ------------------------------------------------------------------
       Утилиты
       ------------------------------------------------------------------ */

    /* Целевая кнопка — единственный .ui-button внутри компонента. */
    function findButton(el) {
        if (!el) return null;
        return el.querySelector('button.ui-button')
            || el.querySelector('.ui-button')
            || el.querySelector('button');
    }

    /* Применяем подпись к кнопке компонента.
       cap === undefined → берём значение атрибута caption с корня. */
    function applyCaption(el, cap) {
        if (!el) return;
        if (cap == null) cap = el.getAttribute('caption') || '';

        var btn = findButton(el);
        if (!btn) return;

        /* Если кнопка инициализирована как jQuery UI button —
           используем штатный API (сохраняет иконки и пр.). */
        var $ = g.jQuery;
        if ($ && $.fn && $.fn.button && $(btn).data('ui-button')) {
            try {
                $(btn).button('option', 'label', cap);
                return;
            } catch (e) { /* fall-through */ }
        }

        /* Fallback: обычная замена текста. */
        if (btn.textContent !== cap) btn.textContent = cap;
    }

    /* ------------------------------------------------------------------
       Property onChangeFunc — вызывается ядром WbComponent при каждом
       изменении атрибута caption (WbComponent.attach → MutationObserver).

       Помимо применения подписи, диспатчим кастомное DOM-событие
       'captionchange' на корне компонента, чтобы подписчики
       (в т.ч. onMyComponentOnChangeCaption) могли на него среагировать.
       ------------------------------------------------------------------ */
    g.onMyComponentCaptionChange = function (ctx) {
        if (!ctx || !ctx.el) return;

        applyCaption(ctx.el, ctx.value);

        try {
            var ce = new CustomEvent('captionchange', {
                detail: {
                    value:    ctx.value,
                    oldValue: ctx.oldValue
                },
                bubbles: false
            });
            ctx.el.dispatchEvent(ce);
        } catch (e) { /* IE11 и старше — игнорируем */ }
    };

    /* ------------------------------------------------------------------
       Custom event handler — вызывается ядром WbComponent по событию
       'captionchange' (WbComponent.attach → el.addEventListener(ev.name)).

       ctx.type          — 'captionchange'
       ctx.originalEvent — CustomEvent
       ctx.data          — e.detail = { value, oldValue }
       ctx.component     — экземпляр WbComponent
       ctx.el            — корневой DOM-элемент компонента
       ------------------------------------------------------------------ */
    g.onMyComponentOnChangeCaption = function (ctx) {
        if (!ctx || !ctx.el) return;

        var newValue = (ctx.data && ctx.data.value != null)
            ? ctx.data.value
            : ctx.el.getAttribute('caption');

        applyCaption(ctx.el, newValue);
    };

    /* ------------------------------------------------------------------
       Начальный рендер: применяем сохранённый caption ко всем уже
       существующим экземплярам и тем, что появятся позже.
       (MutationObserver в core.js срабатывает только на ИЗМЕНЕНИЕ
       атрибута, но не на его первоначальное значение.)
       ------------------------------------------------------------------ */
    function applyAll() {
        var els = document.querySelectorAll(
            '[data-wb-user-comp][cmptype="my.component"]'
        );
        for (var i = 0; i < els.length; i++) {
            if (els[i].getAttribute('caption') != null) {
                applyCaption(els[i]);
            }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyAll, false);
    } else {
        applyAll();
    }

    /* Ловим компоненты, добавленные на сцену после загрузки
       (перетаскивание из палитры, paste, дубликат). */
    if (g.MutationObserver) {
        var mo = new g.MutationObserver(function () {
            setTimeout(applyAll, 0);
        });
        mo.observe(document.documentElement, { childList: true, subtree: true });
    }
})(window);
