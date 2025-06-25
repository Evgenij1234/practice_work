import React, { useEffect } from "react";

function Test() {
  useEffect(() => {
    // Подписка на получение логов от Electron
    if (window.electron && window.electron.onLog) {
      window.electron.onLog((message) => {
        try {
          // Пробуем распарсить сообщение как JSON
          const parsedMessage = JSON.parse(message);
          console.log("Получен лог из Electron (JSON):", parsedMessage);
        } catch (e) {
          // Если не получилось распарсить, используем TextDecoder для правильной кодировки
          const decoder = new TextDecoder('utf-8', { fatal: true });
          const decodedMessage = decoder.decode(new TextEncoder().encode(message));
          
          console.log("Получен лог из Electron (как строка, с декодировкой):", decodedMessage);
        }
      });
    }
  }, []);

  return <div></div>;
}

export default Test;
