# cmpUnitEditGenerate

Генератор форм редактирования. В рантайме читает конфигурацию
метода из БД (`core.v_show_method_cols4bld`) и **строит целую форму**
с полями, вкладками, кнопками и двумя Action-ами:

- **`SelAct`** — выбор записи по `PRIMARY` (SELECT);
- **`UpdAddAct`** — обновление / добавление (UPDATE / INSERT).

Плюс генерирует `<cmpScript>` с обработчиками `Form.onCreate` /
`Form.OnShow` / `Form.OnButtonOk` / `Form.OnSuccess` / `Form.OnError`
/ `Form.onClose`, `<cmpDependences>` для обязательных полей,
`<cmpMask>` для числовых, `<cmpPageControl>` (если `use_unitprop = 1`)
с вкладкой `<cmpUnitProps>`.

Собственной разметки в IDE нет — только «скелет» формы-заготовки.
Всё содержимое — динамическое, зависит от БД.

---

## Расположение

```
Component/d3/UnitEditGenerate/
index.js
README.md              ← этот файл
images/icon.png
css/preview.css
js/                    (пусто)
```

**Серверные файлы:**

| Файл | Роль |
|---|---|
| `UnitEditGenerate.inc` | class `UnitEditGenerateBase extends BaseCtrl` — общая логика |
| `UnitEditGenerateOracle.inc` | class `UnitEditGenerate extends UnitEditGenerateBase` — Oracle-специфика |
| `UnitEditGeneratePDO.inc` | class `UnitEditGenerate extends UnitEditGenerateBase` — PDO-специфика (пустой) |
| `UnitEditGenerate.css` | стили `.unitEditForm`, `.unitEditContent`, `.unit_form_fields`, `.unit_form_buttons` |

**Связанные таблицы в БД:**

- `core.v_unitlist` — разделы системы.
- `core.v_show_method4bld` — методы показа.
- `core.v_show_method_cols4bld` — колонки метода.

---

## Тег и ID

- **XML-тег:** `cmpUnitEditGenerate`
- **Регистрация в IDE:** `id: 'd3.uniteditgenerate'`
- **Категория:** D3
- **Вид в палитре:** `UnitEditGenerate`
- **Видимость:** видимый (рендерит разметку в canvas)

---

## Разметка в рантайме

Серверный `UnitEditGenerate::Show()` генерирует **форму целиком**.
Структура зависит от `use_unitprop` (флаг раздела в
`core.v_unitlist`).

### Без `use_unitprop`

```html
<div cmptype="Form"
     oncreate="Form.onCreate();"
     onshow="Form.OnShow();"
     onclose="Form.onClose();"
     class="formBackground unitEditForm">

  <table class="unit_form_fields">
    <colgroup><col width="30%"/><col/></colgroup>

    <!-- опционально: инфо о записи -->
    <tr><td></td><td style="text-align: right; padding-bottom: 10px">
      <cmpInfoAboutRecord name="info_about_record_Ctrl" unit="MyUnit"/>
    </td></tr>

    <!-- поля формы -->
    <tr cmptype="Base" name="row_name_Ctrl">
      <td class="caption">Наименование:</td>
      <td class="value">
        <cmpEdit name="name_Ctrl" width="100%" maxlength="250"/>
      </td>
    </tr>
    <tr cmptype="Base" name="row_status_Ctrl">
      <td class="caption">Статус:</td>
      <td class="value">
        <cmpComboBox name="status_Ctrl" width="100%" fixwidth="true">
          <cmpComboItem caption="Активен" value="1" selected="true"/>
          <cmpComboItem caption="Неактивен" value="0"/>
        </cmpComboBox>
      </td>
    </tr>
    <!-- … -->

    <tr cmptype="Base" name="uniteditgenerate_doptr"></tr>
  </table>

  <div class="unit_form_buttons">
    <cmpButton name="GENERATED_BUTTON_OK" caption="ОК"
               onclick="Form.OnButtonOk();"/>
    <cmpButton name="GENERATED_BUTTON_BACK" caption="Отмена"
               onclick="close();"/>
  </div>

  <cmpScript name="GENERATED_SCRIPT">
  <![CDATA[
    Form.onCreate = function() { … }
    Form.OnShow = function() { … }
    Form.OnButtonOk = function() { … }
    Form.OnSuccess = function() { … }
    Form.OnError = function() { … }
    Form.onClose = function() { … }
  ]]>
  </cmpScript>

  <cmpDependences name="genDepend"
                  required="name_Ctrl;status_Ctrl"
                  depend="GENERATED_BUTTON_OK"/>
  <cmpMask name="Generated_Mask" controls="amount_Ctrl"/>
</div>

<cmpAction name="SelAct">
  select name, status, amount, …
    from v_my_unit_view
   where id = :PRIMARY
  <cmpActionVar name="PRIMARY" src="PRIMARY" srctype="var" get="0_primary"/>
  <cmpActionVar name="name"   src="name_Ctrl" srctype="ctrl" put="0_name"/>
  <cmpActionVar name="status" src="status_Ctrl" srctype="ctrl" put="1_status"/>
  <!-- … -->
</cmpAction>

<cmpAction name="UpdAddAct" unit="MyUnit">
  <cmpActionVar name="ps_name" src="name_Ctrl" srctype="ctrl" get="0_name"/>
  <cmpActionVar name="pn_status" src="status_Ctrl" srctype="ctrl" get="1_status"/>
  <cmpActionVar name="pn_lpu" src="LPU" srctype="session"/>
  <cmpActionVar name="return" src="newid" srctype="var" put="return"/>
  <cmpActionVar name="action" src="action" srctype="var" get="var2"/>
</cmpAction>
```

### С `use_unitprop = 1`

Дополнительно оборачивается в `<table>` и `<cmpPageControl>`:

```html
<div cmptype="Form" class="formBackground unitEditForm withUnitProps">
  <table style="width: 100%; border-spacing: 0;" name="unitGenerateTable">
    <tbody>
      <tr><td name="unitGeneratePCCont">
        <cmpPageControl name="PC1" cssstyle="tab-grey">
          <cmpTabSheet caption="Главная" name="PC1_TabSheet0"
                       content_class="unitEditContent">
            <!-- таблица полей -->
          </cmpTabSheet>
          <cmpTabSheet caption="Дополнительно"
                       name="MyUnit_tabUnitProps"
                       content_class="unitEditContent">
            <cmpUnitProps unit="MyUnit"
                          bind_action="UpdAddAct"
                          unitid_varname="PRIMARY"
                          name="MyUnit_UnitPropsGenerate"/>
          </cmpTabSheet>
        </cmpPageControl>
      </td></tr>
      <tr><td align="right" name="unitGenerateBtnCont">
        <div class="unit_form_buttons">
          <cmpButton name="GENERATED_BUTTON_OK" caption="ОК"/>
          <cmpButton name="GENERATED_BUTTON_BACK" caption="Отмена"/>
        </div>
      </td></tr>
    </tbody>
  </table>
  <cmpDependences …/>
  <cmpScript …/>
</div>
```

### С `method_form_upd`

Если у метода в БД задана форма редактирования
(`method_form_upd != 'none'`) и атрибут `unit` **не задан в XML**,
сервер **не генерирует форму**, а подключает её через `SubForm`:

```html
<cmpSubForm path="Some/Edit/Form"/>
```

---

## Свойства (инспектор IDE)

### HTML attributes
- `id`, `class`, `style`

### D3 Base
- `name`, `enabled`, `visible`, `hint`, `width`, `height`

### UnitEditGenerate
- **`unit`** — код раздела (`core.v_unitlist`). Если пусто —
  берётся из `$_GET['unit']`.
- **`method`** — код метода показа
  (`core.v_show_method4bld`). Если пусто — из
  `$_GET['method']`.

### Events
Пусто.

### Styles
Полный набор CSS-свойств из `CommonSchema.STYLE_FIELDS`.

---

## Формат атрибутов

| Атрибут | Тип | Описание |
|---|---|---|
| `name` | string | Имя контрола (обычно не задаётся) |
| `unit` | string | Код раздела. Если пусто — из `$_GET['unit']` |
| `method` | string | Код метода. Если пусто — из `$_GET['method']` |
| `enabled` | boolean | `false` — форма отключена |
| `visible` | boolean | `false` — форма скрыта |
| `width`, `height` | string | Размеры (влияют только на placeholder в IDE) |

---

## Логика работы

### Сервер (`UnitEditGenerate::Show`)

1. **Читает `unit` и `method`** — из атрибутов или из
   `$_GET` (`unit` / `method`).

2. **Проверяет раздел** через `core.v_unitlist`:
    - если не найден — печатает форму с ошибкой
      `«Раздел "…" не найден»`;
    - читает `use_unitprop` (`0` / `1`).

3. **Проверяет метод** через `core.v_show_method4bld`:
    - если не найден — печатает форму с ошибкой
      `«Метод показа "…" для раздела "…" не найден»`;
    - читает `id`, `name`, `view_name`, `form_upd`, `gen_info_about`.

4. **Проверяет `method_form_upd`**:
    - если задано (`!= 'none'`) и `unit` **не задан в XML** —
      подключает `<cmpSubForm path="…"/>` и завершает работу.

5. **Читает колонки** через `core.v_show_method_cols4bld`:
    - сортировка: `is_primary desc, is_parent desc, is_hierarhy desc,
     is_haschild desc, cols_order`;
    - читает `name`, `caption`, `type`, `datalen`, `formlen`,
      `ef_*` (`ef_fillmethod`, `ef_onlyread`, `ef_hidden`,
      `ef_replace_script`, `effm_script`, `effm_c_code`,
      `effm_sm_code`), `unitclick`, `is_required`, `nameforparam`,
      `nameforvalue`.

6. **Формирует `<cmpInfoAboutRecord>`** (если `gen_info_about = 1`
   и есть колонки).

7. **Формирует контролы** для каждой колонки в зависимости от
   `ef_fillmethod`:

   | `ef_fillmethod` | Контрол |
      |---|---|
   | `0` (text) + `unitclick` | `cmpUnitEdit` (ButtonEdit) |
   | `0` + `type = 2` (date) | `cmpDateEdit` |
   | `0` + `type = 1` (num) | `cmpEdit mask_type="signfnumber"` |
   | `0` + `type = 0` (str) | `cmpEdit` |
   | `1` (checkbox) | `cmpCheckBox` |
   | `2` (combobox) + `unitclick` | `cmpUnitEdit type="ComboBox"` |
   | `2` (combobox) | `cmpComboBox` с `<cmpComboItem>` |
   | `3` (textarea) | `cmpTextArea` (`rows` зависит от `datalen`) |
   | `4` (file) | `cmpFile` (storage db) |
   | `5` (fs file) | `cmpFile storage="fs"` |

8. **Формирует `<cmpDependences>`** для обязательных полей
   (`is_required`) и `<cmpMask>` для числовых.

9. **Формирует `<cmpAction name="SelAct">`** — SELECT по `PRIMARY`
   с ActionVar-ами для каждого поля.

10. **Формирует `<cmpAction name="UpdAddAct">`** — UPDATE / INSERT
    с ActionVar-ами для каждой колонки.

11. **Формирует `<cmpScript name="GENERATED_SCRIPT">`** —
    обработчики `Form.onCreate` / `Form.OnShow` /
    `Form.OnButtonOk` / `Form.OnSuccess` / `Form.OnError` /
    `Form.onClose`.

12. **Формирует кнопки** «ОК» и «Отмена».

13. **Оборачивает в `<cmpPageControl>`** (если `use_unitprop = 1`)
    с вкладками «Главная» / «Дополнительно».

14. **Парсит всё через `FormParser`** и передаёт родителю через
    `SetInnerText`.

### Клиент

Клиентского контрола нет. Вся логика — в сгенерированном
`<cmpScript>`:

- **`Form.onCreate`** — прячет вкладку «Дополнительно», если
  она не нужна.
- **`Form.OnShow`** — обрабатывает параметры (`PRIMARY`, `COPY`,
  `SHOW_BUTTON_OK`), загружает данные через `executeAction("SelAct")`,
  устанавливает caption формы, при просмотре (`SHOW_BUTTON_OK = 0`)
  отключает все контролы.
- **`Form.OnButtonOk`** — вызывает `executeAction("UpdAddAct")`,
  блокирует кнопку ОК.
- **`Form.OnSuccess`** — закрывает форму (`close()`), возвращая
  `newid` (для add) или `true` (для upd).
- **`Form.OnError`** — разблокирует кнопку ОК.
- **`Form.onClose`** — заглушка.

---

## Примеры использования

### 1. Простой вызов с XML

```xml
<cmpUnitEditGenerate name="" unit="MyUnit" method="LIST"/>
```

Сервер сгенерирует форму для раздела `MyUnit` по методу `LIST`.

### 2. Вызов из ссылки

```xml
<cmpUnitEditGenerate/>
```

Сервер возьмёт `unit` и `method` из `$_GET`:
`?unit=MyUnit&method=LIST`.

### 3. Вызов из JS

```js
D3Api.showForm('System/UnitEditGenerate', null, {
    vars: { unit: 'MyUnit', method: 'LIST' }
});
```

### 4. С формой редактирования из БД

Если у метода `LIST` в БД задана `form_upd = 'MyUnit/Edit'` и
XML содержит `<cmpUnitEditGenerate/>` **без атрибута `unit`** —
сервер подключит `<cmpSubForm path="MyUnit/Edit"/>` вместо
генерации полей.

### 5. Программный вызов `returnFRMonShow`

```php
// В серверном коде:
$generate = new UnitEditGenerate($attrs, $parent);
$generate->returnFRMonShow = true;
$html = $generate->Show(); // вернёт HTML-строку, не парся
```

Используется для отладки.

### 6. Использование `withUnitProps`

Если у раздела `use_unitprop = 1`, сервер добавит вкладку
«Дополнительно» с `<cmpUnitProps>`. Пользователь сможет
редактировать доп. свойства записи прямо на этой вкладке.

### 7. Обработка `COPY`

Если при открытии формы установлена переменная `COPY = 1`,
`Form.OnShow` вызовет `SelAct` с `action = "add"` — данные
загрузятся, но `PRIMARY` сбросится. Это режим «копирования»
записи.

### 8. Режим просмотра

Если установить `SHOW_BUTTON_OK = 0`, форма откроется в режиме
просмотра:
- кнопка «ОК» скрывается;
- кнопка «Отмена» переименовывается в «Закрыть»;
- все контролы отключаются через `setEnabled(ctrl, false)`.

### 9. Программное открытие

```js
D3Api.showForm('System/UnitEditGenerate', null, {
    modal_form: true,
    vars: {
        unit: 'MyUnit',
        method: 'LIST',
        PRIMARY: 42
    },
    onclose: function(res) {
        if (res && res.newid) {
            refreshDataSet('DS_MyUnit');
        }
    }
});
```

### 10. Открытие через `openD3Form`

```js
openD3Form('System/UnitEditGenerate', true, {
    width: 640,
    height: 480,
    vars: { unit: 'MyUnit', method: 'LIST' },
    onclose: function(res) {
        if (res && res.newid) {
            setControlProperty('GRID_MyUnit', 'locate', res.newid);
            refreshDataSet('DS_MyUnit');
        }
    }
});
```

---

## Поведение в IDE

Компонент **видимый**. В canvas отображается «скелет» — карточка
формы с примером структуры:

```
┌──────────────────────────────────────────────┐
│ ⚙ Form (generate)                            │
├──────────────────────────────────────────────┤
│ unit:   MyUnit                               │
│ method: LIST                                 │
├──────────────┬───────────────────────────────┤
│ Поле 1:      │ [_____…______]                │
│ Поле 2:      │ [_____…______]                │
│ Поле 3:      │ [_____…______]                │
├──────────────┴───────────────────────────────┤
│ ┌──────────┬───────────────┐                 │
│ │ Главная  │ Дополнительно │                 │
│ └──────────┴───────────────┘                 │
├──────────────────────────────────────────────┤
│                        [ ОК ]  [ Отмена ]    │
└──────────────────────────────────────────────┘
```

Реальные поля, вкладки и кнопки генерируются сервером на основе
конфигурации метода. В IDE отображается только «скелет».

### В дереве

```
cmpUnitEditGenerate name="" unit="" method=""
```

Одна строка — в IDE детей нет.

### В инспекторе

- HTML attributes: `id`, `class`, `style`
- D3 Base: `name`, `enabled`, `visible`, `hint`, `width`, `height`
- UnitEditGenerate: `unit`, `method`
- Events: пусто
- Styles: полный набор CSS-свойств

### Ограничения

- **Содержимое в IDE не воспроизводится** — только скелет.
- **Генерируемые Action-ы, DataSet-ы, Script не видны** — они
  создаются сервером в момент парсинга.
- **Ошибки БД** (раздел / метод не найден) отображаются в виде
  формы с сообщением, но не в IDE, а в рантайме.

---

## Интеграция с ядром IDE

### Подключение в `index.html`

Секция **D3 controls** (рядом с `UnitEdit`, `Form`, `SubForm`):

```html
<script src="Component/d3/UnitEditGenerate/index.js"></script>
```

### Правки в `ide/canvas.js`

**`CMP_TAGS`:**

```js
'cmpuniteditgenerate': 'cmpUnitEditGenerate',
```

`_injectIdeStyle` не трогаем — компонент видим.

`XML_SELF_CLOSE` не трогаем — контейнерный (сервер генерирует
внутри формы полноценную разметку).

`CDATA_CONTAINERS` не трогаем — нет CDATA.

### Правки в `ide/app.js`

**`CMP_TAGS`:**

```js
'cmpuniteditgenerate': 'cmpUnitEditGenerate',
```

### `PARENT_ONLY`

Не трогаем — `UnitEditGenerate` вставляется в любое место формы.

---

## Известные ограничения

1. **`unit` / `method` не обязательны в XML.** Если не заданы —
   берутся из `$_GET`. Это используется при вызове через ссылку
   `?unit=…&method=…`.

2. **`method_form_upd` в БД.** Если у метода задана форма
   редактирования, сервер подключает её через `SubForm` вместо
   генерации полей. Условие: `unit` **не задан** в XML.

3. **`use_unitprop = 1`** — раздел имеет доп. свойства. Сервер
   оборачивает форму в `PageControl` с двумя вкладками.
   Первая — «Главная» (поля), вторая — «Дополнительно»
   (`<cmpUnitProps>`).

4. **`gen_info_about = 1`** — генерируется `<cmpInfoAboutRecord>`
   в первой строке таблицы. Требует, чтобы у метода был
   `gen_info_about = 1` и `form_upd = ''`.

5. **`ef_fillmethod`** — определяет тип контрола:
    - `0` — text (Edit / DateEdit / UnitEdit);
    - `1` — checkbox;
    - `2` — combobox;
    - `3` — textarea;
    - `4` — file (БД);
    - `5` — file (ФС).

6. **`ef_onlyread = 1`** — колонка только для чтения
   (`readonly="true"` + `enabled="false"`).

7. **`ef_hidden = 1`** — колонка скрыта. Если у неё
   `is_required = 1` — всё равно показывается.

8. **`ef_replace_script`** — заменяет стандартный контрол на
   пользовательский HTML/JS.

9. **`unitclick`** — справочник для поля. Генерируется
   `<cmpUnitEdit>` вместо `<cmpEdit>` / `<cmpComboBox>`.

10. **`nameforparam` / `nameforvalue`** — переопределяют имена
    ActionVar-ов. Используются для нестандартных сценариев.

11. **`SelAct`** — фиксированное имя. Вызывается из `Form.OnShow`
    при `PRIMARY != undefined` и `COPY != 1`.

12. **`UpdAddAct`** — фиксированное имя. Вызывается из
    `Form.OnButtonOk`. Внутри — `UPDATE` или `INSERT` в зависимости
    от `action` (`upd` / `add`).

13. **`GENERATED_BUTTON_OK` / `GENERATED_BUTTON_BACK`** —
    фиксированные имена кнопок.

14. **`returnFRMonShow`** — флаг для отладки. Если `true`, сервер
    возвращает HTML-строку (не парся) через `return`. Это не
    публичный API, а внутренний механизм.

15. **`prepareSelectAction` / `prepareEditAction` /
    `prepareContainer` / `prepapreArrayControls`** — хуки для
    переопределения в наследниках (Oracle / PDO). В базовом классе
    просто возвращают аргумент без изменений.

16. **Стили `.unitEditForm` / `.unitEditContent` /
    `.unit_form_fields` / `.unit_form_buttons`** — заданы в
    `UnitEditGenerate.css`. Отвечают за отступы и выравнивание.
    В превью IDE используются собственные классы
    `.d3-preview-uniteditgenerate-*`.

17. **`Form.OnShow` отключает контролы при `SHOW_BUTTON_OK = 0`.**
    Это режим просмотра. Список cmptype-ов для отключения:
    `ComboBox`, `CheckBox`, `ButtonEdit`, `DateEdit`, `Edit`,
    `TextArea`.

18. **`Form.onClose` — пустой.** В отличие от `Dialog` или
    `Expander`, `UnitEditGenerate` не делает ничего особенного
    при закрытии.

19. **Программный вызов.** Через `D3Api.showForm` /
    `openD3Form` с `vars.unit` и `vars.method`. Можно передать
    `PRIMARY` для открытия в режиме редактирования.

20. **Обработка ошибок.** Если раздел или метод не найдены —
    сервер печатает форму-заглушку с сообщением. Если
    `form_upd` указывает на несуществующий файл — FormParser
    выбросит исключение.

21. **`COPY = 1`** — режим копирования. Данные загружаются,
    но `action` становится `add` (INSERT вместо UPDATE).

22. **`SHOW_BUTTON_OK = 0`** — режим просмотра. Скрывается
    кнопка «ОК», отключаются контролы.

23. **`newid`** — переменная, устанавливаемая после INSERT.
    Возвращается через `close({newid: getVar('newid')})`.

24. **`CMP_TAGS` в обеих картах** — обязательно. Без них при
    загрузке HTML с `<cmpuniteditgenerate>` (нижний регистр)
    `ComponentRegistry.match` вернёт `html.generic`.

25. **`XML_SELF_CLOSE` не трогаем** — контейнерный.

26. **`CDATA_CONTAINERS` не трогаем** — нет CDATA.

27. **`PARENT_ONLY` не трогаем** — без ограничений.

28. **Несколько `UnitEditGenerate` на одной форме** — не
    рекомендуется. Каждый генерирует свои `SelAct` / `UpdAddAct`
    / `GENERATED_SCRIPT`, что может привести к коллизиям имён.
    Если нужно — задавайте разные `name` в атрибутах (не
    поддерживается в текущей версии).

29. **Формы `.frm` с `UnitEditGenerate`.** Обычно это
    отдельная форма (например, `System/UnitEditGenerate.frm`),
    которая открывается через `D3Api.showForm` с `vars.unit` и
    `vars.method`. В IDE её можно создать как обычную форму,
    положив внутрь один `cmpUnitEditGenerate`.

30. **Наследники Oracle / PDO.** `UnitEditGenerateOracle` и
    `UnitEditGeneratePDO` наследуют `UnitEditGenerateBase`.
    Различия — в SQL-запросах (bindOut vs bindValue и т.п.).
    В IDE они не различаются.

---

## Чек-лист добавления нового экземпляра

1. В палитре выбрать **D3 → UnitEditGenerate**.
2. В инспекторе задать:
    - `unit` — код раздела (например `MyUnit`);
    - `method` — код метода (например `LIST`).
3. Если планируется вызов через ссылку с параметрами — оставить
   `unit` и `method` пустыми, значения придут из `$_GET`.
4. При необходимости задать `width`, `height`, `visible`,
   `enabled`.
5. Проверить в canvas: должен отобразиться «скелет» формы с
   заголовком, параметрами, примером полей, вкладками и кнопками.
6. Проверить в дереве: `cmpUnitEditGenerate` — одна строка.
7. При сохранении убедиться, что атрибуты `unit` и `method`
   попали в XML.
8. В рантайме:
    - сервер найдёт раздел и метод в БД;
    - сгенерирует форму со всеми полями;
    - `Form.OnShow` загрузит данные (если `PRIMARY` задан);
    - клик по «ОК» вызовет `UpdAddAct` и закроет форму.

---

## См. также

- `Component/d3/UnitEdit/README.md` — универсальный контрол
  выбора из справочника
- `Component/d3/UnitProps/README.md` — дополнительная вкладка
  свойств раздела (при `use_unitprop = 1`)
- `Component/d3/Form/README.md` — контейнер формы
- `Component/d3/SubForm/README.md` — подключение формы по пути
- `Component/d3/Action/README.md` — Action, генерируемый как
  `SelAct` / `UpdAddAct`
- `Component/d3/DataSet/README.md` — DataSet для данных
- `Component/d3/Script/README.md` — Script, генерируемый как
  `GENERATED_SCRIPT`
- `Component/d3/PageControl/README.md` — вкладки для
  `use_unitprop = 1`
- `UnitEditGenerate.inc` — серверный базовый класс
- `UnitEditGenerateOracle.inc` — Oracle-специфика
- `UnitEditGeneratePDO.inc` — PDO-специфика
- `UnitEditGenerate.css` — стили формы
