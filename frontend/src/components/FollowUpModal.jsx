import React, { useState, useEffect } from "react";
import {
  FiCalendar,
  FiClock,
  FiX,
  FiCreditCard,
  FiDollarSign,
  FiArrowLeft,
} from "react-icons/fi";
import { getAvailability, bookFollowUp, createPayment } from "../utils/api";
import { useTranslation } from "react-i18next";
import "../styles/FollowUpModal.css";

const FollowUpModal = ({ isOpen, onClose, appointment, onBooked }) => {
  const [followUpDate, setFollowUpDate] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [payNowWarning, setPayNowWarning] = useState(null);
  const [appointmentMode, setAppointmentMode] = useState("");
  const [payNowOnly, setPayNowOnly] = useState(false);
  const [step, setStep] = useState(1);
  const [paymentOption, setPaymentOption] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const { t } = useTranslation();

  useEffect(() => {
    if (appointment?.appointmentMode) {
      setAppointmentMode(appointment.appointmentMode);
    }
  }, [appointment]);

  if (!isOpen) return null;

  const handleDateChange = async (date) => {
    setFollowUpDate(date);
    setSelectedSlot(null);

    if (!appointment?.doctorEmail) return;

    setLoadingSlots(true);
    const res = await getAvailability(
      appointment.doctorEmail,
      date,
      appointment.patientEmail
    );
    if (res.success) {
      setAvailableSlots(res.data || []);
    } else {
      setAvailableSlots([]);
      alert(res.message || "No slots available");
    }
    setLoadingSlots(false);
  };

  const handleProceed = () => {
    if (!appointmentMode) {
      alert("Please select consultation type.");
      return;
    }
    if (!followUpDate) {
      alert("Please select a date.");
      return;
    }
    if (!selectedSlot) {
      alert("Please select a time slot.");
      return;
    }
    setStep(2);
  };

  const handleConfirm = async () => {
    if (!paymentOption) {
      alert("Please select a payment option.");
      return;
    }

    setIsProcessing(true);

    try {
      const res = await bookFollowUp(appointment.applicationId, {
        needed: true,
        booked: true,
        comment: appointment.followUp?.comment || "",
        followUpDate,
        followUpTime: selectedSlot,
        appointmentMode,
        paymentPreference: paymentOption,
      });

      if (paymentOption === "pay_now") {
        await handleCreatePayment(
          res.followUpApplicationId,
          res.amount,
          res.currency
        );
      } else {
        alert("Follow-up booked successfully! Please pay at clinic.");
        onClose();
        onBooked && onBooked();
      }
    } catch (err) {
      console.error("Booking follow-up failed", err);
      alert("Failed to book follow-up");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreatePayment = async (applicationId, amount, currency) => {
    try {
      const paymentData = { applicationId, amount, currency };
      const paymentResponse = await createPayment(paymentData);

      const paymentUrl =
        paymentResponse.data?.paymentUrl ||
        paymentResponse.data?.confirmation_url;

      if (paymentUrl) {
        window.location.href = paymentUrl;
      } else {
        throw new Error("No payment URL received");
      }
    } catch (error) {
      console.error("Payment creation error:", error);
      alert("Failed to initiate payment");
      setIsProcessing(false);
    }
  };

  return (
    <div className="fum-overlay">
      <div className="fum-container">
        <div className="fum-card">
          {/* Header */}
          <div className="fum-header">
            <div className="fum-title-section">
              <div className="fum-step-indicator">
                <span className={`fum-step ${step === 1 ? "active" : ""}`}>
                  1
                </span>
                <div className="fum-step-divider"></div>
                <span className={`fum-step ${step === 2 ? "active" : ""}`}>
                  2
                </span>
              </div>
              <h3 className="fum-title">
                {step === 1
                  ? t("appointment.selectFollowUp")
                  : t("order_service.payment_options")}
              </h3>
            </div>
            <button className="fum-close-btn" onClick={onClose}>
              <FiX />
            </button>
          </div>

          {/* Step 1: Select Mode, Date, Slot */}
          {step === 1 && (
            <div className="fum-content">
              <div className="fum-form-group">
                <label className="fum-label">
                  {t("inface_remote_consultations.appointment_mode_label")}
                </label>
                <div className="fum-select-wrapper">
                  <select
                    className="fum-select"
                    value={appointmentMode}
                    onChange={(e) => setAppointmentMode(e.target.value)}
                  >
                    <option value="">{t("common.select")}</option>
                    <option value="Offline">{t("appointment.inFace")}</option>
                    <option value="Online">{t("appointment.remote")}</option>
                  </select>
                </div>
              </div>

              <div className="fum-form-group">
                <label className="fum-label">
                  <FiCalendar className="fum-icon" />
                  {t("appointment.date")}
                </label>
                <input
                  type="date"
                  className="fum-date-input"
                  value={followUpDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                />
              </div>

              {loadingSlots && (
                <div className="fum-loading">
                  <div className="fum-loading-spinner"></div>
                  <p>{t("follow_up_modal.loading_slots")}</p>
                </div>
              )}

              <div className="fum-form-group">
                <label className="fum-label">
                  <FiClock className="fum-icon" />
                  {t("service_form.booking_time")}
                </label>
                <div className="fum-slots-grid">
                  {availableSlots.length > 0 ? (
                    availableSlots.map((slot, index) => {
                      const start = new Date(slot.start);
                      const label = start.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                      const isSelected = selectedSlot === slot.start;

                      let displayStatus = slot.status;
                      let isDisabled = false;
                      let slotClass = "fum-slot";

                      if (slot.slotType === "patientConflict") {
                        isDisabled = true;
                        if (slot.status === "Unconfirmed") {
                          displayStatus = "Your Appointment (Unconfirmed)";
                          slotClass += " fum-slot-patient-conflict-unconfirmed";
                        } else if (slot.status === "Confirmed") {
                          displayStatus = "Your Appointment (Confirmed)";
                          slotClass += " fum-slot-patient-conflict-confirmed";
                        }
                      } else {
                        if (slot.status === "available") {
                          slotClass += isSelected
                            ? " fum-slot-selected"
                            : " fum-slot-available";
                        } else if (slot.status === "Confirmed") {
                          slotClass += " fum-slot-booked";
                        } else if (slot.status === "Booked & Unconfirmed") {
                          slotClass += isSelected
                            ? " fum-slot-reserved-selected"
                            : " fum-slot-reserved";
                          setPayNowOnly(true);
                        }
                      }

                      return (
                        <button
                          key={index}
                          className={slotClass}
                          disabled={isDisabled}
                          onClick={() => {
                            if (slot.status === "available") {
                              setSelectedSlot(slot.start);
                              setPayNowWarning(null);
                              setPayNowOnly(false);
                            } else if (slot.status === "Booked & Unconfirmed") {
                              setSelectedSlot(slot.start);
                              setPayNowWarning(
                                t("follow_up_modal.slot_warning")
                              );
                              setPayNowOnly(true);
                            }
                          }}
                        >
                          <span className="fum-slot-time">{label}</span>
                          <span className="fum-slot-status">
                            {displayStatus}
                          </span>
                        </button>
                      );
                    })
                  ) : (
                    <div className="fum-no-slots">
                      <FiClock className="fum-no-slots-icon" />
                      <p>{t("service_form.no_slots")}</p>
                    </div>
                  )}
                </div>
              </div>

              {payNowWarning && (
                <div className="fum-warning-banner">
                  <span>{payNowWarning}</span>
                </div>
              )}

              <div className="fum-action-buttons">
                <button className="fum-btn fum-btn-secondary" onClick={onClose}>
                  {t("common.cancel")}
                </button>
                <button
                  className="fum-btn fum-btn-primary"
                  onClick={handleProceed}
                  disabled={!appointmentMode || !followUpDate || !selectedSlot}
                >
                  {t("common.proceed")}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Payment Options */}
          {step === 2 && (
            <div className="fum-content">
              <div className="fum-payment-section">
                <div className="fum-appointment-summary">
                  <h4>{t("follow_up_modal.appointment_details")}</h4>
                  <div className="fum-summary-item">
                    <span>Date:</span>
                    <span>{new Date(followUpDate).toLocaleDateString()}</span>
                  </div>
                  <div className="fum-summary-item">
                    <span>Time:</span>
                    <span>
                      {selectedSlot
                        ? new Date(selectedSlot).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </span>
                  </div>
                  <div className="fum-summary-item">
                    <span>Type:</span>
                    <span>
                      {appointmentMode === "Online"
                        ? t("appointment.remote")
                        : t("appointment.inFace")}
                    </span>
                  </div>
                </div>

                <div className="fum-payment-options">
                  <h4>{t("order_service.payment_options")}</h4>

                  {appointmentMode === "Online" || payNowOnly ? (
                    <div className="fum-payment-option-group">
                      <p className="fum-payment-info">
                        {t("order_service.online_payment_info")}
                      </p>
                      <label className="fum-payment-option">
                        <input
                          type="radio"
                          name="paymentOption"
                          value="pay_now"
                          checked={paymentOption === "pay_now"}
                          onChange={() => setPaymentOption("pay_now")}
                          disabled={isProcessing}
                        />
                        <div className="fum-payment-option-content">
                          <FiCreditCard className="fum-payment-icon" />
                          <div className="fum-payment-text">
                            <span className="fum-payment-label">
                              {t("order_service.pay_now")}
                            </span>
                            <span className="fum-payment-desc">
                              {t("follow_up_modal.payment_secure")}
                            </span>
                          </div>
                        </div>
                      </label>
                    </div>
                  ) : (
                    <div className="fum-payment-option-group">
                      <p className="fum-payment-info">
                        {t("order_service.offline_payment_info")}
                      </p>
                      <label className="fum-payment-option">
                        <input
                          type="radio"
                          name="paymentOption"
                          value="pay_now"
                          checked={paymentOption === "pay_now"}
                          onChange={() => setPaymentOption("pay_now")}
                          disabled={isProcessing}
                        />
                        <div className="fum-payment-option-content">
                          <FiCreditCard className="fum-payment-icon" />
                          <div className="fum-payment-text">
                            <span className="fum-payment-label">
                              {t("order_service.pay_now")}
                            </span>
                            <span className="fum-payment-desc">
                              {t("follow_up_modal.payment_secure")}
                            </span>
                          </div>
                        </div>
                      </label>
                      <label className="fum-payment-option">
                        <input
                          type="radio"
                          name="paymentOption"
                          value="pay_at_clinic"
                          checked={paymentOption === "pay_at_clinic"}
                          onChange={() => setPaymentOption("pay_at_clinic")}
                          disabled={isProcessing}
                        />
                        <div className="fum-payment-option-content">
                          <FiDollarSign className="fum-payment-icon" />
                          <div className="fum-payment-text">
                            <span className="fum-payment-label">
                              {t("order_service.pay_at_clinic")}
                            </span>
                            <span className="fum-payment-desc">
                              {t("follow_up_modal.payment_clinic")}
                            </span>
                          </div>
                        </div>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div className="fum-action-buttons">
                <button
                  className="fum-btn fum-btn-secondary"
                  onClick={() => setStep(1)}
                  disabled={isProcessing}
                >
                  <FiArrowLeft className="fum-btn-icon" />
                  {t("common.back")}
                </button>
                <button
                  className="fum-btn fum-btn-primary"
                  onClick={handleConfirm}
                  disabled={!paymentOption || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <div className="fum-loading-spinner"></div>
                      {t("follow_up_modal.processing")}
                    </>
                  ) : (
                    t("common.confirm")
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FollowUpModal;
