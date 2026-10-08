# cmpUnitEdit

Универсальный контрол выбора значения из справочника. В зависимости
от атрибута `type` рендерится по-разному:

- **`ButtonEdit`** (по умолчанию) — input + кнопка вызова формы-справочника;
- **`Edit`** — input с авто-валидацией значения по справочнику;
- **`ComboBox`** — выпадающий список;
- **`RadioGroup`** — группа радиокнопок;
- **`FillingTextArea`** — textarea с заполнением по справочнику.

Сервер автоматически генерирует:

- **DataSet** `<name>_dataset` — список значений справочника;
- **Action** `<name>_action` — валидация введённого значения;
- **Completer** (для `ButtonEdit`) — подсказки при вводе;
- **ComboItem** / **RadioItem** — внутри `ComboBox` / `RadioGroup`;
- **Script** — с обработчиком `onbuttonclick`.

Клиентский `D3Api.UnitEditCtrl` содержит:
- **`callComposition(dom, name, data, addOnClose, permanent_filter)`** —
  открытие формы-справочника через `D3Api.showForm`;
- **`setSelectResult(dom)`** — функция-обёртка, возвращающая
  обработчик результата (`onclose`).

---

## Расположение

```
Component/d3/UnitEdit/
index.js
README.md              ← этот файл
images/icon.png
css/preview.css
js/                    (пусто)
```

**Серверные файлы:**

| Файл | Роль |
|---|---|
| `UnitEditCtrl.inc` | class `UnitEditBase extends BaseCtrl` — общая логика |
| `UnitEditOracle.inc` | class `UnitEdit extends UnitEditBase` — Oracle-специфика |
| `UnitEditPDO.inc` | class `UnitEdit extends UnitEditBase` — PDO-специфика |
| `UnitEdit.js` | `D3Api.UnitEditCtrl` |
| `UnitEdit.css` | (опционально — стили) |

---

## Тег и ID

- **XML-тег:** `cmpUnitEdit`
- **Регистрация в IDE:** `id: 'd3.unitedit'`
- **Категория:** D3
- **Вид в палитре:** `UnitEdit`
- **Видимость:** видимый (рендерит разметку в canvas)

---

## Разметка в рантайме

Серверный `UnitEdit::Show()` **не рендерит собственную разметку** —
он разворачивается в реальный компонент в зависимости от `type`:

### ButtonEdit

```html
<cmpScript>
  Form._onButtonClick<name> = function() {
    D3Api.UnitEditCtrl.callComposition(this, 'System/composition',
      { request: { unit: '<unit>', composition: '<composition>', … },
        vars: { LOCATE: getValue('<name>') } },
      null);
  };
</cmpScript>

<cmpButtonEdit name="<name>" unit="<unit>" composition="<composition>"
               onbuttonclick="Form._onButtonClick<name>.call(this);"
               …/>
```

### Edit

```html
<cmpEdit name="<name>" unit="<unit>" onblur="Edit_onExit(this); …"/>
```

### ComboBox

```html
<cmpComboBox name="<name>" unit="<unit>" …>
  <cmpComboItem activ="true"/>
  <cmpComboItem dataset="<name>_dataset" repeat="0"
                data="value:<primary>;caption:<result>"
                repeatername="<repeatername>"/>
</cmpComboBox>
```

### RadioGroup

```html
<cmpRadioGroup name="<name>" unit="<unit>" …>
  <cmpRadioItem dataset="<name>_dataset" repeat="0"
                data="value:<primary>;caption:<result>"/>
</cmpRadioGroup>
```

### FillingTextArea

```html
<cmpFillingTextArea name="<name>" unit="<unit>"
                    fillingdataset="<name>_dataset"
                    showfield="<result>"
                    returnfield="<primary>"/>
```

### Генерируемые DataSet и Action

**DataSet**:

```html
<cmpDataSet name="<name>_dataset" custom_filter="<custom_filter>"
            activateoncreate="false">
  <![CDATA[
    select … from … where …
  ]]>
  <cmpDataSetVar name="lpu" src="LPU" srctype="session"/>
  <cmpDataSetVar name="parent" src="<parent_ctrl>" srctype="ctrl"/>
  <cmpDataSetVar name="dirdict_id" get="dirdict" src="<id>" srctype="const"/>
  <cmpDataSetVar name="extradict_id" get="extradict" srctype="server_const"
                 default="<id>"/>
</cmpDataSet>
```

**Action** (для валидации):

```html
<cmpAction name="<name>_action" showerror="false">
  <![CDATA[
    select (<call_back_sql>) rvalue, :result rcaption
  ]]>
  <cmpActionVar name="result" get="cbresult" src="<name>:caption" srctype="ctrl"/>
  <cmpActionVar name="rvalue" put="rvalue" src="" srctype="data"/>
  <cmpActionVar name="rcaption" put="rcaption" src="" srctype="data"/>
  <cmpActionVar name="lpu" src="LPU" srctype="session"/>
  <cmpActionVar name="parent" get="cbparent" src="<parent_ctrl>" srctype="ctrl"/>
</cmpAction>
```

**Completer** (для ButtonEdit):

```html
<cmpCompleter name="<name>_completer" controls="<name>"
              dataset="DS_<name>_completer" minlength="3"
              maxitems="15" showfield="caption"
              setdata="value:value;caption:caption"/>
```

---

## Свойства (инспектор IDE)

### HTML attributes
- `id`, `class`, `style`, `title`

### D3 Base
- `name`, `caption`, `value`, `enabled`, `visible`, `hint`,
  `width`, `height`

### UnitEdit
- **`type`** — `ButtonEdit` | `Edit` | `ComboBox` | `RadioGroup` |
  `FillingTextArea`.
- **`unit`** — код раздела-справочника. Обязателен, если не
  заданы `extradict` / `dirdict`.
- **`method`** — код метода показа (`LIST`, `TREE`, …).
- **`composition`** — код композиции. Приоритетнее `method`.
- **`readonly`** — `true` — только для чтения.
- **`multisel`** — `true` — множественный выбор.
- **`kind`** — вид `ButtonEdit`.
- **`placeholder`** — подсказка.
- **`show_info`** — `true` — показывать информацию о выбранном.

### Parent
- **`parent_ctrl`** — имя контрола-родителя. Значение контрола
  передаётся в справочник как `parent_value`.
- **`parent_var`** — имя переменной формы.
- **`parent_value`** — фиксированное значение.

Приоритет: `parent_ctrl` > `parent_var` > `parent_value`.

### Dictionaries
- **`extradict`** — код дополнительного справочника.
- **`dirdict`** — код `add_directories`.
- **`return_note`** — `true` — возвращать note из extradict.
- **`catalog_unitcode`** — код каталога.

### Handlers
- **`beforeopen`** — JS-код перед открытием формы (может
  возвращать объект с дополнительными vars).
- **`onbuttonclick`** — JS-обработчик клика по кнопке.
- **`onblur`** — JS-обработчик blur.
- **`addlistener`** — JS-функция после выбора из справочника.
- **`window_data`** — JSON для параметров окна (`onshow`,
  `oncreate` и т. п.).
- **`custom_filter`** — JSON-фильтр для DataSet.
- **`permanent_filter`** — JSON-фильтр, сохраняющийся между
  вызовами справочника.
- **`append_filter`** — строка дополнительного фильтра
  (`const:…;ctrl:…;var:…`).
- **`add_to_request`** — дополнительные переменные в request.

### Completer
- **`completer_dataset`** — имя DataSet для Completer. `false` —
  отключить.
- **`minlength`** — минимальная длина для показа подсказок.
- **`callback`** — `false` — отключить обратный вызов (Action).
- **`notnode`** — исключение узлов дерева.
- **`locate_with_check`** — `true` — locate с галочкой в SelectList.
- **`repeatername`** — имя репитера (для ComboBox в Grid).

### Events
- `onchange`, `onselect`, `onopen`, `onclose`, `onfocus`, `onblur`,
  `onclick`

### Styles
Полный набор CSS-свойств из `CommonSchema.STYLE_FIELDS`.

---

## Формат атрибутов

| Атрибут | Тип | Описание |
|---|---|---|
| `name` | string | Имя контрола |
| `unit` | string | Код раздела справочника |
| `method` | string | Код метода показа |
| `composition` | string | Код композиции |
| `type` | enum | `ButtonEdit` / `Edit` / `ComboBox` / `RadioGroup` / `FillingTextArea` |
| `readonly` | boolean | Только для чтения |
| `multisel` | boolean | Множественный выбор |
| `kind` | string | Вид ButtonEdit |
| `show_info` | boolean | Показывать информацию о выбранном |
| `parent_ctrl` | string | Контрол-родитель |
| `parent_var` | string | Переменная-родитель |
| `parent_value` | string | Значение-родитель |
| `extradict` | string | Код дополнительного справочника |
| `dirdict` | string | Код `add_directories` |
| `return_note` | boolean | Возвращать note из extradict |
| `catalog_unitcode` | string | Код каталога |
| `beforeopen` | code | JS перед открытием |
| `onbuttonclick` | code | JS-обработчик клика |
| `onblur` | code | JS-обработчик blur |
| `addlistener` | code | JS после выбора |
| `window_data` | code | JSON параметров окна |
| `custom_filter` | code | JSON-фильтр DataSet |
| `permanent_filter` | code | JSON постоянный фильтр |
| `append_filter` | string | Строка `const:…;ctrl:…;var:…` |
| `add_to_request` | code | Доп. переменные request |
| `completer_dataset` | string | DataSet Completer |
| `minlength` | number | Минимальная длина |
| `callback` | boolean | `false` — отключить callback |
| `notnode` | string | Исключение узлов |
| `locate_with_check` | boolean | Locate с галочкой |
| `repeatername` | string | Имя репитера |

---

## Логика работы

### Сервер (`UnitEditBase::__construct`)

1. Устанавливает `CmpType = 'UnitEdit'`.
2. Читает `unit`, `method`, `composition`.
3. Читает `type`. По умолчанию — `ButtonEdit`.
4. Для `type = ComboBox` / `RadioGroup` / `FillingTextArea` —
   принудительно ставит `callback = 'false'`.
5. Для `type = FillingTextArea` — читает `addsql`.
6. Читает `multisel`, `kind`, `readonly`.
7. Если задан `dirdict` и `type != ComboBox` — принудительно
   `readonly = 'true'`.

### Сервер (`UnitEdit::Show`)

1. Определяет источник данных:
    - `composition` → ищет `method_id` через
      `core.f_composition8get_callback_method`;
    - `method` → ищет `method_id` через
      `core.f_show_method8get_id_by_code`;
    - `extradict` → ищет `extradict_id` и `extradict_format`;
    - `dirdict` → ищет `dirdict_id`, `dirdict_column`,
      `dirdict_format`.

2. Формирует `call_method` — JS-код для `onbuttonclick` или
   `onblur`.

3. Формирует `call_back_action` — Action `<name>_action` для
   валидации (если `callback != 'false'` и не `readonly`).

4. Для `ButtonEdit` — формирует `completer` (DataSet +
   `cmpCompleter`).

5. Для `ComboBox` / `RadioGroup` / `FillingTextArea` —
   формирует `dataset` (`<name>_dataset`), внутри которого:
    - SQL-запрос (`select_sql` + `order_str`);
    - DataSetVar-ы (`lpu`, `parent`, `version`, `dirdict_id`,
      `extradict_id`, `CABLAB`, `DIR_SERV_ID`, `sSQL`).

6. Парсит все сгенерированные компоненты через `FormParser`:
    - `completerDataSet`;
    - `call_back_action`;
    - `dataset`;
    - `method` (реальный контрол);
    - `methodScript`.

7. Передаёт всё родителю через `SetInnerText`.

### Клиент (`D3Api.UnitEditCtrl`)

**`callComposition(dom, name, data, addOnClose, permanent_filter)`**:

1. Если задан `permanent_filter` — преобразует его в структуру
   `{ds: {field: {value, mode}}}`. Для каждого поля:
    - если `value` содержит `:` (формат `ctrl:property`), берёт
      значение через `getControlProperty`;
    - если `value` совпадает с переменной формы — берёт
      через `getVar`;
    - иначе — константа.
2. Формирует `data.onprepare` — функцию, которая при открытии
   формы установит фильтры через `addFilterPermanent`.
3. Формирует `data.onclose` — массив `[setSelectResult(dom), addOnClose]`.
4. Вызывает `D3Api.showForm(name, undefined, data)`.

**`setSelectResult(dom)`** — возвращает обработчик результата:

1. Если результат не пуст:
    - сохраняет `res[res.name + '_fulldata']` в `dom.D3Store._fulldata`;
    - если `show_info && unit`:
        - ставит `valueShowInfo = res[res.name + '_id']`;
    - иначе:
        - если `dom.D3Store.tagged` — сравнивает старые и новые
          значения (`value`), устанавливает `caption` только если
          значение изменилось;
        - иначе — устанавливает `value` и `caption` из результата.

---

## Примеры использования

### 1. Простой ButtonEdit

```xml
<cmpUnitEdit name="lpuEdit" unit="LPUDICT" method="LIST"/>
```

При клике на кнопку откроется форма-справочник `LPUDICT`, выбор
вернёт `value` и `caption` в контрол.

### 2. С композицией

```xml
<cmpUnitEdit name="catalogEdit" unit="CATALOGS"
             composition="CATALOGS_TREE"/>
```

Используется композиция — открывается дерево каталогов.

### 3. ComboBox

```xml
<cmpUnitEdit name="statusEdit" unit="VAC_STATUSES"
             method="LIST" type="ComboBox"/>
```

Отрендерится как выпадающий список со значениями из `VAC_STATUSES`.

### 4. RadioGroup

```xml
<cmpUnitEdit name="sexEdit" unit="SEXES"
             method="LIST" type="RadioGroup"/>
```

Отрендерится как группа радиокнопок.

### 5. Edit с валидацией

```xml
<cmpUnitEdit name="codeEdit" unit="ICD10"
             method="LIST" type="Edit"/>
```

Ввод значения с проверкой по справочнику `ICD10`. Если значение
не найдено — Action вернёт ошибку, а `caption`/`value` будут
скорректированы.

### 6. С родителем

```xml
<cmpEdit name="organization" value="10903"/>

<cmpUnitEdit name="agentEdit" unit="AGENTS" method="LIST"
             parent_ctrl="organization"/>
```

При открытии справочника `AGENTS` передаётся `parent_value` из
`organization`. В форме-справочнике оно превратится в фильтр.

### 7. Множественный выбор

```xml
<cmpUnitEdit name="agentsEdit" unit="AGENTS" method="LIST"
             multisel="true"/>
```

ButtonEdit с `clearbutton="true"` — можно выбрать несколько
значений. В `value` вернётся `;`-разделённый список.

### 8. Дополнительный справочник

```xml
<cmpUnitEdit name="extraEdit" extradict="SOME_DICT"
             type="ComboBox" return_note="true"/>
```

Список значений из дополнительного справочника. `return_note="true"`
вернёт `note_cap` вместо `values`.

### 9. Директория `add_directories`

```xml
<cmpUnitEdit name="dirEdit" dirdict="SOME_DIR"
             type="ComboBox"/>
```

Значения из `d_v_add_directories_view_cse`.

### 10. Фильтры

```xml
<cmpUnitEdit name="filteredEdit" unit="AGENTS" method="LIST"
             custom_filter="{0:{unit:'LPUDICT',method:'LIST',
                               filter:'ACTIVE=1'}}"/>
```

Фильтр применяется к DataSet справочника.

### 11. Постоянный фильтр

```xml
<cmpUnitEdit name="constFilterEdit" unit="AGENTS" method="LIST"
             permanent_filter="{DS_AGENTS:{lpu:{value:'LPU',mode:'='}}}"/>
```

Значения фильтра берутся из переменной формы `LPU` при каждом
открытии справочника.

### 12. Дополнительный фильтр строкой

```xml
<cmpUnitEdit name="appendEdit" unit="AGENTS" method="LIST"
             append_filter="const:ACTIVE=1;ctrl:organization"/>
```

Формирует `append_filter` из константы и значения контрола.

### 13. С `beforeopen`

```xml
<cmpUnitEdit name="beforeEdit" unit="AGENTS" method="LIST"
             beforeopen="Form.prepareFilter()"/>
```

```js
Form.prepareFilter = function() {
    return { extraVar: 'value' };
};
```

Результат функции попадёт в `vars` формы-справочника.

### 14. Программное открытие

```js
var dom = getControl('lpuEdit');
D3Api.UnitEditCtrl.callComposition(
    dom,
    'System/composition',
    {
        request: { unit: 'LPUDICT', composition: 'LPUDICT_TREE' },
        vars: { LOCATE: getValue('lpuEdit') }
    },
    null
);
```

### 15. Программная обработка результата

```js
var handler = D3Api.UnitEditCtrl.setSelectResult(getControl('lpuEdit'));
handler({
    name: 'lpuEdit',
    lpuEdit: 'Наименование ЛПУ',
    lpuEdit_id: 10903
});
```

Установит `value="10903"` и `caption="Наименование ЛПУ"`.

### 16. `show_info="true"`

```xml
<cmpUnitEdit name="infoEdit" unit="AGENTS" method="LIST"
             show_info="true"/>
```

При выборе значения `valueShowInfo` будет содержать id, но
`caption` не изменится — используется для специальных сценариев.

### 17. Отключение callback

```xml
<cmpUnitEdit name="noCallbackEdit" unit="AGENTS" method="LIST"
             callback="false"/>
```

Не будет генерироваться Action для валидации. Подходит для
случаев, когда значение вводится вручную без проверки.

---

## Поведение в IDE

Компонент **видимый**. В canvas отображается в зависимости от
`type`:

**ButtonEdit** (по умолчанию):

```
┌─────────────────────┬────┐  ButtonEdit
│ Значение            │ …  │
└─────────────────────┴────┘
```

**Edit**:

```
┌─────────────────────┐  Edit
│ Значение            │
└─────────────────────┘
```

**ComboBox**:

```
┌──────────────┬──┐  ComboBox
│ (выбрать)    │▾ │
└──────────────┴──┘
```

**RadioGroup**:

```
○ A   ○ B   ○ C  RadioGroup
```

**FillingTextArea**:

```
┌────────────────────────┐  FillingTextArea
│ Значение               │
│                        │
└────────────────────────┘
```

Бейдж с типом — в правом верхнем углу превью.

### В дереве

```
cmpUnitEdit name="lpuEdit" unit="LPUDICT" type="ButtonEdit"
```

Одна строка — в IDE детей нет.

### В инспекторе

Большой набор атрибутов, разбитый на разделы:
- HTML attributes
- D3 Base
- UnitEdit (`type`, `unit`, `method`, `composition`, `readonly`,
  `multisel`, `kind`, `placeholder`, `show_info`)
- Parent (`parent_ctrl`, `parent_var`, `parent_value`)
- Dictionaries (`extradict`, `dirdict`, `return_note`,
  `catalog_unitcode`)
- Handlers (`beforeopen`, `onbuttonclick`, `onblur`, `addlistener`,
  `window_data`, `custom_filter`, `permanent_filter`,
  `append_filter`, `add_to_request`)
- Completer (`completer_dataset`, `minlength`, `callback`,
  `notnode`, `locate_with_check`, `repeatername`)
- Events (`OnChange`, `OnSelect`, `OnOpen`, `OnClose`, `OnFocus`,
  `OnBlur`, `OnClick`)
- Styles

### Ограничения

- **`unit` обязателен** — если не заданы `extradict` / `dirdict`,
  компонент не сработает.
- **Собственный preview зависит от `type`** — визуализация
  соответствует реальному контролу.
- **Генерируемые DataSet, Action, Completer не видны в дереве** —
  они создаются сервером в момент парсинга.

---

## Интеграция с ядром IDE

### Подключение в `index.html`

Секция **D3 controls**:

```html
<script src="Component/d3/UnitEdit/index.js"></script>
```

### Правки в `ide/canvas.js`

**`CMP_TAGS`:**

```js
'cmpunitedit': 'cmpUnitEdit',
```

`_injectIdeStyle` не трогаем — компонент видим.

`XML_SELF_CLOSE` не трогаем — контейнерный.

`CDATA_CONTAINERS` не трогаем — нет CDATA.

### Правки в `ide/app.js`

**`CMP_TAGS`:**

```js
'cmpunitedit': 'cmpUnitEdit',
```

### `PARENT_ONLY`

Не трогаем — `UnitEdit` вставляется в любое место формы.

---

## Известные ограничения

1. **`unit` обязателен.** Если не заданы `extradict` / `dirdict` —
   `Show()` выходит молча.

2. **`composition` приоритетнее `method`.** Если заданы оба,
   используется `composition`.

3. **`type = ComboBox` / `RadioGroup` / `FillingTextArea`** —
   принудительно ставит `callback = 'false'` — Action для
   валидации не генерируется.

4. **`dirdict` + `type != ComboBox`** — принудительно `readonly`.
   В `add_directories` нет уникальности в пределах словаря, поэтому
   ручной ввод запрещается.

5. **`extradict` / `dirdict` взаимоисключающие с `unit`.** Если
   задан хотя бы один из них — `unit` не обязателен.

6. **`parent_ctrl` / `parent_var` / `parent_value` — три
   альтернативы.** Приоритет: контрол → переменная → значение.

7. **`permanent_filter` требует формат** `{DS:{field:{value,mode}}}`.
   Пример: `{DS_AGENTS:{lpu:{value:'LPU',mode:'='}}}`.

8. **`custom_filter` — JSON-строка.** Пример:
   `{0:{unit:'UNIT',method:'LIST',filter:'ACTIVE=1'}}`.

9. **`append_filter` — строка `key:value;key:value`.** Возможные
   ключи: `const` (константа), `ctrl` (значение контрола),
   `var` (значение переменной).

10. **`beforeopen` возвращает объект** — он объединяется с
    `vars` через `Object.assign`. Если вернёт не-объект — vars
    не изменятся.

11. **Completer создаётся автоматически** (для ButtonEdit),
    если не задан `completer_dataset = false`. DataSet для
    Completer — `<name>_completer`, минимальная длина — 3,
    максимум — 15 подсказок.

12. **`callback = false`** отключает Action валидации. Тогда
    значение сохраняется как введено, без проверки по
    справочнику.

13. **`readonly = 'true'`** отключает Action валидации
    (аналогично `callback = false`).

14. **`multisel = true`** добавляет `clearbutton="true"` в
    ButtonEdit. В `value` возвращается `;`-разделённый список.

15. **`show_info = true`** — сохраняет `valueShowInfo`, но не
    меняет `caption`. Используется для сценариев, когда
    отображение caption контролируется отдельно.

16. **`onbuttonclick`** — если не задан, сервер генерирует
    `Form._onButtonClick<name>.call(this)`. Пользователь может
    переопределить.

17. **`window_data`** — вставляется в объект data формы как есть.
    Пример: `onshow: function() { … }`.

18. **`addlistener`** — JS-функция, вызываемая после выбора из
    справочника. Передаётся 4-м аргументом в `callComposition`.

19. **`add_to_request`** — добавляет переменные в `request` формы.
    Формат — строка `var1:value1;var2:value2`.

20. **`kind`** — вид ButtonEdit (например, `default`, `small`).
    Влияет на CSS-класс и поведение.

21. **`extradict` + `return_note="true"`** — при выборе вернётся
    `note_cap` вместо `values`. Используется, когда нужны
    подписи из доп. справочника.

22. **`repeatername`** — имя репитера для ComboBox внутри Grid.
    Для одиночного использования не требуется.

23. **Программное использование** — через
    `D3Api.UnitEditCtrl.callComposition`. Требует корректно
    сформированный объект `data`.

24. **`setSelectResult` возвращает функцию** — обработчик
    результата. Используется как `onclose` формы-справочника.

25. **`D3Api.showForm` внутри `callComposition`** — стандартный
    механизм D3 для открытия формы. Поддерживает `modal_form`,
    `onclose`, `onshow`, `oncreate`.

26. **Клиентский контрол — единый для всех типов.** Несмотря на
    разные рендеры, `D3Api.UnitEditCtrl` один.

27. **DataSet, Action, Completer, ComboItem, RadioItem, Script —
    генерируются сервером.** В IDE они не видны. Если нужен
    кастомный DataSet — задайте `completer_dataset` явно.

28. **`custom_filter` для DataSet-а.** Внутри SQL используется
    `custom_filter` как значение атрибута `cmpDataSet`. Клиент
    подхватывает фильтры из JSON.

29. **Версии DataSet** (для Oracle): `ver_lpu` может быть `0`, `1`
    или `2`. От этого зависит, передаётся ли `lpu` или `version`.

30. **`fdir` vs `dirdict`** — в `Show()` для `dirdict` используется
    сложный запрос через `d_v_add_directories`, включая
    `add_directories_view_cse` и `D_PKG_CSE_ACCESSES`. Требует
    правильно настроенной схемы БД.

---

## Чек-лист добавления нового экземпляра

1. В палитре выбрать **D3 → UnitEdit**.
2. В инспекторе задать:
    - `name` — имя контрола (обязательное);
    - `type` — `ButtonEdit` / `Edit` / `ComboBox` / `RadioGroup` /
      `FillingTextArea`;
    - `unit` — код справочника (или `extradict` / `dirdict`);
    - `method` / `composition` — код метода или композиции;
    - `readonly="true"` — если только для чтения;
    - `multisel="true"` — для множественного выбора;
    - `kind` — вид ButtonEdit;
    - `show_info="true"` — для сценариев с valueShowInfo.
3. Для родительской связи:
    - `parent_ctrl` — имя контрола-родителя; или
    - `parent_var` — имя переменной; или
    - `parent_value` — фиксированное значение.
4. Для дополнительных справочников:
    - `extradict` — код дополнительного;
    - `dirdict` — код `add_directories`;
    - `return_note="true"` — если нужны подписи.
5. Для фильтров:
    - `custom_filter` — JSON-фильтр DataSet;
    - `permanent_filter` — JSON постоянный фильтр;
    - `append_filter` — строка `const:…;ctrl:…;var:…`.
6. Для событий:
    - `beforeopen` — JS перед открытием;
    - `onbuttonclick` — переопределение обработчика;
    - `onblur` — обработчик blur;
    - `addlistener` — JS после выбора.
7. Для Completer:
    - `completer_dataset` — имя DataSet (или `false`);
    - `minlength` — минимальная длина (по умолчанию 3).
8. Проверить в дереве: `cmpUnitEdit` — одна строка без детей.
9. Проверить в canvas: превью должно отображаться в соответствии
   с `type`.
10. В рантайме: клик по кнопке (ButtonEdit) должен открыть форму
    справочника; выбор — вернуть `value` и `caption`.

---

## См. также

- `Component/d3/Edit/README.md` — однострочное поле
- `Component/d3/ComboBox/README.md` — выпадающий список
- `Component/d3/RadioGroup/README.md` — группа радиокнопок
- `Component/d3/TextArea/README.md` — многострочное поле
- `Component/d3/DataSet/README.md` — DataSet (генерируется сервером)
- `Component/d3/Action/README.md` — Action валидации
- `Component/d3/Completer/README.md` — Completer (для ButtonEdit)
- `UnitEditCtrl.inc` — серверный базовый класс
- `UnitEditOracle.inc` — Oracle-специфика
- `UnitEditPDO.inc` — PDO-специфика (пустой, наследуется)
- `UnitEdit.js` — клиентский `D3Api.UnitEditCtrl`
