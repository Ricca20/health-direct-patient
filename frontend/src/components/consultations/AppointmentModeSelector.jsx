import React from "react";

export default function AppointmentModeSelector({
  doctorServices,
  selectedDoctor,
  formData,
  handleInputChange,
  t,
  inputStyle,
  labelStyle,
  disabled
}) {
  return (
    <div style={{ marginBottom: "15px" }}>
      <label htmlFor="appointmentMode" style={labelStyle}>
        {t("inface_remote_consultations.appointment_mode_label")}
      </label>
      <select
        id="appointmentMode"
        name="appointmentMode"
        value={formData.appointmentMode || ""}
        onChange={(e) => handleInputChange({ target: { name: "appointmentMode", value: e.target.value } })}
        style={inputStyle}
        disabled={!selectedDoctor || disabled}
      >
        <option value="">
          {selectedDoctor 
            ? t("inface_remote_consultations.select_placeholder") 
            : t("inface_remote_consultations.select_doctor_first")}
        </option>
        {doctorServices.includes("Offline") && (
          <option value="Offline">
            {t("inface_remote_consultations.offline_option")}
          </option>
        )}
        {doctorServices.includes("Online") && (
          <option value="Online">
            {t("inface_remote_consultations.online_option")}
          </option>
        )}
      </select>
    </div>
  );
}