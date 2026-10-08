# cmpStatGridFooter

Подвал аналитического Grid (`cmpStatGrid`). В рантайме не рендерит
собственной разметки — весь накопленный текст через `SetInnerText`
передаётся в родительский `StatGrid`:

```php
$this->parent->footer_text .= $this->text;
```

Серверный `StatGrid::Show()` использует этот текст при формировании
разметки подвала:

```html
<div class="statgrid_footer" cont="statgridfooter">
  <span cont="statgridfootersumm"></span>
  <span cont="statgridfootertext" class="statgrid_footer_text">
    <!-- СЮДА ПОПАДАЕТ $footer_text -->
  </span>
</div>
```

Без `StatGrid` не работает: при попытке рендера вне `StatGrid`
`Show()` выходит молча.

---

## Расположение

```
Component/d3/StatGridFooter/
    index.js
    README.md              ← этот файл
    images/icon.png
    css/preview.css
    js/                    (пусто)
```

**Серверные файлы:**

| Файл | Роль |
|---|---|
| `StatGridCtrl.inc` | class `StatGridFooter extends BaseCtrl` |
| `StatGrid.js` | клиентского контрола нет (`D3Api.StatGridCtrl` частично работает с `statgridfootertext`) |
| `StatGrid.css` | стили `.statgrid_footer`, `.statgrid_footer_text` |

---

## Тег и ID

- **XML-тег:** `cmpStatGridFooter`
- **Регистрация в IDE:** `id: 'd3.statgridfooter'`
- **Категория:** D3
- **Вид в палитре:** `StatGridFooter`
- **Видимость:** видимый (рендерится родителем `StatGrid`)
- **parentOnly:** `cmpstatgrid` — можно вставить только внутрь
  `StatGrid`

---

## Разметка в рантайме

`StatGridFooter` **сам не рендерит разметку**. В `Show()` он
приписывает свой текст к `$parent->footer_text` и вызывает
`BaseCtrl::Show()`.

Родитель `StatGrid` в `Show()` формирует подвал так:

```html
<div class="statgrid_footer" cont="statgridfooter">
  <span cont="statgridfootersumm"></span>
  <span cont="statgridfootertext" class="statgrid_footer_text">
    <!-- текст, накопленный из всех StatGridFooter -->
  </span>
</div>
```

Особенности:

- `statgridfootersumm` заполняется в рантайме клиентским кодом
  (сюда пишется «Всего: N», см. `StatGridCtrl.setStatGridData`).
- `statgridfootertext` содержит пользовательский текст из
  `StatGridFooter`. Класс `.statgrid_footer_text` даёт `margin-left: 20px`
  от левого края подвала.

CSS:

```css
div.statgrid_footer {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 36px;
    line-height: 36px;
    overflow: hidden;
    background-color: #F0F0EB;
    text-indent: 5px;
}
span.statgrid_footer_text {
    margin-left: 20px;
}
```

---

## Свойства (инспектор IDE)

### HTML attributes
- `id`, `class`, `style`

### StatGridFooter
- **`separate`** — `true` / `false`. **Атрибут объявлен в серверном
  классе (`var $separate;`), но не используется в `Show()` и не
  считывается из `$attrs`.** Сохранён для совместимости с
  `GridFooter`. Реального влияния на разметку не оказывает.
- **`height`** — высота подвала в пикселях. **Атрибут не читается
  серверным кодом** `StatGridFooter`. Высота подвала задаётся
  фиксированно в CSS (`height: 36px`) и в `StatGrid::Show()`
  через `padding-bottom` для `statgrid_data_cont`.

### Content
Текст подвала передаётся через `SetInnerText` — то есть **между
тегами**:

```xml
<cmpStatGridFooter>
    Всего записей: <span cont="statgridfootersumm"></span>
</cmpStatGridFooter>
```

В IDE это содержимое доступно через **Edit InnerHTML…** на узле
`cmpStatGridFooter`. Прямого поля для редактирования в инспекторе
нет (только атрибуты).

### Events
Пусто.

### Styles
Полный набор CSS-свойств из `CommonSchema.STYLE_FIELDS`. Впрочем,
они применяются к `cmpStatGridFooter` (который не рендерится в
DOM), а не к финальному `<div class="statgrid_footer">`. Стили
практически не влияют на внешний вид.

---

## Формат содержимого

Между тегами `<cmpStatGridFooter>…</cmpStatGridFooter>` можно
задать HTML-строку. Она попадёт в `statgridfootertext` подвала
как есть.

Примеры содержимого:

- `Всего записей: <span cont="statgridfootersumm"></span>`
- `Итого по фильтру: <b>за период</b>`
- `<a href="#" onclick="Form.exportXls();">Выгрузить</a>`

Компонент не выполняет `cmp*`-компоненты внутри себя — он только
передаёт текст в родителя. Всё, что попадёт в `footer_text`,
отрендерится как обычный HTML.

---

## Логика работы

### Сервер

`StatGridFooter::__construct`:

1. Устанавливает `CmpType = 'StatGridFooter'`.
2. Вызывает `parent::__construct`.

`StatGridFooter::SetInnerText($text)`:

1. Накапливает текст: `$this->text .= $text`.

`StatGridFooter::Show()`:

1. Проверяет `parent->CmpType == 'StatGrid'`. Если нет — выходит
   молча.
2. Присваивает: `$this->parent->footer_text .= $this->text`.
3. Вызывает `BaseCtrl::Show()`.

После этого `StatGrid::Show()` использует `$this->footer_text`
при формировании разметки подвала.

### Клиент

Клиентского контрола у `StatGridFooter` нет. Но клиентский код
`D3Api.StatGridCtrl` взаимодействует с подвалом через:

- **`cont="statgridfootersumm"`** — заполняется `setStatGridData`
  («Всего: N» и итоги сумм);
- **`cont="statgridfootertext"`** — статический текст из
  `StatGridFooter`;
- **`cont="statgridfooter"`** — корневой контейнер подвала
  (используется для `show_selectcount`, если задан `selectlist`).

---

## Примеры использования

### 1. Простой подвал

```xml
<cmpStatGrid name="SG1" dataset="DS_STAT" caption="Статистика">
    <cmpStatGridColumn name="" field="code" caption="Код"/>
    <cmpStatGridColumn name="" field="amount" caption="Сумма">
        <cmpStatSumm field="amount" index="1" summ_type="sum"/>
    </cmpStatGridColumn>
    <cmpStatGridFooter>
        Данные за текущий период
    </cmpStatGridFooter>
</cmpStatGrid>
```

В подвале отобразится «Всего: N» (из `statgridfootersumm`) и
«Данные за текущий период» (из `statgridfootertext`).

### 2. Подвал с пояснением

```xml
<cmpStatGridFooter>
    <b>Примечание:</b> суммы указаны без учёта НДС
</cmpStatGridFooter>
```

### 3. Подвал с ссылкой

```xml
<cmpStatGridFooter>
    Источник: <a href="javascript:Form.openSource();"
                 style="color: #0066CC;">внутренняя база</a>
</cmpStatGridFooter>
```

### 4. Пустой подвал

Если подвал не нужен, но `StatGrid` требует наличие
`StatGridFooter` — задайте пустой:

```xml
<cmpStatGridFooter></cmpStatGridFooter>
```

Сервер сформирует подвал с пустым `statgridfootertext`. В нём
всё равно будет «Всего: N» из `statgridfootersumm` (если задан
`onrefresh` в `StatGrid`).

### 5. Несколько подвалов

Сервер накапливает текст через `+=`:

```xml
<cmpStatGridFooter>Первая строка</cmpStatGridFooter>
<cmpStatGridFooter>Вторая строка</cmpStatGridFooter>
```

В итоге в `statgridfootertext` попадёт «Первая строкаВторая
строка» — без разделителя. Если нужно разделение — добавьте
`<br/>` или пробел в одном из них.

### 6. Динамическая подстановка через клиент

```html
<cmpStatGridFooter>
    <span id="customInfo"></span>
</cmpStatGridFooter>
```

```js
document.getElementById('customInfo').textContent = 'Обновлено: ' +
    new Date().toLocaleTimeString();
```

Клиентский код может взаимодействовать с подвалом через
стандартные DOM-операции.

### 7. `separate` (не работает)

```xml
<cmpStatGridFooter separate="true">
    Текст подвала
</cmpStatGridFooter>
```

Атрибут присутствует в XML, но **не влияет на разметку** —
`StatGridFooter::Show()` его не читает. Оставлен для совместимости
с `GridFooter`.

### 8. `height` (не работает)

```xml
<cmpStatGridFooter height="50">
    Текст подвала
</cmpStatGridFooter>
```

Атрибут присутствует в инспекторе, но **не читается серверным
кодом**. Высота подвала — фиксированная (36px) в CSS.

---

## Поведение в IDE

`StatGridFooter` — видимый только через родителя (`StatGrid`).
Отдельного `preview()` у него нет: `StatGrid.preview()` рисует
подвал в виде блока «Всего: 0».

### В canvas

В превью StatGrid внизу отображается подвал:

```
┌──────────────────────────────────────────┐
│ StatGrid                                 │
├──────────────────────────────────────────┤
│ …                                        │
├──────────────────────────────────────────┤
│ Всего: 0                                 │  ← подвал
└──────────────────────────────────────────┘
```

Текст «Всего: 0» — это заглушка превью. Реальный подвал в
рантайме заполняется из `statgridfootersumm` (суммы) и
`statgridfootertext` (пользовательский текст).

Если в `StatGridFooter` задано содержимое — оно **не отображается
в превью**, потому что `StatGrid.preview()` не читает текст детей
`cmpStatGridFooter`.

### В дереве

```
cmpStatGrid name="SG1" dataset="DS_STAT"
  cmpStatGridColumn name="" field="code" caption="Код"
  cmpStatGridColumn name="" field="amount" caption="Сумма"
    cmpStatSumm field="amount" index="1" summ_type="sum"
  cmpStatGridFooter separate="false"
```

`StatGridFooter` — узел внутри `StatGrid`.

### В инспекторе

- HTML attributes: `id`, `class`, `style`
- StatGridFooter: `separate`, `height`
- Events: пусто
- Styles: полный набор CSS-свойств

Содержимое подвала редактируется через **Edit InnerHTML…** в
контекстном меню или через **Component → Edit InnerHTML…**.

### Ограничения

- **Содержимое в превью не отображается** — только заглушка
  «Всего: 0».
- **Атрибуты `separate` и `height` не работают** — объявлены, но
  не используются.
- **Собственный preview отсутствует.**

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

Порядок: `StatGridFooter` после `StatGridColumn`.

### Правки в `ide/panels.js`

**`PARENT_ONLY`:**

```js
cmpstatgridfooter: 'cmpstatgrid',
```

Это включает проверку drag&drop — `StatGridFooter` не сможет
улететь вне `StatGrid`.

### Правки в `ide/canvas.js`

**`CMP_TAGS`:**

```js
'cmpstatgridfooter': 'cmpStatGridFooter',
```

`_injectIdeStyle` не трогаем — компонент видим через родителя.

`XML_SELF_CLOSE` не трогаем — контейнерный компонент
(содержит HTML-текст).

`CDATA_CONTAINERS` **не трогаем** — в отличие от
`StatGridColumnHeader`, содержимое подвала не оборачивается в
CDATA. Простой текст сохраняется как обычный текстовый узел.

### Правки в `ide/app.js`

**`CMP_TAGS`:**

```js
'cmpstatgridfooter': 'cmpStatGridFooter',
```

---

## Известные ограничения

1. **`parentOnly: cmpstatgrid`.** Вне `StatGrid` не рендерится.

2. **`separate` не работает.** Объявлен в классе (`var $separate;`),
   но не присваивается из `$attrs` и не используется в `Show()`.
   Оставлен для совместимости с `GridFooter`.

3. **`height` не работает.** Атрибут присутствует в инспекторе, но
   не читается серверным кодом. Высота подвала фиксирована
   (`height: 36px` в CSS).

4. **Содержимое в превью не отображается.** `StatGrid.preview()`
   рисует только заглушку «Всего: 0», игнорируя `text` из
   `StatGridFooter`.

5. **Несколько подвалов объединяются без разделителя.** Текст
   накапливается через `.=`, поэтому в итоге может получиться
   «Первая строкаВторая строка». Добавляйте `\n`, `<br/>` или
   пробел вручную.

6. **`cont="statgridfootersumm"` заполняется клиентом.** Этот
   span — для итогов сумм («Всего: N», «ИТОГО: …»). Не пытайтесь
   писать в него из `StatGridFooter` — клиент перезапишет.

7. **Стили из инспектора не применяются к финальному DOM.**
   `cmpStatGridFooter` не рендерится в DOM. Реальные стили —
   `.statgrid_footer` и `.statgrid_footer_text` в CSS.

8. **`selectlist` в StatGrid влияет на подвал.** Если задан
   `selectlist` + `show_selectcount="true"`, в
   `statgridfootertext` выводится «Отмечено: N» (см. `StatGridCtrl.init`).
   Пользовательский текст из `StatGridFooter` при этом
   сохраняется — оба пишутся в один span в порядке инициализации.

9. **`D3Api.StatGridCtrl.setVisible(statgrid, false)`** скрывает
   весь StatGrid вместе с подвалом. Отдельно скрыть подвал нельзя.

10. **`White space` в подвале.** CSS задаёт `text-indent: 5px` и
    `margin-left: 20px` для `statgrid_footer_text`. Это создаёт
    отступ слева. Если нужно другое поведение — переопределяйте
    стили через `.statgrid_footer_text` в форме.

11. **Экспорт в Excel.** Текст из `statgridfootertext` попадает
    в Excel-файл как отдельная строка внизу таблицы (см.
    `D3Api.StatGridCtrl.exportXLS`). Если это не нужно — не
    задавайте `StatGridFooter`.

12. **Клиентского контрола нет.** Взаимодействие с подвалом —
    через DOM (id, class) или через `D3Api.StatGridCtrl`.

---

## Чек-лист добавления нового экземпляра

1. Убедиться, что `StatGridFooter` добавляется **внутрь
   `cmpStatGrid`** — иначе IDE не даст вставить (через
   `PARENT_ONLY`).
2. Через контекстное меню открыть **Edit InnerHTML…** и задать
   HTML-содержимое подвала.
3. Не задавать `separate` и `height` — они не работают.
4. Проверить в дереве: `cmpStatGridFooter` должен быть ребёнком
   `cmpStatGrid`.
5. При сохранении убедиться, что HTML-содержимое корректно
   (закрытые теги, экранированные амперсанды).
6. В рантайме: подвал должен отобразить заданный HTML вместе с
   итоговой суммой «Всего: N» (если задан `onrefresh`).

---

## См. также

- `Component/d3/StatGrid/README.md` — родительский аналитический
  Grid, внутри которого рендерится подвал
- `Component/d3/StatGridColumn/README.md` — колонка StatGrid
- `Component/d3/StatSumm/README.md` — определение суммы в колонке
- `Component/d3/GridFooter/README.md` — обычный GridFooter
  (аналог для `cmpGrid`, поддерживает `separate`)
- `StatGridCtrl.inc` — серверный код `StatGridFooter`
- `StatGrid.css` — стили `.statgrid_footer`, `.statgrid_footer_text`
