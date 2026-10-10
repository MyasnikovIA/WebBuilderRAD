/* Общие утилиты и константы для модулей panels.

   Здесь:
     • VOID_TAGS, STRICT_HEAD_TAGS, SERVICE_CLASSES
     • PARENT_ONLY
     • FILE_LIKE_NAMES, IMAGE_LIKE_NAMES + isFileField / isImageField
     • stripServiceClasses / getServiceClasses / isServiceClass
     • resolvePreviewSrc
   Экспортируются через global.PanelsUtils. */
(function (global) {
    'use strict';

    var VOID_TAGS = { IMG:1, INPUT:1, BR:1, HR:1, META:1, LINK:1, AREA:1, BASE:1,
        COL:1, EMBED:1, SOURCE:1, TRACK:1, WBR:1 };

    var STRICT_HEAD_TAGS = { meta:1, title:1, base:1 };

    var SERVICE_CLASSES = { 'wb-selected': 1, 'wb-hover': 1, 'wb-moving': 1 };

    var PARENT_ONLY = {
        cmpactionvar:    ['cmpaction', 'cmpsubaction'],
        cmpsubaction:    ['cmpaction', 'cmpsubaction'],
        cmpsubactionvar: 'cmpsubaction',
        cmpdatasetvar:   'cmpdataset',
        cmpfetchvar:     'cmpfetch',
        cmpmodulevar:    'cmpmodule',
        cmpcomboitem:    'cmpcombobox',
        cmpfilteritem:   'cmpfilter',
        cmpcolumn:       'cmpgrid',
        cmpgridfooter:   'cmpgrid',
        cmptreecolumn:   'cmptree',
        cmptreefooter:   'cmptree',
        cmptabsheet:     'cmppagecontrol',
        cmplayoutrow:    'cmplayout',
        cmpradioitem:    'cmpradiogroup',
        cmplayoutcell:   'cmplayoutrow',
        cmppopupitem:      ['cmppopupmenu', 'cmppopupgroupitem', 'cmppopupitem'],
        cmppopupgroupitem: ['cmppopupmenu', 'cmppopupgroupitem', 'cmppopupitem'],
        cmptagitem:      'cmpbuttonedit',
        cmpselectlistitem: 'cmpselectlist'
    };

    /* Имена полей, которые трактуются как «ссылка на файл/ресурс»:
       к ним автоматически добавляется кнопка выбора файла из проекта.
       Отключить автодетект: { name: 'data', type: 'string', filePicker: false } */
    var FILE_LIKE_NAMES = {
        'src': 1, 'href': 1, 'action': 1, 'srcset': 1, 'poster': 1,
        'icon': 1, 'path': 1, 'module': 1, 'url': 1, 'link': 1, 'file': 1,
        'formaction': 1, 'cite': 1, 'longdesc': 1, 'usemap': 1, 'codebase': 1,
        'manifest': 1, 'ping': 1, 'download': 1, 'profile': 1, 'archive': 1,
        'classid': 1, 'background': 1, 'img': 1, 'image': 1,
        'content': 1, 'logo': 1
    };

    var IMAGE_LIKE_NAMES = {
        'src': 1, 'poster': 1, 'icon': 1, 'logo': 1, 'img': 1, 'image': 1
    };

    function isFileField(f) {
        if (!f) return false;
        if (f.filePicker === false) return false;
        if (f.type === 'FILE') return true;
        if (f.type === 'image') return true;
        if (f.type === 'string' || !f.type) {
            var n = String(f.name || '').toLowerCase();
            if (FILE_LIKE_NAMES[n]) return true;
        }
        return false;
    }

    function isImageField(f) {
        if (!f) return false;
        if (f.type === 'image') return true;
        var n = String(f.name || '').toLowerCase();
        return !!IMAGE_LIKE_NAMES[n];
    }

    function isServiceClass(c) { return !!SERVICE_CLASSES[c]; }

    function stripServiceClasses(cls) {
        if (!cls) return '';
        return String(cls).split(/\s+/).filter(function (c) {
            return c && !isServiceClass(c);
        }).join(' ');
    }

    function getServiceClasses(cls) {
        if (!cls) return '';
        return String(cls).split(/\s+/).filter(function (c) {
            return c && isServiceClass(c);
        }).join(' ');
    }

    /* Пытается получить отображаемый src для превью картинки:
       data:/https?:/blob: — как есть, относительный путь — через ProjectResolver. */
    function resolvePreviewSrc(value) {
        if (!value) return '';
        var v = String(value);
        if (/^(data:|https?:|blob:)/i.test(v)) return v;
        if (global.ProjectResolver && global.ProjectResolver.isProjectPath &&
            global.ProjectResolver.isProjectPath(v)) {
            return global.ProjectResolver.resolve(v);
        }
        /* Fallback — читаем прямо из проекта. */
        var pm = global.IDE && global.IDE.projectManager;
        if (pm && pm.current && pm.current.files) {
            var f = pm.current.files[v];
            if (f && f.content) return f.content;
        }
        return '';
    }

    global.PanelsUtils = {
        VOID_TAGS:            VOID_TAGS,
        STRICT_HEAD_TAGS:     STRICT_HEAD_TAGS,
        SERVICE_CLASSES:      SERVICE_CLASSES,
        PARENT_ONLY:          PARENT_ONLY,
        FILE_LIKE_NAMES:      FILE_LIKE_NAMES,
        IMAGE_LIKE_NAMES:     IMAGE_LIKE_NAMES,
        isFileField:          isFileField,
        isImageField:         isImageField,
        isServiceClass:       isServiceClass,
        stripServiceClasses:  stripServiceClasses,
        getServiceClasses:    getServiceClasses,
        resolvePreviewSrc:    resolvePreviewSrc
    };

})(window);