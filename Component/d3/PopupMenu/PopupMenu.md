```markdown
# cmpPopupMenu

Контейнер контекстного меню. В рантайме — скрытый `<div>` (`position: fixed;
display: none`), который показывается по правому клику на привязанный
контрол или программно через `D3Api.PopupMenuCtrl.show(coords)`.

Меню состоит из пунктов (`cmpPopupItem`), может содержать группы
(`cmpPopupGroupItem`) для отделения пользовательских пунктов от
системных. Пункты могут быть разделителями (`caption="-"`) или
подменю (если внутри `PopupItem` есть другие `PopupItem`).

Клиентский `D3Api.PopupMenuCtrl` управляет показом/скрытием,
позиционированием у курсора, клавиатурной навигацией, динамическим
добавлением/удалением пунктов.

---

## Расположение

```
Component/d3/PopupMenu/
index.js
README.md              ← этот файл
images/icon.png
css/preview.css
js/                    (пусто)

Component/d3/PopupItem/
index.js
README.md
images/icon.png
css/preview.css
js/

Component/d3/PopupGroupItem/
index.js
README.md
images/icon.png
css/preview.css
js/
```

**Серверные файлы:**

| Файл | Роль |
|---|---|
| `PopupMenuCtrl.inc` | class `PopupMenu`, `PopupItem`, `PopupGroupItem` |
| `AutoPopupMenuCtrl.inc` | class `AutoPopupMenu` — генерация меню по юниту |
| `PopupMenu.js` | `D3Api.PopupMenuCtrl`, `D3Api.PopupItemCtrl`, `D3Api.PopupGroupItemCtrl` |
| `PopupMenu.css` | Стили `.popupMenu`, `.item`, `.separator`, `.subItems` |

---

## Тег и ID

- **XML-тег:** `cmpPopupMenu`
- **Регистрация в IDE:** `id: 'd3.popupmenu'`
- **Категория:** D3
- **Вид в палитре:** `PopupMenu`
- **Видимость:** видимый (в canvas отображается «скелет» меню)
- **Дочерние компоненты:** `cmpPopupItem`, `cmpPopupGroupItem`

---

## Разметка в рантайме

Серверный `PopupMenu::Show()` собирает:

```html
<div class="popupMenu" tabindex="0" cont="menu" …attrs…>
  <div class="item waittext">Подождите...</div>
  …дети: PopupItem / PopupGroupItem…
  <div class="popupGroupItem" cont="groupitem"
       name="additionalMainMenu" cmptype="PopupGroupItem"></div>
  <div class="popupGroupItem" cont="groupitem"
       name="system" cmptype="PopupGroupItem" separator="before"></div>
</div>
```

Две служебные группы (`additionalMainMenu`, `system`) создаются
автоматически, если меню не является частью другого (`join_menu`).
В них попадают динамические пункты, добавляемые через `addItem`.

Показ меню:

- `D3Api.PopupMenuCtrl.show(dom, coords)` — программный показ;
- `D3Api.PopupMenuCtrl.showPopupMenu(event, anyDom, menuName)` —
  показ по событию;
- правый клик по контролу, привязанному через `popupobject` /
  `popupobject_var`.

---

## Свойства (инспектор IDE)

### HTML attributes
- `id`, `class`, `style`

### D3 Base
- `name` — имя меню (обязателен для `getControl(name)`)
- `enabled`, `visible`, `hint`

### PopupMenu
- **`popupobject`** — имя контрола, к которому привязано меню.
  Правый клик по контролу открывает меню
- **`popupobject_var`** — то же, но имя контрола берётся из переменной
- **`join_menu`** — имя другого меню, в которое вливаются пункты
  этого меню (при инициализации `PopupItem` копируются в группу
  `join_group` целевого меню)
- **`join_group`** — имя группы внутри `join_menu`. По умолчанию
  `'additionalMainMenu'`
- **`onpopup_action`** — имя Action, вызываемого перед показом
  меню (waitAction). Пока Action выполняется, меню показывает
  «Подождите...»
- **`autopopup`** — `true` — меню автозаполняемое (`AutoPopupMenu`).
  Для IDE-регистрации обычно не указывается

### Events
- `onpopup` — вызывается перед показом меню. Аргументы `(coords, show)`.
  Возврат `false` отменяет показ
- `onitem_add` — вызывается после `addItem`. Аргументы `(item, rootEl)`
- `onitem_delete` — вызывается перед `deleteItem`. Аргументы `(item, rootEl)`.
  Возврат `false` отменяет удаление
- `onclick`, `ondblclick`

### Styles
Полный набор CSS-свойств из `CommonSchema.STYLE_FIELDS`.

---

## Дочерние компоненты

### PopupItem

Пункт меню. Атрибуты:

- **`caption`** — текст. Если `'-'`, рендерится как разделитель
- **`icon`** — URL иконки
- **`std_icon`** — имя стандартной иконки из `~CmpPopupMenu/Icons/<std_icon>`
- **`onclick`** — обработчик клика. Пользовательский вызов идёт до
  системного (`D3Api.PopupItemCtrl.clickItem(this)`)
- **`onmouseover`** — обработчик наведения
- **`default`** — `true` — пункт по умолчанию (для `defaultAction`)
- **`visible`** — показывать ли пункт

`PopupItem` может содержать другие `PopupItem` — тогда рендерится
как подменю (класс `haveItems`, появляется `caret` →).

### PopupGroupItem

Группа пунктов. Визуально сама по себе не рендерится — служит
контейнером для отделения групп.

Атрибуты:

- **`name`** — имя группы (для `addGroupItem`)
- **`separator`** — `before` | `after` — куда поставить разделитель
  относительно группы. Если задано, `PopupMenu` создаст
  `<div class="item separator">` до/после группы

Может содержать `PopupItem` и другие `PopupGroupItem` (вложенные).

---

## Примеры использования

### 1. Простое контекстное меню для Grid

```xml
<cmpPopupMenu name="ctxGrid" popupobject="GRID_HH">
    <cmpPopupItem name="pREFR" caption="Обновить"
                  onclick="refreshDataSet('DS_HH');"
                  icon="~CmpPopupMenu/Icons/refresh"/>
    <cmpPopupItem caption="-"/>
    <cmpPopupItem name="pADD"  caption="Добавить"
                  onclick="Form.addPC();"
                  icon="~CmpPopupMenu/Icons/insert"/>
    <cmpPopupItem name="pEDIT" caption="Редактировать"
                  onclick="Form.editPC();"
                  icon="~CmpPopupMenu/Icons/edit"/>
    <cmpPopupItem name="pDEL"  caption="Удалить"
                  onclick="Form.delPC();"
                  icon="~CmpPopupMenu/Icons/delete"/>
</cmpPopupMenu>
```

Правый клик по `GRID_HH` открывает меню с этими пунктами.

### 2. Меню с подменю

```xml
<cmpPopupMenu name="ctxGrid" popupobject="GRID_HH">
    <cmpPopupItem name="pEXPORT" caption="Экспорт">
        <cmpPopupItem name="pXLS" caption="В Excel" onclick="Form.exportXls();"/>
        <cmpPopupItem name="pPDF" caption="В PDF"   onclick="Form.exportPdf();"/>
        <cmpPopupItem name="pCSV" caption="В CSV"   onclick="Form.exportCsv();"/>
    </cmpPopupItem>
    <cmpPopupItem caption="-"/>
    <cmpPopupItem name="pDEL" caption="Удалить" onclick="Form.delPC();"/>
</cmpPopupMenu>
```

Пункт «Экспорт» получает подменю с тремя пунктами.

### 3. Меню с группами

```xml
<cmpPopupMenu name="ctxGrid" popupobject="GRID_HH">
    <cmpPopupGroupItem name="userActions">
        <cmpPopupItem caption="Мой пункт 1" onclick="Form.custom1();"/>
        <cmpPopupItem caption="Мой пункт 2" onclick="Form.custom2();"/>
    </cmpPopupGroupItem>
    <cmpPopupGroupItem name="system" separator="before">
        <cmpPopupItem caption="Журнал изменений"
                      onclick="D3Api.showForm('System/Logs/logs');"
                      icon="~CmpPopupMenu/Icons/logs"/>
    </cmpPopupGroupItem>
</cmpPopupMenu>
```

Группа `system` отделена разделителем сверху.

### 4. Программный показ

```js
var menu = getControl('ctxGrid');
D3Api.PopupMenuCtrl.show(menu, { left: 200, top: 150 });
```

### 5. Показ по кнопке

```xml
<cmpButton caption="Действия"
           onclick="D3Api.PopupMenuCtrl.showPopupMenu(event, this, 'ctxGrid');"/>
```

### 6. Динамическое добавление пункта

```js
var menu = getControl('ctxGrid');
var item = D3Api.PopupMenuCtrl.addItem(menu, {
    name: 'pCUSTOM',
    caption: 'Пользовательский пункт',
    onclick: 'Form.custom();',
    icon: '~CmpPopupMenu/Icons/insert'
});
```

### 7. Динамическое удаление пункта

```js
var menu = getControl('ctxGrid');
var item = D3Api.PopupMenuCtrl.getItems(menu, true)[0];
D3Api.PopupMenuCtrl.deleteItem(menu, item);
```

### 8. Вливание пунктов в другое меню

Основное меню (`mainMenu`):

```xml
<cmpPopupMenu name="mainMenu" popupobject="GRID_HH">
    <cmpPopupItem caption="Обновить" onclick="Form.refresh();"/>
</cmpPopupMenu>
```

Дополнительное меню, которое вливается в основное:

```xml
<cmpPopupMenu name="extraMenu" join_menu="mainMenu" join_group="additionalMainMenu">
    <cmpPopupItem caption="Мой пункт 1" onclick="Form.custom1();"/>
    <cmpPopupItem caption="Мой пункт 2" onclick="Form.custom2();"/>
</cmpPopupMenu>
```

При инициализации пункты `extraMenu` копируются в группу
`additionalMainMenu` основного меню `mainMenu`.

### 9. Отмена показа через `onpopup`

```xml
<cmpPopupMenu name="ctxGrid" popupobject="GRID_HH"
              onpopup="Form.onPopup(arguments[0], arguments[1]);">
    …
</cmpPopupMenu>
```

```js
Form.onPopup = function(coords, show) {
    if (!Form.canShowMenu) return false;  // отменить показ
    return true;
};
```

### 10. Асинхронная подготовка меню

```xml
<cmpPopupMenu name="ctxGrid" popupobject="GRID_HH"
              onpopup_action="ACT_PREPARE_MENU">
    …
</cmpPopupMenu>
```

Action `ACT_PREPARE_MENU` выполнится перед показом. Пока он
работает, меню показывает «Подождите...».

---

## Логика работы

### Инициализация (`D3Api.PopupMenuCtrl.init`)

1. Устанавливает `z-index: 10` (кроме IE).
2. Проверяет `join_menu` / `join_menu_var`. Если задано — находит
   целевое меню, копирует пункты в указанную группу и завершает init.
3. Инициализирует `waitAction` (если задан `onpopup_action`).
4. Находит контрол `popupobject`, навешивает на него обработчик
   правого клика `popup(e)`.
5. Ищет все контролы с `popupmenu="<name>"` и навешивает на них тот
   же обработчик.
6. Переносит меню в `D3Form.DOM` (чтобы клики внутри меню не
   всплывали на другие контролы).
7. Обрабатывает группы с `separator="before"` / `"after"` — создаёт
   разделители и скрывает их, если группа пуста.

### Показ (`show(dom, coords)`)

1. Если задан `waitAction` — запускает его, показывает класс
   `waitAction`, ждёт `onafter_execute`.
2. Иначе — вызывает `onpopup`. Если вернул `false` — прерывает.
3. Считает позицию так, чтобы меню не вылезало за границы окна.
4. Навешивает `document.mousedown` — закрытие при клике вне меню.
5. Показывает меню.

### Скрытие

`D3Api.PopupMenuCtrl.hideFunc(event)`:

- если клик пришёл внутри меню — ничего не делает;
- иначе — скрывает меню, очищает `selected_item`, `parent_item`,
  снимает обработчик `document.mousedown`.

### Клавиатура (`CtrlKeyDown`)

- `↓` — следующий пункт (`setNextItem(dom, 1)`);
- `↑` — предыдущий (`setNextItem(dom, -1)`);
- `→` — открыть подменю текущего пункта;
- `←` — вернуться к родительскому меню;
- `Enter` — выполнить текущий пункт;
- `Esc` — закрыть меню.

Разделители (`class="separator"`) пропускаются при навигации.

### Динамические операции

- **`addItem(dom, attrs, rootItem, rootGroup, boolBefore, posItem)`** —
  создаёт новый пункт, парсит его через `D3Form.parse`, вставляет
  в указанное место. Вызывает `onitem_add`.
- **`deleteItem(dom, itemDom)`** — удаляет пункт. Если
  `onitem_delete` вернёт `false` — удаление отменяется.
- **`addGroupItem(dom, item, name)`** — создаёт новую группу
  `PopupGroupItem` внутри меню.

---

## Поведение в IDE

Компонент **видимый**. В canvas отображается «скелет» меню:

```
┌──────────────────────────────┐
│  ┌──┐ Обновить               │
│  ┌──┐ ─────────────────────  │
│  ┌──┐ Добавить               │
│  ┌──┐ Редактировать          │
│  ┌──┐ Удалить                │
│                              │
│                        menu  │
└──────────────────────────────┘
```

- Пункты читаются из детей `cmpPopupItem` и `cmpPopupGroupItem`.
- Разделители (`caption="-"`) рисуются тонкой линией.
- Иконки-плейсхолдеры (квадратики) слева — визуальная эмуляция
  `~CmpPopupMenu/Icons/…` (реальные пути серверные, в IDE не
  загружаются).
- Метка `menu` в углу — маркер того, что это PopupMenu, а не
  обычный список.

### В дереве

```
cmpPopupMenu name="ctxGrid" popupobject="GRID_HH"
  cmpPopupItem name="pREFR" caption="Обновить" icon="~CmpPopupMenu/Icons/refresh"
  cmpPopupItem name="" caption="-"
  cmpPopupItem name="pADD"  caption="Добавить" icon="~CmpPopupMenu/Icons/insert"
  cmpPopupItem name="pEDIT" caption="Редактировать" icon="~CmpPopupMenu/Icons/edit"
    cmpPopupItem name="pEDIT_1" caption="В окне"
    cmpPopupItem name="pEDIT_2" caption="В модальном"
  cmpPopupItem name="pDEL"  caption="Удалить" icon="~CmpPopupMenu/Icons/delete"
```

`PopupItem` и `PopupGroupItem` можно перетащить только в `PopupMenu`,
`PopupGroupItem` или другой `PopupItem` (для подменю). Ограничение
задано через `PARENT_ONLY.cmppopupitem` / `cmppopupgroupitem`.

### В инспекторе

Все атрибуты доступны для редактирования. У `PopupMenu` — 6
специфичных полей (`popupobject`, `popupobject_var`, `join_menu`,
`join_group`, `onpopup_action`, `autopopup`).

### Ограничения

- **PopupItem / PopupGroupItem не видны отдельно** — только через
  preview родителя.
- **Реальные иконки не отображаются** — placeholder-квадратики.
- **Меню показывается как блок** — в рантайме оно `position: fixed;
  display: none`, но в IDE мы это переопределяем.

---

## Интеграция с ядром IDE

### Подключение в `index.html`

Секция **D3 controls**:

```html
<script src="Component/d3/PopupMenu/index.js"></script>
<script src="Component/d3/PopupItem/index.js"></script>
<script src="Component/d3/PopupGroupItem/index.js"></script>
```

Порядок: `PopupMenu` до `PopupItem` и `PopupGroupItem`.

### Правки в `ide/canvas.js`

**`CMP_TAGS`:**

```js
'cmppopupmenu':      'cmpPopupMenu',
'cmppopupitem':      'cmpPopupItem',
'cmppopupgroupitem': 'cmpPopupGroupItem',
```

`_injectIdeStyle` и `XML_SELF_CLOSE` не трогаем — `PopupMenu`
видимый, `PopupItem` может содержать подменю (не самозакрывающийся).

### Правки в `ide/app.js`

**`CMP_TAGS`:**

```js
'cmppopupmenu':      'cmpPopupMenu',
'cmppopupitem':      'cmpPopupItem',
'cmppopupgroupitem': 'cmpPopupGroupItem',
```

### Правки в `ide/panels.js`

**`PARENT_ONLY`** (массивы, потому что у `PopupItem` и
`PopupGroupItem` несколько допустимых родителей):

```js
var PARENT_ONLY = {
    /* … существующие записи … */
    cmppopupitem:      ['cmppopupmenu', 'cmppopupgroupitem', 'cmppopupitem'],
    cmppopupgroupitem: ['cmppopupmenu', 'cmppopupgroupitem', 'cmppopupitem'],
    /* … */
};
```

`_canDrop` (DomTree) уже обрабатывает массивы — правка только в
словаре.

---

## Известные ограничения

1. **`PopupMenu` изначально скрыт** — в рантайме `display: none`, пока
   не вызван `show()`. В IDE отображается как «скелет».

2. **`PopupItem.caption = "-"`** — специальное значение для
   разделителя. В дереве он всё равно виден как обычный узел, но
   в preview рисуется линией.

3. **`PopupItem` может быть подменю** — если внутри есть другие
   `PopupItem`. Сервер добавляет класс `haveItems` и `caret` (→).
   В IDE-превью подменю не раскрывается — просто показывается
   родительский пункт.

4. **Реальные иконки** (`~CmpPopupMenu/Icons/…`) — серверные пути,
   недоступные в iframe IDE. В preview рисуется placeholder.
   В сохранённый XML `icon` попадает как есть.

5. **`join_menu`** — при инициализации пункты этого меню копируются
   в указанную группу целевого меню. В IDE отражается только через
   превью родителя; в дереве всё равно видны как дети исходного меню.

6. **`onpopup_action`** — асинхронная подготовка меню. В IDE
   моделируется только как атрибут; реальная логика — в рантайме.

7. **`AutoPopupMenu`** — серверный компонент, генерирующий меню
   автоматически на основе юнита. В IDE не регистрируется, потому
   что в `.frm` не используется напрямую — только через серверную
   логику.

8. **`popupobject` и `popupobject_var`** — взаимоисключающие. Если
   заданы оба, приоритет у `popupobject` (прямое имя контрола).

9. **`onitem_add` / `onitem_delete`** — события динамических
   операций. Вызываются через `D3Base.callEvent`. Для отмены
   удаления `onitem_delete` должен вернуть `false`.

10. **`document.mousedown` для закрытия меню** — навешивается при
    показе и снимается при скрытии. Если несколько меню открыты
    одновременно (что теоретически возможно), обработчики
    конфликтуют. В типовых случаях проблема не проявляется.

---

## Чек-лист добавления нового экземпляра

1. В палитре выбрать **D3 → PopupMenu**.
2. В инспекторе задать:
    - `name` — имя меню (для `getControl`);
    - `popupobject` — контрол, к которому привязано меню (правый клик
      открывает);
    - `onpopup_action` — если нужна асинхронная подготовка пунктов;
    - `enabled`, `visible` — по необходимости.
3. Добавить в `PopupMenu` нужные `PopupItem`:
    - `name` — для доступа через `getControl` / `addItem`;
    - `caption` — текст пункта (`"-"` для разделителя);
    - `icon` — URL иконки;
    - `onclick` — обработчик;
    - `default` — `true` для пункта по умолчанию.
4. Для подменю — вложить `PopupItem` в `PopupItem`.
5. Для группировки — использовать `PopupGroupItem`:
    - `name` — имя группы;
    - `separator` — `before` / `after` для разделителя.
6. Проверить в дереве: иерархия должна быть
   `PopupMenu → PopupItem / PopupGroupItem → PopupItem → …`.
7. Проверить в canvas: в «скелете» должны отображаться все пункты
   с правильными `caption` и разделителями.

---

## См. также

- `Component/d3/PopupItem/README.md` — детальное описание пункта
- `Component/d3/PopupGroupItem/README.md` — описание группы
- `Component/d3/Grid/README.md` — типичный потребитель PopupMenu
  (правый клик по строке)
- `PopupMenuCtrl.inc` — серверный код `PopupMenu`, `PopupItem`,
  `PopupGroupItem`
- `AutoPopupMenuCtrl.inc` — серверный код автоматической генерации
- `PopupMenu.js` — клиентские контролы
- `PopupMenu.css` — стили `.popupMenu`, `.item`, `.separator`,
  `.subItems`
```