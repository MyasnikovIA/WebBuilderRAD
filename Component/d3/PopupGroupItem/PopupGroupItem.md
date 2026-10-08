# cmpPopupGroupItem

Группа пунктов внутри контекстного меню. Используется для
логического разделения пунктов на категории (например,
пользовательские действия / системные действия).

Сам по себе `PopupGroupItem` не имеет визуального представления —
это только контейнер. Может содержать `PopupItem` и другие
`PopupGroupItem` (вложенные). Родительский `PopupMenu` собирает
содержимое всех групп в один `<div class="popupMenu">` с пунктами
подряд.

Серверная логика группировки минимальна: `PopupGroupItem::Show()`
оборачивает детей в `<div class="popupGroupItem" cont="groupitem">`.
Клиентский контрол `D3Api.PopupGroupItemCtrl` — пустой (нет
собственных методов).

---

## Расположение

```
Component/d3/PopupGroupItem/
index.js
README.md              ← этот файл
images/icon.png
css/preview.css
js/                    (пусто)
```

**Серверные файлы:**

| Файл | Роль |
|---|---|
| `PopupMenuCtrl.inc` | class `PopupGroupItem extends BaseCtrl` (в одном файле с `PopupMenu`) |
| `PopupMenu.js` | `D3Api.PopupGroupItemCtrl` — пустая заглушка |
| `PopupMenu.css` | Стили `.popupGroupItem` (минимальные) |

---

## Тег и ID

- **XML-тег:** `cmpPopupGroupItem`
- **Регистрация в IDE:** `id: 'd3.popupgroupitem'`
- **Категория:** D3
- **Вид в палитре:** `PopupGroupItem`
- **Видимость:** видимый (рендерится родителем)
- **parentOnly:** `['cmppopupmenu', 'cmppopupgroupitem', 'cmppopupitem']` —
  можно вставить в `PopupMenu`, в другую `PopupGroupItem` или в
  `PopupItem` (для группировки внутри подменю)

---

## Разметка в рантайме

Серверный `PopupGroupItem::Show()` формирует:

```html
<div class="popupGroupItem" cont="groupitem" …attrs…>
  …дети: PopupItem / PopupGroupItem…
</div>
```

Этот `<div>` вставляется в родительский `PopupMenu` через
`parent->SetInnerText(...)`. Внешне группа не выделяется — её
пункты просто идут подряд с пунктами других групп.

### Служебные группы

`PopupMenu::Show()` создаёт две служебные группы в конце меню,
если меню не вливается в другое (`isJoin == false`):

```html
<div class="popupGroupItem" cont="groupitem"
     name="additionalMainMenu" cmptype="PopupGroupItem"></div>
<div class="popupGroupItem" cont="groupitem"
     name="system" cmptype="PopupGroupItem" separator="before"></div>
```

- **`additionalMainMenu`** — для пользовательских динамических
  пунктов (`addItem`);
- **`system`** — для системных действий (`addItem` с параметром
  `'system'`).

Эти группы создаются сервером автоматически, в `.frm` их не
описывают.

### Разделители (`separator`)

Если у группы задан атрибут `separator`:

- `separator="before"` — `PopupMenu` создаст
  `<div class="item separator" item_split="true">` **перед** группой;
- `separator="after"` — **после** группы.

Разделитель скрывается (`ctrl_hidden`), если группа пуста, и
показывается при добавлении первого пункта. Это делает
клиентский код в `PopupMenuCtrl.init`:

```js
for (var collectionGroup = D3Api.getAllDomBy(dom, '[cont="groupitem"][separator]'), i = 0; …) {
    var placeSep = D3Api.getProperty(collectionGroup[i], 'separator');
    var sep = D3Api.createDom('<div class="item separator" item_split="true" cmptype="PopupItem"></div>');
    if (!collectionGroup[i].children.length) D3Api.addClass(sep, 'ctrl_hidden');
    collectionGroup[i].D3Store.separator = (placeSep === 'before') && D3Api.insertBeforeDom(collectionGroup[i], sep) ||
                                            (placeSep === 'after')  && D3Api.insertAfterDom(collectionGroup[i], sep) || null;
}
```

---

## Свойства (инспектор IDE)

### HTML attributes
- `id`, `class`, `style`

### D3 Base
- `name`, `enabled`, `visible`, `hint`

### PopupGroupItem
- **`name`** — имя группы. Используется в `addGroupItem`, а также в
  `PopupMenu` для поиска служебных групп (`additionalMainMenu`,
  `system`)
- **`separator`** — `""` | `before` | `after`. Куда поставить
  разделитель относительно группы. Если пусто — разделитель не
  создаётся

### Events
Пусто — `PopupGroupItem` не инициализирует собственных событий.

### Styles
Полный набор CSS-свойств из `CommonSchema.STYLE_FIELDS`.

---

## Формат атрибутов

| Атрибут | Описание |
|---|---|
| `name` | Имя группы. Если не задано — группа считается «безымянной», но всё равно работает |
| `separator` | `before` — разделитель перед группой; `after` — после; пусто — без разделителя |
| `visible` | `false` — группа и все её пункты скрыты |
| `enabled` | `false` — пункты группы недоступны (передаётся детям) |

---

## Логика работы

### Инициализация (сервер)

`PopupGroupItem::__construct`:

1. Проверяет родителя — `PopupMenu`, `PopupGroupItem` или
   `PopupItem`.
2. Очищает `$this->text`.

### Рендер (сервер)

`PopupGroupItem::Show`:

1. Проверяет родителя — `PopupMenu`, `PopupGroupItem` или
   `PopupItem`. Если иное — молча выходит.
2. Формирует `<div class="popupGroupItem" cont="groupitem" …attrs…>`
   с детьми.
3. Передаёт родителю через `SetInnerText(['caption' => '', 'text' => $showtext])`.

### Клиент

`D3Api.PopupGroupItemCtrl` — **пустой**. Группа не имеет
собственного поведения: клики по пунктам обрабатываются
`D3Api.PopupItemCtrl`, показ меню — `D3Api.PopupMenuCtrl`.

Скрытие группы целиком — через `D3Api.BaseCtrl.setVisible(group, false)`.
Это скроет саму `<div>` и, как следствие, всех её детей.

### Связь с `separator`

При инициализации `PopupMenu` обходит все группы с
`separator="before"` / `"after"`, создаёт соответствующие
разделители и запоминает их в `group.D3Store.separator`. При
добавлении первого пункта в группу через `addItem` разделитель
показывается:

```js
if (rootGroup && rootGroup.D3Store && rootGroup.D3Store.separator) {
    D3Api.removeClass(rootGroup.D3Store.separator, 'ctrl_hidden');
}
```

При удалении последнего пункта разделитель можно скрыть вручную
(автоматически не делается — это ответственность вызывающего кода).

---

## Примеры использования

### 1. Простая группа

```xml
<cmpPopupMenu name="ctxGrid" popupobject="GRID_HH">
    <cmpPopupGroupItem name="userActions">
        <cmpPopupItem caption="Мой пункт 1" onclick="Form.custom1();"/>
        <cmpPopupItem caption="Мой пункт 2" onclick="Form.custom2();"/>
    </cmpPopupGroupItem>
    <cmpPopupGroupItem name="systemActions">
        <cmpPopupItem caption="Журнал изменений"
                      onclick="D3Api.showForm('System/Logs/logs');"
                      icon="~CmpPopupMenu/Icons/logs"/>
    </cmpPopupGroupItem>
</cmpPopupMenu>
```

Обе группы визуально не выделяются — просто пункты идут подряд.

### 2. Группа с разделителем сверху

```xml
<cmpPopupMenu name="ctxGrid" popupobject="GRID_HH">
    <cmpPopupItem caption="Обновить" onclick="Form.refresh();"/>
    <cmpPopupGroupItem name="system" separator="before">
        <cmpPopupItem caption="Журнал изменений" onclick="Form.openLogs();"/>
        <cmpPopupItem caption="О программе" onclick="Form.showAbout();"/>
    </cmpPopupGroupItem>
</cmpPopupMenu>
```

Перед группой `system` появится горизонтальный разделитель:

```
┌──────────────────────────────┐
│  Обновить                    │
│  ─────────────────────       │  ← separator перед группой
│  Журнал изменений            │
│  О программе                 │
└──────────────────────────────┘
```

### 3. Вложенные группы

```xml
<cmpPopupMenu name="ctxGrid" popupobject="GRID_HH">
    <cmpPopupGroupItem name="export">
        <cmpPopupItem caption="В Excel" onclick="Form.xls();"/>
        <cmpPopupItem caption="В PDF"   onclick="Form.pdf();"/>
        <cmpPopupGroupItem name="exportAdvanced" separator="before">
            <cmpPopupItem caption="С шаблоном" onclick="Form.xlsTpl();"/>
            <cmpPopupItem caption="По расписанию" onclick="Form.xlsSched();"/>
        </cmpPopupGroupItem>
    </cmpPopupGroupItem>
</cmpPopupMenu>
```

Вложенная группа `exportAdvanced` отделена от `export` разделителем.

### 4. Группа внутри подменю

```xml
<cmpPopupItem name="pEXPORT" caption="Экспорт">
    <cmpPopupGroupItem name="main">
        <cmpPopupItem caption="В Excel" onclick="Form.xls();"/>
        <cmpPopupItem caption="В PDF"   onclick="Form.pdf();"/>
    </cmpPopupGroupItem>
    <cmpPopupGroupItem name="advanced" separator="before">
        <cmpPopupItem caption="В XML" onclick="Form.xml();"/>
    </cmpPopupGroupItem>
</cmpPopupItem>
```

`PopupGroupItem` можно вкладывать в `PopupItem` — это делит
подменю на секции.

### 5. Динамическое создание группы

```js
var menu = getControl('ctxGrid');
var group = D3Api.PopupMenuCtrl.addGroupItem(menu, null, 'myGroup');

// Добавить пункт в группу
D3Api.PopupMenuCtrl.addItem(menu, {
    caption: 'Пользовательский пункт',
    onclick: 'Form.custom();'
}, group);
```

Первый аргумент — корневое меню, второй — позиция (или `null`,
чтобы добавить в конец), третий — имя группы.

### 6. Скрытие группы целиком

```js
var group = getControl('userActions');
setControlProperty('userActions', 'visible', false);
```

Все пункты группы исчезнут из меню.

### 7. Группа в `join_menu` сценарии

```xml
<!-- Основное меню формы -->
<cmpPopupMenu name="mainMenu" popupobject="GRID_HH">
    <cmpPopupItem caption="Обновить" onclick="Form.refresh();"/>
</cmpPopupMenu>

<!-- Плагин, вливающийся в основное меню -->
<cmpPopupMenu name="pluginMenu" join_menu="mainMenu" join_group="additionalMainMenu">
    <cmpPopupItem caption="Плагин: действие 1" onclick="Plugin.action1();"/>
    <cmpPopupItem caption="Плагин: действие 2" onclick="Plugin.action2();"/>
</cmpPopupMenu>
```

При инициализации `pluginMenu` его пункты копируются в группу
`additionalMainMenu` меню `mainMenu`. Группа `additionalMainMenu`
создаётся автоматически в основном меню.

### 8. Служебная группа `system`

В `PopupMenu::Show()` автоматически создаётся:

```html
<div class="popupGroupItem" cont="groupitem"
     name="system" cmptype="PopupGroupItem" separator="before"></div>
```

В неё попадают системные пункты (логи, отчёты, экспорт), которые
добавляет `AutoPopupMenu` или прикладной код через `addItem(menu, attrs, null, 'system')`.

---

## Поведение в IDE

`PopupGroupItem` — видимый только через родителя (`PopupMenu`,
`PopupGroupItem` или `PopupItem`). Собственного `preview()` у него
нет: `PopupMenu.preview()` сканирует детей и рисует общий «скелет»
меню, включая содержимое групп.

### В canvas

Внутри `PopupMenu` пункты группы отображаются как обычные пункты
(без визуального выделения группы):

```
┌──────────────────────────────┐
│  ┌──┐ Обновить               │
│  ─────────────────────       │  ← separator перед группой
│  ┌──┐ Пользовательский 1     │
│  ┌──┐ Пользовательский 2     │
│  ┌──┐ Журнал изменений        │
└──────────────────────────────┘
```

Если группа пуста — она невидима (нет ни пунктов, ни разделителя,
если `separator` не задан или группа пуста).

### В дереве

```
cmpPopupMenu name="ctxGrid" popupobject="GRID_HH"
  cmpPopupGroupItem name="userActions"
    cmpPopupItem name="" caption="Мой пункт 1"
    cmpPopupItem name="" caption="Мой пункт 2"
  cmpPopupGroupItem name="system" separator="before"
    cmpPopupItem name="" caption="Журнал изменений"
```

Группа отображается отдельным узлом, дети — внутри него.
Ограничение `parentOnly` позволяет вкладывать группы друг в друга.

### В инспекторе

- HTML attributes: `id`, `class`, `style`
- D3 Base: `name`, `enabled`, `visible`, `hint`
- PopupGroupItem: `name`, `separator` (enum: `""` / `before` / `after`)
- Events: пусто
- Styles: полный набор CSS-свойств

### Ограничения

- **Без родителя невидима** — `PopupGroupItem` вне допустимых
  родителей не рендерится. В IDE вставка вне этих родителей
  заблокирована через `PARENT_ONLY`.
- **Собственный preview отсутствует** — вся визуализация в
  родителе.
- **`separator` не рисуется в превью** — в `preview()` родителя
  можно было бы отрисовать разделитель, но это усложнит
  сканирование. Сейчас группы видны просто как последовательность
  пунктов.

---

## Интеграция с ядром IDE

### Подключение в `index.html`

Секция **D3 controls**:

```html
<script src="Component/d3/PopupMenu/index.js"></script>
<script src="Component/d3/PopupItem/index.js"></script>
<script src="Component/d3/PopupGroupItem/index.js"></script>
```

Порядок: `PopupMenu` до `PopupGroupItem`.

### Правки в `ide/canvas.js`

**`CMP_TAGS`:**

```js
'cmppopupmenu':      'cmpPopupMenu',
'cmppopupitem':      'cmpPopupItem',
'cmppopupgroupitem': 'cmpPopupGroupItem',
```

**`_injectIdeStyle`:** не трогаем — `PopupGroupItem` видим, но
скрывается CSS-правилом внутри `cmpPopupMenu`:

```css
cmpPopupMenu > cmpPopupItem,
cmpPopupMenu > cmpPopupGroupItem {
    display: none !important;
}
```

Правило живёт в `PopupMenu/css/preview.css`.

**`XML_SELF_CLOSE`:** не трогаем — `PopupGroupItem` контейнерный.

### Правки в `ide/app.js`

**`CMP_TAGS`:**

```js
'cmppopupmenu':      'cmpPopupMenu',
'cmppopupitem':      'cmpPopupItem',
'cmppopupgroupitem': 'cmpPopupGroupItem',
```

### Правки в `ide/panels.js`

**`PARENT_ONLY`** (массивы, потому что у `PopupGroupItem`
несколько допустимых родителей):

```js
var PARENT_ONLY = {
    /* … */
    cmppopupitem:      ['cmppopupmenu', 'cmppopupgroupitem', 'cmppopupitem'],
    cmppopupgroupitem: ['cmppopupmenu', 'cmppopupgroupitem', 'cmppopupitem'],
    /* … */
};
```

---

## Известные ограничения

1. **Не имеет собственного визуального представления** — `<div class="popupGroupItem">` не стилизуется. Пункты внутри группы выглядят так же, как пункты вне группы.

2. **Разделитель создаётся через `PopupMenuCtrl.init`** — сервер только помечает группу атрибутом `separator="before"` / `"after"`. Реальный `<div class="item separator">` создаётся на клиенте при инициализации формы.

3. **Пустая группа + `separator`** — разделитель скрывается (класс `ctrl_hidden`), пока в группе нет ни одного видимого пункта. При добавлении первого пункта — показывается.

4. **Вложенность групп** — `PopupGroupItem` может содержать другой `PopupGroupItem`. В рантайме это работает, но визуально выделения нет — просто последовательность пунктов.

5. **`visible="false"` скрывает всю группу** — все пункты внутри перестают отображаться. Это реализовано через `D3Api.BaseCtrl.setVisible` на корне группы; CSS `display: none` скрывает потомков.

6. **`enabled="false"` не каскадируется** — если нужно, чтобы все пункты группы были недоступны, задайте `enabled="false"` каждому `PopupItem` вручную. BaseCtrl для `PopupGroupItem` не имеет специфичной логики.

7. **Служебные группы `additionalMainMenu` и `system`** — создаются сервером автоматически. В `.frm` их не описывают. При `join_menu`-сценарии пункты другого меню вливаются в одну из этих групп.

8. **`separator="before"` / `"after"`** — строки, не boolean. Значение `before`/`after` соответствует позиции разделителя относительно группы. Любое другое значение игнорируется.

9. **`PopupGroupItemCtrl` — пустой** — нет `get`/`set` методов, кроме базовых `BaseCtrl`. Все операции — через `D3Api.PopupMenuCtrl` (например, `addGroupItem`, `addItem` с указанием группы).

10. **Дерево в IDE показывает группы как узлы** — но в canvas и в рантайме группы визуально не выделяются. Это нормально: `PopupGroupItem` — служебный контейнер, его задача — только разделение.

---

## Чек-лист добавления нового экземпляра

1. Убедиться, что `PopupGroupItem` добавляется **внутрь `PopupMenu`,
   другой `PopupGroupItem` или `PopupItem`** — иначе IDE не даст
   вставить (через `PARENT_ONLY`).
2. В инспекторе задать:
    - `name` — имя группы (для `addGroupItem` и поиска);
    - `separator` — `before` / `after`, если нужна визуальная
      граница с соседними группами.
3. Положить внутрь нужные `PopupItem` (или вложенные
   `PopupGroupItem`).
4. Проверить в дереве: `cmpPopupGroupItem` должен быть ребёнком
   `cmpPopupMenu`, `cmpPopupGroupItem` или `cmpPopupItem`.
5. Проверить в canvas: пункты группы должны отображаться в
   «скелете» меню подряд, разделитель (если задан) — как
   тонкая линия.
6. При необходимости скрыть группу целиком — `visible="false"`.

---

## См. также

- `Component/d3/PopupMenu/README.md` — родительский компонент
- `Component/d3/PopupItem/README.md` — пункт меню
- `Component/d3/Grid/README.md` — типичный потребитель PopupMenu
- `PopupMenuCtrl.inc` — серверный код `PopupGroupItem`
- `PopupMenu.js` — клиентский `D3Api.PopupGroupItemCtrl` (пустой)
- `PopupMenu.css` — стили `.popupGroupItem`
