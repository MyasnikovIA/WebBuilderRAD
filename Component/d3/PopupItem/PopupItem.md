# cmpPopupItem

Пункт контекстного меню. Может быть:

- **обычным пунктом** с текстом, иконкой и обработчиком клика;
- **разделителем** (`caption="-"`) — тонкая линия между группами;
- **подменю** — если внутри `PopupItem` есть другие `PopupItem`.

В рантайме сервер рендерит `<div class="item">` с `<table>` внутри
(иконка + текст + caret для подменю). Клиентский `D3Api.PopupItemCtrl`
управляет наведением, показом подменю, видимостью.

Пункт не работает вне `PopupMenu` — он только наполняет меню
своим HTML-фрагментом.

---

## Расположение

```
Component/d3/PopupItem/
index.js
README.md              ← этот файл
images/icon.png
css/preview.css
js/                    (пусто)
```

**Серверные файлы:**

| Файл | Роль |
|---|---|
| `PopupMenuCtrl.inc` | class `PopupItem extends BaseCtrl` (в одном файле с `PopupMenu`) |
| `PopupMenu.js` | `D3Api.PopupItemCtrl` |
| `PopupMenu.css` | Стили `.item`, `.itemCaption`, `.caret`, `.subItems`, `.itemIcon` |

---

## Тег и ID

- **XML-тег:** `cmpPopupItem`
- **Регистрация в IDE:** `id: 'd3.popupitem'`
- **Категория:** D3
- **Вид в палитре:** `PopupItem`
- **Видимость:** видимый (рендерится родителем)
- **parentOnly:** `['cmppopupmenu', 'cmppopupgroupitem', 'cmppopupitem']` —
  можно вставить в `PopupMenu`, `PopupGroupItem` или другой `PopupItem`
  (для подменю)

---

## Разметка в рантайме

### Обычный пункт

```html
<div class="item" caption="Обновить">
  <table style="width:100%" cmpparse="PopupItem" cont="item"
         onclick="refreshDataSet('DS_HH'); D3Api.PopupItemCtrl.clickItem(this);"
         onmouseover="D3Api.PopupItemCtrl.hoverItem(this);">
    <tr>
      <td class="itemCaption">
        <img src="~CmpPopupMenu/Icons/refresh" cont="itemIcon" class="itemIcon"/>
        <span cont="itemCaption">Обновить</span>
      </td>
      <td class="caret"></td>
    </tr>
  </table>
</div>
```

### Разделитель (`caption="-"`)

```html
<div class="item separator" item_split="true"></div>
```

### Подменю (если внутри есть `PopupItem`)

```html
<div class="item haveItems" caption="Экспорт">
  <table style="width:100%" cmpparse="PopupItem" cont="item"
         onmouseover="D3Api.PopupItemCtrl.hoverItem(this);">
    <tr>
      <td class="itemCaption">
        <img src="…" cont="itemIcon" class="itemIcon"/>
        <span cont="itemCaption">Экспорт</span>
      </td>
      <td class="caret"></td>
    </tr>
  </table>
  <div class="popupMenu subItems" cont="menu">
    …вложенные PopupItem…
  </div>
</div>
```

Класс `haveItems` включает показ `caret` (→) справа. Класс
`subItems` у вложенного `<div>` открывается при наведении через
`D3Api.PopupItemCtrl.hoverItem`.

---

## Свойства (инспектор IDE)

### HTML attributes
- `id`, `class`, `style`

### D3 Base
- `name`, `enabled`, `visible`, `hint`

### PopupItem
- **`caption`** — текст пункта. Если `'-'`, рендерится как разделитель
- **`icon`** — URL иконки
- **`std_icon`** — имя стандартной иконки. Сервер сам подставит
  `~CmpPopupMenu/Icons/<std_icon>`, если `icon` пусто
- **`default`** — `true` — пункт по умолчанию (для `defaultAction`)

### Events
- **`onclick`** — обработчик клика. Пользовательский вызов идёт **до**
  системного (`D3Api.PopupItemCtrl.clickItem(this)`), который закрывает
  меню
- **`onmouseover`** — обработчик наведения. Пользовательский вызов
  идёт до системного (`D3Api.PopupItemCtrl.hoverItem(this)`)

### Styles
Полный набор CSS-свойств из `CommonSchema.STYLE_FIELDS`.

---

## Формат атрибутов

| Атрибут | Описание |
|---|---|
| `caption` | Текст пункта. `-` — разделитель. Может быть пустым для пункта без текста |
| `icon` | Абсолютный или серверный URL иконки |
| `std_icon` | Имя стандартной иконки: `refresh`, `insert`, `edit`, `delete`, `logs`, `report`, `printer`, `upload`, `download`, `userprocs`, `unitprops`, `jdocs` |
| `default` | `true` — пункт по умолчанию |
| `name` | Имя пункта для `getControl(name)` или динамических операций (`addItem`, `deleteItem`) |
| `onclick` | JS-код. Вызов идёт перед системным закрытием меню |
| `onmouseover` | JS-код. Вызов идёт перед системным `hoverItem` |
| `visible` | `false` — пункт скрыт (не отображается в меню) |
| `enabled` | `false` — пункт недоступен (серый, курсор default) |

---

## Логика работы

### Инициализация (сервер)

`PopupItem::__construct`:

1. Навешивает `onclick="D3Api.PopupItemCtrl.clickItem(this);"` через
   `extendEvent`.
2. Навешивает `onmouseover="D3Api.PopupItemCtrl.hoverItem(this);"`.
3. Создаёт `clickHover` — обработчик наведения с флагом
   (для случая «клик по подменю»).
4. Резолвит `icon`: если пусто, но задан `std_icon`, подставляет
   `~CmpPopupMenu/Icons/<std_icon>`.

### Рендер (сервер)

`PopupItem::Show`:

1. Проверяет родителя — `PopupMenu`, `PopupGroupItem` или
   `PopupItem`.
2. Если родитель — `PopupItem`, увеличивает `parent->items` (это
   значит, что текущий пункт будет подменю).
3. Если `caption == '-'` — рендерит `<div class="item separator">`
   и выходит.
4. Иначе — рендерит `<div class="item">` с `<table>`, иконкой и
   текстом. Если `items > 0` — добавляет класс `haveItems` и
   вложенный `<div class="subItems">`.

### Клиент

**`D3Api.PopupItemCtrl.clickItem(dom)`** — вызывается при клике.
Находит родительское меню через `getControlByDom(dom, 'PopupMenu')`
и вызывает `hideFunc()` — меню закрывается.

**`D3Api.PopupItemCtrl.hoverItem(dom, click)`** — вызывается при
наведении:

1. Снимает `active` со всех пунктов меню.
2. Если у пункта есть подменю (`submenu`), показывает его рядом,
   с учётом границ окна.
3. Добавляет `active` текущему пункту.

**`D3Api.PopupItemCtrl.setVisible(dom, value)`** — управляет
видимостью с автоматической коррекцией разделителей: если после
скрытия пункта рядом стоят два разделителя, один из них тоже
скрывается.

**`D3Api.PopupItemCtrl.getCaption(dom)`** / **`setCaption(dom, value)`** —
читает/пишет текст в `<span cont="itemCaption">`.

**`D3Api.PopupItemCtrl.getIcon(dom)`** / **`setIcon(dom, value)`** —
читает/пишет URL в `<img cont="itemIcon">`.

---

## Примеры использования

### 1. Простой пункт

```xml
<cmpPopupItem name="pREFR" caption="Обновить"
              onclick="refreshDataSet('DS_HH');"
              icon="~CmpPopupMenu/Icons/refresh"/>
```

### 2. Разделитель

```xml
<cmpPopupItem caption="-"/>
```

Между двумя группами пунктов. Не имеет `name`, `onclick` не
вызывается.

### 3. Пункт без иконки

```xml
<cmpPopupItem name="pABOUT" caption="О программе"
              onclick="Form.showAbout();"/>
```

### 4. Пункт со стандартной иконкой

```xml
<cmpPopupItem name="pDEL" caption="Удалить"
              onclick="Form.delPC();"
              std_icon="delete"/>
```

Сервер подставит `icon="~CmpPopupMenu/Icons/delete"`.

### 5. Подменю

```xml
<cmpPopupItem name="pEXPORT" caption="Экспорт" icon="~CmpPopupMenu/Icons/upload">
    <cmpPopupItem name="pXLS" caption="В Excel" onclick="Form.exportXls();"/>
    <cmpPopupItem name="pPDF" caption="В PDF"   onclick="Form.exportPdf();"/>
    <cmpPopupItem name="pCSV" caption="В CSV"   onclick="Form.exportCsv();"/>
</cmpPopupItem>
```

Пункт «Экспорт» получает подменю с тремя пунктами. При наведении
подменю раскрывается справа.

### 6. Пункт по умолчанию

```xml
<cmpPopupItem name="pEDIT" caption="Редактировать"
              onclick="Form.editPC();"
              default="true"/>
```

Жирный шрифт. Вызывается через `D3Api.PopupMenuCtrl.defaultAction(menu)`.

### 7. Условная видимость

```xml
<cmpPopupItem name="pADMIN" caption="Администрирование"
              onclick="Form.openAdmin();"
              visible="false"/>
```

Показать в рантайме:

```js
setControlProperty('pADMIN', 'visible', true);
```

При скрытии серверный `PopupItemCtrl.setVisible` автоматически
убирает лишние разделители.

### 8. Отключённый пункт

```xml
<cmpPopupItem name="pSAVE" caption="Сохранить"
              onclick="Form.save();"
              enabled="false"/>
```

Серый текст, курсор default, клик не выполняется.

### 9. Комбинированный обработчик

```xml
<cmpPopupItem name="pEDIT" caption="Редактировать"
              onclick="Form.prepareEdit();"
              onmouseover="Form.onItemHover();"/>
```

Пользовательские обработчики вызовутся **до** системных:
сначала `Form.prepareEdit()`, потом `D3Api.PopupItemCtrl.clickItem`.
При наведении — сначала `Form.onItemHover()`, потом
`D3Api.PopupItemCtrl.hoverItem`.

### 10. Динамическое добавление

```js
var menu = getControl('ctxGrid');

var item = D3Api.PopupMenuCtrl.addItem(menu, {
    name: 'pCUSTOM',
    caption: 'Мой пункт',
    onclick: 'Form.custom();',
    icon: '~CmpPopupMenu/Icons/insert'
});
```

Пункт создаётся во время выполнения формы, а не при загрузке `.frm`.

---

## Поведение в IDE

`PopupItem` — видимый только через родителя (`PopupMenu`,
`PopupGroupItem` или другой `PopupItem`). Отдельного `preview()`
у него нет: `PopupMenu.preview()` сканирует детей и рисует общий
«скелет» меню.

### В canvas

Внутри `PopupMenu`:

```
┌──────────────────────────────┐
│  ┌──┐ Обновить               │
│  ┌──┐ ─────────────────────  │  ← разделитель (caption="-")
│  ┌──┐ Добавить               │
│  ┌──┐ Редактировать          │  ← пункт с подменю
│  ┌──┐ Удалить                │
└──────────────────────────────┘
```

Иконки-плейсхолдеры (пустые квадратики) слева эмулируют
`~CmpPopupMenu/Icons/…` — реальные пути серверные, в IDE не
загружаются.

### В дереве

```
cmpPopupMenu name="ctxGrid" popupobject="GRID_HH"
  cmpPopupItem name="pREFR" caption="Обновить"
  cmpPopupItem name="" caption="-"
  cmpPopupItem name="pADD"  caption="Добавить"
  cmpPopupItem name="pEDIT" caption="Редактировать"
    cmpPopupItem name="pEDIT_1" caption="В окне"
    cmpPopupItem name="pEDIT_2" caption="В модальном"
  cmpPopupItem name="pDEL"  caption="Удалить"
```

Подменю отображается как вложенные `cmpPopupItem` внутри
родителя. Ограничение `parentOnly` позволяет вложенность — IDE
не заблокирует вставку `PopupItem` в другой `PopupItem`.

### В инспекторе

- HTML attributes: `id`, `class`, `style`
- D3 Base: `name`, `enabled`, `visible`, `hint`
- PopupItem: `caption`, `icon`, `std_icon`, `default`
- Events: `OnClick`, `OnMouseOver`
- Styles: полный набор CSS-свойств

Изменение `caption` в инспекторе немедленно отражается в
canvas — `preview()` родителя перерисовывает «скелет».

### Ограничения

- **Без родителя невидим** — `PopupItem` вне `PopupMenu` /
  `PopupGroupItem` / другого `PopupItem` не рендерится. В IDE
  вставка вне этих родителей заблокирована через `PARENT_ONLY`.
- **Собственный preview отсутствует** — вся визуализация в
  родителе.
- **Реальные иконки не отображаются** — только placeholder.
- **Подменю не раскрывается** — в IDE пункт с подменю выглядит
  как обычный пункт (плюс нет визуального маркера `▸`).
  Если нужно — добавьте `class="haveItems"` вручную или расширьте
  `preview()` родителя.

---

## Интеграция с ядром IDE

### Подключение в `index.html`

Секция **D3 controls**:

```html
<script src="Component/d3/PopupMenu/index.js"></script>
<script src="Component/d3/PopupItem/index.js"></script>
<script src="Component/d3/PopupGroupItem/index.js"></script>
```

Порядок: `PopupMenu` до `PopupItem`.

### Правки в `ide/canvas.js`

**`CMP_TAGS`:**

```js
'cmppopupmenu':      'cmpPopupMenu',
'cmppopupitem':      'cmpPopupItem',
'cmppopupgroupitem': 'cmpPopupGroupItem',
```

**`_injectIdeStyle`:** не трогаем — `PopupItem` видим, но
скрывается CSS-правилом внутри `cmpPopupMenu`:

```css
cmpPopupMenu > cmpPopupItem,
cmpPopupMenu > cmpPopupGroupItem {
    display: none !important;
}
```

Правило живёт в `PopupMenu/css/preview.css`.

**`XML_SELF_CLOSE`:** не трогаем — `PopupItem` контейнерный
(может содержать подменю).

### Правки в `ide/app.js`

**`CMP_TAGS`:**

```js
'cmppopupmenu':      'cmpPopupMenu',
'cmppopupitem':      'cmpPopupItem',
'cmppopupgroupitem': 'cmpPopupGroupItem',
```

### Правки в `ide/panels.js`

**`PARENT_ONLY`** (массивы, потому что у `PopupItem` несколько
допустимых родителей):

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

1. **`caption="-"` — разделитель** — специальное значение. В дереве
   узел выглядит как обычный `cmpPopupItem`, но в preview
   родителя рендерится как тонкая линия. Не имеет `name`, не
   вызывается по клику.

2. **`onclick` совмещается с системным** — сервер вызывает
   `extendEvent('onclick', 'D3Api.PopupItemCtrl.clickItem(this);')`.
   Пользовательский `onclick` вызовется **до** системного. Это
   значит, что при клике:
    1. Сначала выполнится пользовательский код.
    2. Потом системный `clickItem` закроет меню.

   Если нужно предотвратить закрытие — вернуть `false` из
   пользовательского обработчика (но текущая реализация
   `clickItem` не проверяет возврат).

3. **`onmouseover` совмещается с системным** — то же правило:
   пользовательский вызов до системного `hoverItem`. Системный
   отвечает за показ подменю и подсветку.

4. **`icon` vs `std_icon`** — если заданы оба, приоритет у `icon`.
   `std_icon` используется только если `icon` пусто. При
   сохранении из IDE оба сохраняются.

5. **`default="true"`** — пункт по умолчанию. Вызывается через
   `D3Api.PopupMenuCtrl.defaultAction(menu)`, который находит
   `[default="true"]` и эмулирует клик. В IDE отражается жирным
   шрифтом в preview.

6. **`visible="false"` и разделители** — серверный
   `PopupItemCtrl.setVisible` автоматически скрывает один из двух
   подряд идущих разделителей. Это нужно, чтобы при скрытии
   пункта не оставалось «двойной линии».

7. **`enabled="false"`** — визуально серый, но всё ещё видим.
   Курсор становится default, клик не выполняется (CSS
   `.ctrl_disable > table { cursor: default }`). Отличие от
   `visible="false"`: пункт виден, но недоступен.

8. **Подменю не поддерживает keyboard-навигацию в IDE** — в
   рантайме `→` открывает подменю, `←` возвращает к родителю.
   В IDE-превью этого нет (статичный скелет).

9. **`parentOnly` проверяется только на сервере и IDE** — сервер
   проверит `parent->CmpType` в `Show()`. IDE — через
   `PARENT_ONLY` в `panels.js`. Вне допустимых родителей сервер
   молча пропустит рендер.

10. **Стандартные иконки** (`std_icon`) — список стандартных
    имён см. в `PopupMenuCtrl.inc` и каталоге
    `Components/PopupMenu/Icons/`. В IDE эти имена не валидируются,
    ошибочное значение приведёт к `<img>` с `src=""` (скрыт
    правилом `.itemIcon[src=""] { display: none }`).

---

## Чек-лист добавления нового экземпляра

1. Убедиться, что `PopupItem` добавляется **внутрь `PopupMenu`,
   `PopupGroupItem` или другого `PopupItem`** — иначе IDE не
   даст вставить (через `PARENT_ONLY`).
2. В инспекторе задать:
    - `caption` — текст пункта (или `"-"` для разделителя);
    - `name` — если нужен доступ по имени (для `getControl`,
      `addItem`, `deleteItem`);
    - `icon` или `std_icon` — иконка пункта;
    - `onclick` — JS-код обработчика клика.
3. Для пункта по умолчанию — `default="true"` (только для одного).
4. Для отключённого пункта — `enabled="false"`.
5. Для скрытого по умолчанию — `visible="false"`.
6. Для подменю — вложить нужные `PopupItem` внутрь текущего.
7. Проверить в дереве: `cmpPopupItem` должен быть ребёнком
   `cmpPopupMenu`, `cmpPopupGroupItem` или другого `cmpPopupItem`.
8. Проверить в canvas: пункт должен отображаться в «скелете» меню
   с правильным `caption` и (при наличии) placeholder-иконкой.

---

## См. также

- `Component/d3/PopupMenu/README.md` — родительский компонент
- `Component/d3/PopupGroupItem/README.md` — группа пунктов
- `Component/d3/Grid/README.md` — типичный потребитель PopupMenu
- `PopupMenuCtrl.inc` — серверный код `PopupItem`
- `PopupMenu.js` — клиентский `D3Api.PopupItemCtrl`
- `PopupMenu.css` — стили `.item`, `.itemCaption`, `.caret`,
  `.itemIcon`, `.subItems`
