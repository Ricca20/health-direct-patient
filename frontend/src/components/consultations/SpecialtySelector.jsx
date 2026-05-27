import React from "react";

export default function SpecialtySelector({
  specialtyList,
  doctorList,
  setFilteredDoctors,
  formData,
  handleInputChange,
  checkExistingAppointments,
  patient,
  setExistingAppointments,
  setShowAppointmentPopup,
  t,
  inputStyle,
  labelStyle,
}) {
  const handleSpecialtyChange = async (e) => {
    const specialty = e.target.value;
    handleInputChange(e);

    // filter doctors immediately
    if (specialty) {
      const filtered = doctorList.filter((doc) => doc.specialty === specialty);
      setFilteredDoctors(filtered);

      // reset doctor selection when specialty changes
      handleInputChange({ target: { name: "doctor", value: "" } });
      handleInputChange({ target: { name: "doctorEmail", value: "" } });
    } else {
      setFilteredDoctors(doctorList);
    }

    if (specialty && patient?.patientId) {
      try {
        const response = await checkExistingAppointments(
          specialty,
          patient?.patientId
        );
        if (response?.data?.applications?.length > 0) {
          setExistingAppointments(response.data.applications);
          setShowAppointmentPopup(true);
        } else {
          setExistingAppointments([]);
        }
      } catch (err) {
        setExistingAppointments([]);
      }
    }
  };

  return (
    <div style={{ marginBottom: "15px" }}>
      <label htmlFor="specialty" style={labelStyle}>
        {t("inface_remote_consultations.specialty_label", "Specialty")}
      </label>
      <select
        id="specialty"
        name="specialty"
        value={formData.specialty || ""}
        onChange={handleSpecialtyChange}
        style={inputStyle}
      >
        <option value="">{t("inface_remote_consultations.choose_specialty", "Choose Specialty")}</option>
        {specialtyList.map((spec, idx) => (
          <option key={idx} value={spec}>
            {spec}
          </option>
        ))}
      </select>
    </div>
  );
}
