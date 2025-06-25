import { useState, useRef, useEffect } from "react";
import React from "react";
import "./Exercise.scss";
import myImage from "./img/image.png";
import Test from "../test";

const signatures = {
  "Е.Д. Крылов": "Генеральный директор",
  "И.В. Нигруца": "Исполнительный директор",
  "Д.Ф. Баляков": "Программный директор",
  "Д.А. Бондаренко": "Заместитель генерального директора",
};

// Функция для преобразования переносов строк и пробелов в XML-совместимый формат
const formatTextForXML = (text) => {
  return text
    .replace(/\n/g, "<text:line-break/>") // Заменяем переносы строк
    .replace(/  +/g, (match) => 
      Array(match.length).fill("<text:s/>").join("") // Заменяем множественные пробелы
    );
};

function Exercise() {
  const textareaBodyRef = useRef(null);
  const textareaOrgRef = useRef(null);
  
  const [formData, setFormData] = useState({
    date: "",
    number: "",
    organization: "",
    contact_name: "",
    contact_surname: "",
    body_text: "",
    signature_name: "Е.Д. Крылов",
    executor_name: "Д.Ф. Баляков",
    executor_phone: "+79135848058",
    website: "www.uav-siberia.com",
  });

  const [rawFormData, setRawFormData] = useState({ ...formData }); // Сохраняем оригинальный текст
  const [fileType, setFileType] = useState("pdf");
  const [errors, setErrors] = useState({});

  const adjustTextareaHeight = (textarea) => {
    const maxHeight = window.innerHeight * 0.7;
    textarea.style.height = "auto";
    const newHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${newHeight}px`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name !== "body_text" && name !== "organization" && value.length > 100) {
      return;
    }
    
    setRawFormData(prev => ({ ...prev, [name]: value }));
    
    // Для полей organization и body_text форматируем текст для XML
    if (name === "organization" || name === "body_text") {
      const formattedValue = formatTextForXML(value);
      setFormData(prev => ({ ...prev, [name]: formattedValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleTextareaChange = (e) => {
    handleChange(e);
    adjustTextareaHeight(e.target);
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text/plain');
    const { name } = e.target;
    
    const newRawValue = rawFormData[name] + pastedText;
    setRawFormData(prev => ({ ...prev, [name]: newRawValue }));
    
    if (name === "organization" || name === "body_text") {
      const formattedValue = formatTextForXML(newRawValue);
      setFormData(prev => ({ ...prev, [name]: formattedValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: newRawValue }));
    }
    
    setTimeout(() => {
      adjustTextareaHeight(e.target);
    }, 0);
  };

  useEffect(() => {
    if (textareaOrgRef.current) {
      adjustTextareaHeight(textareaOrgRef.current);
    }
    if (textareaBodyRef.current) {
      adjustTextareaHeight(textareaBodyRef.current);
    }
  }, []);

  const sendToElectron = () => {
    const newErrors = {};
    for (let key in rawFormData) {
      if (rawFormData[key].trim() === "") {
        newErrors[key] = `${key} не может быть пустым!`;
      }
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const dataToSend = {
      ...formData, // Отправляем форматированные данные
      original_organization: rawFormData.organization, // Для отображения в интерфейсе
      original_body_text: rawFormData.body_text,      // Для отображения в интерфейсе
      signature_position: signatures[formData.signature_name] || "",
      file_type: fileType,
    };

    if (window.electron) {
      window.electron.sendData(dataToSend);
      console.log("Данные отправлены в Electron:", dataToSend);
    }
  };

  return (
    <div className="Exercise">
      <Test />
      <div className="Exercise-avax">
        <img src={myImage} alt="Описание картинки" />
      </div>
      <div className="Exercise-centr">
        <div className="Exercise-centr-left">
          <input
            type="date"
            name="date"
            onChange={handleChange}
            className={errors.date ? "error" : ""}
            max="2099-12-31"
          />
          <span className="Exercise-label">№</span>
          <input
            type="text"
            name="number"
            placeholder="Исходящий номер"
            onChange={handleChange}
            className={errors.number ? "error" : ""}
            maxLength={100}
          />
        </div>
        <div className="Exercise-centr-right">
          <textarea
            ref={textareaOrgRef}
            name="organization"
            value={rawFormData.organization} // Показываем оригинальный текст
            className={`Exercise-centr-right-textarea ${
              errors.organization ? "error" : ""
            }`}
            placeholder="Организация, адрес, email, тел."
            onChange={handleTextareaChange}
            onPaste={handlePaste}
            maxLength={5000}
          />
        </div>
      </div>

      <div className="Exercise-text">
        <div className="Exercise-text-fio">
          Уважаемый{" "}
          <input
            type="text"
            name="contact_name"
            placeholder="Имя"
            onChange={handleChange}
            className={errors.contact_name ? "error" : ""}
            maxLength={100}
          />{" "}
          <input
            type="text"
            name="contact_surname"
            placeholder="Отчество"
            onChange={handleChange}
            className={errors.contact_surname ? "error" : ""}
            maxLength={100}
          />
          !
        </div>
        <div className="Exercise-text-fio-message">
          <textarea
            ref={textareaBodyRef}
            name="body_text"
            value={rawFormData.body_text} // Показываем оригинальный текст
            className={`Exercise-text-label ${errors.body_text ? "error" : ""}`}
            placeholder="Текст сообщения..."
            onChange={handleTextareaChange}
            onPaste={handlePaste}
          />
        </div>
      </div>

      <div className="Exercise-bootom">
        <div>
          <label className="Exercise-label" htmlFor="signature_name">
            С уважением,
          </label>
          <br />
          <select
            id="signature_name"
            name="signature_name"
            onChange={handleChange}
            defaultValue="Е.Д. Крылов"
          >
            <option value="Е.Д. Крылов">Е.Д. Крылов</option>
            <option value="И.В. Нигруца">И.В. Нигруца</option>
            <option value="Д.Ф. Баляков">Д.Ф. Баляков</option>
            <option value="Д.А. Бондаренко">Д.А. Бондаренко</option>
          </select>
        </div>

        <div className="Exercise-filetype">
          <label className="Exercise-filetype-blok">
            <input
              className="Exercise-filetype-input"
              type="radio"
              name="fileType"
              value="pdf"
              checked={fileType === "pdf"}
              onChange={(e) => setFileType(e.target.value)}
            />
            PDF
          </label>
          <label className="Exercise-filetype-blok">
            <input
              className="Exercise-filetype-input"
              type="radio"
              name="fileType"
              value="odt"
              checked={fileType === "odt"}
              onChange={(e) => setFileType(e.target.value)}
            />
            ODT
          </label>
          <div className="Exercise-box-button">
            <button className="button" onClick={sendToElectron}>
              Сохранить файл
            </button>
          </div>
        </div>
      </div>

      <div className="footer-fields">
        <div className="footer-fields-left">
          <input
            className={`footer-fields-left-input ${
              errors.executor_name ? "error" : ""
            }`}
            type="text"
            name="executor_name"
            value={formData.executor_name}
            onChange={handleChange}
            placeholder="Исполнитель"
            maxLength={100}
          />
          <input
            className={`footer-fields-left-input ${
              errors.executor_phone ? "error" : ""
            }`}
            type="text"
            name="executor_phone"
            value={formData.executor_phone}
            onChange={handleChange}
            placeholder="Телефон"
            maxLength={12}
          />
        </div>
        <div className="footer-fields-centr">
          <span
            className={`footer-fields-centr-input ${
              errors.website ? "error" : ""
            }`}
          >
            {formData.website}
          </span>
        </div>
      </div>
    </div>
  );
}

export default Exercise;