import React, { useState } from "react";
import { FaTimes } from "react-icons/fa";
import { toast } from "react-toastify";

const PaymentModal = ({
  isOpen,
  onClose,
  appointmentMode,
  onPaymentChoice,
  t,
  payNowOnly,
}) => {
  if (!isOpen) return null;

  const [selectedOption, setSelectedOption] = useState(
    appointmentMode === "Online" || payNowOnly ? "pay_now" : ""
  );

  const handleConfirm = () => {
    if (!selectedOption) {
      toast.error(
        t(
          "order_service.please_select_payment",
          "Please select a payment option"
        )
      );
      return;
    }
    onPaymentChoice(selectedOption);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{t("order_service.payment_options", "Payment Options")}</h3>
          <button className="modal-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="modal-body">
          {appointmentMode === "Online" || payNowOnly ? (
            <div className="payment-option-online">
              <p className="payment-info">
                {t(
                  "order_service.online_payment_info",
                  "This slot requires immediate payment to confirm your appointment."
                )}
              </p>
              <label className="payment-option">
                <input
                  type="radio"
                  name="paymentOption"
                  value="pay_now"
                  checked={selectedOption === "pay_now"}
                  onChange={() => setSelectedOption("pay_now")}
                />
                <span className="payment-label">
                  {t("order_service.pay_now", "Pay Now")}
                </span>
              </label>
            </div>
          ) : (
            <div className="payment-option-offline">
              <p className="payment-info">
                {t(
                  "order_service.offline_payment_info",
                  "You can pay now to confirm or at the clinic."
                )}
              </p>

              <label className="payment-option">
                <input
                  type="radio"
                  name="paymentOption"
                  value="pay_now"
                  checked={selectedOption === "pay_now"}
                  onChange={() => setSelectedOption("pay_now")}
                />
                <span className="payment-label">
                  {t("order_service.pay_now", "Pay Now")}
                </span>
              </label>

              <label className="payment-option">
                <input
                  type="radio"
                  name="paymentOption"
                  value="pay_at_clinic"
                  checked={selectedOption === "pay_at_clinic"}
                  onChange={() => setSelectedOption("pay_at_clinic")}
                />
                <span className="payment-label">
                  {t("order_service.pay_at_clinic", "Pay at Clinic")}
                </span>
              </label>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="modal-cancel" onClick={onClose}>
            {t("common.cancel", "Cancel")}
          </button>
          <button className="modal-confirm" onClick={handleConfirm}>
            {t("common.confirm", "Confirm")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;