# practice_work
Приложение генерации писем для организации АВАКС-ГеоСервис
# Требования:
1. ОС Linux
2. Типы документов: odt, pdf

# Инструкция по сборке
1. Скачать репозиторий с гитхаба
2. открыть в терминале папку app
3. npm i
4. Обновить Либр офис если необходимо
sudo apt-get update
sudo apt-get install --reinstall libreoffice
5. npm run build
6. npm run package-linux

# Инструкция для запуска в режиме разрабочика
1. В разных терминалах:
npm start
npm run dev

# Инструкция по установке
1. Установить deb пакет 
sudo dpkg -i имя_пакета.deb из директории где лежит установщик

Упаковка скриптов питона:
pyinstaller --onefile --name odt_generator --add-data "template:template" generate_data.py
pyinstaller --onefile --name pdf_generator --add-data "template:template" generate_data_pdf.py
