import React, { useEffect } from "react";

export default function ClinicSelector({ formData, handleInputChange, t, inputStyle, labelStyle, disabled }) {
  useEffect(() => {
    if (!formData.clinic) {
      handleInputChange({ target: { name: "clinic", value: t("inface_remote_consultations.clinic_option_1") } });
    }
  }, [formData.clinic, handleInputChange, t]);

  return (
    <div style={{ marginBottom: "15px" }}>
      <label htmlFor="clinic" style={labelStyle}>
        {t("inface_remote_consultations.clinic_label")}
      </label>
      <select
        id="clinic"
        name="clinic"
        value={formData.clinic || t("inface_remote_consultations.clinic_option_1")}
        onChange={handleInputChange}
        style={inputStyle}
        disabled={disabled}
      >
        <option value={t("inface_remote_consultations.clinic_option_1")}>
          {t("inface_remote_consultations.clinic_option_1")}
        </option>
        <option value={t("inface_remote_consultations.clinic_option_2")} disabled>
          {t("inface_remote_consultations.clinic_option_2")}
        </option>
      </select>
    </div>
  );
}