/* ProjectFilePicker — модальное окно выбора файла из текущего проекта.

   Открывается кнопкой «…» рядом с URL-полем в Inspector.
   Пользователь может кликнуть по файлу в дереве (или ввести путь
   вручную в нижнем input) и подтвердить выбор.

   Экспортирует global.ProjectFilePicker. */
(function (global) {
    'use strict';

    var ProjectFilePicker = {
        open: function (opts) {
            opts = opts || {};
            var pm = global.IDE && global.IDE.projectManager;
            if (!pm || !pm.current) {
                alert('Проект не выбран. Выберите проект в панели Project.');
                return;
            }
            var project = pm.current;

            var host = document.createElement('div');
            host.className = 'wb-filepicker';
            host.style.cssText =
                'display:flex;flex-direction:column;height:100%;gap:4px;';

            var filterInput = document.createElement('input');
            filterInput.type = 'text';
            filterInput.placeholder = 'filter…';
            filterInput.className = 'wb-filepicker-filter';
            host.appendChild(filterInput);

            var treeBox = document.createElement('div');
            treeBox.className = 'wb-filepicker-tree';
            host.appendChild(treeBox);

            var rootUl = document.createElement('ul');
            rootUl.className = 'wb-ptree wb-ptree-root';
            treeBox.appendChild(rootUl);

            var pathInput = document.createElement('input');
            pathInput.type = 'text';
            pathInput.className = 'wb-filepicker-path';
            pathInput.placeholder = 'путь или выберите файл в списке';
            pathInput.value = opts.value || '';
            host.appendChild(pathInput);

            function buildNode(prefix, parentUl) {
                var files = project.files || {};
                var searchPrefix = prefix ? prefix + '/' : '';
                var folders = {};
                var fileList = [];

                for (var p in files) {
                    if (!files.hasOwnProperty(p)) continue;
                    if (p === '.keep' || /(^|\/)\.keep$/.test(p)) continue;
                    if (searchPrefix && p.indexOf(searchPrefix) !== 0) continue;

                    var rest = prefix ? p.substring(searchPrefix.length) : p;
                    if (!rest) continue;
                    var slash = rest.indexOf('/');
                    if (slash < 0) fileList.push(rest);
                    else folders[rest.substring(0, slash)] = true;
                }

                var folderNames = Object.keys(folders).sort();
                var fileNames = fileList.sort();

                for (var i = 0; i < folderNames.length; i++) {
                    var fname = folderNames[i];
                    var fpath = prefix ? prefix + '/' + fname : fname;

                    var li = document.createElement('li');
                    var toggle = document.createElement('span');
                    toggle.className = 'wb-toggle';
                    toggle.textContent = '−';
                    li.appendChild(toggle);

                    var lbl = document.createElement('span');
                    lbl.className = 'wb-tree-label wb-ptree-folder';
                    lbl.textContent = fname;
                    lbl.setAttribute('data-path', fpath);
                    lbl.setAttribute('data-type', 'folder');
                    li.appendChild(lbl);

                    var ul = document.createElement('ul');
                    buildNode(fpath, ul);
                    li.appendChild(ul);

                    (function (ul, toggle) {
                        toggle.addEventListener('click', function (e) {
                            e.stopPropagation();
                            if (ul.style.display === 'none') {
                                ul.style.display = '';
                                toggle.textContent = '−';
                            } else {
                                ul.style.display = 'none';
                                toggle.textContent = '+';
                            }
                        }, false);
                    })(ul, toggle);

                    parentUl.appendChild(li);
                }

                for (var j = 0; j < fileNames.length; j++) {
                    var name = fileNames[j];
                    var path = prefix ? prefix + '/' + name : name;

                    var li2 = document.createElement('li');
                    var t = document.createElement('span');
                    t.className = 'wb-toggle wb-leaf';
                    li2.appendChild(t);

                    var lbl2 = document.createElement('span');
                    lbl2.className = 'wb-tree-label wb-ptree-file';
                    lbl2.textContent = name;
                    lbl2.setAttribute('data-path', path);
                    lbl2.setAttribute('data-type', 'file');
                    lbl2.setAttribute('title', path);
                    li2.appendChild(lbl2);
                    parentUl.appendChild(li2);
                }
            }
            buildNode('', rootUl);

            function findLabel(t) {
                while (t && t !== treeBox) {
                    if (t.classList && t.classList.contains('wb-tree-label')) return t;
                    t = t.parentNode;
                }
                return null;
            }

            treeBox.addEventListener('click', function (e) {
                var lbl = findLabel(e.target);
                if (!lbl) return;
                var all = treeBox.querySelectorAll('.wb-tree-label');
                for (var i = 0; i < all.length; i++) all[i].classList.remove('wb-selected');
                lbl.classList.add('wb-selected');
                if (lbl.getAttribute('data-type') === 'file') {
                    pathInput.value = lbl.getAttribute('data-path');
                }
            }, false);

            treeBox.addEventListener('dblclick', function (e) {
                var lbl = findLabel(e.target);
                if (!lbl) return;
                if (lbl.getAttribute('data-type') !== 'file') return;
                pathInput.value = lbl.getAttribute('data-path');
                global.Modal.ok();
            }, false);

            filterInput.addEventListener('input', function () {
                var q = (filterInput.value || '').toLowerCase();
                var labels = treeBox.querySelectorAll('.wb-tree-label');
                for (var i = 0; i < labels.length; i++) {
                    var lbl = labels[i];
                    var match = !q || lbl.textContent.toLowerCase().indexOf(q) >= 0;
                    var li = lbl.parentNode;
                    if (li) li.style.display = match ? '' : 'none';
                }
                var uls = treeBox.querySelectorAll('ul');
                for (var j = 0; j < uls.length; j++) uls[j].style.display = '';
            }, false);

            global.Modal.open({
                title: 'Select Project File',
                content: host,
                onOk: function () {
                    var v = pathInput.value || '';
                    if (opts.onPick) opts.onPick(v);
                }
            });

            setTimeout(function () { filterInput.focus(); }, 50);
        }
    };

    global.ProjectFilePicker = ProjectFilePicker;

})(window);