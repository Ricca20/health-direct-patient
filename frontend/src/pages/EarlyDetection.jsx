import React, { useState, useEffect } from "react";
import CustomCalendar from "../components/CustomCalendar";
import {
  CreditCard,
  CheckCircle,
  User,
  AlertCircle,
  Check,
  Calendar,
  X,
} from "lucide-react";
import { FaCheck, FaStar } from "react-icons/fa";
import { useTranslation } from "react-i18next";

const BookingFormPopup = (props) => {
  const { show = true, onClose, packageType, isPaymentSuccess = false } = props;
  const isPopup = Object.prototype.hasOwnProperty.call(props, "show");
  const { t, i18n } = useTranslation();
  const [formData, setFormData] = useState({
    dateOfBirth: null,
    appointmentDate: null,
    selectedPackage: packageType || "predict",
    consentDataProcessing: false,
    consentMarketing: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({
    success: isPaymentSuccess, // Set to true if coming from payment success
    error: false,
    message: isPaymentSuccess
      ? "Оплата прошла успешно! Ваша запись подтверждена."
      : "",
    paymentLink: null,
  });
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isMainPackageSelected, setIsMainPackageSelected] = useState(true); // Track main package selection independently
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);
  const [showOncosearchPopup, setShowOncosearchPopup] = useState(false);
  const [showInsurancePopup, setShowInsurancePopup] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponStatus, setCouponStatus] = useState({ loading: false, message: "", isValid: false, discount: 0, corporateName: "", discountPercentage: 0 });
  const [discountedPrice, setDiscountedPrice] = useState(null);

  // Prevent body scroll when popup is open
  useEffect(() => {
    if (!isPopup) return;

    if (show) {
      // Get scrollbar width before hiding it
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
      // Clear errors when popup closes
      setFieldErrors({});
      setSubmitStatus((prev) => ({ ...prev, error: false, message: "" }));
    }

    // Cleanup function to restore scroll when component unmounts
    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [show, isPopup]);

  // Update selected package when packageType prop changes
  useEffect(() => {
    if (packageType) {
      setFormData((prev) => ({
        ...prev,
        selectedPackage: packageType,
      }));
    }
  }, [packageType]);

  const packages = {
    predict: {
      id: "predict",
      name: t("early.pricing.predict.title"),
      type: "base",
      description: t("early.pricing.predict.subtitle"),
      price: 99500,
      clinicPrice: 149000,
      originalPrice: 208000,
    },
  };

  const addOns = [
    {
      id: "ct",
      name: t("early.booking.addons.ct.name"),
      note: t("early.booking.addons.ct.note"),
      price: 11700,
    },
    {
      id: "mri",
      name: t("early.booking.addons.mri.name"),
      note: t("early.booking.addons.mri.note"),
      price: 12000,
    },
    {
      id: "mammography",
      name: t("early.booking.addons.mammography.name"),
      note: t("early.booking.addons.mammography.note"),
      price: 12000,
    },
    {
      id: "endoscopy",
      name: t("early.booking.addons.endoscopy.name"),
      price: 58000,
    },
  ];

  const allAddOns = [
    ...addOns,
    {
      id: "predict-plus",
      name: t("early.pricing.upgrade.title"),
      price: 98000,
    },
    {
      id: "oncosearch",
      name: t("early.booking.package.oncosearch"),
      price: 50000,
    },
    {
      id: "insurance",
      name: t("early.booking.package.insurance"),
      price: 35000,
    },
  ];

  const selectedPackage = packages[formData.selectedPackage];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Per-field validation
    const errors = {};

    if (!formData.dateOfBirth) {
      errors.dateOfBirth = "early.booking.errors.dob";
    }

    if (!formData.consentDataProcessing) {
      errors.consentDataProcessing = "early.booking.errors.consent";
    }

    // Show validation errors if any
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setSubmitStatus({
        success: false,
        error: true,
        message: "early.booking.errors.fillAll",
      });
      return;
    }

    setFieldErrors({});

    setIsSubmitting(true);
    setSubmitStatus({ success: false, error: false, message: "" });

    const attemptSubmit = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      try {
        const baseUrl = "/sophos-api";
        const currentLang = i18n.language?.startsWith("en") ? "en" : "ru";
        const submissionData = {
          lang: currentLang,
          dateOfBirth: formData.dateOfBirth
            ? formData.dateOfBirth.toLocaleDateString("en-CA")
            : "",
          appointmentDate: formData.appointmentDate
            ? formData.appointmentDate.toLocaleDateString("en-CA")
            : "",
          consents: {
            dataProcessing: formData.consentDataProcessing,
            marketing: formData.consentMarketing,
          },
          package: isMainPackageSelected
            ? {
                id: selectedPackage.id,
                name: selectedPackage.name,
                description: selectedPackage.description,
                currency: "RUB",
              }
            : null,
          addOns: selectedAddOns.map((id) => ({ id })),
          ...(couponStatus.isValid && couponCode ? { couponCode: couponCode.trim() } : {}),
        };

        const response = await fetch(
          `${baseUrl}/api/early-detection/form/submit`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(submissionData),
            signal: controller.signal,
          },
        );
        clearTimeout(timeoutId);

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message || `HTTP error! status: ${response.status}`,
          );
        }

        // Open payment link in new tab
        if (result.success && result.data?.payment?.paymentLink) {
          if (result.data?.booking?.id) {
            localStorage.setItem("lastBookingId", result.data.booking.id);
          }
          if (result.data?.booking?.bookingNumber) {
            localStorage.setItem(
              "lastBookingNumber",
              result.data.booking.bookingNumber,
            );
          }

          // Open payment in new tab
          window.open(result.data.payment.paymentLink, "_blank");

          setSubmitStatus({
            success: true,
            error: false,
            message:
              "Заявка успешно отправлена! Страница оплаты открыта в новой вкладке.",
            paymentLink: result.data.payment.paymentLink,
          });
        } else {
          throw new Error("Payment link not received");
        }
        return true; // success
      } catch (error) {
        clearTimeout(timeoutId);
        // Rethrow so the retry wrapper can inspect it
        throw error;
      }
    };

    try {
      let lastError;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          await attemptSubmit();
          lastError = null;
          break; // success — stop retrying
        } catch (err) {
          lastError = err;
          const isNetworkError =
            err.name === "AbortError" ||
            err.name === "TypeError" ||
            err.message === "Failed to fetch" ||
            err.message?.toLowerCase().includes("network");
          // Only retry on network/timeout errors, not server errors
          if (!isNetworkError || attempt === 1) break;
          // Wait 1.5s before retry
          await new Promise((res) => setTimeout(res, 1500));
        }
      }
      if (lastError) throw lastError;
    } catch (error) {
      console.error("Error submitting form:", error);
      let errorKey = "early.booking.errors.submitFailed";
      if (error.name === "AbortError") {
        errorKey = "early.booking.errors.timeout";
      } else if (
        error.name === "TypeError" ||
        error.message === "Failed to fetch" ||
        error.message?.toLowerCase().includes("network")
      ) {
        errorKey = "early.booking.errors.networkError";
      }
      setSubmitStatus({
        success: false,
        error: true,
        message: errorKey,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = async () => {
    if (submitStatus.paymentLink) {
      try {
        await navigator.clipboard.writeText(submitStatus.paymentLink);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    }
  };

  const handleOpenLink = () => {
    if (submitStatus.paymentLink) {
      window.open(submitStatus.paymentLink, "_blank");
    }
  };

  const today = new Date();
  const minDate = new Date();
  minDate.setFullYear(today.getFullYear() - 100);
  const maxDate = new Date(); // No age limit

  if (show === false) return null;

  const toggleAddOn = (id) => {
    setSelectedAddOns((prev) => {
      // CASE 1: Clicking Predict+5
      if (id === "predict-plus") {
        const isAlreadySelected = prev.includes("predict-plus");

        if (isAlreadySelected) {
          // Remove +5
          setIsMainPackageSelected(false);
          return [];
        } else {
          // Select only +5 (remove all others)
          setIsMainPackageSelected(true);
          return ["predict-plus"];
        }
      }

      // CASE 2: Clicking any OTHER add-on

      let newSelection = prev;

      // If +5 is selected → remove it first
      if (prev.includes("predict-plus")) {
        newSelection = [];
      }

      // Toggle selection
      if (newSelection.includes(id)) {
        newSelection = newSelection.filter((item) => item !== id);
      } else {
        newSelection = [...newSelection, id];
      }

      // KEY RULE: if any addon exists → main package ON
      if (newSelection.length > 0) {
        setIsMainPackageSelected(true);
      } else {
        setIsMainPackageSelected(false);
      }

      return newSelection;
    });
  };

  // Add function to toggle main package independently
  const toggleMainPackage = () => {
    // Block if +5 is active (already correct behavior)
    if (selectedAddOns.includes("predict-plus")) return;

    setIsMainPackageSelected((prev) => {
      const newValue = !prev;

      // If turning OFF → clear all add-ons
      if (!newValue) {
        setSelectedAddOns([]);
      }

      return newValue;
    });
  };

  const addOnsTotal = selectedAddOns.reduce((sum, id) => {
    const item = allAddOns.find((a) => a.id === id);
    return sum + (item?.price || 0);
  }, 0);

  const mainPackagePrice = isMainPackageSelected ? selectedPackage.price : 0;
  const baseTotal = mainPackagePrice + addOnsTotal;
  const totalPrice = discountedPrice !== null ? discountedPrice : baseTotal;

  const handleApplyCoupon = async () => {
    if (!formData.email || !couponCode) return;
    setCouponStatus({ loading: true, message: "", isValid: false, discount: 0 });
    try {
      const baseUrl = "/sophos-api";
      const response = await fetch(`${baseUrl}/api/early-detection/form/check-coupon`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, couponCode }),
      });
      const result = await response.json();
      console.log(result)
      if (result.success) {
        const discountPercentage = result.data?.discountPercentage || 0;
        const corporateName = result.data?.corporateName || "";
        const newTotal = Math.round(baseTotal * (1 - discountPercentage / 100));
        setDiscountedPrice(newTotal);
        setCouponStatus({ loading: false, message: result.message || t("early.booking.coupon.applied"), isValid: true, discount: discountPercentage, corporateName, discountPercentage });
      } else {
        setDiscountedPrice(null);
        setCouponStatus({ loading: false, message: result.message || t("early.booking.coupon.invalid"), isValid: false, discount: 0, corporateName: "", discountPercentage: 0 });
      }
    } catch {
      setDiscountedPrice(null);
      setCouponStatus({ loading: false, message: t("early.booking.coupon.failed"), isValid: false, discount: 0, corporateName: "", discountPercentage: 0 });
    }
  };

  return (
    <>
      <style>{`
        .custom-phone-wrapper {
          display: block !important;
        }
        
        .custom-phone-wrapper .PhoneInput {
          display: flex !important;
          gap: 0.5rem !important;
        }
        
        .custom-phone-wrapper .PhoneInputCountry {
          flex-shrink: 0 !important;
          border: 1px solid #d1d5db !important;
          border-radius: 0.5rem !important;
          padding: 0.5rem !important;
          background: #f9fafb !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          min-width: 80px !important;
        }
        
        .custom-phone-wrapper .PhoneInputInput {
          flex: 1 !important;
          width: 100% !important;
          padding: 0.5rem 1rem !important;
          border: 1px solid #d1d5db !important;
          border-radius: 0.5rem !important;
          font-size: 1rem !important;
          outline: none !important;
          transition: all 0.2s !important;
        }
        
        .custom-phone-wrapper .PhoneInputInput:focus {
          border-color: #244082 !important;
          box-shadow: 0 0 0 2px rgba(36, 64, 130, 0.1) !important;
        }

        .custom-phone-wrapper.phone-error .PhoneInputCountry {
          border-color: #ef4444 !important;
        }

        .custom-phone-wrapper.phone-error .PhoneInputInput {
          border-color: #ef4444 !important;
        }

        .calendar-error .custom-calendar-input-wrapper {
          border: 1px solid #ef4444 !important;
          border-radius: 0.5rem !important;
        }
      `}</style>
      <div className={isPopup ? "fixed top-0 left-0 w-screen h-screen bg-black/60 flex items-center justify-center z-50 p-4" : "h-full bg-[#eff4f8] py-10 px-4 mb-6 mt-4"}>
        {!isPopup && (
          <div className="max-w-6xl mx-auto  px-2">
            <h1 className="text-3xl font-bold text-brand1">
              {t("early.page.title", "Early Detection")}
            </h1>
            <p className="mt-3 text-gray-600 max-w-3xl text-sm md:text-base mb-3">
              {t(
                "early.page.subtitle",
                "Book preventive health checks and early detection services in one convenient page."
              )}
            </p>
          </div>
        )}
        <div className={isPopup ? "bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] relative overflow-hidden shadow-2xl flex flex-col" : "bg-white rounded-2xl max-w-6xl mx-auto w-full overflow-hidden shadow-2xl flex flex-col"}>
          {isPopup && (
            <>
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-500 cursor-pointer hover:text-gray-700 z-10"
              >
                <X size={24} />
              </button>
            </>
          )}

          {/* Form Content - Scrollable */}
          <div className="p-6 md:p-8 overflow-y-auto flex-1 text-left">
            {submitStatus.success ? (
              /* Success Screen */
              <div className="flex flex-col items-center justify-center text-center h-full min-h-[500px] space-y-6 py-8">
                <div className="w-24 h-24  rounded-full flex items-center justify-center">
                  <img
                    src="/favicon.png"
                    alt="Sophos logo"
                    className="w-full h-full "
                  />
                </div>
                <div className="space-y-3">
                  <h2 className="text-3xl font-bold text-brand1">
                    {isPaymentSuccess
                      ? t("early.booking.success.paymentTitle")
                      : t("early.booking.success.formTitle")}
                  </h2>

                  <p className="text-lg text-gray-600 max-w-lg">
                    {isPaymentSuccess
                      ? t("early.booking.success.paymentDesc")
                      : t("early.booking.success.formDesc")}
                  </p>
                </div>

                {/* Payment Link Section - only show if not from payment success */}
                {submitStatus.paymentLink && !isPaymentSuccess && (
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 w-full max-w-lg space-y-4">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <CreditCard size={20} className="text-brand1" />
                      <p className="text-base font-semibold text-brand1">
                        {t("early.booking.success.paymentLinkTitle")}
                      </p>
                    </div>
                    <div className="flex flex-col md:flex-row gap-3">
                      <button
                        onClick={handleOpenLink}
                        className="flex-1 bg-brand1 text-white rounded-lg py-3 px-6 font-semibold hover:bg-brand2 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                          <polyline points="15 3 21 3 21 9"></polyline>
                          <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                        {t("early.booking.success.openPayment")}{" "}
                      </button>
                      <button
                        onClick={handleCopyLink}
                        className="bg-white border-2 border-gray-300 text-gray-700 rounded-lg py-3 px-6 font-semibold hover:bg-gray-50 hover:border-brand1 transition-all flex items-center justify-center gap-2"
                      >
                        {copiedLink ? (
                          <>
                            <Check size={18} className="text-green-600" />
                            <span className="text-green-600">
                              {" "}
                              {t("early.booking.success.copied")}
                            </span>
                          </>
                        ) : (
                          <>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <rect
                                x="9"
                                y="9"
                                width="13"
                                height="13"
                                rx="2"
                                ry="2"
                              ></rect>
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                            {t("early.booking.success.copy")}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                <div className="bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 rounded-xl p-6 w-full max-w-lg">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <AlertCircle size={20} className="text-green-700" />
                    <h3 className="text-lg font-semibold text-green-800">
                      {t("early.booking.success.nextSteps")}{" "}
                    </h3>
                  </div>
                  <ul className="text-sm text-green-800 space-y-3 text-left">
                    {!isPaymentSuccess && (
                      <li className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-green-200 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-green-800">
                            1
                          </span>
                        </div>
                        <span>{t("early.booking.success.step1")}</span>
                      </li>
                    )}
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-200 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-green-800">
                          {isPaymentSuccess ? "1" : "2"}
                        </span>
                      </div>
                      <span>{t("early.booking.success.step2")}</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-200 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-green-800">
                          {isPaymentSuccess ? "2" : "3"}
                        </span>
                      </div>
                      <span>{t("early.booking.success.step3")}</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-200 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-green-800">
                          {isPaymentSuccess ? "3" : "4"}
                        </span>
                      </div>
                      <span>{t("early.booking.success.step4")}</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={onClose}
                  className="bg-gray-100 text-gray-700 rounded-xl py-3 px-12 font-semibold hover:bg-gray-200 transition-all border border-gray-300"
                >
                  {t("early.booking.common.close")}{" "}
                </button>
              </div>
            ) : (
              /* Form Screen */
              <>
                {/* Error Messages */}
                {submitStatus.error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-center gap-3">
                    <AlertCircle size={20} className="text-red-600" />
                    <span className="text-red-800">
                      {t(submitStatus.message)}
                    </span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Personal Information */}


                  {/* Package Selection */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-brand1">
                      <CreditCard size={20} />
                      <h3 className="base-text font-semibold">
                        {t("early.booking.package.title")}
                      </h3>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      {Object.values(packages).map((pkg) => {
                        const isPredictPlusSelected =
                          selectedAddOns.includes("predict-plus");
                        const isLocked = isPredictPlusSelected;
                        const isPackageSelected =
                          formData.selectedPackage === pkg.id && isMainPackageSelected;
                        return (
                          <div
                            key={pkg.id}
                            onClick={() => toggleMainPackage(pkg.id)}
                            className={`border-2 rounded-xl p-4 cursor-pointer transition-all relative ${
                              isPackageSelected
                                ? "border-brand1 bg-brand1/10"
                                : "border-gray-200 hover:border-brand1/50"
                            } ${isLocked ? "cursor-not-allowed opacity-90" : ""} `}
                          >
                            <div className="flex gap-3">
                              {/* Checkbox indicator */}
                              <div
                                className={`w-5 h-5 mt-1 rounded border flex items-center justify-center shrink-0 ${
                                  isPackageSelected
                                    ? "bg-[#00235c] border-brand1"
                                    : "border-gray-300"
                                }`}
                              >
                                {isPackageSelected && (
                                  <Check size={14} className="text-white" />
                                )}
                              </div>

                              <div>
                                <h4
                                  className="base-text font-semibold text-brand1"
                                  dangerouslySetInnerHTML={{ __html: pkg.name }}
                                ></h4>

                                {pkg.type === "addon" && (
                                  <p
                                    className="text-xs text-brand2 mb-1"
                                    dangerouslySetInnerHTML={{
                                      __html: t(
                                        "early.booking.package.addonNote",
                                      ),
                                    }}
                                  ></p>
                                )}

                                <p
                                  className="small-text text-brand1/80 mb-2"
                                  dangerouslySetInnerHTML={{
                                    __html: pkg.description,
                                  }}
                                ></p>

                                <p className="font-bold text-brand1">
                                  {formatCurrency(pkg.price)}
                                </p>

                                <p className="text-xs text-brand1/60">
                                  {formatCurrency(pkg.clinicPrice)} —{" "}
                                  {t("early.booking.package.inClinic")}
                                </p>

                                <p className="text-xs line-through decoration-red-600 text-brand1/60">
                                  {formatCurrency(pkg.originalPrice)} —{" "}
                                  {t("early.booking.package.standard")}
                                </p>
                              </div>
                            </div>
                            {isLocked && (
                              <p
                                className="text-xs text-brand2 mt-2 italic"
                                dangerouslySetInnerHTML={{
                                  __html: t(
                                    "early.booking.package.autoIncluded",
                                  ),
                                }}
                              ></p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className="space-y-4">
                      <h3 className="base-text font-semibold text-brand1">
                        {t("early.booking.package.addons")}
                      </h3>

                      <div className="space-y-3">
                        <div
                          onClick={() => {
                            toggleAddOn("predict-plus");
                          }}
                          className={`border rounded-lg p-4 transition flex justify-between items-start gap-3
    ${
      selectedAddOns.includes("predict-plus")
        ? "border-brand1 bg-brand1/5"
        : "border-gray-200 hover:border-brand1/50"
    }
   mb-8
  `}
                        >
                          <div className="flex gap-3">
                            {/* Checkbox indicator */}
                            <div
                              className={`w-5 h-5 mt-1 rounded border flex items-center justify-center ${
                                selectedAddOns.includes("predict-plus")
                                  ? "bg-brand1 border-brand1"
                                  : "border-gray-300"
                              }`}
                            >
                              {selectedAddOns.includes("predict-plus") && (
                                <Check size={14} className="text-white" />
                              )}
                            </div>

                            <div>
                              <p className="small-text font-medium text-brand1">
                                <span
                                  dangerouslySetInnerHTML={{
                                    __html: t("early.pricing.upgrade.title"),
                                  }}
                                ></span>{" "}
                                <button
                                  onClick={() => setShowUpgradePopup(true)}
                                  className="text-red-600 font-bold hover:underline cursor-pointer"
                                >
                                  ({t("early.pricing.learnMore")}){" "}
                                </button>
                              </p>

                              <p className="text-xs text-brand2">
                                {t("early.booking.package.upgradeDesc")}
                              </p>
                            </div>
                          </div>

                          <p className="font-semibold text-brand1 whitespace-nowrap">
                            98 000 ₽{" "}
                          </p>
                        </div>

                        {addOns.map((item) => {
                          const isSelected = selectedAddOns.includes(item.id);

                          const isPredictPlusSelected =
                            selectedAddOns.includes("predict-plus");
                          return (
                            <div
                              key={item.id}
                              onClick={() => {
                                if (
                                  isPredictPlusSelected &&
                                  item.id !== "predict-plus"
                                ) {
                                  toggleAddOn(item.id);
                                } else {
                                  toggleAddOn(item.id);
                                }
                              }}
                              className={`border rounded-lg p-4 transition flex justify-between items-start gap-3
    ${
      isSelected
        ? "border-brand1 bg-brand1/5"
        : "border-gray-200 hover:border-brand1/50"
    }
    ${isPredictPlusSelected && item.id !== "predict-plus" ? "opacity-50 " : "cursor-pointer"} ${item.id === "predict-plus" && "mb-8"}
  `}
                            >
                              <div className="flex gap-3">
                                {/* Checkbox indicator */}
                                <div
                                  className={`w-5 h-5 mt-1 rounded border flex items-center justify-center ${
                                    isSelected
                                      ? "bg-brand1 border-brand1"
                                      : "border-gray-300"
                                  }`}
                                >
                                  {isSelected && (
                                    <Check size={14} className="text-white" />
                                  )}
                                </div>

                                <div>
                                  <p
                                    className="small-text font-medium text-brand1"
                                    dangerouslySetInnerHTML={{
                                      __html: item.name,
                                    }}
                                  ></p>

                                  {item.isUpgrade && (
                                    <p className="text-xs text-brand2">
                                      {t("early.booking.package.upgradeDesc")}
                                    </p>
                                  )}

                                  {item.note && (
                                    <p className="text-xs text-brand1/70">
                                      {item.note}
                                    </p>
                                  )}

                                  {item.oldPrice && (
                                    <p className="text-xs line-through  decoration-red-600 text-brand1/60">
                                      {formatCurrency(item.oldPrice)}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <p className="font-semibold text-brand1 whitespace-nowrap">
                                {formatCurrency(item.price)}
                              </p>
                            </div>
                          );
                        })}

                        <div
                          onClick={() => {
                            toggleAddOn("oncosearch");
                          }}
                          className={`border rounded-lg p-4 transition flex justify-between items-start gap-3
    ${
      selectedAddOns.includes("oncosearch")
        ? "border-brand1 bg-brand1/5"
        : "border-gray-200 hover:border-brand1/50"
    }
    ${
      selectedAddOns.includes("predict-plus") ? "opacity-50 " : "cursor-pointer"
    } 
  `}
                        >
                          <div className="flex gap-3">
                            {/* Checkbox indicator */}
                            <div
                              className={`w-5 h-5 mt-1 rounded border flex items-center justify-center ${
                                selectedAddOns.includes("oncosearch")
                                  ? "bg-brand1 border-brand1"
                                  : "border-gray-300"
                              }`}
                            >
                              {selectedAddOns.includes("oncosearch") && (
                                <Check size={14} className="text-white" />
                              )}
                            </div>

                            <div>
                              <p className="small-text font-medium text-brand1">
                                {t("early.booking.package.oncosearch")}{" "}
                                <button
                                  onClick={() => setShowOncosearchPopup(true)}
                                  className="text-red-600 font-bold hover:underline cursor-pointer"
                                >
                                  ({t("early.pricing.learnMore")}){" "}
                                </button>
                              </p>
                            </div>
                          </div>

                          <p className="font-semibold text-brand1 whitespace-nowrap">
                            {formatCurrency(50000)}
                          </p>
                        </div>

                        <div
                          onClick={() => {
                            toggleAddOn("insurance");
                          }}
                          className={`border rounded-lg p-4 transition flex justify-between items-start gap-3
    ${
      selectedAddOns.includes("insurance")
        ? "border-brand1 bg-brand1/5"
        : "border-gray-200 hover:border-brand1/50"
    }
    ${
      selectedAddOns.includes("predict-plus") ? "opacity-50 " : "cursor-pointer"
    } 
  `}
                        >
                          <div className="flex gap-3">
                            {/* Checkbox indicator */}
                            <div
                              className={`w-5 h-5 mt-1 rounded border flex items-center justify-center ${
                                selectedAddOns.includes("insurance")
                                  ? "bg-brand1 border-brand1"
                                  : "border-gray-300"
                              }`}
                            >
                              {selectedAddOns.includes("insurance") && (
                                <Check size={14} className="text-white" />
                              )}
                            </div>

                            <div>
                              <p className="small-text font-medium text-brand1">
                                {t("early.booking.package.insurance")}{" "}
                                <button
                                  onClick={() => setShowInsurancePopup(true)}
                                  className="text-red-600 font-bold hover:underline cursor-pointer"
                                >
                                  ({t("early.pricing.learnMore")}){" "}
                                </button>
                              </p>
                            </div>
                          </div>

                          <p className="font-semibold text-brand1 whitespace-nowrap">
                            {formatCurrency(35000)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Coupon Code */}
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => {
                          setCouponCode(e.target.value);
                          setDiscountedPrice(null);
                          setCouponStatus({ loading: false, message: "", isValid: false, discount: 0, corporateName: "", discountPercentage: 0 });
                        }}
                        placeholder={t("early.booking.coupon.placeholder")}
                        className={`flex-1 px-3 py-2 text-sm border rounded-lg outline-none focus:ring-1 transition-all ${
                          couponStatus.isValid
                            ? "border-green-400 focus:border-green-500 focus:ring-green-200 bg-green-50"
                            : couponStatus.message && !couponStatus.isValid
                            ? "border-red-400 focus:border-red-500 focus:ring-red-200"
                            : "border-gray-300 focus:border-brand1 focus:ring-brand1/20"
                        }`}
                      />
                      {formData.email && couponCode && (
                        <button
                          type="button"
                          onClick={handleApplyCoupon}
                          disabled={couponStatus.loading}
                          className="px-4 py-2 text-sm bg-brand1 text-white rounded-lg font-semibold hover:bg-brand2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {couponStatus.loading ? t("early.booking.coupon.applying") : t("early.booking.coupon.apply")}
                        </button>
                      )}
                    </div>

                    {/* Coupon result card */}
                    {couponStatus.isValid ? (
                      <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                            <Check size={16} className="text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-green-700">{t("early.booking.coupon.applied")}</p>
                            {couponStatus.corporateName && (
                              <p className="text-xs text-green-600">{couponStatus.corporateName}</p>
                            )}
                          </div>
                        </div>
                        <span className="text-lg font-bold text-green-600">−{couponStatus.discountPercentage}%</span>
                      </div>
                    ) : couponStatus.message ? (
                      <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                          <X size={16} className="text-red-500" />
                        </div>
                        <p className="text-sm text-red-600">{couponStatus.message}</p>
                      </div>
                    ) : null}
                  </div>

                  {/* Consent Checkboxes */}
                  <div className="space-y-3 border-t border-gray-200 pt-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          id="consentDataProcessing"
                          name="consentDataProcessing"
                          checked={formData.consentDataProcessing}
                          onChange={handleInputChange}
                          className={`mt-1 ${fieldErrors.consentDataProcessing ? "ring-2 ring-red-500 rounded" : ""}`}
                        />
                        <label
                          htmlFor="consentDataProcessing"
                          className="small-text text-gray-700"
                        >
                          <span className="text-red-600">*</span>{" "}
                          {t("early.booking.consent.prefix")}{" "}
                          <a
                            href="/согласие.pdf"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-brand1 underline"
                          >
                            {t("early.booking.consent.link")}
                          </a>{" "}
                          {t("early.booking.consent.middle")}{" "}
                          <a
                            href="https://health-direct.info/politika-konfidencialnosti"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-brand1 underline"
                          >
                            {t("early.booking.consent.policy")}
                          </a>
                        </label>
                      </div>
                      {fieldErrors.consentDataProcessing && (
                        <p className="text-red-500 text-xs">
                          {t(fieldErrors.consentDataProcessing)}
                        </p>
                      )}
                    </div>

                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        id="consentMarketing"
                        name="consentMarketing"
                        checked={formData.consentMarketing}
                        onChange={handleInputChange}
                        className="mt-1"
                      />
                      <label
                        htmlFor="consentMarketing"
                        className="small-text text-gray-700"
                      >
                        {t("early.booking.consent.marketing")}
                      </label>
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                    <h3 className="base-text font-semibold text-gray-900">
                      {t("early.booking.summary.title")}{" "}
                    </h3>
                    {isMainPackageSelected && (
                      <div className="flex justify-between items-center">
                        <span className="small-text text-gray-600">
                          {t("early.booking.summary.package")}:
                        </span>
                        <span
                          className="small-text font-medium text-gray-900"
                          dangerouslySetInnerHTML={{
                            __html: selectedPackage.name,
                          }}
                        ></span>
                      </div>
                    )}
                    {selectedAddOns.length > 0 && (
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="small-text text-gray-600">
                            {t("early.booking.summary.addons")}:
                          </span>
                        </div>
                        {selectedAddOns.map((id) => {
                          const addon =
                            addOns.find((a) => a.id === id) ||
                            allAddOns.find((a) => a.id === id);
                          return addon ? (
                            <div
                              key={id}
                              className="flex justify-between items-center pl-4"
                            >
                              <span
                                className="text-xs text-gray-500"
                                dangerouslySetInnerHTML={{ __html: addon.name }}
                              ></span>
                              <span className="text-xs font-medium text-gray-900">
                                {formatCurrency(addon.price)}
                              </span>
                            </div>
                          ) : null;
                        })}
                      </div>
                    )}
                    {discountedPrice !== null && (
                      <div className="flex justify-between items-center text-green-600">
                        <span className="text-sm font-medium">{t("early.booking.coupon.discount")} ({couponStatus.discountPercentage}%):</span>
                        <span className="text-sm font-semibold">−{formatCurrency(baseTotal - discountedPrice)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                      <span className="base-text font-semibold text-gray-900">
                        {t("early.booking.summary.total")}:
                      </span>
                      <div className="text-right">
                        {discountedPrice !== null && (
                          <div className="text-sm text-gray-400 line-through">{formatCurrency(baseTotal)}</div>
                        )}
                        <span className="subheading font-bold text-brand1">
                          {formatCurrency(totalPrice)}
                        </span>
                      </div>
                    </div>
                    {/* VAT */}
                    <p className="text-xs text-gray-500 text-right">
                      {t("early.booking.summary.vat")}
                    </p>
                  </div>

                  {/* Submit Button */}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 bg-gray-200 text-gray-700 rounded-xl py-3 px-6 font-semibold hover:bg-gray-300 transition-all cursor-pointer"
                    >
                      {t("early.booking.common.cancel")}
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 bg-[#00235c] hover:bg-[#001a4d] text-white rounded-xl py-3 px-6 font-semibold hover:bg-brand2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {isSubmitting
                        ? t("early.booking.common.loading")
                        : t("early.booking.common.pay")}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>

      {showUpgradePopup && (
        <UpgradePopup
          show={showUpgradePopup}
          onClose={() => setShowUpgradePopup(false)}
        />
      )}

      {showOncosearchPopup && (
        <OncosearchPopup
          show={showOncosearchPopup}
          onClose={() => setShowOncosearchPopup(false)}
        />
      )}

      {showInsurancePopup && (
        <InsurancePopup
          show={showInsurancePopup}
          onClose={() => setShowInsurancePopup(false)}
        />
      )}
    </>
  );
};

export default BookingFormPopup;

function UpgradePopup({ show, onClose }) {
  const { t } = useTranslation();
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="rounded-xl max-w-2xl max-h-[85vh] overflow-hidden">
        <div className="bg-white rounded-xl max-w-2xl max-h-[85vh] overflow-y-auto w-full p-6 relative shadow-xl">
          {/* CLOSE */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-brand1 cursor-pointer hover:text-red-500"
          >
            ✕
          </button>

          <h3
            className="subheading font-semibold text-brand1 mb-4"
            dangerouslySetInnerHTML={{
              __html: t("early.pricing.upgrade.title"),
            }}
          ></h3>

          <div className=" text-brand1 base-text">
            {/* FEATURES */}
            <p
              className="font-semibold text-brand1 mb-3"
              dangerouslySetInnerHTML={{
                __html: t("early.pricing.upgrade.featuresTitle"),
              }}
            ></p>

            <ul className="space-y-3 text-brand1">
              {t("early.pricing.upgrade.features", { returnObjects: true })
                .slice(0, 4)
                .map((item, i) => (
                  <li key={i} className="flex gap-3">
                    <FaCheck className="text-brand1 mt-1 shrink-0" />
                    <p dangerouslySetInnerHTML={{ __html: item }} />
                  </li>
                ))}

              {/* ONCO SEARCH */}
              <li>
                <div className="flex gap-3">
                  <FaCheck className="text-brand1 mt-1 shrink-0" />
                  <strong>{t("early.pricing.upgrade.oncosearchTitle")}</strong>
                </div>

                <ul className="ml-8 list-disc mt-2 space-y-1">
                  {t("early.pricing.upgrade.oncosearch", {
                    returnObjects: true,
                  }).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </li>

              {t("early.pricing.upgrade.features", { returnObjects: true })
                .slice(4)
                .map((item, i) => (
                  <li key={i} className="flex gap-3">
                    <FaCheck className="text-brand1 mt-1 shrink-0" />
                    <p dangerouslySetInnerHTML={{ __html: item }} />
                  </li>
                ))}
            </ul>

            {/* BENEFITS */}
            <div className="mt-6">
              <p className="font-semibold text-brand1 mb-2">
                {t("early.pricing.upgrade.benefitsTitle")}
              </p>

              <ul className="space-y-2">
                {t("early.pricing.upgrade.benefits", {
                  returnObjects: true,
                }).map((item, i) => (
                  <li key={i} className="flex gap-3">
                    <FaCheck className="text-brand1 mt-1 shrink-0" />
                    {i === 0 ? (
                      <p dangerouslySetInnerHTML={{ __html: item }} />
                    ) : (
                      <p>
                        {item}
                        {/* <button
                          onClick={() => setShowInsurancePopup(true)}
                          className="font-bold hover:underline cursor-pointer text-red-600"
                        >
                          {t("early.pricing.learnMore")}
                        </button> */}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6">
              <p
                className="font-semibold text-brand1 mb-2"
                dangerouslySetInnerHTML={{
                  __html: t("early.pricing.upgrade.extraTitle"),
                }}
              ></p>

              <ul className="space-y-2">
                {t("early.pricing.upgrade.extra", { returnObjects: true }).map(
                  (item, i) => (
                    <li key={i} className="flex gap-3">
                      <FaCheck className="text-brand1 mt-1 shrink-0" />
                      <p dangerouslySetInnerHTML={{ __html: item }} />
                    </li>
                  ),
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OncosearchPopup({ show, onClose }) {
  const { t } = useTranslation();

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="rounded-xl max-w-2xl max-h-[85vh] overflow-hidden">
        <div className="bg-white rounded-xl max-w-2xl max-h-[85vh] overflow-y-auto w-full p-6 relative shadow-xl">
          {/* CLOSE */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-brand1 cursor-pointer hover:text-red-500"
          >
            ✕
          </button>

          <h3 className="subheading font-semibold text-brand1 mb-4">
            {t("early.pricing.upgrade.oncosearchTitle")}
          </h3>

          <div className=" text-brand1 base-text">
            {/* SUB ITEMS */}
            <ul className="ml-5 mt-1 list-disc space-y-1 text-brand1">
              {t("early.pricing.upgrade.oncosearch", {
                returnObjects: true,
              }).map((sub, j) => (
                <li key={j} className="base-text">
                  {sub}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function InsurancePopup({ show, onClose }) {
  const { t } = useTranslation();

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="rounded-xl max-w-2xl max-h-[85vh] overflow-hidden">
        <div className="bg-white rounded-xl max-w-2xl max-h-[85vh] overflow-y-auto w-full p-6 relative shadow-xl">
          {/* CLOSE */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-brand1 cursor-pointer hover:text-red-500"
          >
            ✕
          </button>

          <h3 className="subheading font-semibold text-brand1 mb-4 uppercase">
            {t("early.pricing.insurance.title")}
          </h3>

          <div className="space-y-3 text-brand1 base-text">
            {t("early.pricing.insurance.content", { returnObjects: true }).map(
              (item, i) => (
                <p key={i} dangerouslySetInnerHTML={{ __html: item }} />
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
