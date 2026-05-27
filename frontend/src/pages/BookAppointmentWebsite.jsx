import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { X, Search, ChevronLeft, ChevronRight, Check, ArrowRight, ArrowLeft, Clock, Calendar, Shield, ChevronDown } from "lucide-react";
import "../styles/BookAppointmentWebsite.css";

const API_BASE = "/sophos-api/api";

const publicFetch = async (path, options = {}) => {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw { response: { data: json } };
  return json;
};

const getLocalImage = (doc) => {
  return doc.profileImageUrl || doc.photo || doc.image || null;
};

const getFieldValue = (field, lang = "en") => {
  if (!field) return "";
  if (typeof field === "string") return field;
  if (typeof field === "object") return field[lang] || field["en"] || "";
  return "";
};

const SLOT_DURATION = 30;
const DAYS_EN = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const DAYS_RU = ["ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ", "ВС"];

/** Return a Date object representing the current moment in MSK (UTC+3) */
const getMskNow = () => {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 3 * 3600000); // UTC+3
};

export default function BookAnAppointmentWebsite({ isOpen = true, onClose, onSuccess, preselectedDoctorId, preselectedPromo }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const lang = i18n.language?.slice(0, 2) || "en";

  const handleClose = () => {
    if (typeof onClose === "function") {
      onClose();
    } else {
      navigate("/dashboard");
    }
  };

  const [step, setStep] = useState(1);

  const [specialties, setSpecialties] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);
  const [timeSlotsList, setTimeSlotsList] = useState([]);

  const [selectedSpecialty, setSelectedSpecialty] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const [calMonth, setCalMonth] = useState(getMskNow().getMonth() + 1);
  const [calYear, setCalYear] = useState(getMskNow().getFullYear());

  const [specialtySearch, setSpecialtySearch] = useState("");
  const [doctorSearch, setDoctorSearch] = useState("");
  const [promoFilter, setPromoFilter] = useState(false);
  const [activePromo, setActivePromo] = useState("book"); // "book" | "early"
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setIsExiting(true);
      setTimeout(() => {
        setActivePromo((p) => (p === "book" ? "early" : "book"));
        setIsExiting(false);
      }, 380);
    }, 5000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const PROMO_SPECIALTIES = ["psychiatrist", "psychotherapist", "narcologist", "психиатр", "психотерапевт", "нарколог"];

  const [phoneDigits, setPhoneDigits] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const [patientExists, setPatientExists] = useState(null);
  const [existingPatientId, setExistingPatientId] = useState(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");

  const [loadingSpecialties, setLoadingSpecialties] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [booked, setBooked] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [appointmentId, setAppointmentId] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    if (preselectedPromo) setPromoFilter(true);
    setLoadingSpecialties(true);
    publicFetch("/patient-auth/website/specialties")
      .then((data) => setSpecialties(Array.isArray(data) ? data : (data?.specialties || data?.data || [])))
      .catch(() => toast.error(t("bookAppointment.err_load_specialties")))
      .finally(() => setLoadingSpecialties(false));

    setLoadingDoctors(true);
    publicFetch("/patient-auth/website/doctors")
      .then((data) => setDoctors(Array.isArray(data) ? data : (data?.doctors || data?.data || [])))
      .catch(() => toast.error(t("bookAppointment.err_load_doctors")))
      .finally(() => setLoadingDoctors(false));
  }, [isOpen]);

  useEffect(() => {
    if (!preselectedDoctorId || !doctors.length) return;
    const match = doctors.find((d) => String(d._id) === String(preselectedDoctorId));
    if (match) setSelectedDoctor(match);
  }, [preselectedDoctorId, doctors]);

  useEffect(() => {
    if (!selectedSpecialty || !selectedDoctor) return;
    const ids = (selectedDoctor.specialtyIds || []).map((s) => typeof s === "object" ? s._id : s);
    if (!ids.some((id) => String(id) === String(selectedSpecialty._id))) {
      setSelectedDoctor(null);
      setAvailableDates([]);
      setTimeSlotsList([]);
      setSelectedDate(null);
      setSelectedSlot(null);
    }
  }, [selectedSpecialty]);

  useEffect(() => {
    if (!selectedDoctor) return;
    setLoadingAvailability(true);
    setAvailableDates([]);
    setTimeSlotsList([]);
    setSelectedDate(null);
    setSelectedSlot(null);
    publicFetch(`/doctor-availability?doctorId=${selectedDoctor._id}&month=${calMonth}&year=${calYear}`)
      .then((data) => setAvailableDates(data?.availableDates || []))
      .catch(() => toast.error(t("bookAppointment.err_load_availability")))
      .finally(() => setLoadingAvailability(false));
  }, [selectedDoctor, calMonth, calYear]);

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setSelectedSpecialty(null); setSelectedDoctor(null);
      setSelectedDate(null); setSelectedSlot(null);
      setSpecialtySearch(""); setDoctorSearch(""); setPromoFilter(false);
      setAvailableDates([]); setTimeSlotsList([]);
      setPhoneDigits(""); setOtpSent(false); setOtpCode("");
      setOtpVerified(false); setPatientExists(null);
      setExistingPatientId(null);
      setFirstName(""); setLastName(""); setMiddleName(""); setDateOfBirth("");
      setBooked(false);
      setConfirming(false);
      setAppointmentId(null);
      const msk = getMskNow();
      setCalMonth(msk.getMonth() + 1);
      setCalYear(msk.getFullYear());
    }
  }, [isOpen]);

  const daysInMonth = new Date(calYear, calMonth, 0).getDate();
  const startOffset = ((new Date(calYear, calMonth - 1, 1).getDay()) + 6) % 7;
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const monthNamesRu = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
  const monthLabel = lang === "ru" ? `${monthNamesRu[calMonth - 1]} ${calYear}` : `${monthNames[calMonth - 1]} ${calYear}`;
  const prevMonth = () => { if (calMonth === 1) { setCalMonth(12); setCalYear((y) => y - 1); } else setCalMonth((m) => m - 1); };
  const nextMonth = () => { if (calMonth === 12) { setCalMonth(1); setCalYear((y) => y + 1); } else setCalMonth((m) => m + 1); };
  const today = getMskNow();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const toDateStr = (day) => `${calYear}-${String(calMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const dayHasData = (day) => availableDates.includes(toDateStr(day));
  const isPast = (day) => toDateStr(day) < todayStr;

  const getTimeSlots = () => timeSlotsList;

  const doctorName = (doc) =>
    [getFieldValue(doc.lastName, lang), getFieldValue(doc.firstName, lang), getFieldValue(doc.middleName, lang)].filter(Boolean).join(" ");

  const fullPhone = `+7${phoneDigits}`;

  const handleSendOtp = async () => {
    if (phoneDigits.replace(/\D/g, "").length < 10) { toast.error(t("bookAppointment.err_invalid_phone")); return; }
    setSendingOtp(true);
    try {
      const res = await publicFetch("/patient-auth/website/send-otp", { method: "POST", body: JSON.stringify({ phoneNumber: fullPhone }) });
      setOtpSent(true);
      setPatientExists(res.patientExists ?? null);
      setExistingPatientId(res.patientId ?? null);
      toast.success(t("bookAppointment.otp_sent", { phone: fullPhone }));
    } catch (err) {
      toast.error(err?.response?.data?.message || t("bookAppointment.err_send_otp"));
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode.trim()) { toast.error(t("bookAppointment.err_enter_otp")); return; }
    setVerifyingOtp(true);
    try {
      await publicFetch("/patient-auth/website/verify-otp", { method: "POST", body: JSON.stringify({ phoneNumber: fullPhone, otp: otpCode }) });
      setOtpVerified(true);
      toast.success(t("bookAppointment.phone_verified"));
      if (patientExists) {
        setConfirming(true);
      } else {
        setStep(3);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || t("bookAppointment.err_invalid_otp"));
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleBookExisting = async () => {
    setSubmitting(true);
    try {
      const res = await publicFetch("/new-appointments/website", {
        method: "POST",
        body: JSON.stringify({
          doctorProfile: selectedDoctor._id,
          speciality: selectedSpecialty._id,
          date: new Date(selectedDate).toISOString(),
          startTime: selectedSlot,
          guestPhone: fullPhone,
          ...(existingPatientId ? { patient: existingPatientId } : {}),
          source: "website",
          ...(promoFilter ? { promoCode: t("bookAppointment.promo_text") } : {}),
        }),
      });
      setAppointmentId(res?.applicationId || res?.appointment?.applicationId || null);
      onSuccess?.();
      setBooked(true);
    } catch (err) {
      toast.error(err?.response?.data?.message || t("bookAppointment.err_book"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateAndBook = async () => {
    if (!firstName.trim()) { toast.error(t("bookAppointment.err_first_name")); return; }
    if (!lastName.trim()) { toast.error(t("bookAppointment.err_last_name")); return; }
    if (!dateOfBirth) { toast.error(t("bookAppointment.err_dob")); return; }
    setSubmitting(true);
    try {
      const patientRes = await publicFetch("/patient-auth/website/create-patient", {
        method: "POST",
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          middleName: middleName.trim() || undefined,
          dateOfBirth,
          phoneNumber: fullPhone,
        }),
      });
      const patientData = patientRes?.patient || patientRes?.data || patientRes;

      const apptRes = await publicFetch("/new-appointments/website", {
        method: "POST",
        body: JSON.stringify({
          doctorProfile: selectedDoctor._id,
          speciality: selectedSpecialty._id,
          date: new Date(selectedDate).toISOString(),
          startTime: selectedSlot,
          guestPhone: fullPhone,
          guestFirstName: firstName.trim(),
          guestLastName: lastName.trim(),
          ...(patientData?._id ? { patient: patientData._id } : {}),
          source: "website",
          ...(promoFilter ? { promoCode: t("bookAppointment.promo_text") } : {}),
        }),
      });
      setAppointmentId(apptRes?.applicationId || apptRes?.appointment?.applicationId || null);
      onSuccess?.();
      setBooked(true);
    } catch (err) {
      toast.error(err?.response?.data?.message || t("bookAppointment.err_create_book"));
    } finally {
      setSubmitting(false);
    }
  };

  const filteredSpecialties = specialties.filter((s) => {
    const name = lang === "ru" ? s.name_ru : s.name_en;
    if (!name?.toLowerCase().includes(specialtySearch.toLowerCase())) return false;
    if (promoFilter) {
      return PROMO_SPECIALTIES.some((p) => name?.toLowerCase().includes(p));
    }
    if (selectedDoctor) {
      const ids = (selectedDoctor.specialtyIds || []).map((sp) => typeof sp === "object" ? String(sp._id) : String(sp));
      return ids.includes(String(s._id));
    }
    // Only show specialties that have at least one doctor
    const hasDoctors = doctors.some((d) => {
      const ids = (d.specialtyIds || []).map((sp) => typeof sp === "object" ? String(sp._id) : String(sp));
      return ids.includes(String(s._id));
    });
    return hasDoctors;
  });

  const filteredDoctors = doctors.filter((d) => {
    if (!doctorName(d).toLowerCase().includes(doctorSearch.toLowerCase())) return false;
    if (selectedDoctor) return String(d._id) === String(selectedDoctor._id);
    if (promoFilter) {
      const docSpecIds = (d.specialtyIds || []).map((s) => typeof s === "object" ? String(s._id) : String(s));
      if (selectedSpecialty) {
        return docSpecIds.includes(String(selectedSpecialty._id));
      }
      const promoSpIds = specialties
        .filter((s) => {
          const name = lang === "ru" ? s.name_ru : s.name_en;
          return PROMO_SPECIALTIES.some((p) => name?.toLowerCase().includes(p));
        })
        .map((s) => String(s._id));
      return docSpecIds.some((id) => promoSpIds.includes(id));
    }
    if (selectedSpecialty) {
      const ids = (d.specialtyIds || []).map((s) => typeof s === "object" ? String(s._id) : String(s));
      return ids.includes(String(selectedSpecialty._id));
    }
    return true;
  });

  const timeSlots = getTimeSlots();
  const calCells = [];
  for (let i = 0; i < startOffset; i++) calCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calCells.push(d);

  const step1Complete = selectedSpecialty && selectedDoctor && selectedDate && selectedSlot;

  if (!isOpen) return null;

  return createPortal(
    <div className="baa-overlay" onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}>
      <div className="baa-modal baw-modal">

        <div className={`baa-promo-ticker baa-promo-ticker--${activePromo}`}>
          <div className="baa-promo-dots">
            <span className={`baa-promo-dot${activePromo === "book" ? " baa-promo-dot--active" : ""}`} />
            <span className={`baa-promo-dot${activePromo === "early" ? " baa-promo-dot--active" : ""}`} />
          </div>
          <div className={`baa-promo-ticker__slide${isExiting ? " baa-promo-slide--exit" : " baa-promo-slide--enter"}`}>
            <span className="baa-promo-ticker__text">
              {activePromo === "book"
                ? <>🎉 {t("bookAppointment.promo_text")}</>
                : <>🎗️ {t("bookAppointment.promo_early_text")}</>}
            </span>
            {activePromo === "book" ? (
              <button className="baa-promo-ticker__btn" onClick={() => { setPromoFilter(true); setSelectedSpecialty(null); setSelectedDoctor(null); setSelectedSlot(null); setAvailableDates([]); setTimeSlotsList([]); setSpecialtySearch(""); setDoctorSearch(""); }}>
                {t("bookAppointment.promo_book_now")}
              </button>
            ) : (
              <a className="baa-promo-ticker__btn" href="https://ed.sophos-med.ru" target="_blank" rel="noopener noreferrer">
                {t("bookAppointment.promo_learn_more")}
              </a>
            )}
          </div>
        </div>

        <div className="baa-header baw-header">
          <div className="baw-header-left">
            {(step > 1 || confirming) && !booked && (
              <button className="baw-back-btn" onClick={() => {
                if (confirming) {
                  setConfirming(false); setOtpVerified(false); setOtpCode(""); setOtpSent(false);
                } else if (step === 3) {
                  setStep(2); setOtpVerified(false); setOtpSent(false); setOtpCode(""); setPatientExists(null);
                } else {
                  setStep(1); setOtpSent(false); setOtpCode(""); setOtpVerified(false); setPatientExists(null);
                }
              }}>
                <ArrowLeft size={16} />
              </button>
            )}
          </div>

          <div className="baw-hs">
            {[{ n: "01", label: t("bookAppointment.step_select") }, { n: "02", label: t("bookAppointment.step_verification") }, { n: "03", label: t("bookAppointment.step_confirm") }].map(({ n, label }, i) => {
              const s = i + 1;
              const hsStep = booked ? 3 : confirming ? 3 : step;
              const isActive = hsStep === s;
              const isDone = hsStep > s;
              return (
                <div key={n} className="baw-hs-item">
                  <div className={`baw-hs-node ${isActive ? "baw-hs-node--active" : isDone ? "baw-hs-node--done" : "baw-hs-node--upcoming"}`}>
                    <span className="baw-hs-num">{n}</span>
                    <span className="baw-hs-label">{label}</span>
                  </div>
                  {i < 2 && <div className={`baw-hs-line ${hsStep > s ? "baw-hs-line--done" : hsStep === s ? "baw-hs-line--active" : ""}`} />}
                </div>
              );
            })}
          </div>

          <div className="baw-header-right">
            <button className="baa-close-btn" onClick={handleClose}><X size={20} /></button>
          </div>
        </div>

        {step === 1 && (
          <>
          <div className="baa-scroll-wrapper">
            <div className="baa-body">
              <div className="baa-col">
                {promoFilter && (
                  <div className="baa-promo-filter-badge">
                    🎉 {t("bookAppointment.promo_filter_label")}
                    <button className="baa-promo-filter-clear" onClick={() => setPromoFilter(false)}>✕</button>
                  </div>
                )}
                <div className="baa-col-search">
                  <Search size={14} className="baa-search-icon" />
                  <input className="baa-search-input" placeholder={t("bookAppointment.search_specialty")} value={specialtySearch} onChange={(e) => setSpecialtySearch(e.target.value)} />
                </div>
                <div className="baa-col-list">
                  {loadingSpecialties ? <div className="baa-loading-spinner" /> :
                    filteredSpecialties.length === 0 ? <p className="baa-empty">{t("bookAppointment.no_results")}</p> :
                      filteredSpecialties.map((sp) => {
                        const name = lang === "ru" ? sp.name_ru : sp.name_en;
                        const isSel = selectedSpecialty?._id === sp._id;
                        return (
                          <button key={sp._id} className={`baa-list-item ${isSel ? "baa-list-item--selected" : ""}`}
                            onClick={() => setSelectedSpecialty((prev) => prev?._id === sp._id ? null : sp)}>
                            <span className={`baa-radio ${isSel ? "baa-radio--checked" : ""}`}>{isSel && <span className="baa-radio-dot" />}</span>
                            {name}
                          </button>
                        );
                      })
                  }
                </div>
              </div>

              <div className="baa-col">
                <div className="baa-col-search">
                  <Search size={14} className="baa-search-icon" />
                  <input className="baa-search-input" placeholder={t("bookAppointment.search_doctor")} value={doctorSearch} onChange={(e) => setDoctorSearch(e.target.value)} />
                </div>
                <div className="baa-col-list">
                  {loadingDoctors ? <div className="baa-loading-spinner" /> :
                    filteredDoctors.length === 0 ? <p className="baa-empty">{t("bookAppointment.no_doctors")}</p> :
                      filteredDoctors.map((doc) => {
                        const isSel = selectedDoctor?._id === doc._id;
                        const name = doctorName(doc);
                        const imgSrc = getLocalImage(doc);
                        return (
                          <button key={doc._id} className={`baa-doctor-item ${isSel ? "baa-doctor-item--selected" : ""}`}
                            onClick={() => {
                              if (selectedDoctor?._id === doc._id) { setSelectedDoctor(null); setSelectedSlot(null); setAvailableDates([]); setTimeSlotsList([]); }
                              else {
                                setSelectedDoctor(doc); setSelectedSlot(null);
                                const ids = (doc.specialtyIds || []).map((s) => typeof s === "object" ? s._id : s);
                                if (ids.length > 0) {
                                  const match = specialties.find((sp) => ids.some((id) => String(id) === String(sp._id)));
                                  if (match) setSelectedSpecialty(match);
                                }
                              }
                            }}>
                            <span className={`baa-radio ${isSel ? "baa-radio--checked" : ""}`}>{isSel && <span className="baa-radio-dot" />}</span>
                            <div className="baa-doctor-avatar">
                              {imgSrc ? <img src={imgSrc} alt={name} className="baa-doctor-img" /> : <div className="baa-doctor-placeholder">{name.charAt(0).toUpperCase()}</div>}
                            </div>
                            <span className="baa-doctor-name">{name}</span>
                          </button>
                        );
                      })
                  }
                </div>
              </div>

              <div className="baa-col baa-col--calendar">
                <div className="baa-cal-nav">
                  <button className="baa-cal-nav-btn" onClick={prevMonth}><ChevronLeft size={16} /></button>
                  <span className="baa-cal-month">{monthLabel}</span>
                  <button className="baa-cal-nav-btn" onClick={nextMonth}><ChevronRight size={16} /></button>
                </div>
                <div className="baa-cal-grid">
                  {(lang === "ru" ? DAYS_RU : DAYS_EN).map((d) => <div key={d} className="baa-cal-day-header">{d}</div>)}
                  {loadingAvailability ? <div className="baa-cal-loading"><div className="baa-loading-spinner" /></div> :
                    calCells.map((day, idx) => {
                      if (!day) return <div key={`e-${idx}`} className="baa-cal-cell baa-cal-cell--empty" />;
                      const ds = toDateStr(day);
                      const past = isPast(day);
                      const isSel = selectedDate === ds;
                      return (
                        <button key={ds} disabled={past || (selectedDoctor && !loadingAvailability && !dayHasData(day) && !past)}
                          className={["baa-cal-cell", past ? "baa-cal-cell--past" : "", selectedDoctor && !loadingAvailability && !dayHasData(day) && !past ? "baa-cal-cell--unavailable" : "", selectedDoctor && dayHasData(day) && !past ? "baa-cal-cell--available" : "", ds === todayStr ? "baa-cal-cell--today" : "", isSel ? "baa-cal-cell--selected" : ""].join(" ")}
                          onClick={() => {
                            setSelectedDate(ds);
                            setSelectedSlot(null);
                            setTimeSlotsList([]);
                            if (selectedDoctor?._id) {
                              setLoadingSlots(true);
                              publicFetch(`/doctor-availability/slots?doctorId=${selectedDoctor._id}&date=${ds}&slotDuration=${SLOT_DURATION}`)
                                .then((data) => setTimeSlotsList(data?.slots || []))
                                .catch(() => toast.error(t("bookAppointment.err_load_availability")))
                                .finally(() => setLoadingSlots(false));
                            }
                          }}>
                          {day}
                        </button>
                      );
                    })
                  }
                </div>
                {!selectedDoctor && !loadingAvailability && <p className="baa-hint baa-hint--center" style={{ marginTop: "12px" }}>{t("bookAppointment.select_doctor_hint")}</p>}
                {selectedDoctor && selectedSpecialty && selectedDate && (
                  <div className="baa-slots-section">
                    <p className="baa-slots-title">{t("bookAppointment.available_slots")}</p>
                    {loadingSlots ? <div className="baa-loading-spinner" /> : timeSlots.length === 0 ? <p className="baa-empty">{t("bookAppointment.no_slots")}</p> : (
                      <div className="baa-slots-grid">
                        {timeSlots.map((slot) => (
                          <button key={slot.startTime} className={`baa-slot-btn ${selectedSlot === slot.startTime ? "baa-slot-btn--selected" : ""}`} onClick={() => setSelectedSlot(slot.startTime)}>{slot.startTime}</button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* <div className="baa-notice">
              <h4 className="baa-notice__title">{t("bookAppointment.notice_title")}</h4>
              <p className="baa-notice__highlight">{t("bookAppointment.notice_arrive")}</p>
              <p className="baa-notice__text">
                {t("bookAppointment.notice_call")}{" "}
                <a href="tel:+74953241111" className="baa-notice__phone">+7 (495) 324-11-11</a>
              </p>
              <p className="baa-notice__text">{t("bookAppointment.notice_thanks")}</p>
            </div> */}
          </div>

            <div className="baw-s1-footer">
              <button className="baw-next-btn" disabled={!step1Complete} onClick={() => setStep(2)}>
                {t("bookAppointment.next")} <ArrowRight size={15} />
              </button>
            </div>
          </>
        )}

        {step === 2 && !confirming && !booked && (
          <div className="baw-v2-body">

            {selectedDoctor && (
              <div className="baw-v2-doc-card">
                <div className="baw-v2-doc-avatar">
                  {getLocalImage(selectedDoctor)
                    ? <img src={getLocalImage(selectedDoctor)} alt={doctorName(selectedDoctor)} className="baw-v2-doc-img" />
                    : <div className="baw-v2-doc-initial">{doctorName(selectedDoctor).charAt(0)}</div>
                  }
                </div>
                <div className="baw-v2-doc-info">
                  <div className="baw-v2-doc-name-row">
                    <span className="baw-v2-doc-name">{doctorName(selectedDoctor)}</span>
                    <span className="baw-v2-verified-pill"><Check size={10} /> {t("bookAppointment.verified_pill")}</span>
                  </div>
                  {selectedSpecialty && (
                    <p className="baw-v2-doc-specialty">
                      {lang === "ru" ? selectedSpecialty.name_ru : selectedSpecialty.name_en}
                    </p>
                  )}
                  {selectedDate && selectedSlot && (
                    <p className="baw-v2-doc-dt">
                      <Calendar size={12} /> {selectedDate} • {selectedSlot}
                    </p>
                  )}
                </div>
              </div>
            )}

            {!otpVerified && (
              <>
                <div className="baw-v2-phone-section">
                  <h3 className="baw-v2-phone-title">{t("bookAppointment.phone_title")}</h3>
                  <p className="baw-v2-phone-sub">{t("bookAppointment.phone_sub")}</p>
                  <div className="baw-v2-phone-input-row">
                    <button type="button" className="baw-v2-flag-btn">+7 <ChevronDown size={13} /></button>
                    <input
                      className="baw-v2-phone-digits"
                      placeholder={t("bookAppointment.phone_placeholder")}
                      value={phoneDigits}
                      onChange={(e) => {
                        setPhoneDigits(e.target.value.replace(/\D/g, "").slice(0, 10));
                        setOtpSent(false); setOtpCode(""); setPatientExists(null);
                      }}
                      disabled={sendingOtp}
                    />
                  </div>
                  {otpSent && (
                    <input
                      className="baw-v2-otp-input"
                      placeholder={t("bookAppointment.otp_placeholder")}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      maxLength={6}
                    />
                  )}
                </div>

                {!otpSent ? (
                  <button className="baw-v2-cta-btn" onClick={handleSendOtp} disabled={sendingOtp || phoneDigits.length < 10}>
                    {sendingOtp ? <span className="baa-btn-spinner" /> : <>{t("bookAppointment.send_otp")} <ArrowRight size={16} /></>}
                  </button>
                ) : (
                  <button className="baw-v2-cta-btn" onClick={handleVerifyOtp} disabled={verifyingOtp || !otpCode || submitting}>
                    {verifyingOtp || submitting ? <span className="baa-btn-spinner" /> : <>{t("bookAppointment.verify_continue")} <ArrowRight size={16} /></>}
                  </button>
                )}

                {otpSent && (
                  <button className="baw-v2-text-btn" type="button" onClick={handleSendOtp} disabled={sendingOtp}>
                    {sendingOtp ? t("bookAppointment.sending") : t("bookAppointment.resend_otp")}
                  </button>
                )}
              </>
            )}

            {otpVerified && patientExists && (
              <div className="baw-booking-status">
                <div className="baw-verified-badge"><Check size={16} /> {t("bookAppointment.phone_verified_status")}</div>
                {submitting && <div className="baa-loading-spinner" style={{ margin: "16px auto 0" }} />}
              </div>
            )}

          </div>
        )}

        {confirming && !booked && (
          <div className="baw-v2-body">

            {selectedDoctor && (
              <div className="baw-v2-doc-card">
                <div className="baw-v2-doc-avatar">
                  {getLocalImage(selectedDoctor)
                    ? <img src={getLocalImage(selectedDoctor)} alt={doctorName(selectedDoctor)} className="baw-v2-doc-img" />
                    : <div className="baw-v2-doc-initial">{doctorName(selectedDoctor).charAt(0)}</div>
                  }
                </div>
                <div className="baw-v2-doc-info">
                  <div className="baw-v2-doc-name-row">
                    <span className="baw-v2-doc-name">{doctorName(selectedDoctor)}</span>
                    <span className="baw-v2-verified-pill"><Check size={10} /> {t("bookAppointment.verified_pill")}</span>
                  </div>
                  {selectedSpecialty && <p className="baw-v2-doc-specialty">{lang === "ru" ? selectedSpecialty.name_ru : selectedSpecialty.name_en}</p>}
                  {selectedDate && selectedSlot && (
                    <p className="baw-v2-doc-dt"><Calendar size={12} /> {selectedDate} • {selectedSlot}</p>
                  )}
                </div>
              </div>
            )}

            <div className="baw-confirm-summary">
              <p className="baw-confirm-summary-title">{t("bookAppointment.summary_title")}</p>
              <div className="baw-confirm-summary-row">
                <span className="baw-confirm-summary-key">{t("bookAppointment.summary_date")}</span>
                <span className="baw-confirm-summary-val">{selectedDate}</span>
              </div>
              <div className="baw-confirm-summary-row">
                <span className="baw-confirm-summary-key">{t("bookAppointment.summary_time")}</span>
                <span className="baw-confirm-summary-val">{selectedSlot}</span>
              </div>
              <div className="baw-confirm-summary-row">
                <span className="baw-confirm-summary-key">{t("bookAppointment.summary_phone")}</span>
                <span className="baw-confirm-summary-val">{fullPhone}</span>
              </div>
            </div>

            <button className="baw-v2-cta-btn" disabled={submitting} onClick={handleBookExisting}>
              {submitting ? <span className="baa-btn-spinner" /> : <><Check size={16} /> {t("bookAppointment.confirm_book")}</>}
            </button>

          </div>
        )}

        {step === 3 && !booked && (
          <div className="baw-v2-body">

            {selectedDoctor && (
              <div className="baw-v2-doc-card">
                <div className="baw-v2-doc-avatar">
                  {getLocalImage(selectedDoctor)
                    ? <img src={getLocalImage(selectedDoctor)} alt={doctorName(selectedDoctor)} className="baw-v2-doc-img" />
                    : <div className="baw-v2-doc-initial">{doctorName(selectedDoctor).charAt(0)}</div>
                  }
                </div>
                <div className="baw-v2-doc-info">
                  <div className="baw-v2-doc-name-row">
                    <span className="baw-v2-doc-name">{doctorName(selectedDoctor)}</span>
                    <span className="baw-v2-verified-pill"><Check size={10} /> {t("bookAppointment.verified_pill")}</span>
                  </div>
                  {selectedSpecialty && (
                    <p className="baw-v2-doc-specialty">
                      {lang === "ru" ? selectedSpecialty.name_ru : selectedSpecialty.name_en}
                    </p>
                  )}
                  {selectedDate && selectedSlot && (
                    <p className="baw-v2-doc-dt">
                      <Calendar size={12} /> {selectedDate} • {selectedSlot}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="baw-v2-phone-section">
              <h3 className="baw-v2-phone-title">{t("bookAppointment.profile_title")}</h3>
              <p className="baw-v2-phone-sub">{t("bookAppointment.profile_sub")}</p>
            </div>

            <div className="baw-v2-reg-form">
              <div className="baw-v2-reg-row">
                <div className="baw-v2-reg-field">
                  <label className="baw-v2-reg-label">{t("bookAppointment.label_last_name")} <span className="baw-v2-req">*</span></label>
                  <input className="baw-v2-reg-input" placeholder={t("bookAppointment.placeholder_last")} value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
                <div className="baw-v2-reg-field">
                  <label className="baw-v2-reg-label">{t("bookAppointment.label_first_name")} <span className="baw-v2-req">*</span></label>
                  <input className="baw-v2-reg-input" placeholder={t("bookAppointment.placeholder_first")} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
              </div>
              <div className="baw-v2-reg-row">
                <div className="baw-v2-reg-field">
                  <label className="baw-v2-reg-label">{t("bookAppointment.label_middle_name")}</label>
                  <input className="baw-v2-reg-input" placeholder={t("bookAppointment.placeholder_middle")} value={middleName} onChange={(e) => setMiddleName(e.target.value)} />
                </div>
                <div className="baw-v2-reg-field">
                  <label className="baw-v2-reg-label">{t("bookAppointment.label_dob")} <span className="baw-v2-req">*</span></label>
                  <input className="baw-v2-reg-input baw-v2-reg-input--date" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
                </div>
              </div>
            </div>

            <button
              className="baw-v2-cta-btn"
              disabled={submitting || !firstName.trim() || !lastName.trim() || !dateOfBirth}
              onClick={handleCreateAndBook}
            >
              {submitting ? <span className="baa-btn-spinner" /> : <><Check size={16} /> {t("bookAppointment.book_appointment")}</>}
            </button>
          </div>
        )}

        {booked && (
          <div className="baw-success">
            <div className="baw-success-icon"><Check size={32} /></div>
            <h2 className="baw-success-title">{t("bookAppointment.success_title")}</h2>
            <p className="baw-success-sub">
              {t("bookAppointment.success_sub", { doctor: selectedDoctor ? doctorName(selectedDoctor) : "" })}
            </p>
            {(selectedDate || selectedSlot) && (
              <p className="baw-success-sub">
                {selectedDate && <>{t("bookAppointment.success_for")} <strong>{selectedDate}</strong></>}
                {selectedSlot && <> {t("bookAppointment.success_at")} <strong>{selectedSlot}</strong></>}.
              </p>
            )}
            {selectedSpecialty && (
              <p className="baw-success-specialty">{lang === "ru" ? selectedSpecialty.name_ru : selectedSpecialty.name_en}</p>
            )}
            {appointmentId && (
              <p className="baw-success-sub" style={{ fontSize: "13px", color: "#6b7280" }}>
                {lang === "ru" ? "Номер заявки" : "Application ID"}: <strong>{appointmentId}</strong>
              </p>
            )}
            <button className="baw-v2-cta-btn baw-success-close-btn" onClick={handleClose}>{t("bookAppointment.close")}</button>
          </div>
        )}

      </div>
    </div>,
    document.body
  );
}
