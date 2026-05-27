import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../styles/ProfilePopup.css";

const ProfilePopup = ({ onClose }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleCompleteProfile = () => {
    navigate("/profile");
    onClose();
  };

  const handleClosePopup = () => {
    onClose();
  };

  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <h2>{t("profilePrompt.title")}</h2>
        <p>{t("profilePrompt.message")}</p>
        <div className="popup-buttons">
          <button
            className="popup-button primary"
            onClick={handleCompleteProfile}
          >
            {t("profilePrompt.completeNow")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePopup;
