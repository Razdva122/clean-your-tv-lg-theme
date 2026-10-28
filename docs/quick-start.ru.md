# Быстрый старт

Нужен Node.js 22 или новее. Откройте терминал в папке этого набора инструментов:

```sh
npm ci --ignore-scripts
npm run theme -- init themes/ocean --name Ocean --repository https://github.com/YOUR-NAME/YOUR-THEMES
npm run theme -- preview themes/ocean --runtime .runtime/candidate --edition no-root
```

Сначала получите у сопровождающего локальный экспорт runtime и поместите всю
папку в `.runtime/candidate`. Официальный runtime пока не опубликован; подробности
в [runtime.md](runtime.md). Никакие адреса загрузки не подставляются автоматически.

Откройте в браузере адрес **http://127.0.0.1:8766/**, напечатанный в терминале.
Не закрывайте терминал. Редактируйте `themes/ocean/theme.css` и сохраняйте файл:
допустимые изменения применяются автоматически. При ошибке останется последний
рабочий вариант, а текст ошибки появится над интерфейсом Home. Остановка: **Ctrl+C**.
Занят порт? Добавьте `--port 8767`. Для Root используйте `--edition root`.

Несколько тем можно хранить в `themes/ocean/`, `themes/forest/`: у каждой свои
id, версия, лицензия и описание. Проверка: `npm run theme -- validate themes/ocean
--runtime .runtime/candidate` (введите одной строкой). Сборка и публикация описаны
в [publish.md](publish.md). Английская документация и контракт runtime определяют
точные ограничения. Просмотр в браузере не подтверждает работу на телевизоре.
