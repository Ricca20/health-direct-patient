import React from "react";

export default function DoctorSelector({
  doctorList,
  filteredDoctors,
  formData,
  handleInputChange,
  setFilteredDoctors,
  t,
  inputStyle,
  labelStyle,
  disabled
}) {
  return (
    <div style={{ marginBottom: "15px" }}>
      <label htmlFor="doctor" style={labelStyle}>
        {t("inface_remote_consultations.doctor_label", "Doctor")}
      </label>
      <select
        id="doctor"
        name="doctor"
        value={formData.doctor || ""}
         disabled={disabled}
        onChange={(e) => {
          const selectedDoctorId = e.target.value;
          const doc = doctorList.find((d) => d._id === selectedDoctorId);

          // store doctorId
          handleInputChange({
            target: { name: "doctor", value: selectedDoctorId },
          });

          // store specialty
          if (doc?.specialty) {
            handleInputChange({
              target: { name: "specialty", value: doc.specialty },
            });
          }

          // store doctorEmail
          if (doc?.email) {
            handleInputChange({
              target: { name: "doctorEmail", value: doc.email },
            });
          }

          // store amount and currency
          if (doc?.feesAmount) {
            handleInputChange({
              target: { name: "amount", value: doc.feesAmount },
            });
          }
          if (doc?.currency) {
            handleInputChange({
              target: { name: "currency", value: doc.currency },
            });
          }
        }}
        style={inputStyle}
      >
        <option value="">{t("inface_remote_consultations.choose_doctor", "-- Choose Doctor --")}</option>
        {filteredDoctors.map((doctor) => (
          <option key={doctor._id} value={doctor._id}>
            {doctor.fullName} - {doctor.specialty} ({doctor.feesAmount}{" "}
            {doctor.currency || "RUB"})
          </option>
        ))}
      </select>
    </div>
  );
}
