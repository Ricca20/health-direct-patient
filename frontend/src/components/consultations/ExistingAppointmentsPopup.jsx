import React, { useState, useEffect } from "react";
import {
  FaCalendarAlt,
  FaClock,
  FaInfoCircle,
  FaEye,
  FaTrashAlt,
  FaCheck,
  FaBan,
  FaMoneyBillWave,
  FaCheckCircle,
  FaQuestionCircle,
  FaExclamationCircle,
} from "react-icons/fa";
import { useTranslation } from "react-i18next";
import "../../styles/ExistingAppointmentsPopup.css";

export default function ExistingAppointmentsPopup({
  showAppointmentPopup,
  setShowAppointmentPopup,
  existingAppointments,
  setExistingAppointments,
  appointmentToCancel,
  setAppointmentToCancel,
  handleCancelAppointment,
  navigate,
  loadingAppointments,
}) {
  const { t } = useTranslation();
  const [closing, setClosing] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);

  // Auto-close the popup when there are no appointments
  useEffect(() => {
    if (
      showAppointmentPopup &&
      Array.isArray(existingAppointments) &&
      existingAppointments.length === 0
    ) {
      const timer = setTimeout(() => {
        handleManualClose();
      }, 2000); // Close after 2 seconds

      return () => clearTimeout(timer);
    }
  }, [showAppointmentPopup, existingAppointments]);

  const getStatusDetails = (status) => {
    switch (status?.toLowerCase()) {
      case "confirmed":
        return {
          icon: <FaCheckCircle />,
          class: "confirmed",
          text: t("existingAppointments.appointmentItem.status.confirmed"),
        };
      case "unconfirmed":
        return {
          icon: <FaQuestionCircle />,
          class: "unconfirmed",
          text: t("existingAppointments.appointmentItem.status.unconfirmed"),
        };
      case "awaiting for payment":
      case "awaiting payment":
        return {
          icon: <FaMoneyBillWave />,
          class: "awaiting-payment",
          text: t("existingAppointments.appointmentItem.status.awaitingPayment"),
        };
      case "cancelled":
        return {
          icon: <FaBan />,
          class: "cancelled",
          text: t("existingAppointments.appointmentItem.status.cancelled"),
        };
      default:
        return {
          icon: <FaExclamationCircle />,
          class: "unknown",
          text: t("existingAppointments.appointmentItem.status.unknown"),
        };
    }
  };

  const handleManualClose = () => {
    setClosing(true);
    setTimeout(() => {
      setShowAppointmentPopup(false);
      setClosing(false);
    }, 300);
  };

  // Check if all appointments are cancelled
  const allCancelled =
    existingAppointments.length > 0 &&
    existingAppointments.every(
      (appt) => appt.appointmentStatus === "Cancelled"
    );

  // Only depend on the explicit show flag
  if (!showAppointmentPopup) return null;

  return (
    <div className={`appt-popup-overlay ${closing ? "popup-closing" : ""}`}>
      <div className="appt-popup-container">
        <div className="appt-popup-card">
          <div className="appt-popup-header">
            <div className="appt-popup-title">
              <FaCalendarAlt className="appt-header-icon" />
              <h3>{t("existingAppointments.title")}</h3>
            </div>
          </div>

          <div className="appt-popup-body">
            {!Array.isArray(existingAppointments) ? null : allCancelled ? (
              <div className="appt-success-message">
                <FaCheckCircle className="appt-success-icon" />
                <p>{t("existingAppointments.allCancelled")}</p>
                <button
                  className="appt-btn appt-btn-primary"
                  onClick={handleManualClose}
                >
                  {t("existingAppointments.close")}
                </button>
              </div>
            ) : existingAppointments.length === 0 ? (
              <div className="appt-info-alert">
                <FaInfoCircle className="appt-info-icon" />
                <p>{t("existingAppointments.noAppointments")}</p>
                <p className="appt-auto-close">
                  {t("existingAppointments.autoClose")}
                </p>
              </div>
            ) : (
              <>
                <div className="appt-info-alert">
                  <FaInfoCircle className="appt-info-icon" />
                  <p>
                    {t("existingAppointments.infoMessage")}
                  </p>
                </div>

                <div className="appt-list-container">
                  {loadingAppointments ? (
                    <p>{t("existingAppointments.refreshing")}</p>
                  ) : (
                    existingAppointments.map((appt, index) => {
                      const statusDetails = getStatusDetails(
                        appt.appointmentStatus
                      );
                      const isCancelled =
                        appt.appointmentStatus === "Cancelled";
                      const isCancelling = cancellingId === appt.applicationId;

                      return (
                        <div key={index} className="appt-item-card">
                          <div className="appt-item-header">
                            <div className="appt-doctor-info">
                              <div className="appt-avatar">
                                {appt.doctorName
                                  ? appt.doctorName.charAt(0)
                                  : "D"}
                              </div>
                              <div className="appt-doctor-details">
                                <h4 className="appt-doctor-name">
                                  {appt.doctorName || appt.doctorEmail}
                                </h4>
                              </div>
                            </div>
                            <span
                              className={`appt-status appt-status-${
                                isCancelled ? "cancelled" : statusDetails.class
                              }`}
                            >
                              {isCancelled ? <FaBan /> : statusDetails.icon}
                              {isCancelled
                                ? t("existingAppointments.appointmentItem.status.cancelled")
                                : appt.appointmentStatus}
                            </span>
                          </div>

                          <div className="appt-status-message">
                            {isCancelled
                              ? t("existingAppointments.appointmentItem.status.cancelled")
                              : statusDetails.text}
                          </div>

                          <div className="appt-details-grid">
                            <div className="appt-detail-item">
                              <FaCalendarAlt className="appt-detail-icon" />
                              <div>
                                <p className="appt-detail-label">
                                  {t("existingAppointments.appointmentItem.date")}
                                </p>
                                <p className="appt-detail-value">
                                  {appt.date
                                    ? new Date(appt.date).toLocaleDateString()
                                    : "N/A"}
                                </p>
                              </div>
                            </div>
                            <div className="appt-detail-item">
                              <FaClock className="appt-detail-icon" />
                              <div>
                                <p className="appt-detail-label">
                                  {t("existingAppointments.appointmentItem.time")}
                                </p>
                                <p className="appt-detail-value">
                                  {appt.startTime
                                    ? new Date(
                                        appt.startTime
                                      ).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })
                                    : "N/A"}{" "}
                                  -{" "}
                                  {appt.endTime
                                    ? new Date(appt.endTime).toLocaleTimeString(
                                        [],
                                        { hour: "2-digit", minute: "2-digit" }
                                      )
                                    : "N/A"}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="appt-actions">
                            <button
                              className="appt-btn appt-btn-secondary"
                              onClick={() =>
                                navigate(
                                  `/appointments/${encodeURIComponent(
                                    appt.applicationId
                                  )}`
                                )
                              }
                            >
                              <FaEye className="appt-btn-icon" />
                              {t("existingAppointments.appointmentItem.viewDetails")}
                            </button>

                            {!isCancelled &&
                              appointmentToCancel !== appt.applicationId && (
                                <button
                                  className="appt-btn appt-btn-danger"
                                  onClick={() =>
                                    setAppointmentToCancel(appt.applicationId)
                                  }
                                  disabled={isCancelling}
                                >
                                  <FaTrashAlt className="appt-btn-icon" />
                                  {isCancelling
                                    ? t("existingAppointments.appointmentItem.cancelling")
                                    : t("existingAppointments.appointmentItem.cancel")}
                                </button>
                              )}
                          </div>

                          {appointmentToCancel === appt.applicationId && (
                            <div className="appt-cancel-confirm">
                              <p>
                                {t("existingAppointments.appointmentItem.cancelConfirm")}
                              </p>
                              <div className="appt-confirm-buttons">
                                <button
                                  className="appt-btn appt-btn-confirm"
                                  onClick={async () => {
                                    setCancellingId(appt.applicationId);
                                    await handleCancelAppointment(
                                      appt.applicationId
                                    );
                                    setAppointmentToCancel(null);
                                    setCancellingId(null);
                                  }}
                                  disabled={isCancelling}
                                >
                                  <FaCheck className="appt-btn-icon" />
                                  {isCancelling
                                    ? t("existingAppointments.appointmentItem.cancelling")
                                    : t("existingAppointments.appointmentItem.confirmCancel")}
                                </button>
                                <button
                                  className="appt-btn appt-btn-cancel"
                                  onClick={() => setAppointmentToCancel(null)}
                                  disabled={isCancelling}
                                >
                                  <FaBan className="appt-btn-icon" />
                                  {t("existingAppointments.appointmentItem.keepAppointment")}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}