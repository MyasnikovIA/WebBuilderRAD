# cmpTreeFooter

Подвал иерархического Grid (`cmpTree`). В рантайме не рендерит
собственной разметки — весь накопленный текст через `SetInnerText`
передаётся в родительский `Tree`:

```php
$this->parent->footer_text = $this->text;
```

Серверный `Tree::Show()` использует этот текст при формировании
подвала:

```html
<div class="tree_footer">
  <!-- СЮДА ПОПАДАЕТ $footer_text -->
</div>
```

CSS:

```css
div.tree_footer {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 54px;
    background-color: #F0F0EB;
}
```

Без `Tree` не работает: при попытке рендера вне `Tree` `Show()`
выходит молча.

---

## Расположение

```
Component/d3/TreeFooter/
    index.js
    README.md              ← этот файл
    images/icon.png
    css/preview.css
    js/                    (пусто)
```

**Серверные файлы:**

| Файл | Роль |
|---|---|
| `TreeCtrl.inc` | class `TreeFooter extends BaseCtrl` |
| `Tree.js` | клиентского контрола нет (`D3Api.TreeCtrl` работает с подвалом косвенно) |
| `Tree.css` | стили `.tree_footer`, `.tree_data_cont.withfooter` |

---

## Тег и ID

- **XML-тег:** `cmpTreeFooter`
- **Регистрация в IDE:** `id: 'd3.treefooter'`
- **Категория:** D3
- **Вид в палитре:** `TreeFooter`
- **Видимость:** видимый (рендерится родителем `Tree`)
- **parentOnly:** `cmptree` — можно вставить только внутрь `Tree`

---

## Разметка в рантайме

`TreeFooter` **сам не рендерит разметку**. В `Show()` он
присваивает свой текст к `$parent->footer_text` и вызывает
`BaseCtrl::Show()`.

Родитель `Tree` в `Show()` формирует подвал так:

```html
<div class="tree_footer">
  <!-- текст, накопленный из всех TreeFooter -->
</div>
```

Особенности:

- Подвал появляется, только если `$footer_text != ''`. Если
  `TreeFooter` не добавлен — тега `<div class="tree_footer">`
  в разметке не будет.
- Высота подвала фиксирована (`height: 54px` в CSS).
- Класс `withfooter` добавляется к `tree_data_cont`, чтобы
  освободить место для подвала (`padding-bottom: 54px`).

---

## Свойства (инспектор IDE)

### HTML attributes
- `id`, `class`, `style`

### TreeFooter
- **`separate`** — `true` / `false`. **Атрибут объявлен в серверном
  классе (`var $separate;`), но не используется в `Show()` и не
  считывается из `$attrs`.** Сохранён для совместимости с
  `GridFooter` / `StatGridFooter`. Реального влияния на разметку
  не оказывает.
- **`height`** — высота подвала в пикселях. **Атрибут не читается
  серверным кодом `TreeFooter`.** Высота подвала задаётся
  фиксированно в CSS (`height: 54px`) и в `Tree::Show()` через
  `padding-bottom` для `tree_data_cont.withfooter`.

### Content
Текст подвала передаётся через `SetInnerText` — то есть **между
тегами**:

```xml
<cmpTreeFooter>
    Всего записей: <b>42</b>
</cmpTreeFooter>
```

В IDE это содержимое доступно через **Edit InnerHTML…** на узле
`cmpTreeFooter`. Прямого поля для редактирования в инспекторе нет
(только атрибуты).

### Events
Пусто.

### Styles
Полный набор CSS-свойств из `CommonSchema.STYLE_FIELDS`. Впрочем,
они применяются к `cmpTreeFooter` (который не рендерится в DOM),
а не к финальному `<div class="tree_footer">`. Стили практически
не влияют на внешний вид.

---

## Формат содержимого

Между тегами `<cmpTreeFooter>…</cmpTreeFooter>` можно задать
HTML-строку. Она попадёт в `.tree_footer` как есть.

Примеры содержимого:

- `Всего записей: <b>42</b>`
- `Данные за текущий период`
- `<a href="#" onclick="Form.export();">Выгрузить</a>`
- `<span class="statgrid_footer_text">Источник: внутренняя база</span>`

Компонент не выполняет `cmp*`-компоненты внутри себя — он только
передаёт текст в родителя. Всё, что попадёт в `footer_text`,
отрендерится как обычный HTML.

---

## Логика работы

### Сервер

`TreeFooter::__construct`:

1. Устанавливает `CmpType = 'TreeFooter'`.
2. Вызывает `parent::__construct`.

`TreeFooter::SetInnerText($text)`:

1. Накапливает текст: `$this->text .= $text`.

`TreeFooter::Show()`:

1. Проверяет `parent->CmpType == 'Tree'`. Если нет — выходит
   молча.
2. Присваивает: `$this->parent->footer_text = $this->text`.
3. Вызывает `BaseCtrl::Show()`.

После этого `Tree::Show()` использует `$this->footer_text` при
формировании разметки подвала.

### Клиент

Клиентского контрола у `TreeFooter` нет. Подвал — статичный HTML,
который не участвует в клиентской логике `Tree` (раскрытие узлов,
профили, фильтры работают независимо).

---

## Примеры использования

### 1. Простой подвал

```xml
<cmpTree name="TR1" dataset="DS_TREE" caption="Каталоги"
         keyfield="id" parentfield="pid">
  <cmpTreeColumn name="" field="name" caption="Наименование"/>
  <cmpTreeFooter>
    Данные за текущий период
  </cmpTreeFooter>
</cmpTree>
```

Подвал отобразится внизу дерева.

### 2. Подвал с пояснением

```xml
<cmpTreeFooter>
  <b>Примечание:</b> отображаются только активные записи
</cmpTreeFooter>
```

### 3. Подвал со ссылкой

```xml
<cmpTreeFooter>
  Источник: <a href="javascript:Form.openSource();"
               style="color: #0066CC;">внутренняя база</a>
</cmpTreeFooter>
```

### 4. Подвал с кнопкой

```xml
<cmpTreeFooter>
  <button type="button" onclick="Form.exportTBS();">Выгрузить</button>
</cmpTreeFooter>
```

### 5. Пустой подвал

```xml
<cmpTreeFooter></cmpTreeFooter>
```

Сервер сформирует `<div class="tree_footer"></div>` — пустой блок
высотой 54px. Полезно, если нужно зарезервировать место под
будущий контент.

### 6. Несколько подвалов

Сервер присваивает `footer_text = $this->text` (не `+=`):

```xml
<cmpTreeFooter>Первый</cmpTreeFooter>
<cmpTreeFooter>Второй</cmpTreeFooter>
```

В итоге в `footer_text` попадёт только **последний** — «Второй».
Это отличается от `GridFooter` / `StatGridFooter`, где текст
накапливается через `+=`.

### 7. Динамическая подстановка через клиент

```html
<cmpTreeFooter>
    <span id="customInfo"></span>
</cmpTreeFooter>
```

```js
document.getElementById('customInfo').textContent = 'Обновлено: ' +
    new Date().toLocaleTimeString();
```

Клиентский код может взаимодействовать с подвалом через
стандартные DOM-операции.

### 8. `separate` (не работает)

```xml
<cmpTreeFooter separate="true">
    Текст подвала
</cmpTreeFooter>
```

Атрибут присутствует в XML, но **не влияет на разметку** —
`TreeFooter::Show()` его не читает.

### 9. `height` (не работает)

```xml
<cmpTreeFooter height="80">
    Текст подвала
</cmpTreeFooter>
```

Атрибут присутствует в инспекторе, но **не читается серверным
кодом**. Высота подвала фиксирована (54px) в CSS.

---

## Поведение в IDE

`TreeFooter` — видимый только через родителя (`Tree`).
Отдельного `preview()` у него нет: `Tree.preview()` рисует подвал
в виде блока `(footer)`.

### В canvas

В превью Tree внизу отображается подвал:

```
┌──────────────────────────────────────────────┐
│ Tree                                         │
├──────────────┬──────────────┬────────────────┤
│ Код          │ Наименование │ Дата           │
├──────────────┼──────────────┼────────────────┤
│ ⊖ Корень     │              │                │
│   · Ребёнок1 │              │                │
│ ⊕ Узел2      │              │                │
├──────────────┴──────────────┴────────────────┤
│ (footer)                                     │
└──────────────────────────────────────────────┘
```

Текст `(footer)` — заглушка превью. Реальный подвал в рантайме
содержит пользовательский HTML из `TreeFooter`.

Если `TreeFooter` не добавлен — подвал в превью тоже не
отображается.

### В дереве

```
cmpTree name="TR1" dataset="DS_TREE"
  cmpTreeColumn name="" field="name" caption="Наименование"
  cmpTreeColumn name="" field="code" caption="Код"
  cmpTreeFooter separate="false"
```

`TreeFooter` — узел внутри `Tree`.

### В инспекторе

- HTML attributes: `id`, `class`, `style`
- TreeFooter: `separate`, `height`
- Events: пусто
- Styles: полный набор CSS-свойств

Содержимое подвала редактируется через **Edit InnerHTML…** в
контекстном меню или через **Component → Edit InnerHTML…**.

### Ограничения

- **Содержимое в превью не отображается** — только заглушка
  `(footer)`.
- **Атрибуты `separate` и `height` не работают** — объявлены, но
  не используются.
- **Только один подвал.** Если задать несколько, сохранится только
  последний.

---

## Интеграция с ядром IDE

### Подключение в `index.html`

Секция **D3 controls**:

```html
<script src="Component/d3/Tree/index.js"></script>
<script src="Component/d3/TreeColumn/index.js"></script>
<script src="Component/d3/TreeFooter/index.js"></script>
```

Порядок: `TreeFooter` после `TreeColumn`.

### Правки в `ide/panels.js`

**`PARENT_ONLY`:**

```js
cmptreefooter: 'cmptree',
```

Это включает проверку drag&drop — `TreeFooter` не сможет улететь
вне `Tree`.

### Правки в `ide/canvas.js`

**`CMP_TAGS`:**

```js
'cmptreefooter': 'cmpTreeFooter',
```

`_injectIdeStyle` не трогаем — компонент видим через родителя.

`XML_SELF_CLOSE` не трогаем — контейнерный компонент
(содержит HTML-текст).

`CDATA_CONTAINERS` **не трогаем** — содержимое подвала не
оборачивается в CDATA.

### Правки в `ide/app.js`

**`CMP_TAGS`:**

```js
'cmptreefooter': 'cmpTreeFooter',
```

---

## Известные ограничения

1. **`parentOnly: cmptree`.** Вне `Tree` не рендерится.

2. **`separate` не работает.** Объявлен в классе, но не
   присваивается из `$attrs` и не используется в `Show()`.

3. **`height` не работает.** Атрибут присутствует в инспекторе,
   но не читается серверным кодом. Высота фиксирована
   (`height: 54px` в CSS).

4. **Содержимое в превью не отображается.** `Tree.preview()`
   рисует только заглушку `(footer)`.

5. **Только один подвал.** `TreeFooter::Show()` перезаписывает
   `parent->footer_text = $this->text`, а не накапливает. Если
   задать несколько `TreeFooter`, сохранится последний. Это
   отличается от `GridFooter` / `StatGridFooter`, где текст
   накапливается через `+=`.

6. **Стили из инспектора не применяются к финальному DOM.**
   `cmpTreeFooter` не рендерится в DOM. Реальные стили —
   `.tree_footer` в CSS.

7. **Подвал не участвует в клиентской логике.** Раскрытие узлов,
   профили, фильтры, экспорт — всё работает независимо от
   наличия подвала.

8. **`Tree::Show()` использует условие `$footer_text != ''`.** Если
   подвал пуст, тег `<div class="tree_footer">` в разметке не
   появится. Для появления пустого подвала задайте `&nbsp;` или
   пустую ссылку.

9. **Класс `withfooter`** — добавляется к `tree_data_cont`, чтобы
   освободить место для подвала (`padding-bottom: 54px`). Если
   подвал не задан, класс не добавляется.

10. **Клиентского контрола нет.** Взаимодействие с подвалом —
    через DOM (id, class) или через `D3Api.TreeCtrl`.

11. **Профили.** Подвал не участвует в профилях `Tree`
    (`D3Api.TreeCtrl.setProfile`). Профили управляют только
    колонками.

12. **Экспорт в ODS.** Подвал не попадает в выгрузку через
    `D3Api.TreeCtrl.exportTBS`. В ODS-файле будут только колонки
    и данные.

13. **`Tree::ShowXML` case 'export'** — экспорт в HTML-таблицу
    (устаревший, не ODS). Подвал в этой выгрузке тоже не
    участвует.

14. **В `TreeFooter` нет `SetSysInfo`.** В отличие от `GridFooter`,
    `TreeFooter` не вызывает `SetSysInfo` — только `SetInnerText`.

15. **CSS-стили фиксированные.** Высота (`54px`), фон
    (`#F0F0EB`) и позиционирование (`absolute bottom: 0`) не
    настраиваются через инспектор. Для изменения — правьте
    `Tree.css` или добавляйте собственные стили в форму.

---

## Чек-лист добавления нового экземпляра

1. Убедиться, что `TreeFooter` добавляется **внутрь `cmpTree`** —
   иначе IDE не даст вставить (через `PARENT_ONLY`).
2. Через контекстное меню открыть **Edit InnerHTML…** и задать
   HTML-содержимое подвала.
3. Не задавать `separate` и `height` — они не работают.
4. Проверить в дереве: `cmpTreeFooter` должен быть ребёнком
   `cmpTree`.
5. При сохранении убедиться, что HTML-содержимое корректно
   (закрытые теги, экранированные амперсанды).
6. В рантайме: подвал должен отобразиться внизу дерева с
   заданным HTML.
7. Убедиться, что в `Tree` только **один** `TreeFooter` — иначе
   сохранится только последний.

---

## См. также

- `Component/d3/Tree/README.md` — родительский иерархический Grid,
  внутри которого рендерится подвал
- `Component/d3/TreeColumn/README.md` — колонка Tree
- `Component/d3/GridFooter/README.md` — аналогичный подвал для
  `cmpGrid` (текст накапливается через `+=`)
- `Component/d3/StatGridFooter/README.md` — подвал StatGrid
- `TreeCtrl.inc` — серверный код `TreeFooter`
- `Tree.css` — стили `.tree_footer`, `.tree_data_cont.withfooter`
