// InFaceRemoteConsultations.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  getDoctors,
  getAvailability,
  checkExistingAppointments,
  cancelAppointment,
} from "../../utils/api";

import SpecialtySelector from "../consultations/SpecialtySelector";
import ExistingAppointmentsPopup from "../consultations/ExistingAppointmentsPopup";
import DoctorSelector from "../consultations/DoctorSelector";
import PaymentInfoCard from "../consultations/PaymentInfoCard";
import AppointmentModeSelector from "../consultations/AppointmentModeSelector";
import ClinicSelector from "../consultations/ClinicSelector";
import AppointmentDatePicker from "../consultations/AppointmentDatePicker";
import TimeSlotSelector from "../consultations/TimeSlotSelector";

import { FaCalendarAlt, FaInfoCircle } from "react-icons/fa";

const inputStyle = {
  width: "100%",
  padding: "8px",
  fontFamily: "'Quicksand', sans-serif",
  fontSize: "14px",
  color: "#333",
  border: "1px solid #ccc",
  borderRadius: "4px",
  backgroundColor: "#fff",
  boxSizing: "border-box",
};

const labelStyle = {
  display: "block",
  fontFamily: "'Quicksand', sans-serif",
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

export default function InFaceRemoteConsultations({
  formData,
  handleInputChange,
  setDescription,
  handleFileChange,
  files,
  patient,
  payNowOnly,
  setPayNowOnly,
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [doctorList, setDoctorList] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [slots, setSlots] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [specialtyList, setSpecialtyList] = useState([]);
  const [existingAppointments, setExistingAppointments] = useState([]);
  const [showAppointmentPopup, setShowAppointmentPopup] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState(null);
  const [timeSlotConflict, setTimeSlotConflict] = useState(null);
  const [payNowWarning, setPayNowWarning] = useState(null);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [blockBooking, setBlockBooking] = useState(false);

  // === Load Doctors on Mount ===
  useEffect(() => {
    getDoctors()
      .then((res) => {
        const docs = res.data || [];
        setDoctorList(docs);
        setFilteredDoctors(docs);
        setDoctors(docs);
        const specialties = Array.from(
          new Set(docs.map((d) => d.specialty))
        ).filter(Boolean);
        setSpecialtyList(specialties);
      })
      .catch(() => {
        setDoctorList([]);
        setFilteredDoctors([]);
        setSpecialtyList([]);
      });
  }, []);

  // === Cancel Appointment Handler ===
  const handleCancelAppointment = async (applicationId) => {
    try {
      setLoadingAppointments(true);
      const res = await cancelAppointment(applicationId);

      if (res.success) {
        const refreshed = await checkExistingAppointments(
          formData.specialty,
          patient?.patientId
        );
        const apps = Array.isArray(refreshed.data?.applications)
          ? refreshed.data.applications
          : [];
        setExistingAppointments(apps);
        setBlockBooking(apps.length > 0); // auto-update blockBooking
      }
      setLoadingAppointments(false);
      return res.success;
    } catch (err) {
      setLoadingAppointments(false);
      return false;
    }
  };

  // === Auto-check existing appointments when doctor changes ===
  useEffect(() => {
    const checkExisting = async () => {
      if (!formData.specialty || !patient?.patientId) return;

      try {
        setLoadingAppointments(true);
        const res = await checkExistingAppointments(
          formData.specialty,
          patient?.patientId
        );
        const apps = Array.isArray(res.data?.applications)
          ? res.data.applications
          : [];
        setExistingAppointments(apps);
        setBlockBooking(apps.length > 0);
        setLoadingAppointments(false);
      } catch (err) {
        console.error("Error checking existing appointments:", err);
        setLoadingAppointments(false);
      }
    };

    checkExisting();
  }, [formData.specialty, patient?.patientId]);

  // === Selected Doctor & Services ===
  const selectedDoctor = useMemo(
    () => doctors.find((d) => d._id === formData.doctor),
    [doctors, formData.doctor]
  );

  const doctorServices = useMemo(
    () =>
      Array.isArray(selectedDoctor?.services) ? selectedDoctor.services : [],
    [selectedDoctor]
  );

  // === Load Slots when doctor/date changes ===
  useEffect(() => {
    if (formData.doctor && formData.appointmentDate) {
      const doc = doctors.find((d) => d._id === formData.doctor);
      if (doc?.email) {
        getAvailability(doc.email, formData.appointmentDate, patient?.patientId)
          .then((res) => setSlots(Array.isArray(res.data) ? res.data : []))
          .catch(() => setSlots([]));
      }
    } else {
      setSlots([]);
    }
  }, [formData.doctor, formData.appointmentDate, doctors, patient?.patientId]);

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className={blockBooking ? "form-container disabled" : "form-container"}>
      {/* Specialty */}
      <SpecialtySelector
        specialtyList={specialtyList}
        doctorList={doctorList}
        setFilteredDoctors={setFilteredDoctors}
        formData={formData}
        handleInputChange={handleInputChange}
        checkExistingAppointments={checkExistingAppointments}
        patient={patient}
        setExistingAppointments={setExistingAppointments}
        setShowAppointmentPopup={setShowAppointmentPopup}
        t={t}
        inputStyle={inputStyle}
        labelStyle={labelStyle}
        disabled={blockBooking} // Pass disabled prop
      />

      {/* Popup for existing appointments */}
      <ExistingAppointmentsPopup
        showAppointmentPopup={showAppointmentPopup}
        setShowAppointmentPopup={setShowAppointmentPopup}
        existingAppointments={existingAppointments}
        setExistingAppointments={setExistingAppointments}
        appointmentToCancel={appointmentToCancel}
        setAppointmentToCancel={setAppointmentToCancel}
        handleCancelAppointment={handleCancelAppointment}
        navigate={navigate}
        loadingAppointments={loadingAppointments}
      />

      {/* Doctor */}
      <DoctorSelector
        doctorList={doctorList}
        filteredDoctors={filteredDoctors}
        formData={formData}
        handleInputChange={handleInputChange}
        setFilteredDoctors={setFilteredDoctors}
        t={t}
        inputStyle={inputStyle}
        labelStyle={labelStyle}
        disabled={blockBooking}
      />

      {/* Payment Info */}
      {selectedDoctor && (
        <PaymentInfoCard selectedDoctor={selectedDoctor} t={t} />
      )}

      {/* Appointment Mode */}
      <AppointmentModeSelector
        doctorServices={doctorServices}
        selectedDoctor={selectedDoctor}
        formData={formData}
        handleInputChange={handleInputChange}
        t={t}
        inputStyle={inputStyle}
        labelStyle={labelStyle}
        disabled={blockBooking}
      />

      {/* Clinic Selector */}
      {formData.appointmentMode === "Offline" && (
        <ClinicSelector
          formData={formData}
          handleInputChange={handleInputChange}
          t={t}
          inputStyle={inputStyle}
          labelStyle={labelStyle}
          disabled={blockBooking}
        />
      )}

      {/* Appointment Date */}
      <AppointmentDatePicker
        today={today}
        formData={formData}
        handleInputChange={handleInputChange}
        t={t}
        inputStyle={inputStyle}
        labelStyle={labelStyle}
        disabled={blockBooking}
      />

      {/* Time Slots */}
      <TimeSlotSelector
        slots={slots}
        formData={formData}
        handleSlotSelection={(slot) => {
          handleInputChange({
            target: { name: "startTime", value: slot.start },
          });
          handleInputChange({ target: { name: "endTime", value: slot.end } });
          handleInputChange({
            target: { name: "slotId", value: `${slot.start}_${slot.end}` },
          });
        }}
        setPayNowWarning={setPayNowWarning}
        setPayNowOnly={setPayNowOnly}
        payNowWarning={payNowWarning}
        t={t}
        slotCardStyle={slotCardStyle}
        labelStyle={labelStyle}
        disabled={blockBooking}
      />

      {/* Blocker Overlay */}
      {blockBooking && (
        <div className="blocker-overlay">
          <div className="blocker-popup">
            <FaInfoCircle className="blocker-icon" />
            <h3 className="blocker-title">{t("consultations.blocker.title")}</h3>
            <p className="blocker-message">
              {t("consultations.blocker.message")}
            </p>
            <button
              onClick={() => setShowAppointmentPopup(true)}
              className="blocker-button"
            >
              <FaCalendarAlt />
              {t("consultations.blocker.view_appointments")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}