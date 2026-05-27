import React from "react";
import moment from "moment-timezone";

export default function TimeSlotSelector({
  slots,
  formData,
  handleSlotSelection,
  setPayNowWarning,
  setPayNowOnly,
  payNowWarning,
  t,
  slotCardStyle,
  labelStyle,
}) {

  return (
    <div style={{ marginBottom: "15px" }}>
      <label style={labelStyle}>{t("service_form.booking_time")}</label>

      {slots.length > 0 ? (
        slots.map((slot, index) => {
          // Always display in Moscow timezone
          const startLabel = moment.utc(slot.start).tz("Europe/Moscow").format("HH:mm");
          const endLabel = moment.utc(slot.end).tz("Europe/Moscow").format("HH:mm");

          const slotId = `${slot.start}_${slot.end}`;
          const isSelected = formData.slotId === slotId;

          let slotStyle = { ...slotCardStyle };
          let slotLabelExtra = null;
          let isDisabled = false;

          if (slot.slotType === "patientConflict") {
            isDisabled = true;
            if (slot.status === "Unconfirmed") {
              slotStyle.backgroundColor = "#ffeeba"; // yellow
              slotLabelExtra = t("service_form.slot_labels.your_appointment_unconfirmed");
            } else if (slot.status === "Confirmed") {
              slotStyle.backgroundColor = "#d4edda"; // green
              slotLabelExtra = t("service_form.slot_labels.your_appointment_confirmed");
            }
          } else if (slot.status === "available") {
            slotStyle.backgroundColor = isSelected ? "#cce5ff" : "#fff";
          } else if (slot.status === "Confirmed") {
            slotStyle.backgroundColor = "#f8d7da"; // red
          } else if (slot.status === "Booked & Unconfirmed") {
            slotStyle.backgroundColor = isSelected ? "#ffe0b3" : "#fffaf0";
          }

          return (
            <div
              key={index}
              onClick={() => {
                if (isDisabled) return;
                if (slot.status === "available") {
                  handleSlotSelection(slot);
                  setPayNowWarning(null);
                  setPayNowOnly(false);
                } else if (slot.status === "Booked & Unconfirmed") {
                  handleSlotSelection({ ...slot, payNowOnly: true });
                  setPayNowWarning(t("service_form.slot_labels.pay_now_warning"));
                  setPayNowOnly(true);
                }
              }}
              style={{
                ...slotStyle,
                border: "1px solid #ccc",
                cursor:
                  isDisabled ||
                  (!["available", "Booked & Unconfirmed"].includes(slot.status))
                    ? "not-allowed"
                    : "pointer",
                padding: "10px 15px",
                borderRadius: "8px",
                margin: "5px",
                opacity: isDisabled ? 0.6 : 1,
              }}
            >
              {`${startLabel}`}
              <div style={{ fontSize: "10px", marginTop: "4px" }}>
                {slotLabelExtra || slot.status}
              </div>
            </div>
          );
        })
      ) : (
        <p style={{ color: "#777" }}>{t("service_form.no_slots")}</p>
      )}

      {payNowWarning && (
        <div
          style={{
            marginTop: "12px",
            padding: "10px",
            backgroundColor: "#fff3cd",
            border: "1px solid #ffe58f",
            borderRadius: "4px",
          }}
        >
          {payNowWarning}
        </div>
      )}
    </div>
  );
}
