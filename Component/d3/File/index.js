/* cmpFile — поле загрузки/скачивания файла.

   Серверный контрол: FileCtrl.inc (class FileBase / class File).
   Клиентский контрол: File.js (D3Api.FileCtrl).

   Серверный Show() собирает:
     <div class="ctrl_file" tabindex="0"
          value="<fileuid>" caption="<filename>"
          [userdata="true"] [extentions="..."]
          [storage="db|fs"] [file_store="db|fs"] [max_size="..."]>
       [<span class="file_label">Label:</span>]
       <div class="file_loader" cont="fileloader">
         <form method="post" onsubmit="return false;" enctype="multipart/form-data">
           <div class="file_select">
             <input [multiple] [accept="..."] type="file" name="file"/>
             <span>Выбрать...</span>
             <div class="progress"></div>
             <div class="percent"></div>
           </div>
           <input type="hidden" name="request" value="{}"/>
         </form>
       </div>
       <div class="file_info" style="display:none;" cont="fileinfo">
         <span class="file_name" cont="filename"></span>
         [<span class="file_save" onclick="D3Api.FileCtrl.fileSave(this)">Скачать</span>]
         [<span class="file_delete" onclick="D3Api.FileCtrl.fileDelete(this)">Очистить</span>]
       </div>
     </div>

   Атрибуты:
     name           — имя контрола.
     value          — uid загруженного файла.
     caption        — имя файла для отображения.
     label          — подпись слева от поля.
     downloadable   — показывать ссылку «Скачать» (по умолчанию true).
     download_label — текст ссылки скачивания (по умолчанию «Скачать»).
     readonly       — только чтение (скрывает выбор и удаление).
     extentions     — список допустимых расширений через ';'.
     max_size       — максимальный размер файла.
     multiple       — разрешить выбор нескольких файлов.
     storage        — 'db' | 'fs' — хранилище.
     file_store     — 'db' | 'fs' — режим хранения (перекрывает storage).
     accept         — атрибут accept для <input type=file>.
     vars           — список query-переменных через ';' (для select/script).
     select         — base64 код для Action сохранения (userdata-режим).
     script         — PHP-скрипт для Action сохранения (userdata-режим).

   В IDE: chrome-узлы (file_label, file_loader, file_info) создаются в create()
   с маркерами data-wb-ide="1" — они видны в canvas, но не сериализуются
   и не появляются в дереве. При изменении value / caption через preview()
   переключаем видимость file_loader / file_info. */
(function (global) {
    'use strict';
    var D3 = global.D3;
    var CS = global.CommonSchema;

    function mkChrome(doc, cls, part, text) {
        var d = doc.createElement('span');
        d.className = cls;
        d.setAttribute('data-wb-ide', '1');
        if (part) d.setAttribute('data-part', part);
        if (text != null) d.textContent = text;
        return d;
    }

    D3.register({
        id: 'd3.file', tagName: 'cmpFile', caption: 'File',
        icon: 'images/icon.png',
        previewCss: ['css/preview.css'],
        attrs: {
            name: '',
            value: '',
            caption: '',
            label: '',
            download_label: 'Скачать'
        },

        create: function (doc) {
            var el = doc.createElement('cmpfile');
            el.setAttribute('data-wb-tag', 'cmpFile');
            el.setAttribute('name', '');
            el.setAttribute('value', '');
            el.setAttribute('caption', '');
            el.setAttribute('label', '');
            el.setAttribute('download_label', 'Скачать');

            /* label — chrome-узел (виден, не сериализуется). */
            var label = mkChrome(doc, 'file_label', 'label', '');
            label.style.display = 'none';
            el.appendChild(label);

            /* Зона загрузки. */
            var loader = doc.createElement('div');
            loader.className = 'file_loader';
            loader.setAttribute('data-wb-ide', '1');
            loader.setAttribute('data-part', 'loader');

            var sel = doc.createElement('div');
            sel.className = 'file_select';
            var btn = doc.createElement('span');
            btn.textContent = 'Выбрать...';
            sel.appendChild(btn);
            loader.appendChild(sel);
            el.appendChild(loader);

            /* Зона информации о файле (по умолчанию скрыта). */
            var info = doc.createElement('div');
            info.className = 'file_info';
            info.setAttribute('data-wb-ide', '1');
            info.setAttribute('data-part', 'info');
            info.style.display = 'none';

            var fname = doc.createElement('span');
            fname.className = 'file_name';
            fname.setAttribute('data-part', 'filename');

            var save = doc.createElement('span');
            save.className = 'file_save';
            save.textContent = 'Скачать';

            var del = doc.createElement('span');
            del.className = 'file_delete';
            del.textContent = 'Очистить';

            info.appendChild(fname);
            info.appendChild(save);
            info.appendChild(del);
            el.appendChild(info);

            return el;
        },

        /* Обновляет chrome-узлы по атрибутам — без создания preview-узла. */
        preview: function (el) {
            var val = el.getAttribute('value') || '';
            var cap = el.getAttribute('caption') || '';
            var label = el.getAttribute('label') || '';
            var dl = el.getAttribute('download_label') || 'Скачать';
            var readonly = el.getAttribute('readonly') === 'true';
            var downloadable = el.getAttribute('downloadable') !== 'false';
            var multiple = el.getAttribute('multiple') === 'true';
            var accept = el.getAttribute('accept') || '';

            var kids = el.children;
            for (var i = 0; i < kids.length; i++) {
                var k = kids[i];
                if (k.getAttribute && k.getAttribute('data-wb-ide') !== '1') continue;
                var part = k.getAttribute('data-part');

                if (part === 'label') {
                    if (label) {
                        k.textContent = label + ':';
                        k.style.display = '';
                    } else {
                        k.style.display = 'none';
                    }
                } else if (part === 'loader') {
                    if (val || readonly) k.style.display = 'none';
                    else k.style.display = '';
                    var inp = k.querySelector('input');
                    if (inp) {
                        if (multiple) inp.setAttribute('multiple', '');
                        else inp.removeAttribute('multiple');
                        if (accept) inp.setAttribute('accept', accept);
                        else inp.removeAttribute('accept');
                    }
                } else if (part === 'info') {
                    if (val) k.style.display = '';
                    else k.style.display = 'none';
                    var fn = k.querySelector('[data-part="filename"]');
                    if (fn) fn.textContent = cap || '';
                    var sv = k.querySelector('.file_save');
                    if (sv) {
                        sv.textContent = dl;
                        sv.style.display = downloadable ? '' : 'none';
                    }
                    var dlBtn = k.querySelector('.file_delete');
                    if (dlBtn) dlBtn.style.display = readonly ? 'none' : '';
                }
            }
            return null;
        },

        /* ---------------- Properties ---------------- */
        properties: [
            /* --- HTML --- */
            { type: 'separator', caption: 'HTML attributes' },
            { name: 'id',    caption: 'Id',    type: 'string', attr: true },
            { name: 'class', caption: 'Class', type: 'string', attr: true },
            { name: 'style', caption: 'Style', type: 'string', attr: true },
            { name: 'accept', caption: 'Accept', type: 'string', attr: true },

            /* --- D3 Base --- */
            { type: 'separator', caption: 'D3 Base' },
            { name: 'name',    caption: 'Name',    type: 'string',  attr: true },
            { name: 'value',   caption: 'Value',   type: 'string',  attr: true },
            { name: 'enabled', caption: 'Enabled', type: 'boolean', attr: true },
            { name: 'visible', caption: 'Visible', type: 'boolean', attr: true },
            { name: 'hint',    caption: 'Hint',    type: 'string',  attr: true },
            { name: 'width',   caption: 'Width',   type: 'string',  attr: true },

            /* --- File --- */
            { type: 'separator', caption: 'File' },
            { name: 'caption',        caption: 'Caption (filename)', type: 'string',  attr: true },
            { name: 'label',          caption: 'Label',              type: 'string',  attr: true },
            { name: 'downloadable',   caption: 'Downloadable',       type: 'boolean', attr: true },
            { name: 'download_label', caption: 'Download Label',     type: 'string',  attr: true },
            { name: 'readonly',       caption: 'ReadOnly',           type: 'boolean', attr: true },
            { name: 'multiple',       caption: 'Multiple',           type: 'boolean', attr: true },
            { name: 'extentions',     caption: 'Extensions',         type: 'string',  attr: true },
            { name: 'max_size',       caption: 'Max Size',           type: 'number',  attr: true },
            { name: 'storage',        caption: 'Storage',            type: 'enum',    attr: true,
                values: ['', 'db', 'fs'] },
            { name: 'file_store',     caption: 'File Store',         type: 'enum',    attr: true,
                values: ['', 'db', 'fs'] },
            { name: 'vars',           caption: 'Vars',               type: 'string',  attr: true },
            { name: 'select',         caption: 'Select (base64)',    type: 'string',  attr: true },
            { name: 'script',         caption: 'Script',             type: 'code',    attr: true }
        ],

        /* ---------------- Events ---------------- */
        events: [
            { name: 'onload',         caption: 'OnLoad',         type: 'code' },
            { name: 'onsave',         caption: 'OnSave',         type: 'code' },
            { name: 'ondelete',       caption: 'OnDelete',       type: 'code' },
            { name: 'onbefore_delete',caption: 'OnBeforeDelete', type: 'code' },
            { name: 'onfileupload',   caption: 'OnFileUpload',   type: 'code' },
            { name: 'onfocus',        caption: 'OnFocus',        type: 'code' },
            { name: 'onblur',         caption: 'OnBlur',         type: 'code' },
            { name: 'onclick',        caption: 'OnClick',        type: 'code' }
        ],

        /* ---------------- Styles ---------------- */
        styles: CS.STYLE_FIELDS.slice()
    });

})(window);