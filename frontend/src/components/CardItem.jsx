import React from "react";
import { useTranslation } from "react-i18next";
import moment from "moment-timezone";
import "../styles/CardItem.css";

const MOSCOW_TZ = "Europe/Moscow";

const CardItem = ({ item, onViewDetails }) => {
  const { t } = useTranslation();

  // Format date (Moscow time)
  const formattedDate = item.appointmentDate
    ? moment.utc(item.appointmentDate).tz(MOSCOW_TZ).format("DD.MM.YYYY")
    : t("appointments.not_scheduled", "Not Scheduled");

  // Format time (Moscow time)
  let formattedTime = t("appointments.time_not_set", "Not Scheduled");
  if (item.appointmentTime?.includes(" - ")) {
    const [start, end] = item.appointmentTime.split(" - ");
    try {
      const startTime = moment.utc(start).tz(MOSCOW_TZ).format("HH:mm");
      const endTime = moment.utc(end).tz(MOSCOW_TZ).format("HH:mm");
      formattedTime = `${startTime} - ${endTime}`;
    } catch {
      console.warn("Invalid appointmentTime:", item.appointmentTime);
    }
  }

  const getStatusClass = (status) => {
    if (!status) return "status-unknown";
    switch (status.toLowerCase()) {
      case "unconfirmed":
        return "status-unconfirmed";
      case "confirmed":
        return "status-confirmed";
      case "awaiting for payment":
      case "awaiting_payment":
        return "status-awaiting";
      case "cancelled":
        return "status-cancelled";
      default:
        return "status-unknown";
    }
  };

  const handleViewDetailsClick = (e) => {
    e.stopPropagation();
    if (!item.applicationId) {
      console.error("Missing applicationId in item:", item);
      alert("Application ID is missing.");
      return;
    }
    onViewDetails(item.applicationId);
  };

  return (
    <div className="card-item-modern">
      <div className="appointment-card-header">
        <h3 className="card-title-modern">
          {item.serviceName ||
            t("appointments.no_service_name", "No Service Name")}
        </h3>
        <div className={`status-badge ${getStatusClass(item.status)}`}>
          {t(
            `appointments.status.${(item.status || "pending").toLowerCase()}`,
            item.status || "Pending"
          )}
        </div>
      </div>

      <div className="card-details-modern">
        <div className="appointment-detail-row">
          <div className="detail-icon">📅</div>
          <div className="detail-content">
            <span className="detail-label">
              {t("appointmentDetails.date", "Date")}
            </span>
            <span className="detail-value">{formattedDate}</span>
          </div>
        </div>

        <div className="appointment-detail-row">
          <div className="detail-icon">⏰</div>
          <div className="detail-content">
            <span className="detail-label">
              {t("appointmentDetails.time", "Time")}
            </span>
            <span className="detail-value">{formattedTime}</span>
          </div>
        </div>

        <div className="appointment-detail-row">
          <div className="detail-icon">🆔</div>
          <div className="detail-content">
            <span className="detail-label">
              {t("appointments.appointmentId", "Appointment ID")}
            </span>
            <span className="detail-value">{item.applicationId || "N/A"}</span>
          </div>
        </div>
      </div>

      <div className="card-actions">
        <button
          className="view-details-btn-modern"
          onClick={handleViewDetailsClick}
        >
          {t("appointments.view_details", "View Details")}
          <span className="btn-arrow">→</span>
        </button>
      </div>
    </div>
  );
};

export default CardItem;
