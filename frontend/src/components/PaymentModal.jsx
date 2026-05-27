// PaymentModal.jsx
import React, { useState } from "react";
import { FaCreditCard, FaTimes } from "react-icons/fa";
import "../styles/PaymentModal.css";
import { useTranslation } from "react-i18next";

const PaymentModal = ({ payment, onClose, onConfirm }) => {
  const { t } = useTranslation();

  if (!payment) return null;

  const subtotal = payment.items?.reduce((sum, i) => sum + i.amount, 0) || 0;
  const tax = subtotal * 0.05;
  const total = subtotal + tax - (payment.discount || 0);

  return (
    <div className="payment-modal-overlay">
      <div className="payment-modal">
        {/* Header */}
        <div className="modal-header">
          <h3
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              color: "white",
            }}
          >
            <FaCreditCard className="icon" />
            {t("payment_card.paymentSummary")}
          </h3>
          <button
            className="close-btn"
            onClick={onClose}
            aria-label={t("payment_card.close")}
          >
            <FaTimes />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          <h4 className="section-title">{t("payment_card.items")}</h4>
          <ul className="items-list">
            {payment.items?.map((it, idx) => (
              <li key={idx} className="item-row">
                <span className="item-name">{it.name}</span>
                <span className="item-amount">
                  {it.amount.toFixed(2)} {payment.currency}
                </span>
              </li>
            ))}
          </ul>

          {/* Summary */}
          <div className="summary">
            <div className="summary-row">
              <span>{t("payment_card.subtotal")}</span>
              <span>
                {subtotal.toFixed(2)} {payment.currency}
              </span>
            </div>
            <div className="summary-row">
              <span>{t("payment_card.tax")}</span>
              <span>
                {tax.toFixed(2)} {payment.currency}
              </span>
            </div>
            {payment.discount > 0 && (
              <div className="summary-row discount">
                <span>{t("payment_card.discount")}</span>
                <span>
                  -{payment.discount.toFixed(2)} {payment.currency}
                </span>
              </div>
            )}
            <div className="summary-row total">
              <span>{t("payment_card.total")}</span>
              <span>
                {total.toFixed(2)} {payment.currency}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button
            className="confirm-pay-btn"
            onClick={() => onConfirm(payment)}
          >
            <FaCreditCard className="icon" /> {t("payment_card.confirmPay")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
