import React, { useState, useContext, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { AuthContext } from "../context/AuthContext";
import ProfilePopup from "../components/ProfilePopup";
import PaymentModal from "../components/PaymentModal";
import { getUserPayments, recreatePaymentLink } from "../utils/api";
import AppointmentsSkeleton from "../components/Skeleton/AppointmentsSkeleton";

// Map backend status to translation keys
const getStatusKey = (status) => {
  switch (status) {
    case "paid":
      return "payments.status.success";
    case "pending":
      return "payments.status.pending";
    case "cancelled":
      return "payments.status.failed";
    case "new":
      return "payments.status.new";
    case "invoice-sent":
      return "payments.status.invoice_sent";
    case "free":
      return "payments.status.free";
    default:
      return null;
  }
};

// Get badge color class based on status
const getStatusColor = (status) => {
  switch (status) {
    case "paid":
      return "bg-green-100 text-green-800";
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    case "new":
      return "bg-blue-100 text-blue-800";
    case "invoice-sent":
      return "bg-purple-100 text-purple-800";
    case "free":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const Payments = () => {
  const { t } = useTranslation();
  const { patient, profileCompleted, token } = useContext(AuthContext);

  const [showPopup, setShowPopup] = useState(!!token && !profileCompleted);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedPayment, setSelectedPayment] = useState(null);

  // Normalized status keys for filtering (lowercase, same as backend status)
  const statusFilterOptions = [
    { value: "all", labelKey: "payments.tabs.all" },
    { value: "pending", labelKey: "payments.status.pending" },
    { value: "paid", labelKey: "payments.status.success" },
    { value: "cancelled", labelKey: "payments.status.failed" },
    { value: "new", labelKey: "payments.status.new" },
    { value: "invoice-sent", labelKey: "payments.status.invoice_sent" },
    { value: "free", labelKey: "payments.status.free" },
  ];

  useEffect(() => {
    if (!token || !profileCompleted || !patient?.patientId) {
      setPayments([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const fetchData = async () => {
      try {
        const res = await getUserPayments(patient?.patientId);
        const rawPayments = Array.isArray(res.data.payments)
          ? res.data.payments
          : [];
        const enriched = rawPayments.map((pay) => ({
          ...pay,
          statusColor: getStatusColor(pay.status),
          createdAtFormatted: pay.createdAt
            ? new Date(pay.createdAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
            : "",
          enrollmentName:
            pay.items && pay.items.length > 0
              ? pay.items[0].name
              : t("payments.course_name"),
        }));
        setPayments(enriched);
      } catch (error) {
        console.error("Failed to fetch payments:", error);
        setPayments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, profileCompleted, patient?.patientId, t]);

  // Counts per status (for display in tabs)
  const counts = useMemo(() => {
    const countsMap = {
      all: payments.length,
      pending: payments.filter((p) => p.status === "pending").length,
      paid: payments.filter((p) => p.status === "paid").length,
      cancelled: payments.filter((p) => p.status === "cancelled").length,
      new: payments.filter((p) => p.status === "new").length,
      "invoice-sent": payments.filter((p) => p.status === "invoice-sent")
        .length,
      free: payments.filter((p) => p.status === "free").length,
    };
    return countsMap;
  }, [payments]);

  const filteredPayments = payments.filter((payment) => {
    if (filterStatus === "all") return true;
    return payment.status === filterStatus;
  });

  const handleConfirmPay = async (payment) => {
    try {
      const { data } = await recreatePaymentLink(
        payment.applicationId,
        payment.type,
      );
      if (!data.success) throw new Error("Failed to create payment link");
      window.open(data.paymentLink, "_blank");
      setSelectedPayment(null);
    } catch (err) {
      console.error("Payment creation failed:", err);
      alert(t("payments.payment_error"));
    }
  };

  return (
    <>
      <div
        className={`min-h-screen ${token && !profileCompleted ? "opacity-50 pointer-events-none" : ""}`}
      >
        <div className="max-w-5xl mx-auto px-4 py-8 md:px-6 md:py-12">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {t("payments.title")}
            </h1>
            <p className="text-gray-500 mt-1">{t("payments.subtitle")}</p>
          </div>

          {/* Status Tabs */}
          <div className="border-b border-gray-200 mb-6 overflow-x-auto">
            <nav className="flex space-x-6 pb-2">
              {statusFilterOptions.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setFilterStatus(tab.value)}
                  className={`whitespace-nowrap pb-2 px-1 font-medium text-sm transition ${
                    filterStatus === tab.value
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {t(tab.labelKey)} ({counts[tab.value]})
                </button>
              ))}
            </nav>
          </div>

          {/* Payments List */}
          {loading ? (
            <AppointmentsSkeleton viewMode="list" />
          ) : filteredPayments.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500">
              {t("payments.no_results")}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPayments.map((payment) => (
                <div
                  key={payment.id || payment.invoiceNumber}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* Left side: Invoice info */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between md:justify-start gap-3 flex-wrap">
                        <span className="font-mono text-sm font-semibold text-gray-700">
                          {payment.invoiceNumber ||
                            `INV-${payment.id?.slice(-8)}`}
                        </span>
                        <span className="text-lg font-bold text-gray-900">
                          {payment.currency}{" "}
                          {payment.finalAmount?.toLocaleString()}
                        </span>
                      </div>

                      <div className="mt-3 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {t("payments.method")}:
                          </span>
                          <span>Stripe</span>
                          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                            💳
                          </span>
                        </div>
                        <div className="mt-1">
                          <span className="font-medium">
                            {t("payments.linked_enrollments")}:
                          </span>
                          <span className="ml-1">{payment.enrollmentName}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right side: Status, date, action */}
                    <div className="flex flex-col items-start md:items-end gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${payment.statusColor}`}
                      >
                        {t(getStatusKey(payment.status))}
                      </span>
                      <span className="text-xs text-gray-400">
                        {payment.createdAtFormatted}
                      </span>
                      {payment.status === "pending" && (
                        <button
                          onClick={() => setSelectedPayment(payment)}
                          className="mt-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          {t("payments.pay_now")}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {selectedPayment && (
        <PaymentModal
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
          onConfirm={handleConfirmPay}
        />
      )}

      {/* Profile Popup */}
      {token && !profileCompleted && (
        <ProfilePopup onClose={() => setShowPopup(false)} />
      )}
    </>
  );
};

export default Payments;
