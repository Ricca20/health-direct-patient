import React from "react";
import { FaCheckCircle, FaCreditCard, FaStethoscope } from "react-icons/fa";
import { IoDocumentTextOutline, IoCashOutline } from "react-icons/io5";
import { useTranslation } from "react-i18next";
import "../styles/PaymentCardItem.css";

const PaymentCardItem = ({ item, onPayClick }) => {
  const { t } = useTranslation();
  const isPaid =
    item.paymentStatus?.toLowerCase() === "paid" ||
    item.paymentStatus?.toLowerCase() === "completed";

  const getStatusClass = (status) => {
    const statusMap = {
      paid: "payment-status-paid",
      completed: "payment-status-paid",
      pending: "payment-status-pending",
      failed: "payment-status-failed",
      processing: "payment-status-processing",
    };
    return statusMap[status?.toLowerCase()] || "payment-status-unknown";
  };

  const getStatusText = (status) => {
    const statusKey = status?.toLowerCase();
    return t(`payment_card.status.${statusKey}`, status);
  };

  return (
    <div className="payment-card-modern">
      <div className="payment-card-header">
        <div className="payment-service-icon">
          <FaStethoscope />
        </div>
        <h3 className="payment-service-title">{item.serviceName}</h3>
      </div>

      <div className="payment-card-details">
        <div className="payment-card-detail">
          <IoDocumentTextOutline className="payment-card-icon" />
          <div className="payment-card-info">
            <span className="payment-card-label">
              {t("payment_card.appointment_id")}
            </span>
            <span className="payment-card-value">{item.appointmentId}</span>
          </div>
        </div>

        <div className="payment-card-detail">
          <IoCashOutline className="payment-card-icon" />
          <div className="payment-card-info">
            <span className="payment-card-label">
              {t("payment_card.payment_status")}
            </span>
            <span
              className={`payment-status ${getStatusClass(item.paymentStatus)}`}
            >
              {getStatusText(item.paymentStatus)}
            </span>
          </div>
        </div>
      </div>

      <div className="payment-card-action">
        {isPaid ? (
          <div className="payment-status-badge paid">
            <FaCheckCircle className="status-icon" />
            {t("payment_card.paid")}
          </div>
        ) : (
          <button
            onClick={() => onPayClick(item)}
            className="pay-now-button"
            disabled={
              !item.paymentLink && item.paymentStatus?.toLowerCase() === "paid"
            }
          >
            <FaCreditCard className="payment-link-icon" />
            {t("payment_card.pay_now")}
          </button>
        )}
      </div>
    </div>
  );
};

export default PaymentCardItem;
