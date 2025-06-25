FROM ubuntu:18.04

# Установка системных зависимостей + Python
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential \
    python3-dev \
    python3-pip \
    python3-setuptools \
    libglib2.0-0 \
    libgl1 \
    libglib2.0-bin \
    tar \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Обновляем pip и ставим wheel (нужен для сборки PyInstaller)
RUN pip3 install --no-cache-dir --upgrade pip setuptools wheel

# Ставим PyInstaller (можно заменить на конкретную версию, например `pyinstaller==5.13.2`)
RUN pip3 install --no-cache-dir pyinstaller

# Копируем исходники в /app
WORKDIR /app
COPY . .

# Собираем бинарники
RUN pyinstaller --onefile --name odt_generator --add-data "template:template" generate_data.py && \
    pyinstaller --onefile --name pdf_generator --add-data "template:template" generate_data_pdf.py

# Упаковываем бинарники в tar.gz (чтобы удобно копировать одной командой)
RUN tar -czvf /app/binaries.tar.gz -C /app/dist .

# Точка монтирования (чтобы можно было скопировать архив наружу)
VOLUME /app/output

# Копируем архив в /app/output (который будет смонтирован с хоста)
CMD cp /app/binaries.tar.gz /app/output/ && tail -f /dev/null