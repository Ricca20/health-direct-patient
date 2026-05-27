import React from "react";

export default function AppointmentDatePicker({ today, formData, handleInputChange, t, inputStyle, labelStyle, disabled }) {
  return (
    <div style={{ marginBottom: "15px" }}>
      <label htmlFor="appointmentDate" style={labelStyle}>
        {t("service_form.booking_date")}
      </label>
      <input
        type="date"
        name="appointmentDate"
        value={formData.appointmentDate || ""}
        min={today}
        onChange={handleInputChange}
        style={inputStyle}
        disabled={disabled}
      />
    </div>
  );
}