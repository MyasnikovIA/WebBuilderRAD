# cmpStatGridColumnHeader

Заголовок колонки аналитического Grid (`cmpStatGridColumn`). В рантайме
заменяет обычный `caption` колонки на произвольный HTML-контент.

Серверный код (`StatGridCtrl.inc → StatGridColumnHeader::Show`) просто
присваивает `$this->parent->caption = $this->text`, где `$this->text`
накоплен через `SetInnerText`. То есть `caption` колонки в шапке
таблицы формируется из содержимого этого компонента, а не из
атрибута `caption`.

Компонент содержит **CDATA-блок** — иначе пробелы и `<` в HTML
схлопнулись бы при парсинге XML. В IDE обязательно должен быть
добавлен в `CDATA_CONTAINERS`.

---

## Расположение

```
Component/d3/StatGridColumnHeader/
index.js
README.md              ← этот файл
images/icon.png
css/preview.css
js/                    (пусто)
```

**Серверные файлы:**

| Файл | Роль |
|---|---|
| `StatGridCtrl.inc` | class `StatGridColumnHeader extends BaseCtrl` |
| `StatGrid.js` | клиентского контрола нет (заголовок — часть StatGrid) |
| `StatGrid.css` | стили `.table_caption`, `td.column_caption`, `td.caption` |

---

## Тег и ID

- **XML-тег:** `cmpStatGridColumnHeader`
- **Регистрация в IDE:** `id: 'd3.statgridcolumnheader'`
- **Категория:** D3
- **Вид в палитре:** `StatGridColumnHeader`
- **Видимость:** видимый (рендерится родителем `StatGridColumn`)
- **parentOnly:** `cmpstatgridcolumn` — можно вставить только внутрь
  `StatGridColumn`
- **CDATA:** да (содержимое — HTML, обёрнутый в `<![CDATA[…]]>`)

---

## Разметка в рантайме

`StatGridColumnHeader` **сам не рендерит разметку**. В `Show()` он
делает только:

```php
$this->parent->caption = $this->text;
BaseCtrl::Show();
```

`$this->text` — это содержимое, накопленное через `SetInnerText`
(то есть то, что было внутри `<cmpStatGridColumnHeader>…</cmpStatGridColumnHeader>`).

Дальше `StatGridColumn::Show()` использует `$this->caption` при
формировании заголовка колонки в таблице `table_caption`:

```html
<td class="column_caption" cont="amount" index="2" column_name="amount">
  <div style="overflow: hidden;">
    <table class="table_caption">
      <tr>
        <td class="icn"><cmpSortItem …/></td>
        <td class="caption_sort" title="">
          <!-- ВСТАВЛЯЕТСЯ $this->parent->caption -->
          <b>Сумма</b><br/><span style="font-size: 9px">руб.</span>
        </td>
        <td class="icn"><div class="filter_icon" …></div></td>
      </tr>
    </table>
  </div>
</td>
```

Без `StatGridColumnHeader` в `caption_sort` попадает простой текст
из атрибута `caption` колонки.

---

## Свойства (инспектор IDE)

### HTML attributes
- `id`, `class`, `style`

### Content
- **`cdata`** — тип `code`. HTML-содержимое заголовка. Открывается
  модальный редактор с подсветкой (в IDE обёрнут в CDATA
  автоматически благодаря `CDATA_CONTAINERS`).

### Events
Пусто.

### Styles
Полный набор CSS-свойств из `CommonSchema.STYLE_FIELDS`.

---

## Формат `cdata`

Произвольный HTML. Может содержать:

- текст и теги (`<b>`, `<i>`, `<br/>`, `<span>`, `<div>`);
- классы и inline-стили;
- HTML-сущности.

Не рекомендуется:

- вставлять `<script>` — сервер не выполняет его отдельно,
  попадёт в текст;
- использовать `cmp*`-компоненты — они не будут распарсены внутри
  заголовка (заголовок — это часть `table_caption`, не отдельная
  форма).

---

## Логика работы

### Сервер

`StatGridColumnHeader::__construct`:

1. Устанавливает `CmpType = 'StatGridColumnHeader'`.
2. Вызывает `parent::__construct`.

`StatGridColumnHeader::SetInnerText($text)`:

1. Накапливает текст: `$this->text .= $text`.

`StatGridColumnHeader::Show()`:

1. Проверяет `parent->CmpType == 'StatGridColumn'`. Если нет —
   выходит молча.
2. Присваивает: `$this->parent->caption = $this->text`.
3. Вызывает `BaseCtrl::Show()`.

После этого `StatGridColumn::Show()` использует обновлённый
`caption` при формировании ячейки `column_caption`.

### Клиент

Клиентского контрола у `StatGridColumnHeader` нет — вся работа
происходит на сервере в момент парсинга формы. В рантайме уже
готовая HTML-разметка заголовка вставляется в `table_caption`.

---

## Примеры использования

### 1. Простой HTML-заголовок

```xml
<cmpStatGridColumn name="" field="sum" caption="Сумма">
    <cmpStatGridColumnHeader>
    <![CDATA[
    <b>Сумма</b>
    ]]>
    </cmpStatGridColumnHeader>
</cmpStatGridColumn>
```

В шапке отобразится жирный текст «Сумма» вместо обычного.

### 2. Заголовок с подписью

```xml
<cmpStatGridColumn name="" field="amount" caption="Сумма">
    <cmpStatGridColumnHeader>
    <![CDATA[
    <b>Сумма</b><br/>
    <span style="font-size: 9px; color: #666;">руб., без НДС</span>
    ]]>
    </cmpStatGridColumnHeader>
</cmpStatGridColumn>
```

В шапке две строки: жирная «Сумма» и мелкая подпись.

### 3. Заголовок с иконкой

```xml
<cmpStatGridColumn name="" field="warning" caption="Тревога">
    <cmpStatGridColumnHeader>
    <![CDATA[
    <img src="~CmpPopupMenu/Icons/warning"
         style="vertical-align: middle; margin-right: 4px;"/>
    Тревога
    ]]>
    </cmpStatGridColumnHeader>
</cmpStatGridColumn>
```

Перед текстом отобразится иконка.

### 4. Двуязычный заголовок

```xml
<cmpStatGridColumn name="" field="code" caption="Код">
    <cmpStatGridColumnHeader>
    <![CDATA[
    Код <span style="color: #999;">(Code)</span>
    ]]>
    </cmpStatGridColumnHeader>
</cmpStatGridColumn>
```

### 5. Заголовок с выделением единицы измерения

```xml
<cmpStatGridColumn name="" field="weight" caption="Вес">
    <cmpStatGridColumnHeader>
    <![CDATA[
    <span style="font-weight: bold;">Вес</span>
    <span style="font-size: 10px; color: #777;">, кг</span>
    ]]>
    </cmpStatGridColumnHeader>
</cmpStatGridColumn>
```

### 6. Заголовок с условной подсветкой

```xml
<cmpStatGridColumn name="" field="critical" caption="Критично">
    <cmpStatGridColumnHeader>
    <![CDATA[
    <span style="color: #d32f2f; font-weight: bold;">⚠ Критично</span>
    ]]>
    </cmpStatGridColumnHeader>
</cmpStatGridColumn>
```

### 7. Пустой заголовок (скрыть)

```xml
<cmpStatGridColumn name="" field="internal" caption="Внутреннее">
    <cmpStatGridColumnHeader>
    <![CDATA[
    ]]>
    </cmpStatGridColumnHeader>
</cmpStatGridColumn>
```

В шапке ничего не отобразится — но ячейка колонки сохраняется.

### 8. Заголовок с тултипом

```xml
<cmpStatGridColumn name="" field="amount" caption="Сумма">
    <cmpStatGridColumnHeader>
    <![CDATA[
    <span title="Сумма за период, руб.">Сумма</span>
    ]]>
    </cmpStatGridColumnHeader>
</cmpStatGridColumn>
```

При наведении на заголовок появится системный tooltip браузера.

---

## Поведение в IDE

`StatGridColumnHeader` — видимый только через родителя
(`StatGridColumn` → `StatGrid`). Отдельного `preview()` у него нет:
`StatGrid.preview()` сканирует колонки и выводит их `caption` в
шапке.

### В canvas

В шапке StatGrid отображается `caption` колонки. Если задан
`StatGridColumnHeader`, то в качестве `caption` используется его
CDATA — но в превью IDE это **не воспроизводится** (превью
StatGrid читает `caption`-атрибут колонки, а не содержимое
дочернего `StatGridColumnHeader`).

Если нужно увидеть HTML-заголовок в canvas — задайте его и в
`caption` колонки (для превью) и в `StatGridColumnHeader` (для
рантайма). Либо смиритесь с тем, что превью покажет обычный
текст, а в рантайме будет HTML.

### В дереве

```
cmpStatGrid name="SG1" dataset="DS_STAT"
  cmpStatGridColumn name="" field="amount" caption="Сумма"
    cmpStatGridColumnHeader
```

`StatGridColumnHeader` — узел внутри колонки.

### В инспекторе

- HTML attributes: `id`, `class`, `style`
- Content: `cdata` (тип `code`, открывает модальный редактор HTML)
- Events: пусто
- Styles: полный набор CSS-свойств

### Ограничения

- **В превью StatGrid HTML-заголовок не отображается** — только
  обычный `caption` колонки.
- **Собственный preview отсутствует** — визуализируется через
  родителя.
- **Нельзя редактировать в canvas** — только через инспектор.

---

## Интеграция с ядром IDE

### Подключение в `index.html`

Секция **D3 controls**:

```html
<script src="Component/d3/StatGrid/index.js"></script>
<script src="Component/d3/StatGridColumn/index.js"></script>
<script src="Component/d3/StatGridColumnHeader/index.js"></script>
<script src="Component/d3/StatGridFooter/index.js"></script>
<script src="Component/d3/StatSumm/index.js"></script>
```

Порядок: `StatGridColumnHeader` после `StatGridColumn`.

### Правки в `ide/panels.js`

**`PARENT_ONLY`:**

```js
cmpstatgridcolumnheader: 'cmpstatgridcolumn',
```

Это включает проверку drag&drop — `StatGridColumnHeader` не сможет
улететь вне `StatGridColumn`.

### Правки в `ide/canvas.js`

**`CMP_TAGS`:**

```js
'cmpstatgridcolumnheader': 'cmpStatGridColumnHeader',
```

**`CDATA_CONTAINERS`:**

```js
cmpstatgridcolumnheader: 1
```

Это обязательно — иначе HTML-заголовок будет нормализован
(множественные пробелы схлопнутся, переносы строк исчезнут),
что может испортить форматирование.

**`_injectIdeStyle` не трогаем** — компонент видим через родителя.

**`XML_SELF_CLOSE` не трогаем** — контейнерный компонент,
содержит CDATA.

### Правки в `ide/app.js`

**`CMP_TAGS`:**

```js
'cmpstatgridcolumnheader': 'cmpStatGridColumnHeader',
```

---

## Известные ограничения

1. **CDATA обязательна.** HTML-заголовок содержит `<`, `>`, `&`,
   `"`. Без CDATA парсинг XML сломается или нормализует
   содержимое. IDE оборачивает автоматически благодаря
   `CDATA_CONTAINERS`.

2. **`parentOnly: cmpstatgridcolumn`.** Вне `StatGridColumn` не
   рендерится.

3. **Заменяет `caption`, а не дополняет.** Если у колонки задан
   `caption="Сумма"` и `StatGridColumnHeader`, в шапке будет
   содержимое `StatGridColumnHeader`, а не `caption`. Это
   соответствует серверному коду: `$this->parent->caption = $this->text`.

4. **Не выполняет `cmp*`-компоненты.** Внутри HTML-заголовка
   нельзя вставить `<cmpLabel>` и т.п. — он парсится как часть
   `table_caption`, а не как отдельная форма.

5. **Только один `StatGridColumnHeader` на колонку.** Сервер в
   `Show()` перезаписывает `parent->caption` целиком: если их
   несколько, сохранится только последний (в порядке парсинга).

6. **Превью в IDE не показывает HTML.** `StatGrid.preview()`
   читает `caption` колонки, а не содержимое `StatGridColumnHeader`.
   В canvas отображается обычный текст из `caption`.

7. **Подсветка HTML в редакторе** — если в проекте подключён
   Highlight.js с языком `xml`, CDATA подсветится как XML.
   Если нет — редактор отобразит plain text.

8. **Пробелы внутри CDATA сохраняются.** Это позволяет
   форматировать HTML-заголовок многострочно:

   ```xml
   <cmpStatGridColumnHeader>
   <![CDATA[
   <b>Сумма</b>
   <br/>
   <span>руб.</span>
   ]]>
   </cmpStatGridColumnHeader>
   ```

   Все переносы и отступы попадут в итоговый HTML (что может
   дать лишние пробелы при отображении). Если это нежелательно —
   пишите HTML в одну строку без переносов.

9. **`class` и `style` на корне не работают.** Компонент не
   рендерит собственный `<div>` — его атрибуты не применяются к
   заголовку. Стили задавайте inline в HTML-содержимом.

10. **`cdata` — не `innerHTML`.** В редакторе IDE поле `cdata`
    содержит HTML-код, но не применяет его к DOM. Это текстовая
    строка, которая уходит в XML как CDATA.

11. **Экспорт в Excel.** HTML-заголовок попадёт в Excel как
    обычный текст (теги будут видны). Если это нежелательно —
    используйте простой `caption` для колонок, которые
    экспортируются.

12. **Клиентский контрол отсутствует.** Все взаимодействия —
    серверные. В рантайме нет событий, связанных с
    `StatGridColumnHeader`.

---

## Чек-лист добавления нового экземпляра

1. Убедиться, что `StatGridColumnHeader` добавляется **внутрь
   `cmpStatGridColumn`** — иначе IDE не даст вставить (через
   `PARENT_ONLY`).
2. В инспекторе открыть поле `cdata` (тип `code`) и ввести
   HTML-содержимое заголовка.
3. Убедиться, что HTML корректный: закрытые теги, экранированные
   амперсанды (если нужно).
4. При необходимости — задать `id`, `class`, `style` (хотя они
   не применяются к заголовку напрямую).
5. Проверить в дереве: `cmpStatGridColumnHeader` должен быть
   ребёнком `cmpStatGridColumn`.
6. При сохранении убедиться, что CDATA-блок не поломал XML.
7. В рантайме: заголовок колонки должен отобразить заданный HTML.

---

## См. также

- `Component/d3/StatGrid/README.md` — родительский аналитический Grid
- `Component/d3/StatGridColumn/README.md` — колонка, внутри которой
  рендерится заголовок
- `Component/d3/StatSumm/README.md` — определение суммы в колонке
- `StatGridCtrl.inc` — серверный код `StatGridColumnHeader`
- `StatGrid.css` — стили `.table_caption`, `td.column_caption`,
  `td.caption`
