import React, { useState, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { IoCloseSharp } from "react-icons/io5";
import { FaCreditCard } from "react-icons/fa6";
import CommonServiceFields from "./CommonServiceFields";
import {
  submitApplication,
  getEmailFromToken,
  createPayment,
  uploadPendingDocuments,
} from "../utils/api";
import "react-toastify/dist/ReactToastify.css";
import "../styles/OrderService.css";
import {
  FaStethoscope,
  FaMicroscope,
  FaDna,
  FaUserMd,
  FaUsers,
  FaXRay,
  FaSyringe,
  FaRadiation,
  FaProcedures,
  FaHandsHelping,
  FaBone,
  FaVial,
  FaCamera,
  FaTimes,
} from "react-icons/fa";

const serviceModules = {
  "Individual early diagnosis of diseases": () =>
    import("./services/IndividualEarlyDiagnosis"),
  "In-face and remote consultations": () =>
    import("./services/InFaceRemoteConsultations"),
};

const serviceIcons = {
  "Individual early diagnosis of diseases": FaStethoscope,
  "PathoLogica Service": FaMicroscope,
  "Molecular consilium": FaDna,
  "In-face and remote consultations": FaUserMd,
  "International Oncology Consilium": FaUsers,
  "Expert review of CT, MRI, PET-CT": FaXRay,
  "PET-CT": FaXRay,
  "Drug therapy of malignant neoplasms": FaSyringe,
  "Radiation therapy": FaRadiation,
  Oncosurgery: FaProcedures,
  "Medical support": FaHandsHelping,
  "Traumatology and orthopedics": FaBone,
  "Installation of a venous port system": FaVial,
  "Digital diagnosis of skin neoplasms (dermatoscopy using artificial intelligence)":
    FaCamera,
};

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
    <div className="payment-modal-overlay" onClick={onClose}>
      <div
        className="payment-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="payment-modal-header">
          <div className="payment-modal-title-wrap">
            <FaCreditCard />
            <h3 className="payment-modal-title">
              {t("order_service.payment_options", "Payment Options")}
            </h3>
          </div>
          <button className="payment-modal-close" onClick={onClose}>
            <IoCloseSharp />
          </button>
        </div>

        <div className="payment-modal-body">
          {appointmentMode === "Online" || payNowOnly ? (
            <div className="payment-options-section">
              <div
                className={`payment-info-card ${
                  payNowOnly ? "reserved-notice" : "standard-notice"
                }`}
              >
                <i
                  className={`payment-info-icon ${
                    payNowOnly ? "fas fa-exclamation-circle" : "fas fa-laptop"
                  }`}
                ></i>
                <div className="payment-info-content">
                  <p className="payment-info-text">
                    {payNowOnly
                      ? t(
                          "order_service.booked_unconfirmed_info",
                          "This slot is already reserved. You can only confirm it if you pay now."
                        )
                      : t(
                          "order_service.online_payment_info",
                          "Online consultations require immediate payment to confirm your appointment."
                        )}
                  </p>
                </div>
              </div>

              <div
                className={`payment-option-card ${
                  selectedOption === "pay_now" ? "selected" : ""
                }`}
              >
                <label className="payment-option-label">
                  <input
                    type="radio"
                    name="paymentOption"
                    value="pay_now"
                    checked={selectedOption === "pay_now"}
                    onChange={() => setSelectedOption("pay_now")}
                    className="payment-option-input"
                  />
                  <div className="payment-option-content">
                    <span className="payment-option-main">
                      <i className="payment-option-icon fas fa-bolt"></i>
                      {t("order_service.pay_now", "Pay Now")}
                    </span>
                    <span className="payment-option-desc">
                      Secure payment with credit card or digital wallet
                    </span>
                  </div>
                </label>
              </div>
            </div>
          ) : (
            <div className="payment-options-section">
              <div className="payment-info-card standard-notice">
                <i className="payment-info-icon fas fa-building"></i>
                <div className="payment-info-content">
                  <p className="payment-info-text">
                    {t(
                      "order_service.offline_payment_info",
                      "Your slot will be confirmed only if you pay now. If someone else pays for your slot, they will get the appointment."
                    )}
                  </p>
                </div>
              </div>

              <div
                className={`payment-option-card ${
                  selectedOption === "pay_now" ? "selected" : ""
                }`}
              >
                <label className="payment-option-label">
                  <input
                    type="radio"
                    name="paymentOption"
                    value="pay_now"
                    checked={selectedOption === "pay_now"}
                    onChange={() => setSelectedOption("pay_now")}
                    className="payment-option-input"
                  />
                  <div className="payment-option-content">
                    <span className="payment-option-main">
                      <i className="payment-option-icon fas fa-bolt"></i>
                      {t("order_service.pay_now", "Pay Now")}
                    </span>
                    <span className="payment-option-desc">
                      Secure online payment
                    </span>
                  </div>
                </label>
              </div>

              <div
                className={`payment-option-card ${
                  selectedOption === "pay_at_clinic" ? "selected" : ""
                }`}
              >
                <label className="payment-option-label">
                  <input
                    type="radio"
                    name="paymentOption"
                    value="pay_at_clinic"
                    checked={selectedOption === "pay_at_clinic"}
                    onChange={() => setSelectedOption("pay_at_clinic")}
                    className="payment-option-input"
                  />
                  <div className="payment-option-content">
                    <span className="payment-option-main">
                      <i className="payment-option-icon fas fa-map-marker-alt"></i>
                      {t("order_service.pay_at_clinic", "Pay at Clinic")}
                    </span>
                    <span className="payment-option-desc">
                      Pay in-person when you arrive
                    </span>
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="payment-modal-footer">
          <button className="payment-modal-cancel-btn" onClick={onClose}>
            {t("common.cancel", "Cancel")}
          </button>
          <button
            className={`payment-modal-confirm-btn ${
              !selectedOption ? "disabled" : ""
            }`}
            onClick={handleConfirm}
            disabled={!selectedOption}
          >
            {t("common.confirm", "Confirm")}
          </button>
        </div>
      </div>
    </div>
  );
};

const OrderService = () => {
  const { t } = useTranslation();
  const { profileCompleted, patient, token } = useContext(AuthContext);
  const navigate = useNavigate();

  const [selectedService, setSelectedService] = useState(null);
  const [formData, setFormData] = useState({});
  const [files, setFiles] = useState([]);
  const [ServiceComponent, setServiceComponent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadType, setUploadType] = useState("device");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [applicationId, setApplicationId] = useState(null);
  const [payNowOnly, setPayNowOnly] = useState(false);

  const services = Object.keys(serviceModules).map((name) => ({
    name,
    icon: name,
  }));

  const handleServiceClick = async (serviceName) => {
    if (!serviceName || (token && !profileCompleted)) return;
    const service = services.find((s) => s.name === serviceName);
    setSelectedService(service);
    setFormData({});
    setFiles([]);
    setLoading(true);

    try {
      const module = await serviceModules[service.name]();
      setServiceComponent(() => module.default);
    } catch (error) {
      console.error("Error loading service module:", error);
      setServiceComponent(null);
      toast.error("Error loading service");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "uploadType") setUploadType(value);
  };

  const MAX_FILE_SIZE_MB = 50;
  const ALLOWED_FILE_TYPES = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/zip",
    "application/x-rar-compressed",
  ];

  const handleFileChange = (fileArray) => {
    setFiles(fileArray);
  };

  const isOnline = useMemo(
    () => formData.appointmentMode === "Online",
    [formData.appointmentMode]
  );
  const isOffline = useMemo(
    () => formData.appointmentMode === "Offline",
    [formData.appointmentMode]
  );

  React.useEffect(() => {
    if (!formData.appointmentMode) {
      if (formData.paymentPreference) {
        setFormData((p) => ({ ...p, paymentPreference: "" }));
      }
      return;
    }
  }, [formData.appointmentMode]);

  // ------------ helper ------------
  const normalizeAmount = (val) => {
    if (val == null) return "0.00";
    const n =
      typeof val === "string" ? parseFloat(val.replace(",", ".")) : Number(val);
    return Number.isNaN(n) ? "0.00" : n.toFixed(2);
  };
  // --------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setShowPaymentModal(true);
  };

  const validateForm = () => {
    const requiredFields = [
      "doctorEmail",
      "appointmentDate",
      "slotId",
      "entranceDiagnosis",
      "briefHistory",
      "appointmentMode",
    ];

    if (isOffline) requiredFields.push("clinic");

    const missingFields = requiredFields.filter((f) => !formData[f]);

    if (missingFields.length > 0) {
      console.warn("❗ Missing required fields:", missingFields);
      toast.error(`Missing required fields: ${missingFields.join(", ")}`);
      return false;
    }
    return true;
  };

  const handleCreatePayment = async (applicationId) => {
    setIsSubmitting(true);

    try {
      const paymentData = {
        applicationId,
        amount: normalizeAmount(formData.amount),
        currency: formData.currency || "RUB",
      };

      const paymentResponse = await createPayment(paymentData);

      if (paymentResponse.status === 200 || paymentResponse.status === 201) {
        const paymentUrl =
          paymentResponse.data?.paymentUrl ||
          paymentResponse.data?.confirmation_url;

        if (paymentUrl) {
          window.location.href = paymentUrl;
        } else {
          throw new Error("No payment URL received");
        }
      } else {
        throw new Error(
          paymentResponse.data?.message || "Failed to create payment"
        );
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "An error occurred while creating payment"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitForm = async (paymentPreference) => {
    setUploadProgress(0);
    setIsSubmitting(true);

    if (!token || !profileCompleted) {
      toast.error("Please sign in and complete your profile before submitting");
      setIsSubmitting(false);
      return null;
    }

    if (!validateForm()) {
      setIsSubmitting(false);
      return null;
    }

    const documentsData = new FormData();

    try {
      const detailsPayload = {
        ...formData,
        paymentPreference,
        patientEmail: getEmailFromToken(),
      };

      documentsData.append("serviceName", selectedService?.name || "");
      documentsData.append("details", JSON.stringify(detailsPayload));
      documentsData.append("paymentPreference", paymentPreference);

      if (files && files.length > 0) {
        const filesArray = Array.isArray(files)
          ? files
          : files instanceof FileList
          ? Array.from(files)
          : [files].filter((file) => file instanceof File);

        filesArray.forEach((file) => {
          if (file instanceof File) {
            documentsData.append("documents", file, file.name);
          }
        });
      }

      const response = await submitApplication(documentsData, {
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          setUploadProgress(progress);
        },
      });

      if (response.status === 200 || response.status === 201) {
        const applicationId = response.data?.applicationId;
        const requiresPayment = response.data?.requiresPayment;

        if (paymentPreference === "pay_at_clinic") {
          toast.success("Service order submitted successfully!");
          setSelectedService(null);
          setFormData({});
          setFiles([]);
          setServiceComponent(null);
          navigate("/appointments");
        } else if (paymentPreference === "pay_now" && requiresPayment) {
          // For pay_now, return the application ID to proceed with payment
          return applicationId;
        }

        return applicationId;
      } else {
        throw new Error(
          response.data?.message || "Failed to submit service order"
        );
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "An error occurred while submitting the service order"
      );
      return null;
    } finally {
      if (paymentPreference === "pay_at_clinic") {
        setIsSubmitting(false);
        setUploadProgress(0);
      }
    }
  };

  const handlePaymentChoice = async (paymentOption) => {
    // First save the application details
    const savedApplicationId = await handleSubmitForm(paymentOption);

    if (!savedApplicationId) {
      toast.error("Failed to save application details");
      return;
    }

    // Only proceed to payment if pay_now option is selected
    if (paymentOption === "pay_now") {
      await handleCreatePayment(savedApplicationId);
    }
  };

  const handleOrderNewService = () => {
    setSelectedService(null);
    setServiceComponent(null);
    setFormData({});
    setFiles([]);
    setLoading(false);
    setDescription(null);
  };

  return (
    <div
      className={`order-service-wrapper ${
        token && !profileCompleted ? "grayed-out" : ""
      }`}
    >
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        appointmentMode={formData.appointmentMode}
        onPaymentChoice={handlePaymentChoice}
        t={t}
        payNowOnly={payNowOnly}
      />

      {!selectedService ? (
        <div className="services-grid">
          <h2 className="services-heading">
            {t("order_service.services_title", "Order Service")}
          </h2>
          <p className="services-subheading">
            {t(
              "order_service.services_subtitle",
              "To open the description of the service, find out the cost, send an application - click on the service."
            )}
          </p>
          <div className="services-grid-container">
            {services.map((service) => {
              const IconComponent = serviceIcons[service.icon];
              return (
                <div
                  key={service.name}
                  className="service-card"
                  onClick={() => handleServiceClick(service.name)}
                >
                  <div
                    className="order-service-icon"
                  >
                    <IconComponent size={48} color="#6BD0D1" />
                  </div>
                  <p className="service-name">{service.name}</p>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="service-form-container">
          <div className="form-card">
            <h2 className="service-form-title">
              {t(
                "order_service.application_title",
                "Application for the service"
              )}{" "}
              "{selectedService.name}"
            </h2>
            <form onSubmit={handleSubmit}>
              {ServiceComponent && (
                <ServiceComponent
                  formData={formData}
                  handleInputChange={handleInputChange}
                  t={t}
                  setDescription={setDescription}
                  patient={patient}
                  payNowOnly={payNowOnly}
                  setPayNowOnly={setPayNowOnly}
                />
              )}

              <CommonServiceFields
                formData={formData}
                handleInputChange={handleInputChange}
                handleFileChange={handleFileChange}
                files={files}
              />

              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="upload-progress">
                  <progress value={uploadProgress} max="100" />
                  <span>{uploadProgress}%</span>
                </div>
              )}

              <button
                type="submit"
                className={`submit-button ${isSubmitting ? "submitting" : ""}`}
                disabled={isSubmitting || (token && !profileCompleted)}
              >
                {isSubmitting ? (
                  <span className="button-loading-state">
                    <span className="button-spinner"></span>
                    {t("order_service.submitting", "Submitting...")}
                  </span>
                ) : (
                  t("order_service.proceed_to_payment", "Proceed to Payment")
                )}
              </button>
            </form>
          </div>

          <button
            className="order-new-service-button"
            onClick={handleOrderNewService}
          >
            {t("order_service.order_new_service", "Choose another service")}
          </button>

          <div className="service-description-content">
            {loading ? (
              <p>Loading description...</p>
            ) : description ? (
              description
            ) : (
              <p>
                {t("order_service.no_description", "No description available.")}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderService;
