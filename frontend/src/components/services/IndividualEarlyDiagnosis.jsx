import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getDoctors, getAvailability } from "../../utils/api";

const inputStyle = {
  width: "100%",
  padding: "8px",
  fontSize: "14px",
  border: "1px solid #ccc",
  borderRadius: "4px",
  marginBottom: "15px",
};

const labelStyle = {
  display: "block",
  fontSize: "14px",
  color: "#333",
  marginBottom: "5px",
};

const slotCardStyle = {
  display: "inline-block",
  margin: "5px",
  padding: "10px 15px",
  borderRadius: "8px",
  border: "1px solid #ccc",
  cursor: "pointer",
  fontWeight: "500",
};

export default function IndividualEarlyDiagnosis({
  formData,
  handleInputChange,
  setDescription,
}) {
  const { t } = useTranslation();
  const [doctors, setDoctors] = useState([]);
  const [slots, setSlots] = useState([]);

  useEffect(() => {
    setDescription(
      <>
        <strong>
          {t("service_description.title", "Description of the service")}
        </strong>
        <br />
        {t(
          "service_description.intro",
          'The diagnosis of "cancer" always violates the usual way of life of any person, his relatives and friends. To be one step ahead and exclude oncological and other life-threatening diseases, we suggest undergoing a comprehensive health check-up.'
        )}
        <br />
        <br />
        <strong>
          {t(
            "service_description.service_title",
            "Individual early diagnosis of diseases in Health-Direct"
          )}
        </strong>
        <br />
        {t(
          "service_description.service_intro",
          "The service consists of the following stages:"
        )}
        <br />
        <br />
        1.{" "}
        {t(
          "service_description.step1",
          "Remote consultation with an oncologist who will assess the risks, determine potential health threats based on anamnesis data, and prescribe an examination plan."
        )}
        <br />
        2.{" "}
        {t(
          "service_description.step2",
          "You can undergo the examination yourself, or the Health-Direct team will arrange an examination by the best specialists."
        )}
        <br />
        3.{" "}
        {t(
          "service_description.step3",
          "Face-to-face consultation with an oncologist who, based on the results of tests and examinations, will give an accurate answer about the current state of health regarding the presence/absence of oncological diseases and their prerequisites. In addition, you will receive a full examination that identifies concomitant diseases."
        )}
        <br />
        <br />
        <strong>
          {t("service_description.mandatory_tests", "Mandatory tests include:")}
        </strong>
        <br />-{" "}
        {t(
          "service_description.test1",
          "complete blood count (indicated for the diagnosis of anemia, blood pathology, acute infectious diseases, etc.)"
        )}
        ;<br />-{" "}
        {t(
          "service_description.test2",
          "biochemical blood test (indicated to assess the functional state of organs and systems of the body: liver, kidneys, etc.)"
        )}
        ;<br />-{" "}
        {t(
          "service_description.test3",
          "general lipid profile (allows you to assess the risks of atherosclerosis and cardiovascular events: myocardial infarction, cerebral circulation disorders)"
        )}
        ;<br />-{" "}
        {t(
          "service_description.test4",
          "coagulogram (indicated for the diagnosis of blood clotting disorders)"
        )}
        ;<br />-{" "}
        {t(
          "service_description.test5",
          "tumor markers (repeated according to indications)"
        )}
        .<br />
        <br />
        {t(
          "service_description.instrumental_studies_intro",
          "In addition to tests, on the recommendation of a doctor, you will be prescribed instrumental studies, which may include:"
        )}
        <br />-{" "}
        {t("service_description.study1", "ultrasound of the pelvic organs")};
        <br />-{" "}
        {t("service_description.study2", "ultrasound of the abdominal organs")};
        <br />-{" "}
        {t("service_description.study3", "breast ultrasound (for women)")};
        <br />-{" "}
        {t(
          "service_description.study4",
          "ultrasound of the lymph nodes of the neck"
        )}
        ;<br />- {t("service_description.study5", "mammography (for women)")};
        <br />-{" "}
        {t(
          "service_description.study6",
          "gastro- and colonoscopy (with or without sedation)"
        )}
        ;<br />-{" "}
        {t(
          "service_description.study7",
          "low-dose CT scan of the chest organs"
        )}
        ;<br />- {t("service_description.study8", "dermatoscopy")};<br />-{" "}
        {t(
          "service_description.study9",
          "cytological and/or histological examination (if necessary)"
        )}
        ;<br />-{" "}
        {t(
          "service_description.study10",
          "additionally, the doctor will conduct a detailed examination of the skin, check the presence and size of nevi, freckles, and birthmarks."
        )}
        <br />
        <br />
        {t(
          "service_description.conclusion",
          "Individual early diagnosis is necessary for people who care about their health, who understand that it is much easier to prevent than to treat a disease, as well as for people who have survived cancer, who understand the need for an individual approach and a well-planned examination."
        )}
      </>
    );
  }, [t, setDescription]);

  useEffect(() => {
    getDoctors()
      .then((res) => setDoctors(res.data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (formData.doctor && formData.appointmentDate) {
      console.log("[Availability] Selected doctor ID:", formData.doctor);
      console.log("[Availability] Selected date:", formData.appointmentDate);

      const selectedDoctor = doctors.find((d) => d._id === formData.doctor);
      console.log("[Availability] Matched doctor object:", selectedDoctor);

      if (selectedDoctor?.email) {
        console.log("[Availability] Using doctor email:", selectedDoctor.email);

        getAvailability(selectedDoctor.email, formData.appointmentDate)
          .then((res) => {
            const data = res.data;
            console.log("[Availability] API response:", data);

            if (Array.isArray(data)) {
              setSlots(data);
            } else {
              console.warn(
                "[Availability] Unexpected API response (not an array):",
                data
              );
              setSlots([]);
            }
          })
          .catch((err) => {
            console.error("[Availability] Error fetching slots:", err);
            setSlots([]);
          });
      } else {
        console.warn(
          "[Availability] Doctor email not found. Skipping API call."
        );
      }
    } else {
      console.log(
        "[Availability] Doctor or appointment date not selected. Clearing slots."
      );
      setSlots([]);
    }
  }, [formData.doctor, formData.appointmentDate, doctors]);

  const handleSlotSelect = (slot) => {
    
    handleInputChange({
      target: {
        name: "slotId",
        value: slot._id,
      },
    });
  };

  useEffect(() => {
    const selectedDoctor = doctors.find((d) => d._id === formData.doctor);
    if (
      selectedDoctor?.email &&
      formData.doctorEmail !== selectedDoctor.email
    ) {
      handleInputChange({
        target: {
          name: "doctorEmail",
          value: selectedDoctor.email,
        },
      });
    }
  }, [formData.doctor, doctors]);

  const today = new Date().toISOString().split("T")[0];

  return (
    <>
      <div style={{ marginBottom: "15px" }}>
        <label style={labelStyle}>
          {t("inface_remote_consultations.doctor_label", "Doctor")}
        </label>
        <select
          name="doctor"
          value={formData.doctor || ""}
          onChange={handleInputChange}
          style={inputStyle}
        >
          <option value="">-- Choose Doctor --</option>
          {doctors.map((d) => (
            <option key={d._id} value={d._id}>
              {d.fullName}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: "15px" }}>
        <label style={labelStyle}>
          {t("service_form.booking_date", "Schedule Date")}
        </label>
        <input
          type="date"
          name="appointmentDate"
          min={today}
          value={formData.appointmentDate || ""}
          onChange={handleInputChange}
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: "15px" }}>
        <label style={labelStyle}>
          {t("service_form.booking_time", "Schedule Time")}
        </label>
        {slots.length > 0 ? (
  slots.map((slot) => {
    const start = new Date(slot.start);
    const end = new Date(slot.end);
    const subSlots = [];

    for (
      let time = new Date(start);
      time < end;
      time.setHours(time.getHours() + 1)
    ) {
      const subStart = new Date(time);
      const subEnd = new Date(time);
      subEnd.setHours(subEnd.getHours() + 1);

      const combinedId = `${slot._id}_${subStart.toISOString()}`;
      const isSelected = formData.slotId === combinedId; // ✅ FIXED HERE

      subSlots.push(
        <div
          key={combinedId}
          onClick={() => {
            handleInputChange({
              target: {
                name: "slotId",
                value: combinedId, // e.g. "abc123_2025-07-10T10:00:00.000Z"
              },
            });
            handleInputChange({
              target: {
                name: "startTime",
                value: subStart.toISOString(),
              },
            });
            handleInputChange({
              target: {
                name: "endTime",
                value: subEnd.toISOString(),
              },
            });
          }}
          style={{
            ...slotCardStyle,
            backgroundColor: isSelected ? "#cce5ff" : "#ffffff",
            border: isSelected ? "2px solid #007bff" : "1px solid #ccc",
          }}
        >
          {subStart.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}{" "}
          -{" "}
          {subEnd.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      );
    }

    return subSlots;
  })
) : (
  <p style={{ color: "#777" }}>
    {t("service_form.no_slots", "No available time slots")}
  </p>
)}


      </div>
    </>
  );
}
