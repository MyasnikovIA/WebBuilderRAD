/* Canvas: вставка компонентов, target-логика, preview-узлы. */
(function (global) {
    'use strict';
    var Canvas = global.Canvas;
    if (!Canvas) { console.error('[canvas-insert] Canvas не загружен'); return; }

    var bus = global.EventBus;
    var SEL = Canvas.SEL;
    var VOID = Canvas.VOID;
    var PARENT_FALLBACK = Canvas.PARENT_FALLBACK;

    Canvas.prototype._placementTarget = function (el) {
        var html = this.getHtml();
        var body = this.getBody() || this.getOrCreateBody();
        var head = this.getHead();
        if (!html) return null;
        if (!el || el.nodeType !== 1) return body;
        if (this._rootType !== 'html') {
            var rc = this.getRootContainer();
            if (rc && el !== rc && !rc.contains(el)) return rc;
        }
        if (el !== html && !html.contains(el)) return body;
        var n = el;
        while (n && n !== body && n !== head && n !== html) {
            if (n.getAttribute && n.getAttribute('data-wb-preview') === '1') { n = n.parentNode; continue; }
            if (!VOID[n.tagName]) return n;
            n = n.parentNode;
        }
        if (n === head) return head;
        if (this._rootType !== 'html') {
            var rc2 = this.getRootContainer();
            if (rc2) return rc2;
        }
        return body;
    };

    Canvas.prototype._findParentFor = function (parentOnly, target) {
        var doc = this.getDoc();
        var html = this.getHtml();
        var wanted = Array.isArray(parentOnly)
            ? parentOnly.map(function (t) { return String(t).toLowerCase(); })
            : [String(parentOnly).toLowerCase()];
        var t = target;
        while (t && t !== html) {
            if (t.tagName && wanted.indexOf(t.tagName.toLowerCase()) >= 0) return t;
            t = t.parentNode;
        }
        for (var i = 0; i < wanted.length; i++) {
            var all = doc.querySelectorAll(wanted[i]);
            if (all.length > 0) return all[0];
        }
        return null;
    };

    Canvas.prototype._checkUserNesting = function (target, def) {
        if (!global.ComponentStorage || !global.ComponentStorage.canNest) return { ok: true };
        var ucEl = global.ComponentStorage.findUserCompAncestor(target, this.getHtml());
        if (!ucEl) return { ok: true };
        var uc = global.ComponentStorage.getComponent(ucEl.getAttribute('data-wb-user-comp'));
        if (!uc) return { ok: true };
        var childTag = (def && def.tagName) || '';
        var childCmptype = (def && def.cmptype) || (def && def.userComponent && def.userComponent.cmptype) || '';
        if (global.ComponentStorage.canNest(uc, childTag, childCmptype)) return { ok: true };
        return { ok: false, uc: uc };
    };

    /* ------------------------------------------------------------------
   _fitUserComponentToContent

   Вычисляет натуральные размеры содержимого user-компонента и
   либо сразу подгоняет под них сам контейнер (preserveSize=false —
   при вставке из палитры), либо только запоминает их и применяет
   transform: scale() к обёртке (preserveSize=true — при загрузке
   HTML, где размер уже задан пользователем).

   КЛЮЧЕВОЙ МОМЕНТ №1: перед замером размеры el временно обнуляются.
   Без этого .wb-user-comp-preview (width:100%/height:100%) и
   .formBackground (width:100%) растянутся по текущему — большому —
   размеру контейнера, и замер вернёт extents родителя, а не
   фактический размер содержимого.

   КЛЮЧЕВОЙ МОМЕНТ №2: wrapRect сам по себе часто получается 0×0,
   потому что обёртка имеет width:100%/height:100% от обнулённого
   el. Это НЕ значит, что замер невозможен: если содержимое
   позиционировано (position: absolute), его extents от размеров
   обёртки не зависят. Мы используем wrapRect.left/top как начало
   координат и считаем union bbox детей. Раньше здесь стояла
   проверка `wrapRect.width === 0 && wrapRect.height === 0` — она
   как раз и блокировала этот рабочий случай. */
    Canvas.prototype._fitUserComponentToContent = function (el, attempt, preserveSize) {
        if (!el || el.nodeType !== 1) return;
        if (!el.getAttribute) return;
        if (!el.getAttribute('data-wb-user-comp')) return;

        attempt = attempt || 1;

        var wrap = el.querySelector('.wb-user-comp-preview[data-wb-preview="1"]');
        if (!wrap) {
            if (attempt < 8) {
                var s1 = this;
                setTimeout(function () {
                    s1._fitUserComponentToContent(el, attempt + 1, preserveSize);
                }, 60);
            }
            return;
        }

        /* 1. Снимаем предыдущий transform и размеры обёртки —
              иначе замер идёт по искажённому состоянию. */
        wrap.style.transform = '';
        wrap.style.transformOrigin = '';
        wrap.style.marginLeft = '';
        wrap.style.marginTop  = '';
        wrap.style.width  = '';
        wrap.style.height = '';

        /* 2. Временно обнуляем размер контейнера. Сохраняем и
              left/top/position, чтобы гарантированно вернуть их в
              исходное состояние (обнуление вызывает reflow, и если
              что-то побочное попытается пересчитать позицию
              абсолютного элемента — это может испортить left/top). */
        var savedW   = el.style.width;
        var savedH   = el.style.height;
        var savedL   = el.style.left;
        var savedT   = el.style.top;
        var savedPos = el.style.position;

        el.style.width  = '0px';
        el.style.height = '0px';

        void el.offsetWidth;   /* форсим layout */

        /* Origin обёртки. width/height здесь могут быть 0 — это нормально
           (обёртка с width:100% от обнулённого el); нам нужны только
           left/top для привязки координат детей. */
        var wrapRect = wrap.getBoundingClientRect();

        var minLeft = Infinity, minTop = Infinity;
        var maxRight = 0, maxBottom = 0;
        var kids = wrap.querySelectorAll('*');
        for (var i = 0; i < kids.length; i++) {
            var kr = kids[i].getBoundingClientRect();
            if (kr.width === 0 && kr.height === 0) continue;
            var left   = kr.left   - wrapRect.left;
            var top    = kr.top    - wrapRect.top;
            var right  = kr.right  - wrapRect.left;
            var bottom = kr.bottom - wrapRect.top;
            if (left   < minLeft)   minLeft   = left;
            if (top    < minTop)    minTop    = top;
            if (right  > maxRight)  maxRight  = right;
            if (bottom > maxBottom) maxBottom = bottom;
        }

        if (!isFinite(minLeft)) minLeft = 0;
        if (!isFinite(minTop))  minTop  = 0;

        /* Ничего не нашли — восстанавливаем состояние и ретраим. */
        if (maxRight < 8 || maxBottom < 8) {
            el.style.width  = savedW;
            el.style.height = savedH;
            el.style.left   = savedL;
            el.style.top    = savedT;
            el.style.position = savedPos;
            if (attempt < 8) {
                var s3 = this;
                setTimeout(function () {
                    s3._fitUserComponentToContent(el, attempt + 1, preserveSize);
                }, 60);
            }
            return;
        }

        /* 3. Восстанавливаем размеры и позицию контейнера. */
        el.style.width  = savedW;
        el.style.height = savedH;
        el.style.left   = savedL;
        el.style.top    = savedT;
        el.style.position = savedPos;

        var newW = Math.max(50, Math.ceil(maxRight  - minLeft));
        var newH = Math.max(30, Math.ceil(maxBottom - minTop));

        el.__wbNaturalW    = newW;
        el.__wbNaturalH    = newH;
        el.__wbNaturalLeft = minLeft;
        el.__wbNaturalTop  = minTop;

        /* Только при preserveSize=false перезаписываем размер и удаляем
           HTML-атрибуты width/height. При preserveSize=true DOM должен
           остаться идентичным тому, каким был до autofit — иначе
           ProjectManager подумает, что пользователь правил файл, и
           сработает автосейв. */
        if (!preserveSize) {
            el.style.width  = newW + 'px';
            el.style.height = newH + 'px';
            el.removeAttribute('width');
            el.removeAttribute('height');
        }

        this._applyUserComponentTransform(el);

        if (typeof this._positionResizeHandles === 'function') {
            this._positionResizeHandles(el);
        }
    };

    /* ------------------------------------------------------------------
    _applyUserComponentTransform

    Ставит preview user-компонента в natural-размер и применяет
    transform: scale(sx, sy) translate(-minLeft, -minTop), где
    sx = containerW / naturalW, sy = containerH / naturalH.

    Размер контейнера берём из РЕНДЕРА (offsetWidth / offsetHeight),
    а не из строки inline-style. Это важно, когда на элементе есть
    min-width / max-width — строка может говорить 800px, а браузер
    реально отрендерит 600px.

    Функция обязана быть работоспособной в ЛЮБОМ состоянии:
      1. Если обёртки нет — вызываем _fitUserComponentToContent,
         она сама создаст/подготовит её.
      2. Если natural-размер неизвестен (0, NaN, undefined) —
         вызываем _fitUserComponentToContent; она замерит содержимое,
         заполнит el.__wbNaturalW/H и повторно вызовет нас.
      3. Перед чтением offsetWidth делаем void el.offsetWidth —
         гарантированный flush layout.
    ------------------------------------------------------------------ */
    Canvas.prototype._applyUserComponentTransform = function (el) {
        if (!el || !el.getAttribute) return;
        if (!el.getAttribute('data-wb-user-comp')) return;

        /* Ищем обёртку по классу. Атрибут data-wb-preview на ней
           ставится автоматически при создании, но если по какой-то
           причине его сейчас нет — не критично: класс присутствует
           всегда. */
        var wrap = el.querySelector('.wb-user-comp-preview');
        if (!wrap) {
            /* Обёртка ещё не создана — запускаем полный пересчёт. */
            if (typeof this._fitUserComponentToContent === 'function') {
                this._fitUserComponentToContent(el, 1, true);
            }
            return;
        }

        var natW = el.__wbNaturalW;
        var natH = el.__wbNaturalH;

        /* Natural-размер неизвестен → полный пересчёт. */
        if (!natW || !natH || natW < 1 || natH < 1) {
            if (typeof this._fitUserComponentToContent === 'function') {
                this._fitUserComponentToContent(el, 1, true);
                natW = el.__wbNaturalW;
                natH = el.__wbNaturalH;
            }
            if (!natW || !natH || natW < 1 || natH < 1) return;
        }

        var minL = el.__wbNaturalLeft || 0;
        var minT = el.__wbNaturalTop  || 0;

        /* Форсируем reflow — читаем именно текущую геометрию. */
        void el.offsetWidth;

        var w = el.offsetWidth  || parseFloat(el.style.width)  || natW;
        var h = el.offsetHeight || parseFloat(el.style.height) || natH;

        var sx = w / natW;
        var sy = h / natH;

        wrap.style.width  = natW + 'px';
        wrap.style.height = natH + 'px';
        wrap.style.boxSizing = 'border-box';
        wrap.style.marginLeft = '';
        wrap.style.marginTop  = '';
        wrap.style.transformOrigin = '0 0';
        wrap.style.transform =
            'scale(' + sx + ',' + sy + ') ' +
            'translate(' + (-minL) + 'px,' + (-minT) + 'px)';
    };

    Canvas.prototype.insertComponent = function (def, target, zone) {
        var doc  = this.getDoc();
        var html = this.getHtml();
        if (!html) return null;

        if (def.unique) {
            var existing = doc.querySelector(def.tagName);
            if (existing) { this.pending = null; bus.emit('palette:placed'); this.select(existing); return existing; }
        }

        var chk = this._checkUserNesting(target, def);
        if (!chk.ok) {
            var m = 'В компонент "' + chk.uc.name + '" запрещено вставлять вложения';
            if (chk.uc.nestingMode === 'list') m += ' данного типа';
            m += '.';
            alert(m);
            this.pending = null; bus.emit('palette:placed');
            return null;
        }

        var el = def.create ? def.create(doc) : doc.createElement(def.tagName);
        if (def.cmptype && !el.getAttribute('cmptype')) el.setAttribute('cmptype', def.cmptype);
        if (def.cmptypeId) el.setAttribute('data-cmptype', def.cmptypeId);
        if (def.xmlTag && !el.getAttribute('data-wb-tag')) el.setAttribute('data-wb-tag', def.xmlTag);
        if (def.nameTemplate) {
            var newName = Canvas.generateComponentName(doc, def.tagName, def.nameTemplate);
            if (newName) el.setAttribute('name', newName);
        }

        /* Признак видимости: если компонент объявлен невидимым —
           помечаем элемент. CSS (см. _injectIdeStyle в canvas-core.js)
           скроет его на сцене (visibility:hidden) и отключит приём
           кликов (pointer-events:none). В дереве Structure он остаётся
           доступен и выделяется через неё. */
        if (def && def.userComponent && def.userComponent.visible === false) {
            el.setAttribute('data-wb-user-comp-hidden', '1');
        }

        var parentOnly = def.parentOnly;
        if (!parentOnly && def.tagName) parentOnly = PARENT_FALLBACK[String(def.tagName).toLowerCase()];

        if (parentOnly) {
            var parent = this._findParentFor(parentOnly, target);
            if (!parent) { this.pending = null; bus.emit('palette:placed'); return null; }
            parent.appendChild(el);
        } else if (def.rootLevel) {
            html.appendChild(el);
        } else if (def.headOnly) {
            var head = this.getOrCreateHead();
            head.appendChild(el);
        } else if (target === html || !target || !target.parentNode) {
            var body = this.getOrCreateBody();
            if (body) body.appendChild(el);
        } else if (zone === 'before') {
            target.parentNode.insertBefore(el, target);
        } else if (zone === 'after') {
            target.parentNode.insertBefore(el, target.nextSibling);
        } else {
            target.appendChild(el);
        }

        this.refreshPreviewAndParent(el);

        this.pending = null;
        bus.emit('palette:placed');

        var prev = doc.querySelectorAll('.' + SEL);
        for (var i = 0; i < prev.length; i++) { prev[i].classList.remove(SEL); this._cleanClass(prev[i]); }
        el.classList.add(SEL);
        this._addResizeHandles(el);

        if (def && def.userComponent && el.getAttribute('data-wb-user-comp')) {
            el.style.overflow = 'hidden';
        }

        if (def && (def.jsLibs || def.cssLibs ||
            (def.userComponent && def.userComponent.js))) {
            this._injectComponentAssets();
        }

        if (def && def.userComponent && el.getAttribute('data-wb-user-comp')) {
            var self = this;
            setTimeout(function () {
                self._fitUserComponentToContent(el, 1, false);
            }, 100);
        }

        bus.emit('canvas:changed');
        bus.emit('selection:changed', { element: el });
        return el;
    };

    Canvas.prototype._renderPreview = function (el) {
        if (!el || el.nodeType !== 1) return;
        var old = el.querySelector(':scope > [data-wb-preview="1"]');
        if (old) old.parentNode.removeChild(old);
        if (this.getRootContainer && this.getRootContainer() === el) return;

        var def = global.ComponentRegistry && global.ComponentRegistry.match(el);
        if (!def || !def.preview) return;

        var doc = this.getDoc();
        var node;
        try { node = def.preview(el, doc); } catch (e) { node = null; }
        if (!node) return;

        if (typeof node === 'string') {
            var tmp = doc.createElement('div'); tmp.innerHTML = node; node = tmp.firstChild;
        }
        if (!node || node.nodeType !== 1) return;

        node.setAttribute('data-wb-preview', '1');
        el.appendChild(node);

        if (global.ProjectResolver) { try { global.ProjectResolver.applyTree(node); } catch (e) {} }
    };

    Canvas.prototype.refreshPreview = function (el) {
        if (!el || el.nodeType !== 1) return;
        this._renderPreview(el);
        var kids = el.children;
        for (var i = 0; i < kids.length; i++) {
            var c = kids[i];
            if (c.getAttribute && (c.getAttribute('data-wb-tag') || c.getAttribute('cmptype'))) {
                this.refreshPreview(c);
            }
        }
    };
    Canvas.prototype.refreshPreviewAndParent = function (el) {
        if (!el || el.nodeType !== 1) return;
        this.refreshPreview(el);
        var p = el.parentNode;
        if (p && p.nodeType === 1 && p.getAttribute &&
            (p.getAttribute('data-wb-tag') || p.getAttribute('cmptype'))) {
            this._renderPreview(p);
        }
    };
    Canvas.prototype._place = function (def, target) { this.insertComponent(def, target, 'inside'); };

    Canvas.prototype._renderAllPreviews = function (root) {
        if (!root || root.nodeType !== 1) return;
        var isComponent = root.getAttribute && (root.getAttribute('data-wb-tag') || root.getAttribute('cmptype'));
        if (isComponent) this._renderPreview(root);
        var kids = root.children;
        for (var i = 0; i < kids.length; i++) {
            var c = kids[i];
            if (!c.getAttribute) continue;
            if (c.getAttribute('data-wb-preview') === '1') continue;
            if (c.getAttribute('data-wb-ide') === '1') continue;
            if (c.getAttribute && c.getAttribute('data-wb-user-comp-asset') != null) continue;
            if (c.getAttribute && c.getAttribute('data-wb-user-comp-style') != null) continue;
            if (c.getAttribute && c.getAttribute('data-wb-user-comp-script') != null) continue;
            if (c.getAttribute && c.getAttribute('data-wb-user-comp-bootstrap') != null) continue;
            this._renderAllPreviews(c);
        }
    };

})(window);