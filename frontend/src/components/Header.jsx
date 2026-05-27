import { useState, useRef, useEffect, useContext } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { MdOutlineLogout } from "react-icons/md";
import { FaBars } from "react-icons/fa";
import { AuthContext } from "../context/AuthContext";
import i18n from "../utils/i18n";
import logo_en from "../assets/logo_en.png";
import logo_ru from "../assets/logo_ru.png";
import "../styles/Header.css";
import NotificationBox from "./NotificationBox";

const FLAG_URL = {
  en: "https://flagcdn.com/w40/gb.png",
  ru: "https://flagcdn.com/w40/ru.png",
};

const languages = [
  { code: "en", name: "English" },
  { code: "ru", name: "Русский" },
];

const Header = ({ openSidebar }) => {
  const { t } = useTranslation();
  const { patient, logout } = useContext(AuthContext);
  const [selectedLang, setSelectedLang] = useState(i18n.language);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const langContainerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        langContainerRef.current &&
        !langContainerRef.current.contains(event.target)
      ) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    setSelectedLang(lang);
    setIsLangOpen(false);
  };

  const handleLogout = async () => {
    await logout();
  };

  const isLoggedIn = !!patient;

  const getInitials = () => {
    if (!patient) return "";
    const value = patient.email || patient.phoneNumber || patient.firstName || "";
    if (!value || typeof value !== "string") return "U";
    return value[0].toUpperCase();
  };

  const selectedLanguage =
    languages.find((lang) => lang.code === selectedLang) || languages[0];

  return (
    <header className="w-full bg-white border-b border-gray-100 shadow-sm px-4 md:px-6 lg:px-8 py-3 flex items-center justify-between z-30">
      {/* Logo with improved dimensions */}
      <div className={`flex items-center ${!isLoggedIn ? "pl-2 md:pl-4" : ""}`}>
        {/* MOBILE MENU BUTTONk
        <button
          onClick={openSidebar}
          className="xl:hidden p-2 rounded-md hover:bg-gray-100"
        >
          <FaBars size={20} />
        </button> */}

        <img
          src={selectedLang === "ru" ? logo_ru : logo_en}
          alt="Logo"
           className="w-[110px] md:w-[138px] h-auto object-contain"
        />
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-3">
        <NotificationBox />

        {/* Language selector (custom dropdown) */}
        <div className="relative" ref={langContainerRef}>
          <button
            onClick={() => setIsLangOpen((prev) => !prev)}
            className="flex items-center gap-1.5 border border-gray-200 rounded-full px-3 py-1.5 hover:bg-gray-50 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-200"
            aria-expanded={isLangOpen}
            aria-haspopup="listbox"
          >
            <img
              src={FLAG_URL[selectedLang]}
              alt={selectedLang}
              className="w-5 h-3.5 object-cover rounded-sm"
            />
            <span className="text-sm text-gray-700 font-medium">
              {selectedLanguage.name}
            </span>
            <svg
              className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isLangOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* Dropdown menu */}
          {isLangOpen && (
            <div
              className="absolute mt-2 right-0 w-full min-w-[140px] bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden"
              role="listbox"
            >
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors ${
                    selectedLang === lang.code
                      ? "bg-gray-50 font-medium text-gray-900"
                      : "text-gray-700"
                  }`}
                  role="option"
                  aria-selected={selectedLang === lang.code}
                >
                  <img
                    src={FLAG_URL[lang.code]}
                    alt={lang.code}
                    className="w-5 h-3.5 object-cover rounded-sm"
                  />
                  <span>{lang.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Before login: Sign In button (icon removed) */}
        {!isLoggedIn && (
          <button
            onClick={() => navigate("/signin")}
            className="text-sm font-semibold text-white rounded-full px-4 py-2 transition shadow-sm"
            style={{ backgroundColor: "#00235c" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#001a47")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "#00235c")
            }
          >
            {t("header.signin") || "Sign In"}
          </button>
        )}

        {/* After login: user initials + logout */}
        {isLoggedIn && (
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm select-none"
              style={{ backgroundColor: "#00235c" }}
              title={patient?.email || patient?.phoneNumber || ""}
            >
              {getInitials()}
            </div>
            <button
              onClick={handleLogout}
              className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition"
              title="Logout"
            >
              <MdOutlineLogout size={18} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
