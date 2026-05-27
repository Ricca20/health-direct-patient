import React from "react";

export default function PaymentInfoCard({ selectedDoctor, t }) {
  return (
    <div
      style={{
        marginBottom: "15px",
        padding: "10px",
        backgroundColor: "#f8f9fa",
        borderRadius: "4px",
        border: "1px solid #e9ecef",
      }}
    >
      <h4 style={{ margin: "0 0 8px 0", color: "#1A355A" }}>
        {t("inface_remote_consultations.payment_info", "Payment Information")}
      </h4>
      <p style={{ margin: "4px 0", fontSize: "14px" }}>
        <strong>{t("inface_remote_consultations.amount", "Amount")}:</strong>{" "}
        {selectedDoctor.feesAmount} {selectedDoctor.currency || "RUB"}
      </p>
      <p style={{ margin: "4px 0", fontSize: "14px" }}>
        <strong>
          {t("inface_remote_consultations.currency", "Currency")}:
        </strong>{" "}
        {selectedDoctor.currency || "RUB"}
      </p>
      <input
        type="hidden"
        name="amount"
        value={selectedDoctor.feesAmount || ""}
      />
      <input
        type="hidden"
        name="currency"
        value={selectedDoctor.currency || "RUB"}
      />
    </div>
  );
}
