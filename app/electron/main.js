// Модули для управления приложением и создания окна
const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const url = require("url");

let mainWindow;
const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 800,
    minHeight: 600,
    title: "ProjectStudent",
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: true,
      preload: path.join(__dirname, "js_electron/preload.js"),
    },
  });

  // и загрузить index.html приложения.
  //mainWindow.loadFile(path.join(__dirname, "../build/index.html")); //закомменитровать если надо перейти к dev версии

  const startUrl = process.env.ELECTRON_START_URL || url.format({//закомментировать если надо перейти к билд версии
    pathname: path.join(__dirname, '../index.html'),
    protocol: 'file:',
    slashes: true
  });
  //mainWindow.loadURL(startUrl); //закомментировать если надо перейти к билд версии
  mainWindow.loadURL('http://localhost:3000');//закомментировать если надо перейти к билд версии*/
  // Отображаем средства разработчика.
  //mainWindow.webContents.openDevTools(); //Закоментить в продакшене
  mainWindow.setMenuBarVisibility(false);
};
//закрыть
app.on("ready", createWindow);
ipcMain.on("close-window", () => {
  if (mainWindow) {
    mainWindow.close();
  }
});
//скрыть
ipcMain.on("min-window", () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});
//на весь экран
ipcMain.on("max-window", () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});
app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

// Обработка данных из React и запуск бинарных файлов

ipcMain.on("form-data", async (event, data) => {
  // Логируем данные, которые отправляем в рендерер
  mainWindow.webContents.send('log-message-from-main', `[IPC] Отправка данных в рендерер: ${JSON.stringify(data)}`);
  
  try {
    mainWindow.webContents.send('log-message-from-main', `[IPC] Получены данные из React: ${JSON.stringify(data)}`);
    event.sender.send('Получены данные из React:', data);

    // Проверка входных данных
    if (!data || !data.file_type) {
      const errorMsg = "Не получены необходимые данные из формы";
      mainWindow.webContents.send('log-message-from-main', `[IPC] Ошибка: ${errorMsg}`);
      throw new Error(errorMsg);
    }
    mainWindow.webContents.send('log-message-from-main', "[IPC] Данные прошли проверку");

    // Определение расширения и фильтра
    const extension = data.file_type === "pdf" ? "pdf" : "odt";
    const filters = [
      { name: `${extension.toUpperCase()} Files`, extensions: [extension] },
      { name: 'All Files', extensions: ['*'] }
    ];
    mainWindow.webContents.send('log-message-from-main', `[IPC] Выбрано расширение: ${extension}`);

    // Диалог сохранения файла
    const { filePath } = await dialog.showSaveDialog(mainWindow, {
      title: "Сохранить документ",
      defaultPath: path.join(
        app.getPath("documents"),
        `document_${new Date().toISOString().slice(0, 10)}.${extension}`
      ),
      filters: filters,
    });
    mainWindow.webContents.send('log-message-from-main', `[IPC] Ожидаемый путь для сохранения: ${filePath}`);

    if (!filePath) {
      mainWindow.webContents.send('log-message-from-main', "[IPC] Пользователь отменил диалог сохранения");
      return;
    }

    // Имя бинарного файла (без расширения для Linux)
    const binaryName = data.file_type === "pdf" ? "pdf_generator" : "odt_generator";
    const binaryPath = app.isPackaged
      ? path.join(process.resourcesPath, binaryName)  // В собранном приложении
      : path.join(__dirname, binaryName);            // В режиме разработки

    mainWindow.webContents.send('log-message-from-main', `[IPC] Путь к бинарнику: ${binaryPath}`);

    // Проверка существования файла
    if (!fs.existsSync(binaryPath)) {
      const errorMsg = `Бинарный файл не найден по пути: ${binaryPath}\nПроверьте:\n1. Что файл существует\n2. Что он включен в сборку\n3. Что у файла есть права на выполнение`;
      mainWindow.webContents.send('log-message-from-main', `[IPC] Ошибка: ${errorMsg}`);
      event.sender.send(`Ошибка: ${errorMsg}`);
      await dialog.showErrorBox("Ошибка", errorMsg);
      return;
    }

    // Подготовка данных для передачи
    const dataWithPath = {
      ...data,
      savePath: filePath,
    };
    mainWindow.webContents.send('log-message-from-main', `[IPC] Данные для запуска процесса: ${JSON.stringify(dataWithPath)}`);

    // Создаем дочерний процесс
    const childProcess = exec(
      `"${binaryPath}"`,
      { timeout: 30000 },
      (err, stdout, stderr) => {
        if (err) {
          const errorMessage = `Ошибка выполнения процесса: ${err.message}`;
          mainWindow.webContents.send('log-message-from-main', `[IPC] ${errorMessage}`);
          console.error("[IPC] Ошибка выполнения:", err);
          dialog.showMessageBox(mainWindow, {
            type: "error",
            title: "Ошибка",
            message: `${errorMessage}\n\nДетали:\n${stderr?.toString() || err.message}`,
            buttons: ["OK"],
          });
          return;
        }

        mainWindow.webContents.send('log-message-from-main', `[IPC] Вывод программы: ${stdout?.toString()}`);
        if (stderr) mainWindow.webContents.send('log-message-from-main', `[IPC] Ошибки программы: ${stderr?.toString()}`);

        try {
          // Парсим JSON ответ, если он есть
          if (stdout) {
            const result = JSON.parse(stdout);
            if (result.error) {
              throw new Error(result.error);
            }
          }

          dialog.showMessageBox(mainWindow, {
            type: "info",
            title: "Готово",
            message: `Документ успешно сохранен:\n${filePath}`,
            buttons: ["OK"],
          });
        } catch (parseErr) {
          dialog.showMessageBox(mainWindow, {
            type: "error",
            title: "Ошибка обработки результата",
            message: `Не удалось обработать результат: ${parseErr.message}`,
            buttons: ["OK"],
          });
        }
      }
    );

    // Записываем данные в stdin процесса
    childProcess.stdin.write(JSON.stringify(dataWithPath));
    childProcess.stdin.end();

    // Обработка ошибок записи в stdin
    childProcess.stdin.on('error', (err) => {
      mainWindow.webContents.send('log-message-from-main', `[IPC] Ошибка записи в stdin: ${err.message}`);
      console.error("[IPC] Ошибка записи в stdin:", err);
    });

  } catch (mainErr) {
    const errorMsg = `Критическая ошибка: ${mainErr.message}`;
    mainWindow.webContents.send('log-message-from-main', `[IPC] ${errorMsg}`);
    console.error("[IPC] Критическая ошибка:", mainErr);
    dialog.showMessageBox(mainWindow, {
      type: "error",
      title: "Критическая ошибка",
      message: errorMsg,
      buttons: ["OK"],
    });
  }
});