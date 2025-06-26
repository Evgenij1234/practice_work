import os
import sys
import json
from datetime import datetime
import shutil
import tempfile
import xml.etree.ElementTree as ET
from zipfile import ZipFile

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

def generate_odt_from_unpacked_template(output_path, template_data):
    try:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        template_dir = os.path.join(script_dir, "template")

        if not os.path.exists(template_dir):
            print(json.dumps({"error": f"Папка шаблона {template_dir} не найдена"}))
            return

        # Создаем временную папку для модифицированного шаблона
        temp_dir = tempfile.mkdtemp()
        modified_template_dir = os.path.join(temp_dir, "modified_template")
        shutil.copytree(template_dir, modified_template_dir)

        try:
            # Заменяем переменные в content.xml
            content_path = os.path.join(modified_template_dir, "content.xml")
            replace_in_xml(content_path, template_data)

            # Заменяем переменные в styles.xml (для колонтитулов)
            styles_path = os.path.join(modified_template_dir, "styles.xml")
            replace_in_xml(styles_path, template_data)

            # Создаем новый ODT файл
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            
            # Сначала добавляем mimetype без сжатия
            with ZipFile(output_path, 'w') as odt_file:
                # mimetype должен быть первым и несжатым
                mimetype_path = os.path.join(modified_template_dir, "mimetype")
                odt_file.write(mimetype_path, 'mimetype', compress_type=None)
                
                # Добавляем остальные файлы
                for root, dirs, files in os.walk(modified_template_dir):
                    for file in files:
                        file_path = os.path.join(root, file)
                        if file == "mimetype":
                            continue  # уже добавили
                        arcname = os.path.relpath(file_path, modified_template_dir)
                        odt_file.write(file_path, arcname)

            print(json.dumps({
                "success": True,
                "file_path": output_path,
                "message": f"Файл успешно создан по пути {output_path}",
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
            save_path = os.path.join(output_dir, f"document_{datetime.now().strftime('%Y%m%d_%H%M%S')}.odt")

        generate_odt_from_unpacked_template(save_path, input_data)

    except json.JSONDecodeError as e:
        print(json.dumps({"error": f"Неверный формат входных данных: {str(e)}"}))
    except Exception as e:
        print(json.dumps({"error": str(e)}))