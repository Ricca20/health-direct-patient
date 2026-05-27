import React from "react";
import { useTranslation } from "react-i18next";
import "../styles/ListItem.css";
import moment from "moment-timezone";

const MOSCOW_TZ = "Europe/Moscow";

const ListItem = ({ item, onViewDetails }) => {
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

  const statusLabel = t(
    `appointments.status.${item.status?.toLowerCase()}`,
    item.status || t("appointments.status.unknown", "Unknown")
  );

const getStatusClass = (status) => {
  if (!status) return "status-unknown";

  switch (status.toLowerCase()) {
    case "unconfirmed":
      return "status-unconfirmed";   // e.g., orange
    case "confirmed":
      return "status-confirmed";     // e.g., green
    case "awaiting for payment":
    case "awaiting_payment":
      return "status-awaiting";      // e.g., yellow
    case "cancelled":
      return "status-cancelled";     // e.g., red
    default:
      return "status-unknown";       // grey fallback
  }
};


  return (
    <div
      className="appointment-list-item-modern"
      onClick={() => onViewDetails?.(item.applicationId)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") onViewDetails?.(item.id || item.applicationId);
      }}
    >
      <div className="appointment-item-main">
        <div className="appointment-service-info">
          <h3 className="appointment-title-modern">
            {item.serviceName ||
              t("appointments.no_service_name", "No Service Name")}
          </h3>
          <div className="appointment-id">
            ID: {item.applicationId || "N/A"}
          </div>
        </div>
        
        <div className="appointment-status-modern">
          <span className={`status-badge ${getStatusClass(item.status)}`}>
            {statusLabel}
          </span>
        </div>
      </div>

      <div className="appointment-details-modern">
        <div className="detail-item">
          <span className="detail-icon">📅</span>
          <span className="detail-text">{formattedDate}</span>
        </div>
        
        <div className="detail-item">
          <span className="detail-icon">⏰</span>
          <span className="detail-text">{formattedTime}</span>
        </div>
      </div>

      <div className="appointment-actions">
        <button 
          className="view-details-btn-modern"
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails?.(item.applicationId);
          }}
        >
          {t("appointments.view_details", "View Details")}
          <span className="btn-arrow">→</span>
        </button>
      </div>
    </div>
  );
};

export default ListItem;