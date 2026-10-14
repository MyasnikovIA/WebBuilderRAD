/* WbComponent core — автогенерация. Не редактировать вручную. */
(function(g){
if (g.WbComponent && g.WbComponent._bootstrapped) return;
var WbComponent = {
    _bootstrapped: true,
    _defs: {},
    _registry: {},
    _byCmptype: {},
    _pending: [],
    _libsLoaded: {},
    register: function(def){
        if(!def || !def.cmptype) return;
        this._defs[def.cmptype] = def;
        try { this.applyLibs(def); } catch(e){ console.error("[WbComponent] applyLibs", def.cmptype, e); }
        for(var i=0;i<this._pending.length;i++){
            var p = this._pending[i];
            if(p.ct === def.cmptype){
                try { attach(p.el, def); } catch(e){ console.error("[WbComponent] attach", def.cmptype, e); }
                this._pending.splice(i,1); i--;
            }
        }
    },
    _register: function(i){ this._registry[i.id]=i; if(i.cmptype) this._byCmptype[i.cmptype]=i; },
    _unregister: function(i){ delete this._registry[i.id]; if(i.cmptype && this._byCmptype[i.cmptype]===i) delete this._byCmptype[i.cmptype]; },
    get: function(k){
        if(!k) return null;
        if(typeof k==="string") return this._registry[k] || this._byCmptype[k] || null;
        if(k.nodeType===1) return k._wbComponent || null;
        return null;
    },
    all: function(ct){
        var out=[],k;
        if(!ct){ for(k in this._registry) if(this._registry.hasOwnProperty(k)) out.push(this._registry[k]); return out; }
        for(k in this._registry) if(this._registry[k].cmptype===ct) out.push(this._registry[k]);
        return out;
    },
    applyLibs: function(def){
        if(!def) return;
        var head = document.head || document.getElementsByTagName("head")[0];
        if(!head) return;
        var cssList = def.cssLibs || [];
        for(var i=0;i<cssList.length;i++){
            var lib = cssList[i];
            var url = lib && (typeof lib === "string" ? lib : lib.value);
            var typ = lib && lib.type ? lib.type : "url";
            if(!url || typ === "project") continue;
            if(/\.js(\?|#|$)/i.test(url)) continue;
            if(this._libsLoaded["css:"+url]) continue;
            this._libsLoaded["css:"+url] = true;
            var link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = url;
            link.setAttribute("data-wb-user-comp-asset", "1");
            head.appendChild(link);
        }
        var jsList = def.jsLibs || [];
        for(var j=0;j<jsList.length;j++){
            var libj = jsList[j];
            var urlj = libj && (typeof libj === "string" ? libj : libj.value);
            var typj = libj && libj.type ? libj.type : "url";
            if(!urlj || typj === "project") continue;
            if(/\.css(\?|#|$)/i.test(urlj)) continue;
            if(this._libsLoaded["js:"+urlj]) continue;
            this._libsLoaded["js:"+urlj] = true;
            var script = document.createElement("script");
            script.src = urlj;
            script.async = false;
            script.setAttribute("data-wb-user-comp-asset", "1");
            head.appendChild(script);
        }
    }
};
g.WbComponent = WbComponent;

function resolveFn(name){
    if(!name) return null;
    var parts = String(name).split("."), obj = g;
    for(var i=0;i<parts.length;i++){ if(!obj) return null; obj = obj[parts[i]]; }
    return typeof obj==="function" ? obj : null;
}

function hasRealContent(el){
    if(!el || !el.childNodes) return false;
    for(var i=0;i<el.childNodes.length;i++){
        var c = el.childNodes[i];
        if(c.nodeType === 1) return true;
        if(c.nodeType === 3 && c.nodeValue && c.nodeValue.replace(/\s+/g,"") !== "") return true;
    }
    return false;
}

function attach(el, def){
    if(el._wbComponent) return el._wbComponent;
    var instance = {
        id: def.id, cmptype: def.cmptype, name: def.name, el: el,
        _handlers: {},
        get: function(name){ return el.getAttribute(name) || ""; },
        set: function(name, v){ el.setAttribute(name, v); },
        on: function(name, h){ (this._handlers[name]=this._handlers[name]||[]).push(h); return this; },
        off: function(name, h){ var l=this._handlers[name]; if(!l) return this; var i=l.indexOf(h); if(i>=0) l.splice(i,1); return this; },
        emit: function(name, data){
            var l = this._handlers[name] || [];
            for(var i=0;i<l.length;i++){
                try { l[i]({ type: name, data: data, component: this, el: el }); }
                catch(e){ console.error("[WbComponent]", name, e); }
            }
            try {
                var ce = new CustomEvent("wb-component-event", { detail: { name: name, data: data } });
                el.dispatchEvent(ce);
            } catch(e){}
        }
    };
    var props = def.customProperties || [];
    for(var i=0;i<props.length;i++){
        (function(p){
            try {
                Object.defineProperty(instance, p.name, {
                    get: function(){ return el.getAttribute(p.name) || ""; },
                    set: function(v){ el.setAttribute(p.name, v); },
                    enumerable: true, configurable: true
                });
            } catch(e){}
        })(props[i]);
    }
    if(g.MutationObserver){
        var mo = new g.MutationObserver(function(muts){
            for(var m=0;m<muts.length;m++){
                var mu = muts[m];
                if(mu.type !== "attributes") continue;
                var pn = mu.attributeName, pdef = null;
                for(var k=0;k<props.length;k++) if(props[k].name===pn){ pdef=props[k]; break; }
                if(!pdef || !pdef.onChangeFunc) continue;
                var fn = resolveFn(pdef.onChangeFunc);
                if(!fn) continue;
                try {
                    fn.call(instance, {
                        name: pn,
                        value: el.getAttribute(pn),
                        oldValue: mu.oldValue,
                        component: instance,
                        el: el
                    });
                } catch(e){ console.error("[WbComponent] onChange", pdef.onChangeFunc, e); }
            }
        });
        mo.observe(el, { attributes: true, attributeOldValue: true });
        instance._observer = mo;
    }
    var evs = def.customEvents || [];
    for(var j=0;j<evs.length;j++){
        (function(ev){
            if(!ev.handlerFunc) return;
            el.addEventListener(ev.name, function(e){
                var fn = resolveFn(ev.handlerFunc);
                if(!fn) return;
                try {
                    fn.call(instance, {
                        type: ev.name, originalEvent: e,
                        component: instance, el: el,
                        data: e && e.detail
                    });
                } catch(ex){ console.error("[WbComponent] on", ev.handlerFunc, ex); }
            }, false);
        })(evs[j]);
    }
    el._wbComponent = instance;
    if(def.html && !hasRealContent(el)){
        try { el.innerHTML = def.html; } catch(e){ console.error("[WbComponent] render html", def.cmptype, e); }
    }
    WbComponent._register(instance);
    return instance;
}

function init(){
    var els = document.querySelectorAll("[data-wb-user-comp]");
    for(var i=0;i<els.length;i++){
        var el = els[i];
        var ct = el.getAttribute("cmptype") || "";
        var def = WbComponent._defs[ct] || null;
        if(!def){ WbComponent._pending.push({ el: el, ct: ct }); continue; }
        try { attach(el, def); } catch(e){ console.error("[WbComponent] attach", ct, e); }
    }
}
WbComponent._attach = attach;
WbComponent._init = init;
WbComponent._hasRealContent = hasRealContent;
if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, false);
else init();
if(g.MutationObserver){
    var bodyObs = new g.MutationObserver(function(muts){
        for(var i=0;i<muts.length;i++){
            if(muts[i].addedNodes && muts[i].addedNodes.length){ setTimeout(init, 0); return; }
        }
    });
    try { bodyObs.observe(document.documentElement, { childList: true, subtree: true }); } catch(e){}
}
})(window);