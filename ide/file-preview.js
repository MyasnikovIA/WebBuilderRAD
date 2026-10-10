/* FilePreview — универсальный предпросмотр файла проекта в модальном окне.
   Картинки показываются как <img>, текстовые — в CodeEditor (read-only),
   бинарные — как информационный блок. */
(function (global, $) {
    'use strict';

    var MIME_MAP = {
        png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
        gif: 'image/gif', bmp: 'image/bmp', webp: 'image/webp',
        svg: 'image/svg+xml', ico: 'image/x-icon'
    };

    var TEXT_EXTS = /^(txt|md|json|js|ts|css|html|htm|xml|frm|php|java|cs|cpp|c|h|hpp|sql|sh|bat|cmd|ps1|yml|yaml|log|ini|cfg|conf|properties|gradle|kt|scala|rb|py|pl|go|rs|vue|tsx|jsx)$/i;
    var IMAGE_EXTS = /^(png|jpg|jpeg|gif|bmp|webp|svg|ico)$/i;

    function extOf(path) {
        var m = String(path || '').match(/\.([^.\\\/]+)$/);
        return m ? m[1].toLowerCase() : '';
    }

    function langFor(path) {
        var e = extOf(path);
        if (e === 'js' || e === 'ts' || e === 'jsx' || e === 'tsx' || e === 'vue') return 'javascript';
        if (e === 'css') return 'css';
        if (e === 'html' || e === 'htm' || e === 'xml' || e === 'frm' || e === 'svg') return 'xml';
        if (e === 'json') return 'json';
        if (e === 'sql') return 'sql';
        if (e === 'php') return 'php';
        if (e === 'java' || e === 'kt' || e === 'scala' || e === 'gradle') return 'java';
        if (e === 'cs') return 'cs';
        if (e === 'py') return 'python';
        if (e === 'rb') return 'ruby';
        if (e === 'go') return 'go';
        if (e === 'rs') return 'rust';
        if (e === 'yml' || e === 'yaml') return 'yaml';
        return 'plaintext';
    }

    function kindOf(path, data) {
        if (data && data.kind) return data.kind;
        var e = extOf(path);
        if (IMAGE_EXTS.test(e)) return 'image';
        if (TEXT_EXTS.test(e)) return 'text';
        // data URL — тоже картинка
        if (data && /^data:image\//.test(data.content || '')) return 'image';
        return 'binary';
    }

    var FilePreview = {
        open: function (path, data) {
            if (!data) return;
            var content = data.content || '';
            var kind = kindOf(path, data);

            if (kind === 'image') this._showImage(path, content);
            else if (kind === 'text') this._showText(path, content, langFor(path));
            else this._showBinary(path, data);
        },

        _showImage: function (path, content) {
            var host = document.createElement('div');
            host.style.width = '100%';
            host.style.height = '100%';
            host.style.overflow = 'auto';
            host.style.textAlign = 'center';
            host.style.background = '#2d2d2d';

            var img = document.createElement('img');
            img.src = content;
            img.style.maxWidth = '100%';
            img.style.maxHeight = '100%';
            img.style.display = 'inline-block';
            img.style.margin = '10px auto';
            host.appendChild(img);

            global.Modal.open({
                title: 'Preview: ' + path,
                content: host
            });
        },

        _showText: function (path, content, lang) {
            var editor = new global.CodeEditor({ value: content, language: lang });
            editor.ta.readOnly = true;
            editor.ta.style.cursor = 'text';
            global.Modal.open({
                title: 'Preview: ' + path,
                content: editor.el
            });
        },

        _showBinary: function (path, data) {
            var info = document.createElement('div');
            info.style.padding = '20px';
            info.style.fontFamily = 'Consolas, monospace';
            info.style.fontSize = '12px';
            info.style.color = '#555';
            var size = data && data.size ? ' (' + data.size + ' байт)' : '';
            info.textContent = 'Бинарный файл' + size + ': ' + path;
            global.Modal.open({
                title: 'Preview: ' + path,
                content: info
            });
        },

        /* Публичные хелперы — используются zip-utils. */
        _ext: extOf,
        _langFor: langFor,
        _kindOf: kindOf,
        _mimeForExt: function (e) {
            return MIME_MAP[String(e || '').toLowerCase()] || 'application/octet-stream';
        }
    };

    global.FilePreview = FilePreview;

})(window, jQuery);