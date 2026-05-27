import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getApplicationDetails,
  downloadDocument,
  joinMeetingByUser,
} from "../utils/api";
import FollowUpModal from "../components/FollowUpModal";
import moment from "moment-timezone";

import {
  FiCalendar,
  FiClock,
  FiActivity,
  FiMapPin,
  FiFileText,
  FiCheckCircle,
  FiArrowLeft,
  FiEye,
  FiDownload,
  FiExternalLink,
  FiVideo,
  FiUser,
  FiMail,
  FiDollarSign,
  FiClipboard,
  FiBookOpen,
  FiRepeat,
  FiAlertCircle,
} from "react-icons/fi";
import { GrDocumentTest } from "react-icons/gr";
import { useTranslation } from "react-i18next";
import jsPDF from "jspdf";
import AppointmentDetailsSkeleton from "../components/Skeleton/AppointmentDetailsSkeleton";

const AppointmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const decodedId = id ? decodeURIComponent(id) : "";
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [joiningMeeting, setJoiningMeeting] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [joinLink, setJoinLink] = useState("");

  const [error, setError] = useState("");
  const { t } = useTranslation();
  const baseUrl = import.meta.env.VITE_BASE_URL;

  const fetchDetails = async () => {
    try {
      const res = await getApplicationDetails(decodedId);
      if (!res?.data) throw new Error("No data received");
      setAppointment({
        ...res.data.application,
        orders: res.data.orders,
      });
    } catch (err) {
      setError("Appointment not found or failed to load.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!decodedId) {
      setError("Invalid appointment ID.");
      setLoading(false);
      return;
    }
    fetchDetails();
  }, [decodedId]);

  const handleBack = () => navigate("/bookAppointment");

  const handleDownloadPrescription = () => {
    const doc = new jsPDF();
    doc.text(`Prescription:\n\n${appointment?.prescription?.text || "N/A"}`, 10, 10);
    doc.save("prescription.pdf");
  };

  const handleViewPrescription = () => {
    alert(appointment?.prescription?.text || "N/A");
  };

  const handleDownloadDocument = async (fileId, filename) => {
    try {
      const response = await downloadDocument(fileId);
      const blob = new Blob([response.data], {
        type: response.headers["content-type"],
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert("Failed to download document");
    }
  };

  const handleViewDocument = async (fileId) => {
    try {
      const response = await downloadDocument(fileId);
      const blob = new Blob([response.data], {
        type: response.headers["content-type"],
      });
      const url = window.URL.createObjectURL(blob);

      if (response.headers["content-type"] === "application/pdf") {
        window.open(url, "_blank");
      } else if (response.headers["content-type"].startsWith("image/")) {
        const newWindow = window.open("", "_blank");
        newWindow.document.write(`
          <html>
            <body style="margin:0;padding:0;text-align:center;">
              <img src="${url}" style="max-width:100%;max-height:100vh;" />
            </body>
          </html>
        `);
        newWindow.document.close();
      } else {
        window.open(url, "_blank");
      }
    } catch (error) {
      console.error("View failed:", error);
      alert("Failed to view document");
    }
  };

  const handleJoinMeeting = async () => {
    if (!appointment?.applicationId) return;

    try {
      setJoinError("");
      setJoiningMeeting(true);

      const { data } = await joinMeetingByUser({
        applicationId: appointment.applicationId,
        role: "patient",
        userEmail: appointment.patientEmail,
      });

      const url = data?.joinUrl || "";
      setJoinLink(url);

      if (url) {
        navigate(
          `/meeting-room?link=${encodeURIComponent(url)}&role=${encodeURIComponent(
            "patient"
          )}`
        );
      }
    } catch (err) {
      setJoinError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to join meeting"
      );
    } finally {
      setJoiningMeeting(false);
    }
  };

  const formattedDate = appointment?.date
    ? moment.tz(appointment.date, "YYYY-MM-DD", "Europe/Moscow").format("DD MMM YYYY")
    : null;

  const formattedStartTime = appointment?.date && appointment?.startTime
    ? moment.tz(`${appointment.date} ${appointment.startTime}`, "YYYY-MM-DD HH:mm", "Europe/Moscow")
    : null;

  const formattedTimeRange = formattedStartTime && formattedStartTime.isValid()
    ? formattedStartTime.format("HH:mm")
    : appointment?.startTime || t("appointmentDetails.not_specified", "Not specified");

  const renderTests = () => {
    const orders = appointment?.orders || [];

    if (orders.length === 0) {
      return (
        <div className="flex items-center justify-center py-8 text-gray-400">
          <FiClipboard className="mr-2" size={20} />
          <p>{t("appointments.noTests")}</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {orders.map((order, index) => {
          const status = order.status || "Ordered";
          const statusConfig = {
            Completed: { color: "green", bg: "bg-green-100", text: "text-green-700" },
            Ordered: { color: "blue", bg: "bg-blue-100", text: "text-blue-700" },
            "In Progress": { color: "yellow", bg: "bg-yellow-100", text: "text-yellow-700" },
            Cancelled: { color: "red", bg: "bg-red-100", text: "text-red-700" },
          };
          const config = statusConfig[status] || statusConfig.Ordered;

          return (
            <div key={order._id || index} className="border border-gray-100 rounded-xl p-4 bg-gray-50/30 hover:bg-gray-50 transition">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <GrDocumentTest className="text-gray-500" size={18} />
                    <span className="font-semibold text-gray-800">{order.testName}</span>
                  </div>
                  {order.uploadedAt && (
                    <p className="text-xs text-gray-400 mt-1">
                      {t("appointmentDetails.uploaded", "Uploaded:")} {moment(order.uploadedAt).tz("Europe/Moscow").format("DD.MM.YYYY HH:mm")}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                    {status}
                  </span>
                  
                  {order.resultFileId && (
                    <div className="flex gap-2">
                      <a
                        href={`${baseUrl}/api/applications/results/${order.resultFileId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:text-[#0a2e5d] hover:border-[#0a2e5d] transition"
                      >
                        <FiEye size={14} /> {t("appointmentDetails.view", "View")}
                      </a>
                      <a
                        href={`${baseUrl}/api/applications/results/${order.resultFileId}?download=true`}
                        download
                        className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:text-[#0a2e5d] hover:border-[#0a2e5d] transition"
                      >
                        <FiDownload size={14} /> {t("appointmentDetails.download", "Download")}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const getStatusBadge = (status) => {
    const config = {
      New: { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500" },
      Paid: { bg: "bg-green-100", text: "text-green-700", dot: "bg-green-500" },
      Cancelled: { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
      Unconfirmed: { bg: "bg-yellow-100", text: "text-yellow-700", dot: "bg-yellow-500" },
      Confirmed: { bg: "bg-teal-100", text: "text-teal-700", dot: "bg-teal-500" },
      "Pending payment": { bg: "bg-orange-100", text: "text-orange-700", dot: "bg-orange-500" },
      Completed: { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
    };
    const c = config[status] || config.New;
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${c.bg}`}>
        <div className={`w-2 h-2 rounded-full ${c.dot}`}></div>
        <span className={`text-sm font-medium ${c.text}`}>{status}</span>
      </div>
    );
  };

  const allTestsCompleted = (appointment?.orders || []).every(
    (order) => order.status?.toLowerCase() === "completed"
  );

  const canBookFollowUp =
    appointment?.followUp?.needed &&
    !appointment?.followUp?.booked &&
    (appointment?.orders?.length === 0 || allTestsCompleted);

  if (loading) {
    return <AppointmentDetailsSkeleton />;
  }

  if (error) return (
    <div className="max-w-[1200px] mx-auto px-4 py-12">
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <FiAlertCircle className="mx-auto mb-3 text-red-500" size={40} />
        <p className="text-red-600">{error}</p>
        <button onClick={handleBack} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg cursor-pointer hover:bg-red-700 transition">
          {t("appointmentDetails.back", "Go Back")}
        </button>
      </div>
    </div>
  );
  
  if (!appointment) return (
    <div className="max-w-[1200px] mx-auto px-4 py-12 text-center text-gray-500">
      {t("appointmentDetails.noDetails", "No details found.")}
    </div>
  );

  const {
    serviceType,
    appointmentMode,
    appointmentStatus,
    startTime,
    documents,
    serviceOrders,
    payments,
    prescription,
    conclusion,
    patientEmail,
    doctorEmail,
  } = appointment;
  const isOnlineAppointment = (appointmentMode || "").toLowerCase() === "online";

  const serviceLabel = (() => {
    if (!serviceType) return t("appointmentDetails.no_data", "N/A");
    const normalized = serviceType
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_");
    return t(`appointmentDetails.service_${normalized}`, serviceType);
  })();

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-[#0a2e5d] hover:bg-gray-100 rounded-lg transition cursor-pointer"
        >
          <FiArrowLeft size={18} />
          <span>{t("appointmentDetails.back")}</span>
        </button>
        {getStatusBadge(appointmentStatus)}
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-[#0a2e5d] to-[#1a4a7a] px-6 py-5">
          <h1 className="text-xl font-bold text-white">
            {t("appointmentDetails.appointmentDetails", "Appointment Details")}
          </h1>
          <p className="text-blue-100 text-sm mt-1">
            {t("appointmentDetails.application_id", "Appointment ID")}: {appointment.applicationId || decodedId}
          </p>
        </div>

        {/* Info Grid */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="flex items-start gap-3 p-3 bg-gray-50/50 rounded-xl">
              <div className="p-2 bg-white rounded-lg shadow-sm text-[#0a2e5d]">
                <FiCalendar size={18} />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">{t("appointmentDetails.date", "Date")}</p>
                <p className="font-medium text-gray-800">
                  {formattedDate || t("appointmentDetails.not_specified", "Not specified")}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-gray-50/50 rounded-xl">
              <div className="p-2 bg-white rounded-lg shadow-sm text-[#0a2e5d]">
                <FiClock size={18} />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">{t("appointmentDetails.time", "Time")}</p>
                <p className="font-medium text-gray-800">
                  {formattedTimeRange || t("appointmentDetails.not_specified", "Not specified")}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-gray-50/50 rounded-xl">
              <div className="p-2 bg-white rounded-lg shadow-sm text-[#0a2e5d]">
                <FiActivity size={18} />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">{t("appointmentDetails.service", "Service")}</p>
                <p className="font-medium text-gray-800">{serviceLabel}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-gray-50/50 rounded-xl">
              <div className="p-2 bg-white rounded-lg shadow-sm text-[#0a2e5d]">
                <FiMapPin size={18} />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">{t("appointmentDetails.mode", "Mode")}</p>
                <p className="font-medium text-gray-800">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${isOnlineAppointment ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                    {appointmentMode}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-gray-50/50 rounded-xl">
              <div className="p-2 bg-white rounded-lg shadow-sm text-[#0a2e5d]">
                <FiMail size={18} />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">{t("appointmentDetails.patient_email", "Patient Email")}</p>
                <p className="font-medium text-gray-800 text-sm">{patientEmail || t("appointmentDetails.no_data", "N/A")}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-gray-50/50 rounded-xl">
              <div className="p-2 bg-white rounded-lg shadow-sm text-[#0a2e5d]">
                <FiUser size={18} />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">{t("appointmentDetails.doctor_email", "Doctor Email")}</p>
                <p className="font-medium text-gray-800 text-sm">{doctorEmail || t("appointmentDetails.no_data", "N/A")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Online Meeting Section */}
      {isOnlineAppointment && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100 rounded-2xl p-6 mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-100 rounded-xl text-purple-600">
                <FiVideo size={22} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">{t("appointmentDetails.online_meeting", "Online meeting")}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {t("appointmentDetails.join_meeting_hint", "Use this when your consultation starts")}
                </p>
                {joinError && (
                  <p className="text-sm text-red-500 mt-2 flex items-center gap-1">
                    <FiAlertCircle size={14} /> {joinError}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleJoinMeeting}
              disabled={joiningMeeting}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#0a2e5d] text-white rounded-xl font-medium hover:bg-[#123e6e] transition disabled:opacity-50 shadow-sm"
            >
              {joiningMeeting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t("appointmentDetails.preparing_meeting", "Preparing...")}
                </>
              ) : (
                <>
                  <FiVideo size={16} />
                  {t("appointmentDetails.join_now", "Join Meeting")}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Medical Info Cards */}
      {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
            <div className="flex items-center gap-2 text-gray-700">
              <FiClipboard size={16} />
              <span className="font-semibold">{t("appointmentDetails.entranceDiagnosis", "Entrance Diagnosis")}</span>
            </div>
          </div>
          <div className="p-5">
            <p className="text-gray-600 leading-relaxed">
              {serviceOrders?.[0]?.entranceDiagnosis || "N/A"}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
            <div className="flex items-center gap-2 text-gray-700">
              <FiBookOpen size={16} />
              <span className="font-semibold">{t("appointmentDetails.briefHistory", "Brief History")}</span>
            </div>
          </div>
          <div className="p-5">
            <p className="text-gray-600 leading-relaxed">
              {serviceOrders?.[0]?.briefHistory || "N/A"}
            </p>
          </div>
        </div>
      </div> */}

      {/* Documents Section */}
      {/* {documents?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
            <div className="flex items-center gap-2 text-gray-700">
              <FiFileText size={16} />
              <span className="font-semibold">{t("appointmentDetails.documents", "Documents")}</span>
            </div>
          </div>
          <div className="p-5">
            <div className="space-y-3">
              {documents.map((doc, idx) => (
                <div key={idx} className="flex flex-wrap items-center justify-between gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-white rounded-lg">
                      <FiFileText size={14} className="text-gray-500" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-700 text-sm">{doc.filename}</p>
                      {doc.uploadedAt && (
                        <p className="text-xs text-gray-400">
                          {t("appointmentDetails.uploaded", "Uploaded:")} {moment(doc.uploadedAt).tz("Europe/Moscow").format("DD.MM.YYYY HH:mm")}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        window.open(
                          doc.fileId
                            ? `${baseUrl}/api/applications/media/${doc.fileId}`
                            : doc.url,
                          "_blank"
                        )
                      }
                      className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:text-[#0a2e5d] transition"
                    >
                      <FiEye size={14} /> {t("appointmentDetails.view", "View")}
                    </button>
                    {doc.fileId && (
                      <button
                        onClick={() => handleDownloadDocument(doc.fileId, doc.filename)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:text-[#0a2e5d] transition"
                      >
                        <FiDownload size={14} /> {t("appointmentDetails.download", "Download")}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )} */}

      {/* Prescription Section */}
      {/* {appointment?.prescription?.text?.trim() && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
            <div className="flex items-center gap-2 text-gray-700">
              <FiFileText size={16} />
              <span className="font-semibold">{t("appointmentDetails.prescription", "Prescription")}</span>
            </div>
          </div>
          <div className="p-5 bg-gradient-to-br from-green-50/30 to-white">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap font-mono text-sm">
              {appointment.prescription.text}
            </p>
          </div>
        </div>
      )} */}

      {/* Test Results Section */}
      {/* <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
          <div className="flex items-center gap-2 text-gray-700">
            <GrDocumentTest size={16} />
            <span className="font-semibold">{t("appointments.testResults")}</span>
          </div>
        </div>
        <div className="p-5">
          {renderTests()}
        </div>
      </div> */}

      {/* Follow-up Section */}
      {/* {appointment?.followUp?.needed && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
            <div className="flex items-center gap-2 text-gray-700">
              <FiRepeat size={16} />
              <span className="font-semibold">{t("appointmentDetails.follow_up_title", "Follow-up Appointment")}</span>
            </div>
          </div>
          <div className="p-5">
            {!appointment.followUp.booked ? (
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-gray-600">
                  {t("appointmentDetails.follow_up_text", "A follow-up appointment has been recommended by your doctor.")}
                </p>
                <button
                  className="px-5 py-2 bg-[#0a2e5d] text-white rounded-xl font-medium hover:bg-[#123e6e] transition shadow-sm"
                  onClick={() => setShowFollowUpModal(true)}
                >
                  {t("appointmentDetails.book_follow_up", "Book Follow-up")}
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-gray-600">{t("appointmentDetails.follow_up_id", "Follow-up ID:")}</span>
                <button
                  onClick={() =>
                    navigate(`/appointments/${encodeURIComponent(appointment.followUp.applicationId)}`)
                  }
                  className="text-[#0a2e5d] font-medium hover:underline flex items-center gap-1"
                >
                  {appointment.followUp.applicationId}
                  <FiExternalLink size={12} />
                </button>
              </div>
            )}
          </div>
        </div>
      )} */}

      {/* <FollowUpModal
        isOpen={showFollowUpModal}
        onClose={() => setShowFollowUpModal(false)}
        appointment={appointment}
        onBooked={fetchDetails}
      /> */}
    </div>
  );
};

export default AppointmentDetails;