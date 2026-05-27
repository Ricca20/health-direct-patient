import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import "../../styles/PaymentsCard.css";

const PaymentsCard = () => {
  const { t } = useTranslation();
  const payments = [
    {
      title: t("payments_card.payment1.title"),
      status: t("payments_card.payment1.status"),
    },
    {
      title: t("payments_card.payment1.title"),
      status: t("payments_card.payment1.status"),
    },
  ];
  return (
    <div className="payments-card">
      <div className="payments-overlay"></div>

      <div className="payments-card-header">
        <h3 className="payments-card-title">{t("payments_card.title")}</h3>
        <p className="payments-card-subtitle">{t("payments_card.subtitle")}</p>
      </div>

      <div className="payments-card-list">
        {payments.map((item, idx) => (
          <div key={idx} className="payment-item">
            <h4 className="payment-title">{item.title}</h4>
            <p className="payment-status">{item.status}</p>
            <p className="payment-preview">
              {t("payments_card.preview_button")}
            </p>
          </div>
        ))}

        <Link to="/payments">
          <button className="payments-card-button">
            {t("payments_card.previous_payments")}
          </button>
        </Link>
      </div>
    </div>
  );
};

export default PaymentsCard;