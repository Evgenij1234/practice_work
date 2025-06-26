npm start
npm run dev

Распаковка odt

unzip template.odt -d template

упаковкак всего 

упаковка внтри докера с возможностью поменять дистрибутив линукс
docker run --rm pyinstaller-builder tar czf - -C /app/dist . > dist.tar.gz
mkdir -p dist && tar xzf dist.tar.gz -C dist

Упаковка скриптов питона:
pyinstaller --onefile --name odt_generator --add-data "template:template" generate_data.py
pyinstaller --onefile --name pdf_generator --add-data "template:template" generate_data_pdf.py

npm run build
npm run package-linux


папка ресуросв в линуксе 
/opt/LetterGenerator/resources/pdf_generator

