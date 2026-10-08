# cmpTabSheet

Отдельная закладка внутри `cmpPageControl`. В рантайме рендерит
кнопку-таб (`<li>`) и соответствующую ей страницу (`<div>`),
которые родительский `PageControl` собирает в общий `<ul>` и блок
страниц.

`TabSheet` не имеет собственного визуального представления вне
`PageControl` — он только наполняет массивы `$parent->tabs[i]['button']`
и `$parent->tabs[i]['content']`. Поэтому **parentOnly: cmppagecontrol**.

Клиентский контрол (`D3Api.TabSheetCtrl`) минимален: управляет
видимостью связанной страницы, умеет читать/писать `caption` и
отдавать `index`. Основная логика переключения — в
`D3Api.PageControlCtrl`.

---

## Расположение

```
Component/d3/TabSheet/
index.js
README.md              ← этот файл
images/icon.png
css/preview.css
js/                    (пусто)
```

**Серверные файлы:**

| Файл | Роль |
|---|---|
| `PageControlCtrl.inc` | class `TabSheet extends BaseCtrl` (в том же файле, что `PageControl`) |
| `PageControl.js` | `D3Api.TabSheetCtrl` |
| `PageControl.css` | Стили `.ctrl_pageControlTabBtn`, `.ctrl_pageControlTabPage` |

---

## Тег и ID

- **XML-тег:** `cmpTabSheet`
- **Регистрация в IDE:** `id: 'd3.tabsheet'`
- **Категория:** D3
- **Вид в палитре:** `TabSheet`
- **Видимость:** видимый (рендерится родителем)
- **parentOnly:** `cmppagecontrol` (можно вставить только внутрь `PageControl`)

---

## Разметка в рантайме

### Кнопка таба (в `$parent->tabs[i]['button']`)

```html
<li class="ctrl_pageControlTabBtn tab0_pc5f1a2b3c4d"
    pageindex="0"
    cmptype="TabSheet"
    onclick="D3Api.PageControlCtrl.showTab(this);">
  <a class="centerTB" cont="tabcaption">Tab1</a>
</li>
```

### Страница (в `$parent->tabs[i]['content']`)

```html
<div cont="page0_pc5f1a2b3c4d"
     class="ctrl_pageControlTabPage page0_pc5f1a2b3c4d">
  …дети TabSheet…
</div>
```

Уникальные суффиксы (`_pc5f1a2b3c4d`) берутся из `uniqid` родительского
`PageControl`. Через них клиент находит нужный таб/страницу при
переключении.

**Порядок индексов (`pageindex`)** определяется порядком появления
`TabSheet` внутри `PageControl`: `$this->pageIndex = count($this->parent->tabs)`.

---

## Свойства (инспектор IDE)

### HTML attributes
- `id`, `class`, `style`, `title`

### D3 Base
- `name`, `enabled`, `visible`, `hint`

### TabSheet
- **`caption`** — текст на табе (то, что видно пользователю)
- **`active`** — `true` — эта закладка активна при открытии
- **`button_class`** — дополнительный CSS-класс на `<li>` таба
- **`content_class`** — дополнительный CSS-класс на `<div>` страницы

### Events
- `onclick`, `ondblclick`, `onmouseover`, `onmouseout`

Сервер при инициализации навешивает свой `onclick`:
`D3Api.PageControlCtrl.showTab(this);` — если пользователь задал свой,
он **добавляется** через `extendEvent`.

### Styles
Полный набор CSS-свойств из `CommonSchema.STYLE_FIELDS`.

---

## Формат атрибутов

| Атрибут | Обязательный | Описание |
|---|---|---|
| `caption` | нет | Текст таба. Пустой — сервер подставит `''`, будет визуально пустой таб |
| `active` | нет | `true` — закладка активна при открытии. Только у одной `TabSheet` в `PageControl` |
| `visible` | нет | `false` — закладка и страница скрыты |
| `button_class` | нет | Доп. класс на `<li>`. Разделитель — пробел |
| `content_class` | нет | Доп. класс на `<div>` страницы |
| `name` | нет | Имя закладки. Если пусто — сервер генерирует `<parent_name>_TabSheet<index>` |

---

## Логика работы

### Инициализация (сервер)

`TabSheet::__construct`:

1. Проверяет родителя — `parent->CmpType == 'PageControl'`.
2. Вычисляет `pageIndex = count($parent->tabs)`.
3. Если `name` не задано — присваивает `<parent_name>_TabSheet<index>`.
4. Регистрирует пустую пару в `parent->tabs[]`.
5. Если `active="true"` — пишет `parent->attrs['activeindex'] = pageIndex`.
6. Навешивает `onclick="D3Api.PageControlCtrl.showTab(this);"`.

### Рендер (сервер)

`TabSheet::Show`:

1. Проверяет `parent->CmpType == 'PageControl'`.
2. Формирует `<li>` с классом `tab<index>_<uniqid>` и записывает
   в `parent->tabs[index]['button']`.
3. Формирует `<div>` с классом `page<index>_<uniqid>` (детей,
   накопленных через `SetInnerText`) и записывает
   в `parent->tabs[index]['content']`.

### Клиент

`D3Api.TabSheetCtrl`:

- **`setVisible(dom, value)`** — через `BaseCtrl.setVisible` на самом
  табе и на связанной странице (`page<index>_<uniqid>`). Пересчитывает
  ширину табов через `CalckTabSheetHead`.
- **`getIndex(dom)`** — читает `pageindex`.
- **`getCaption(dom)`** — читает текст из `<a cont="tabcaption">`.
- **`setCaption(dom, value)`** — пишет текст в `<a cont="tabcaption">`.

Переключение закладок — на `D3Api.PageControlCtrl` (метод `showTab`).

---

## Примеры использования

### 1. Простая закладка

```xml
<cmpPageControl name="tabs" mode="horizontal">
    <cmpTabSheet name="" caption="Tab 1" active="true">
        <cmpLabel name="" caption="Содержимое первой вкладки"/>
    </cmpTabSheet>
    <cmpTabSheet name="" caption="Tab 2">
        <cmpLabel name="" caption="Содержимое второй вкладки"/>
    </cmpTabSheet>
</cmpPageControl>
```

### 2. Закладка с программируемой видимостью

```xml
<cmpPageControl name="tabs">
    <cmpTabSheet name="ts_main" caption="Основное" active="true">
        …
    </cmpTabSheet>
    <cmpTabSheet name="ts_admin" caption="Администрирование" visible="false">
        …
    </cmpTabSheet>
</cmpPageControl>
```

Показать вторую закладку в рантайме:

```js
setControlProperty('ts_admin', 'visible', true);
```

### 3. Стилизованная закладка

```xml
<cmpTabSheet name="" caption="Важное"
             button_class="tab-important"
             content_class="content-highlighted">
    …
</cmpTabSheet>
```

CSS (в форме):

```css
.tab-important .centerTB {
    color: #d32f2f;
    border-bottom-color: #d32f2f;
}
.content-highlighted {
    background: #fff8e1;
}
```

### 4. Программное переключение на закладку по имени

```js
// Найти PageControl и переключиться на закладку с index = 2
var pc = getControl('tabs');
D3Api.PageControlCtrl.setActiveIndex(pc, 2);
```

Или через свойство:

```js
setControlProperty('tabs', 'activeIndex', 2);
```

### 5. Реакция на клик по табу

```xml
<cmpTabSheet name="" caption="Tab 2"
             onclick="Form.onTab2Click();">
    …
</cmpTabSheet>
```

Сервер навесит оба обработчика: свой `showTab` (через `extendEvent`)
и пользовательский. При клике сначала сработает `showTab` — закладка
станет активной, — потом пользовательский `onclick`.

### 6. Скрытие закладки через API

```js
// Прямой доступ к клиентскому контролу
var ts = getControl('ts_admin');
D3Api.TabSheetCtrl.setVisible(ts, false);
```

Это скроет и таб, и страницу, и пересчитает ширину бара.

---

## Поведение в IDE

`TabSheet` — видимый только внутри `PageControl`. Отдельного
`preview()` у него нет: визуализация происходит в `preview()`
родителя, который сканирует детей-`cmpTabSheet` и строит общий
скелет.

### В canvas

При вставке `TabSheet` в `PageControl` — в баре появляется новый
таб с `caption` (или `Tab N` если `caption` пуст). Активный таб
подсвечивается (чёрное подчёркивание в горизонтальном режиме,
чёрная левая полоса в вертикальном).

### В дереве

```
cmpPageControl name="" mode="horizontal" activeindex="0"
  cmpTabSheet name="" caption="Tab1" active="true"
    <дочерние компоненты>
  cmpTabSheet name="" caption="Tab2"
    <дочерние компоненты>
```

`TabSheet` перетаскивается только в `PageControl` — ограничение
`PARENT_ONLY.cmptabsheet = 'cmppagecontrol'`.

### В инспекторе

- HTML attributes: `id`, `class`, `style`, `title`
- D3 Base: `name`, `enabled`, `visible`, `hint`
- TabSheet: `caption`, `active`, `button_class`, `content_class`
- Events: `OnClick`, `OnDblClick`, `OnMouseOver`, `OnMouseOut`
- Styles: полный набор CSS-свойств

Изменения `caption` / `active` / `visible` немедленно отражаются
в превью родителя через `refreshPreviewAndParent`.

### Ограничения

- **Без родителя невидим** — `TabSheet` вне `PageControl` не рендерится.
  В IDE вставка вне `PageControl` заблокирована через `PARENT_ONLY`.
- **Собственный preview отсутствует** — вся визуализация в родителе.
- **`uniqid` не отображается в инспекторе** — это внутренний
  идентификатор, генерируемый сервером при парсинге `.frm`.

---

## Интеграция с ядром IDE

### Подключение в `index.html`

Секция **D3 controls**:

```html
<script src="Component/d3/PageControl/index.js"></script>
<script src="Component/d3/TabSheet/index.js"></script>
```

Порядок: `PageControl` до `TabSheet`.

### Правки в `ide/canvas.js`

**`CMP_TAGS`:**

```js
'cmppagecontrol': 'cmpPageControl',
'cmptabsheet':    'cmpTabSheet',
```

**`_injectIdeStyle`:** не трогаем — `TabSheet` видим, но скрывается
CSS-правилом внутри `cmpPageControl`:

```css
cmpPageControl > cmpTabSheet {
    display: none !important;
}
```

Это правило живёт в `PageControl/css/preview.css` и предотвращает
рендер детей-`cmpTabSheet` отдельно от общего скелета.

**`XML_SELF_CLOSE`:** не трогаем — `TabSheet` контейнерный (содержит
детей).

### Правки в `ide/app.js`

**`CMP_TAGS`:**

```js
'cmppagecontrol': 'cmpPageControl',
'cmptabsheet':    'cmpTabSheet',
```

### Правки в `ide/panels.js`

**`PARENT_ONLY`:**

```js
cmptabsheet: 'cmppagecontrol',
```

Это включает проверку при drag&drop в дереве — `TabSheet` не
сможет улететь вне `PageControl`.

---

## Известные ограничения

1. **`active` и `activeindex` дублируют друг друга** — сервер при
   `TabSheet.active="true"` перезаписывает `parent->attrs['activeindex']`
   на индекс этого таба. В XML обычно присутствуют оба:
   `activeindex` на `PageControl` и `active="true"` на активном
   `TabSheet`. В `preview()` родителя учитывается сначала
   `activeindex`, потом `active`.

2. **`pageindex` не редактируется** — индекс вычисляется сервером
   по порядку появления `TabSheet` внутри `PageControl`. Если
   переставить закладки в XML, индексы пересчитаются при парсинге
   `.frm`.

3. **`name` не обязателен** — если не задан, сервер генерирует
   `<parent_name>_TabSheet<index>`. Это используется для доступа
   к контролу через `getControl(name)` или `setControlProperty`.

4. **`onclick` совмещается с системным** — сервер вызывает
   `extendEvent('onclick', 'D3Api.PageControlCtrl.showTab(this);')`.
   Если пользователь задал свой `onclick` в инспекторе, он тоже
   будет вызван. Свой вызывается **после** системного — сначала
   закладка активируется, потом пользовательский код.

5. **`button_class` и `content_class`** — доп. CSS-классы. В
   IDE-превью не отражаются визуально (стилизация темы может
   изменить внешний вид, но это ответственность пользователя).
   В сохранённый XML попадают.

6. **`visible` синхронизирует таб и страницу** — при изменении
   `visible` через `TabSheetCtrl.setVisible` скрывается и `<li>`,
   и связанный `<div>`. Пересчитывается ширина бара через
   `CalckTabSheetHead` и вызывается `resize`.

7. **Переключение клавиатурой пропускает невидимые закладки** — в
   `CtrlKeyDown` `PageControl` идёт циклом `while (!flag)`, пока
   не найдёт видимый таб в нужную сторону.

8. **Скролл в горизонтальном режиме** — если табов больше, чем
   влезает по ширине, `PageControl` автоматически показывает
   `ScrollNext` / `ScrollPrior`. `TabSheet` сам по себе на это
   не влияет — только добавляет свою ширину в общую.

9. **Кнопка скролла не является частью `TabSheet`** — это отдельные
   `<div>` внутри `PageControl` (`cont="ScrollNext"` / `cont="ScrollPrior"`).

10. **События `onmouseover` / `onmouseout`** — не обрабатываются
    клиентским `TabSheetCtrl`, но если пользователь задал их в
    инспекторе, они навешиваются как обычные HTML-события на `<li>`.

---

## Чек-лист добавления нового экземпляра

1. Убедиться, что `TabSheet` добавляется **внутрь `cmpPageControl`** —
   иначе IDE не даст вставить (через `PARENT_ONLY`).
2. В инспекторе задать:
    - `caption` — текст на табе (обязательно, иначе будет пустая полоска);
    - `active="true"` — если это активная закладка (только для одной);
    - `name` — если нужен доступ по имени (иначе сервер сгенерирует);
    - при необходимости `visible="false"`, `button_class`, `content_class`.
3. Положить внутрь `TabSheet` нужные D3-компоненты (Label, Edit, Grid, …).
4. При необходимости привязать `onclick` — сработает после активации закладки.
5. Проверить в дереве: `cmpTabSheet` должен быть ребёнком `cmpPageControl`.

---

## См. также

- `Component/d3/PageControl/README.md` — родительский компонент
- `Component/d3/Grid/README.md` — аналогичная пара «родитель → дочерний»
  (`cmpGrid` → `cmpColumn`)
- `Component/d3/Filter/README.md` — ещё одна пара с `parentOnly`
  (`cmpFilter` → `cmpFilterItem`)
- `PageControlCtrl.inc` — серверный код `PageControl` и `TabSheet`
  (в одном файле)
- `PageControl.js` — клиентские контролы `D3Api.PageControlCtrl`
  и `D3Api.TabSheetCtrl`
- `PageControl.css` — стили табов и страниц
