# Webpack 5 Project Starter
---
Стартовый шаблон Wordpress-проекта на Webpack 5


## Начало работы
---

1. Инициализация:

    - Начать проект с нуля:

        > `npm i`

        Также, необходимо сохранить версию Node.js, используемую при установке 
        проекта, в файле `.nvmrc`.

    - Присоединиться к проекту (в т.ч. если локальный репозиторий уже есть, но
      устаревшей версии):
        - установить указанную в файле `.nvmrc` версию Node.js, скачав с 
        официального сайта, либо через NVM (в этом случае выполнить команду 
        `nvm use`, находясь в корне проекта, и необходимая версия Node.js станет 
        активной при условии, что была установлена).
        
        > `npm ci`

2. Разработка:

    > `npm run dev`

    devServer со html страницами будет доступен по адресу 
    http://localhost:8080/html/

3. Продакшн-сборка:

    > `npm run build`

Продакшн сборка происходит в папку `theme`.
