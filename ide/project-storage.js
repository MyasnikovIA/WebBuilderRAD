/* ProjectStorage — CRUD для именованных проектов в LocalStorage.

   Модель проекта:
     {
       name:     'MyProject',
       mainFile: 'index.html',   — путь к стартовому файлу (для ZIP-экспорта)
       files: {
         'index.html':    { kind: 'text',  content: '...' },
         'css/style.css': { kind: 'text',  content: '...' },
         'img/logo.png':  { kind: 'image', content: 'data:image/png;base64,...' }
       }
     }

   Ключи LocalStorage:
     wb.projects       — { "MyProject": {...}, "Other": {...} }
     wb.currentProject — имя текущего активного проекта */
(function (global) {
    'use strict';

    var STORAGE_KEY = 'wb.projects';
    var CURRENT_KEY = 'wb.currentProject';

    function readAll() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch (e) { return {}; }
    }

    function writeAll(all) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
            return true;
        } catch (e) {
            console.error('[ProjectStorage] write error:', e);
            return false;
        }
    }

    var ProjectStorage = {
        list: function () {
            var all = readAll();
            var names = [];
            for (var k in all) if (all.hasOwnProperty(k)) names.push(k);
            names.sort();
            return names;
        },

        get: function (name) {
            if (!name) return null;
            var all = readAll();
            return all[name] || null;
        },

        create: function (name) {
            if (!name) return null;
            var all = readAll();
            if (all[name]) return null;
            all[name] = { name: name, mainFile: '', files: {} };
            writeAll(all);
            return all[name];
        },

        save: function (project) {
            if (!project || !project.name) return false;
            var all = readAll();
            all[project.name] = project;
            return writeAll(all);
        },

        remove: function (name) {
            var all = readAll();
            if (!all[name]) return false;
            delete all[name];
            writeAll(all);
            return true;
        },

        getCurrent: function () {
            try { return localStorage.getItem(CURRENT_KEY) || ''; } catch (e) { return ''; }
        },

        setCurrent: function (name) {
            try { localStorage.setItem(CURRENT_KEY, name || ''); } catch (e) {}
        },

        /* Уникальное имя нового файла в папке — если 'file.txt' уже есть,
           вернёт 'file (1).txt', 'file (2).txt' и т.д. */
        suggestPath: function (project, folder, filename) {
            if (!project) return filename;
            var base = folder ? folder + '/' + filename : filename;
            if (!project.files[base]) return base;
            var m = filename.match(/^(.*?)(\.[^.]+)?$/);
            var stem = m[1] || filename;
            var ext = m[2] || '';
            var i = 1;
            while (true) {
                var cand = folder
                    ? folder + '/' + stem + ' (' + i + ')' + ext
                    : stem + ' (' + i + ')' + ext;
                if (!project.files[cand]) return cand;
                i++;
            }
        },

        /* Плоский список каталогов, выведенный из путей файлов. */
        listFolders: function (project) {
            var set = {};
            if (!project || !project.files) return [];
            for (var p in project.files) {
                if (!project.files.hasOwnProperty(p)) continue;
                var parts = p.split('/');
                parts.pop();
                var cur = '';
                for (var i = 0; i < parts.length; i++) {
                    cur = cur ? cur + '/' + parts[i] : parts[i];
                    set[cur] = true;
                }
            }
            return Object.keys(set).sort();
        }
    };

    global.ProjectStorage = ProjectStorage;

})(window);