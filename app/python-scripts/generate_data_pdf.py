import os
import sys
import json
from datetime import datetime
import shutil
import tempfile
import xml.etree.ElementTree as ET
from zipfile import ZipFile
import subprocess

def replace_in_xml(file_path, replacements):
    """Заменяет переменные в XML файле (content.xml или styles.xml)"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        for key, value in replacements.items():
            if key != 'savePath':
                content = content.replace(f"{{{key}}}", str(value))

        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
    except Exception as e:
        raise Exception(f"Ошибка при обработке файла {file_path}: {str(e)}")

def convert_odt_to_pdf(odt_file_path, pdf_output_path):
    """
    Преобразует ODT файл в PDF с помощью LibreOffice
    """
    try:
        # Автопоиск LibreOffice для разных ОС
        libreoffice_paths = [
            "/usr/bin/libreoffice",
            "/usr/lib/libreoffice/program/soffice",
            "C:\\Program Files\\LibreOffice\\program\\soffice.exe",
            "C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe"
        ]
        
        found_path = None
        for path in libreoffice_paths:
            if os.path.exists(path):
                found_path = path
                break
        
        if not found_path:
            raise Exception("LibreOffice не найден. Установите LibreOffice или проверьте путь")

        # Создаем папку для PDF если её нет
        os.makedirs(os.path.dirname(pdf_output_path), exist_ok=True)
        
        # Команда для конвертации
        result = subprocess.run(
            [found_path, '--headless', '--convert-to', 'pdf', 
             '--outdir', os.path.dirname(pdf_output_path), odt_file_path],
            stdout=subprocess.PIPE, 
            stderr=subprocess.PIPE,
            timeout=30
        )

        if result.returncode != 0:
            error_msg = result.stderr.decode('utf-8', errors='replace')
            raise Exception(f"Ошибка конвертации: {error_msg}")
        
        # Получаем имя файла PDF (LibreOffice использует то же имя с расширением .pdf)
        pdf_path = os.path.join(
            os.path.dirname(pdf_output_path),
            os.path.splitext(os.path.basename(odt_file_path))[0] + '.pdf'
        )
        
        # Переименовываем если нужно
        if pdf_path != pdf_output_path:
            os.rename(pdf_path, pdf_output_path)
        
        return True
        
    except Exception as e:
        raise Exception(f"Ошибка при конвертации в PDF: {str(e)}")

def generate_pdf_from_template(output_path, template_data):
    try:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        template_dir = os.path.join(script_dir, "template")

        if not os.path.exists(template_dir):
            print(json.dumps({"error": f"Папка шаблона {template_dir} не найдена"}))
            return

        # Создаем временную папку для работы
        temp_dir = tempfile.mkdtemp()
        try:
            # 1. Сначала создаем ODT файл
            modified_template_dir = os.path.join(temp_dir, "modified_template")
            shutil.copytree(template_dir, modified_template_dir)

            # Заменяем переменные в XML файлах
            content_path = os.path.join(modified_template_dir, "content.xml")
            styles_path = os.path.join(modified_template_dir, "styles.xml")
            replace_in_xml(content_path, template_data)
            replace_in_xml(styles_path, template_data)

            # Создаем временный ODT файл
            temp_odt_path = os.path.join(temp_dir, "temp_document.odt")
            
            with ZipFile(temp_odt_path, 'w') as odt_file:
                # mimetype должен быть первым и несжатым
                mimetype_path = os.path.join(modified_template_dir, "mimetype")
                odt_file.write(mimetype_path, 'mimetype', compress_type=None)
                
                # Добавляем остальные файлы
                for root, dirs, files in os.walk(modified_template_dir):
                    for file in files:
                        if file == "mimetype":
                            continue
                        file_path = os.path.join(root, file)
                        arcname = os.path.relpath(file_path, modified_template_dir)
                        odt_file.write(file_path, arcname)

            # 2. Конвертируем ODT в PDF
            convert_odt_to_pdf(temp_odt_path, output_path)

            print(json.dumps({
                "success": True,
                "file_path": output_path,
                "message": f"PDF файл успешно создан по пути {output_path}",
                "данные": template_data.get("file_type", "")
            }))

        finally:
            try:
                shutil.rmtree(temp_dir)
            except Exception as e:
                print(f"Ошибка при удалении временных файлов: {e}", file=sys.stderr)

    except Exception as e:
        print(json.dumps({"error": str(e)}))


if __name__ == "__main__":
    try:
        # Чтение данных из stdin
        input_data_str = sys.stdin.read()
        input_data = json.loads(input_data_str)

        # Обработка даты
        if 'date' in input_data and input_data['date']:
            try:
                input_data['date'] = datetime.strptime(input_data['date'], "%Y-%m-%d").strftime("%d.%m.%Y")
            except ValueError:
                input_data['date'] = datetime.now().strftime("%d.%m.%Y")
        else:
            input_data['date'] = datetime.now().strftime("%d.%m.%Y")

        # Определение пути сохранения
        save_path = input_data.get('savePath')
        if not save_path:
            script_dir = os.path.dirname(os.path.abspath(__file__))
            output_dir = os.path.join(script_dir, "generated_docs")
            os.makedirs(output_dir, exist_ok=True)
            save_path = os.path.join(output_dir, f"document_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf")

        generate_pdf_from_template(save_path, input_data)

    except json.JSONDecodeError as e:
        print(json.dumps({"error": f"Неверный формат входных данных: {str(e)}"}))
    except Exception as e:
        print(json.dumps({"error": str(e)}))