// BookAppointment.jsx
import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import axios from 'axios';
import { getUserApplications } from '../utils/api';
import { 
  Search, ChevronLeft, ChevronRight, Check, ArrowRight, ArrowLeft,
  Clock, Star, User, Calendar, CreditCard, X,
  HeartPulse, Stethoscope, Brain, Sparkles, ShieldCheck, Thermometer
} from 'lucide-react';
import '../styles/BookAppointment.css';

// ====================== API CONFIGURATION ======================
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

const SLOT_DURATION = 30;
const DAYS_EN = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const DAYS_RU = ["ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ", "ВС"];

const getMskNow = () => {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 3 * 3600000);
};

const getFieldValue = (field, lang = "en") => {
  if (!field) return "";
  if (typeof field === "string") return field;
  if (typeof field === "object") return field[lang] || field["en"] || "";
  return "";
};

const getDoctorId = (doc) => {
  if (!doc) return "";
  return String(
    doc._id || doc.id || doc.doctorId || doc.doctorProfile?._id || doc.doctorProfile || "",
  );
};

const getSpecialtyIcon = (name) => {
  if (!name) return User;
  const text = name.toLowerCase();
  if (text.includes("cardio") || text.includes("сердц") || text.includes("кардио")) return HeartPulse;
  if (text.includes("dermat") || text.includes("кожа") || text.includes("дермат")) return Sparkles;
  if (text.includes("psychiat") || text.includes("психиатр") || text.includes("психотерап")) return Brain;
  if (text.includes("neuro") || text.includes("невр") || text.includes("мозг")) return Brain;
  if (text.includes("therap") || text.includes("терап") || text.includes("therapy")) return Stethoscope;
  if (text.includes("narc") || text.includes("нарко") || text.includes("наркот")) return ShieldCheck;
  if (text.includes("pediatr") || text.includes("педи")) return HeartPulse;
  if (text.includes("dent") || text.includes("стомат")) return Stethoscope;
  return User;
};

// ====================== MAIN COMPONENT ======================
export default function BookAppointment({ onSuccess, onClose, preselectedDoctorId, preselectedPromo, autoSelectDateTime }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const lang = i18n.language?.slice(0, 2) || "en";
  const requestedDoctorId =
    preselectedDoctorId ||
    location.state?.preselectedDoctorId ||
    new URLSearchParams(location.search).get("doctorId");
  const shouldAutoSelect =
    autoSelectDateTime ||
    location.state?.autoSelectDateTime ||
    new URLSearchParams(location.search).get("autoSelectDateTime") === "true";
  const { token, patient } = useContext(AuthContext);

  // ====================== STATE ======================
  const [specialties, setSpecialties] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);
  const [timeSlotsList, setTimeSlotsList] = useState([]);

  const [selectedSpecialty, setSelectedSpecialty] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showAppointments, setShowAppointments] = useState(Boolean(location.state?.showAppointments));
  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [appointmentsError, setAppointmentsError] = useState("");

  const [calMonth, setCalMonth] = useState(getMskNow().getMonth() + 1);
  const [calYear, setCalYear] = useState(getMskNow().getFullYear());

  const [specialtySearch, setSpecialtySearch] = useState("");
  const [specialtyDropdownOpen, setSpecialtyDropdownOpen] = useState(false);
  const specialtyDropdownRef = useRef(null);
  const [doctorSearch, setDoctorSearch] = useState("");
  const [doctorDropdownOpen, setDoctorDropdownOpen] = useState(false);
  const doctorDropdownRef = useRef(null);
  const [promoFilter, setPromoFilter] = useState(preselectedPromo || false);
  const [activePromo, setActivePromo] = useState("book");
  const [isExiting, setIsExiting] = useState(false);

  // Guest user form
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [phoneDigits, setPhoneDigits] = useState("");

  // Loading states
  const [loadingSpecialties, setLoadingSpecialties] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [booked, setBooked] = useState(false);
  const [appointmentId, setAppointmentId] = useState(null);

  const PROMO_SPECIALTIES = ["psychiatrist", "psychotherapist", "narcologist", "психиатр", "психотерапевт", "нарколог"];

  // ====================== EFFECTS ======================
  const closeDropdowns = (event) => {
    if (specialtyDropdownRef.current && !specialtyDropdownRef.current.contains(event.target)) {
      setSpecialtyDropdownOpen(false);
    }
    if (doctorDropdownRef.current && !doctorDropdownRef.current.contains(event.target)) {
      setDoctorDropdownOpen(false);
    }
  };

  useEffect(() => {
    if (!specialtyDropdownOpen && !doctorDropdownOpen) return;
    document.addEventListener("mousedown", closeDropdowns);
    return () => document.removeEventListener("mousedown", closeDropdowns);
  }, [specialtyDropdownOpen, doctorDropdownOpen]);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsExiting(true);
      setTimeout(() => {
        setActivePromo((prev) => (prev === "book" ? "early" : "book"));
        setIsExiting(false);
      }, 380);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Pre-fill user data if logged in
  useEffect(() => {
    if (patient) {
      setFirstName(patient.firstName || "");
      setLastName(patient.lastName || "");
      setMiddleName(patient.middleName || "");
      setDateOfBirth(patient.dateOfBirth?.split("T")[0] || "");
      setPhoneDigits(patient.phoneNumber?.replace(/\D/g, "").slice(-10) || "");
    }
  }, [patient]);

  // Load specialties and doctors (using same endpoints as Doctors page)
  useEffect(() => {
    setLoadingSpecialties(true);
    setLoadingDoctors(true);
    axios.get(`${import.meta.env.VITE_BASE_URL}/api/doctors`)
      .then((response) => {
        console.log("[DEBUG] Doctors response:", response.data);
        const doctorsArray = response.data?.doctors || response.data || [];
        console.log("[DEBUG] Parsed doctors array:", doctorsArray);
        console.log("[DEBUG] Doctors count:", doctorsArray.length);
        setDoctors(doctorsArray);

        const specialtyMap = new Map();
        doctorsArray.forEach((doc) => {
          (doc.specialtyIds || []).forEach((spec) => {
            if (!spec?._id) return;
            specialtyMap.set(String(spec._id), {
              _id: spec._id,
              name_en: spec.name_en || spec.en || "",
              name_ru: spec.name_ru || spec.ru || "",
            });
          });
        });

        const specialtiesArray = Array.from(specialtyMap.values()).sort((a, b) => {
          const aName = (lang === "ru" ? a.name_ru : a.name_en) || a.name_en || a.name_ru || "";
          const bName = (lang === "ru" ? b.name_ru : b.name_en) || b.name_en || b.name_ru || "";
          return aName.localeCompare(bName);
        });

        setSpecialties(specialtiesArray);
      })
      .catch((err) => {
        console.error("[DEBUG] Doctors fetch error:", err);
        toast.error(t("bookAppointment.err_load_doctors"));
        toast.error(t("bookAppointment.err_load_specialties"));
      })
      .finally(() => {
        setLoadingDoctors(false);
        setLoadingSpecialties(false);
      });
  }, [t, lang]);

  // Preselect doctor if provided
  useEffect(() => {
    if (!requestedDoctorId) return;
    // Wait until doctors fetch has completed
    if (loadingDoctors) return;

    const requestedId = String(requestedDoctorId);
    let match = doctors.find((d) => getDoctorId(d) === requestedId);

    // Fallback: use the doctor object passed via navigation state
    if (!match) {
      const passedDoctor = location.state?.preselectedDoctor;
      if (
        passedDoctor &&
        String(passedDoctor._id || passedDoctor.id) === requestedId
      ) {
        match = passedDoctor;
        // Inject into doctors list so it appears in the dropdown
        setDoctors((prev) => {
          if (prev.some((d) => getDoctorId(d) === requestedId)) return prev;
          return [passedDoctor, ...prev];
        });
      }
    }

    if (!match) return;

    setSelectedDoctor(match);
    setDoctorSearch(doctorName(match));

    // Auto-select the doctor's specialty
    const doctorSpecialtyIds = (match.specialtyIds || []).map((s) =>
      typeof s === "object" ? String(s._id) : String(s),
    );

    // Try matching from loaded specialties first
    let matchedSpecialty = specialties.find((sp) =>
      doctorSpecialtyIds.includes(String(sp._id)),
    );

    // If no specialties loaded from API, create from embedded doctor data
    if (!matchedSpecialty && match.specialtyIds?.length) {
      const embeddedSpec = match.specialtyIds.find(
        (s) => typeof s === "object" && s._id,
      );
      if (embeddedSpec) {
        matchedSpecialty = {
          _id: embeddedSpec._id,
          name_en: embeddedSpec.name_en || embeddedSpec.en || "",
          name_ru: embeddedSpec.name_ru || embeddedSpec.ru || "",
        };
        // Inject into specialties list so it appears in dropdown
        setSpecialties((prev) => {
          if (prev.some((sp) => String(sp._id) === String(embeddedSpec._id)))
            return prev;
          return [matchedSpecialty, ...prev];
        });
      }
    }

    if (matchedSpecialty) {
      setSelectedSpecialty(matchedSpecialty);
      setSpecialtySearch(
        lang === "ru" ? matchedSpecialty.name_ru : matchedSpecialty.name_en,
      );
    }
  }, [requestedDoctorId, doctors, specialties, lang, loadingDoctors]);

  // Clear doctor if specialty changes
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
  }, [selectedSpecialty, selectedDoctor]);

  // Load available dates when doctor or month changes
  useEffect(() => {
    const selectedDoctorId = getDoctorId(selectedDoctor);
    if (!selectedDoctorId) return;
    setLoadingAvailability(true);
    setAvailableDates([]);
    setTimeSlotsList([]);
    setSelectedDate(null);
    setSelectedSlot(null);
    axios.get(`${import.meta.env.VITE_BASE_URL}/api/doctor-availability?doctorId=${selectedDoctorId}&month=${calMonth}&year=${calYear}`)
      .then((response) => setAvailableDates(response.data?.availableDates || []))
      .catch(() => {
        console.warn("[DEBUG] Doctor availability endpoint not available. Users can still select any future date; slots will be validated on booking.");
        setAvailableDates([]);
      })
      .finally(() => setLoadingAvailability(false));
  }, [selectedDoctor, calMonth, calYear]);

  // Auto-select first available date when doctor is selected and availability data is loaded
  useEffect(() => {
    if (!shouldAutoSelect || !selectedDoctor || selectedDate) return;
    
    const today = getMskNow();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    
    // Try to select today if available, otherwise select first available future date
    if (availableDates.length > 0) {
      // Check if today is available
      if (availableDates.includes(todayStr)) {
        handleDateSelect(todayStr);
      } else {
        // Find first available date after today
        const futureDate = availableDates.find(date => date >= todayStr);
        if (futureDate) {
          handleDateSelect(futureDate);
        }
      }
    } else if (availableDates.length === 0 && !loadingAvailability) {
      // If no specific available dates from API, select today as fallback
      handleDateSelect(todayStr);
    }
  }, [shouldAutoSelect, selectedDoctor, availableDates, loadingAvailability, selectedDate]);

  // Auto-select first available time slot when date is selected and slots are loaded
  useEffect(() => {
    if (!shouldAutoSelect || !selectedDate || selectedSlot || loadingSlots) return;
    
    if (timeSlotsList.length > 0) {
      const firstSlot = normalizeSlotTime(timeSlotsList[0]);
      if (firstSlot) {
        setSelectedSlot(firstSlot);
      }
    }
  }, [shouldAutoSelect, selectedDate, timeSlotsList, selectedSlot, loadingSlots]);

  useEffect(() => {
    if (!showAppointments) return;
    if (!token || !patient?.patientId) {
      setAppointments([]);
      setAppointmentsError(t("bookAppointment.err_login_to_view_appointments", "Please log in to view appointments."));
      return;
    }

    const fetchAppointments = async () => {
      setLoadingAppointments(true);
      setAppointmentsError("");
      try {
        const response = await getUserApplications(patient?.patientId);
        const apps = Array.isArray(response?.data) ? response.data : [];
        setAppointments(apps);
      } catch (error) {
        setAppointments([]);
        setAppointmentsError(t("bookAppointment.err_load_appointments", "Unable to load appointments."));
      } finally {
        setLoadingAppointments(false);
      }
    };

    fetchAppointments();
  }, [showAppointments, token, patient?.patientId, t]);

  useEffect(() => {
    if (location.state?.showAppointments) {
      setShowAppointments(true);
    }
  }, [location.state]);

  // ====================== HELPER FUNCTIONS ======================
  const doctorName = (doc) => {
    const localizedFullName =
      getFieldValue(doc.fullName, lang) || getFieldValue(doc.fullName, "en");
    if (localizedFullName) return localizedFullName;

    return [
      getFieldValue(doc.firstName, lang),
      getFieldValue(doc.middleName, lang),
      getFieldValue(doc.lastName, lang),
    ]
      .filter(Boolean)
      .join(" ");
  };

  const fullPhone = `+7${phoneDigits}`;

  const toDateStr = (day) => `${calYear}-${String(calMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const today = getMskNow();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const isPast = (day) => toDateStr(day) < todayStr;
  const dayHasData = (day) => availableDates.includes(toDateStr(day));

  const daysInMonth = new Date(calYear, calMonth, 0).getDate();
  const startOffset = ((new Date(calYear, calMonth - 1, 1).getDay()) + 6) % 7;
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const monthNamesRu = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
  const monthLabel = lang === "ru" ? `${monthNamesRu[calMonth - 1]} ${calYear}` : `${monthNames[calMonth - 1]} ${calYear}`;

  // Filter specialties
  const filteredSpecialties = specialties.filter((s) => {
    const name = lang === "ru" ? s.name_ru : s.name_en;
    if (!name?.toLowerCase().includes(specialtySearch.toLowerCase())) return false;
    if (promoFilter) {
      return PROMO_SPECIALTIES.some((p) => name?.toLowerCase().includes(p));
    }
    const hasDoctors = doctors.some((d) => {
      const ids = (d.specialtyIds || []).map((sp) => typeof sp === "object" ? String(sp._id) : String(sp));
      return ids.includes(String(s._id));
    });
    return hasDoctors;
  });

  // Filter doctors
  const filteredDoctors = doctors.filter((d) => {
    if (!doctorName(d).toLowerCase().includes(doctorSearch.toLowerCase())) return false;
    const docSpecIds = (d.specialtyIds || []).map((s) => typeof s === "object" ? String(s._id) : String(s));
    if (selectedSpecialty) {
      return docSpecIds.some((id) => String(id) === String(selectedSpecialty._id));
    }
    if (promoFilter) {
      const promoSpIds = specialties
        .filter((s) => {
          const name = lang === "ru" ? s.name_ru : s.name_en;
          return PROMO_SPECIALTIES.some((p) => name?.toLowerCase().includes(p));
        })
        .map((s) => String(s._id));
      return docSpecIds.some((id) => promoSpIds.includes(id));
    }
    return true;
  });

  const step1Complete = selectedSpecialty && selectedDoctor && selectedDate && selectedSlot;
  const selectedFee = "$120.00";
  const primarySpecialty = selectedSpecialty;

  const normalizeSlotTime = (slot) => {
    if (!slot) return "";
    if (typeof slot === "string") return slot;
    if (typeof slot === "object") {
      return slot.startTime || slot.time || slot.slot || "";
    }
    return "";
  };

  const formatDateDisplay = (dateString) => {
    if (!dateString) return "";
    const [year, month, day] = dateString.split("-");
    if (!year || !month || !day) return dateString;
    return `${day}-${month}-${year}`;
  };

  const formatApiDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const getStatusBadgeClasses = (status) => {
    const normalized = String(status || "").toLowerCase();
    if (normalized.includes("cancel")) return "bg-red-100 text-red-700";
    if (normalized.includes("pending") || normalized.includes("awaiting")) return "bg-amber-100 text-amber-800";
    if (normalized.includes("confirmed") || normalized.includes("paid") || normalized.includes("completed")) return "bg-emerald-100 text-emerald-800";
    return "bg-slate-100 text-slate-700";
  };

  const translateAppointmentStatus = (status) => {
    if (!status) return t("bookAppointment.status_unknown");
    const key = `bookAppointment.status_${String(status).toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "")}`;
    const translation = t(key);
    return translation !== key ? translation : status;
  };

  const translateServiceName = (serviceName) => {
    if (!serviceName) return t("bookAppointment.no_service_name");
    const key = `bookAppointment.service_${String(serviceName).toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "")}`;
    const translation = t(key);
    return translation !== key ? translation : serviceName;
  };

  const parseSlotHour = (slotTime) => {
    if (!slotTime) return NaN;
    const match = String(slotTime).match(/(\d{1,2})\s*:\s*\d{2}\s*(am|pm)?/i);
    if (!match) return NaN;
    let hour = Number(match[1]);
    const meridiem = match[2]?.toLowerCase();
    if (meridiem === "pm" && hour < 12) hour += 12;
    if (meridiem === "am" && hour === 12) hour = 0;
    return hour;
  };

  const normalizedSlots = timeSlotsList
    .map((slot) => normalizeSlotTime(slot))
    .filter(Boolean);

  const morningSlots = normalizedSlots.filter((slotTime) => {
    const hour = parseSlotHour(slotTime);
    return !Number.isNaN(hour) && hour < 12;
  });

  const eveningSlots = normalizedSlots.filter((slotTime) => {
    const hour = parseSlotHour(slotTime);
    return !Number.isNaN(hour) && hour >= 12;
  });

  // ====================== BOOKING HANDLERS ======================
  const handleBookExisting = async () => {
    const selectedDoctorId = getDoctorId(selectedDoctor);
    if (!selectedDoctorId || !primarySpecialty?._id || !selectedDate || !selectedSlot) {
      toast.error(t("bookAppointment.err_missing_info"));
      return;
    }
    setSubmitting(true);
    try {
      const res = await publicFetch("/new-appointments/website", {
        method: "POST",
        body: JSON.stringify({
          doctorProfile: selectedDoctorId,
          speciality: primarySpecialty._id,
          date: new Date(selectedDate).toISOString(),
          startTime: selectedSlot,
          guestPhone: fullPhone,
          patient: patient?._id,
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
    const selectedDoctorId = getDoctorId(selectedDoctor);
    if (!firstName.trim()) { toast.error(t("bookAppointment.err_first_name")); return; }
    if (!lastName.trim()) { toast.error(t("bookAppointment.err_last_name")); return; }
    if (!dateOfBirth) { toast.error(t("bookAppointment.err_dob")); return; }
    if (phoneDigits.length < 10) { toast.error(t("bookAppointment.err_phone")); return; }
    if (!selectedDoctorId || !primarySpecialty?._id || !selectedDate || !selectedSlot) {
      toast.error(t("bookAppointment.err_missing_info"));
      return;
    }
    
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
          doctorProfile: selectedDoctorId,
          speciality: primarySpecialty._id,
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

  const handleDateSelect = (dateStr) => {
    const selectedDoctorId = getDoctorId(selectedDoctor);
    setSelectedDate(dateStr);
    setSelectedSlot(null);
    setTimeSlotsList([]);
    if (selectedDoctorId) {
      setLoadingSlots(true);
      axios.get(`${import.meta.env.VITE_BASE_URL}/api/doctor-availability/slots?doctorId=${selectedDoctorId}&date=${dateStr}&slotDuration=${SLOT_DURATION}`)
        .then((response) => {
          const slots = response.data?.slots || [];
          setTimeSlotsList(slots);
        })
        .catch(() => {
          console.warn("[DEBUG] Slots endpoint not available. Allowing manual entry.");
          setTimeSlotsList([]);
        })
        .finally(() => setLoadingSlots(false));
    }
  };

  const handleClose = () => {
    if (typeof onClose === "function") {
      onClose();
    } else {
      navigate("/dashboard");
    }
  };

  // Calendar cells
  const calCells = [];
  for (let i = 0; i < startOffset; i++) calCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calCells.push(d);

  if (booked) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 py-8 mt-5">
        
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-lg mx-auto ">
          
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check size={32} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-[#0a2e5d] mb-2">{t("bookAppointment.success_title")}</h2>
          <p className="text-gray-600 mb-4">
            {t("bookAppointment.success_sub", { doctor: selectedDoctor ? doctorName(selectedDoctor) : "" })}
          </p>
          {selectedDate && selectedSlot && (
            <p className="text-gray-600 mb-2">
              {formatDateDisplay(selectedDate)} at <strong>{selectedSlot}</strong>
            </p>
          )}
          {primarySpecialty && (
            <p className="text-sm text-gray-500 mb-4">
              {lang === "ru" ? primarySpecialty.name_ru : primarySpecialty.name_en}
            </p>
          )}
          {appointmentId && (
            <p className="text-xs text-gray-400 mb-6">
              Application ID: <strong>{appointmentId}</strong>
            </p>
          )}
          <button
            onClick={handleClose}
            className="px-6 py-3 bg-[#0a2e5d] text-white rounded-xl font-semibold hover:bg-[#0e3a72] transition cursor-pointer"
          >
            {t("bookAppointment.close")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-6">
      {/* Header with back button */}
      <div className="flex items-center justify-between gap-4 mb-6 mt-8">
        <div className="flex items-center gap-4">
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full transition cursor-pointer">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-[#0a2e5d]">{lang === "ru" ? "Запись на прием" : "Book Appointment"}</h1>
        </div>
        <button
          onClick={() => setShowAppointments((prev) => !prev)}
          className="px-4 py-2 rounded-xl bg-[#0a2e5d] text-white font-semibold hover:bg-[#0e3a72] transition cursor-pointer"
        >
          {showAppointments ? (lang === "ru" ? "Назад к записи" : "Back to Booking") : (lang === "ru" ? "Мои записи" : "My Appointments")}
        </button>
      </div>

      <div className="w-full mb-6">
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
      </div>

      {/* Main content */}
      {showAppointments ? (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 className="text-xl font-bold text-[#0a2e5d]">{lang === "ru" ? "Мои записи" : "My Appointments"}</h2>
              {/* <button
                onClick={() => setShowAppointments(false)}
                className="px-4 py-2 rounded-xl bg-[#0a2e5d] text-white font-semibold hover:bg-[#0e3a72] transition"
              >
                {lang === "ru" ? "К бронированию" : "Back to Booking"}
              </button> */}
            </div>
            {loadingAppointments ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#0a2e5d] border-t-transparent"></div>
              </div>
            ) : appointmentsError ? (
              <p className="text-center text-gray-500 py-8">{appointmentsError}</p>
            ) : appointments.length === 0 ? (
              <p className="text-center text-gray-500 py-8">{t("bookAppointment.no_appointments")}</p>
            ) : (
              <div className="space-y-4">
                {appointments.map((appt) => (
                  <button
                    key={appt._id || appt.applicationId}
                    type="button"
                    onClick={() => navigate(`/appointments/${encodeURIComponent(appt.applicationId || appt._id)}`)}
                    className="w-full rounded-2xl border border-gray-200 p-4 text-left bg-white transition hover:shadow-lg cursor-pointer"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-500">{t("bookAppointment.application_id")}</p>
                        <p className="font-semibold text-gray-900">{appt.applicationId || t("bookAppointment.no_id")}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">{t("bookAppointment.status")}</p>
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClasses(appt.appointmentStatus)}`}>
                          {translateAppointmentStatus(appt.appointmentStatus)}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-400">{t("bookAppointment.service")}</p>
                        <p className="text-sm text-gray-700">{translateServiceName(appt.serviceType || appt.serviceName)}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-400">{t("bookAppointment.date")}</p>
                        <p className="text-sm text-gray-700">{formatApiDate(appt.date || appt.createdAt)}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-400">{t("bookAppointment.time")}</p>
                        <p className="text-sm text-gray-700">{appt.startTime ? appt.startTime : t("bookAppointment.not_set")}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Side - 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-xl font-bold text-[#0a2e5d]">
                {lang === "ru" ? "Выберите медицинскую специальность" : "Select Medical Specialty"}
              </h2>
              {/* <div className="relative w-full max-w-[280px]">
                <Search size="16" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={t("bookAppointment.search_specialty")}
                  value={specialtySearch}
                  onChange={(e) => setSpecialtySearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#0a2e5d]"
                />
              </div> */}
            </div>

            <div ref={specialtyDropdownRef} className="relative">
              <div className="relative">
                <Search size="16" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={t("bookAppointment.search_specialty")}
                  value={specialtySearch}
                  onChange={(e) => {
                    setSpecialtySearch(e.target.value);
                    setSpecialtyDropdownOpen(true);
                  }}
                  onFocus={() => setSpecialtyDropdownOpen(true)}
                  className="w-full pl-9 pr-10 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#0a2e5d]"
                />
                {selectedSpecialty && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSpecialty(null);
                      setSpecialtySearch("");
                      setSpecialtyDropdownOpen(true);
                      setSelectedDoctor(null);
                      setSelectedDate(null);
                      setSelectedSlot(null);
                      setAvailableDates([]);
                      setTimeSlotsList([]);
                    }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center h-8 w-8 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer"
                    aria-label={t("bookAppointment.clear_specialty")}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              {specialtyDropdownOpen && (
                <div className="absolute left-0 right-0 z-20 mt-2 max-h-72 overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-xl">
                  {loadingSpecialties ? (
                    <div className="flex justify-center py-6"><div className="animate-spin rounded-full h-6 w-6 border-2 border-[#0a2e5d] border-t-transparent"></div></div>
                  ) : filteredSpecialties.length === 0 ? (
                    <p className="px-4 py-4 text-center text-gray-500 text-sm">{t("bookAppointment.no_results")}</p>
                  ) : (
                    <div className="grid grid-cols-1 gap-2 p-3">
                      {filteredSpecialties.map((sp) => {
                        const name = lang === "ru" ? sp.name_ru : sp.name_en;
                        return (
                          <button
                            key={sp._id}
                            onClick={() => {
                              setSelectedSpecialty(sp);
                              setSpecialtySearch(name);
                              setSpecialtyDropdownOpen(false);
                              setSelectedDoctor(null);
                              setSelectedDate(null);
                              setSelectedSlot(null);
                              setAvailableDates([]);
                              setTimeSlotsList([]);
                            }}
                              className="w-full text-left rounded-xl px-3 py-3 transition hover:bg-gray-50 cursor-pointer"
                          >
                            <div className="text-sm font-semibold text-gray-800">{name}</div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
            {selectedSpecialty && (
              <div className="mt-4 w-full rounded-2xl border border-gray-200 bg-white p-4 shadow-sm flex items-center gap-4">
                <span className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0a2e5d] to-[#1a4a7a] flex items-center justify-center text-white">
                  {(() => {
                    const name = lang === "ru" ? selectedSpecialty.name_ru : selectedSpecialty.name_en;
                    const Icon = getSpecialtyIcon(name);
                    return <Icon size={18} />;
                  })()}
                </span>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-gray-900">{lang === "ru" ? selectedSpecialty.name_ru : selectedSpecialty.name_en}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedSpecialty(null);
                    setSpecialtySearch("");
                    setSelectedDoctor(null);
                    setSelectedDate(null);
                    setSelectedSlot(null);
                    setAvailableDates([]);
                    setTimeSlotsList([]);
                  }}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 cursor-pointer"
                >
                  <X size={16} color='red'/>
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-[#0a2e5d]">
                {lang === "ru" ? "Выберите вашего консультанта" : "Choose Your Consultant"}
              </h2>
              <div ref={doctorDropdownRef} className="relative w-full max-w-[280px]">
                <Search size="16" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={t("bookAppointment.search_doctor")}
                  value={doctorSearch}
                  onChange={(e) => {
                    setDoctorSearch(e.target.value);
                    setDoctorDropdownOpen(true);
                  }}
                  onFocus={() => setDoctorDropdownOpen(true)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#0a2e5d]"
                />
                {doctorDropdownOpen && (
                  <div className="absolute left-0 right-0 z-20 mt-2 max-h-72 overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-xl">
                    {loadingDoctors ? (
                      <div className="flex justify-center py-6"><div className="animate-spin rounded-full h-6 w-6 border-2 border-[#0a2e5d] border-t-transparent"></div></div>
                    ) : filteredDoctors.length === 0 ? (
                      <p className="px-4 py-4 text-center text-gray-500 text-sm">{t("bookAppointment.no_doctors")}</p>
                    ) : (
                      <div className="grid grid-cols-1 gap-2 p-3">
                        {filteredDoctors.map((doc) => {
                          const name = doctorName(doc);
                          return (
                            <button
                              key={getDoctorId(doc) || name}
                              onClick={() => {
                                setSelectedDoctor(doc);
                                setDoctorDropdownOpen(false);
                                setDoctorSearch(name);
                                setSelectedSlot(null);
                                setSelectedDate(null);
                                setAvailableDates([]);
                                setTimeSlotsList([]);
                              }}
                              className="w-full text-left rounded-xl px-3 py-3 transition hover:bg-gray-50 cursor-pointer"
                            >
                              <div className="text-sm font-semibold text-gray-800">{name}</div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="max-h-[420px] overflow-y-auto p-3">
              {loadingDoctors ? (
                <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-2 border-[#0a2e5d] border-t-transparent"></div></div>
              ) : filteredDoctors.length === 0 ? (
                <p className="text-center text-gray-400 py-8 text-sm">{t("bookAppointment.no_doctors")}</p>
              ) : (
                filteredDoctors.map((doc) => {
                  const isSel = getDoctorId(selectedDoctor) === getDoctorId(doc);
                  const name = doctorName(doc);
                  const docSpecIds = (doc.specialtyIds || []).map((s) => typeof s === "object" ? String(s._id) : String(s));
                  const specialtyName = selectedSpecialty && docSpecIds.includes(String(selectedSpecialty._id))
                    ? (lang === "ru" ? selectedSpecialty.name_ru : selectedSpecialty.name_en)
                    : (() => {
                        const found = specialties.find((sp) => docSpecIds.includes(String(sp._id)));
                        return found ? (lang === "ru" ? found.name_ru : found.name_en) : "";
                      })();
                  return (
                    <button
                      key={getDoctorId(doc) || name}
                      onClick={() => {
                        if (getDoctorId(selectedDoctor) === getDoctorId(doc)) {
                          setSelectedDoctor(null);
                          setSelectedSlot(null);
                          setSelectedDate(null);
                          setAvailableDates([]);
                          setTimeSlotsList([]);
                        } else {
                          setSelectedDoctor(doc);
                          setSelectedSlot(null);
                          const ids = (doc.specialtyIds || []).map((s) => typeof s === "object" ? s._id : s);
                          if (ids.length > 0) {
                            const match = specialties.find((sp) => ids.some((id) => String(id) === String(sp._id)));
                            if (match) setSelectedSpecialty(match);
                          }
                        }
                      }}
                      className={`w-full flex items-center gap-3 p-4 rounded-xl text-left transition-all mb-2 border ${isSel ? "bg-blue-50 border-blue-200" : "hover:bg-gray-50 border-gray-200"} cursor-pointer`}
                    >
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#0a2e5d] to-[#1a4a7a] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 text-base truncate">{name}</p>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{specialtyName || (lang === "ru" ? "Врач" : "Doctor")}</p>
                        
                      </div>
                      
                    </button>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* Right Side - 1/3 */}
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sticky top-4">
          {/* Calendar Navigation */}
          <div className="flex items-center justify-between mb-5">
            <button onClick={() => { if (calMonth === 1) { setCalMonth(12); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); }} className="p-2 hover:bg-gray-100 rounded-full transition cursor-pointer">
              <ChevronLeft size="18" />
            </button>
            <span className="font-semibold text-gray-800">{monthLabel}</span>
            <button onClick={() => { if (calMonth === 12) { setCalMonth(1); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); }} className="p-2 hover:bg-gray-100 rounded-full transition cursor-pointer">
              <ChevronRight size="18" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-3">
            {(lang === "ru" ? DAYS_RU : DAYS_EN).map(d => (
              <div key={d} className="text-center text-xs font-semibold text-gray-400 py-2">{d}</div>
            ))}
          </div>

          {loadingAvailability ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-2 border-[#0a2e5d] border-t-transparent"></div></div>
          ) : (
            <>
              <div className="grid grid-cols-7 gap-1">
                {calCells.map((day, idx) => {
                  if (!day) return <div key={`empty-${idx}`} className="aspect-square" />;
                  const dateStr = toDateStr(day);
                  const past = isPast(day);
                  const hasAvailabilityData = dayHasData(day);
                  const isSel = selectedDate === dateStr;
                  const isToday = dateStr === todayStr;
                  let cellClass = "aspect-square flex items-center justify-center text-sm rounded-full transition-all ";
                  if (past) cellClass += "text-gray-300 cursor-not-allowed bg-gray-50";
                  else if (!selectedDoctor) cellClass += "text-gray-400 cursor-not-allowed bg-gray-50";
                  else if (isSel) cellClass += "bg-[#0a2e5d] text-white font-semibold shadow-md";
                  else if (isToday) cellClass += "border-2 border-[#0a2e5d] text-[#0a2e5d] font-semibold bg-amber-50";
                  else if (hasAvailabilityData) cellClass += "hover:bg-blue-50 cursor-pointer text-gray-700 border border-blue-200";
                  else cellClass += "hover:bg-gray-100 cursor-pointer text-gray-700";
                  
                  return (
                    <button
                      key={dateStr}
                      disabled={past || !selectedDoctor}
                      onClick={() => selectedDoctor && handleDateSelect(dateStr)}
                      className={cellClass}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
              {/* {availableDates.length === 0 && selectedDoctor && (
                <div className="mt-3 text-xs text-gray-500 bg-amber-50 p-2 rounded-lg border border-amber-100">
                  {lang === "ru" 
                    ? "💡 Вы можете выбрать любую будущую дату. Время консультации будет подтверждено после бронирования."
                    : "💡 You can select any future date. Consultation time will be confirmed after booking."}
                </div>
              )} */}
            </>
          )}

          {/* Time Slots Section */}
          {selectedDoctor && selectedDate && (
            <div className="mt-6">
              <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Clock size="14" /> {lang === "ru" ? "Доступное время" : "Available time slots"}</p>
              {loadingSlots ? (
                <div className="flex justify-center py-6"><div className="animate-spin rounded-full h-6 w-6 border-2 border-[#0a2e5d] border-t-transparent"></div></div>
              ) : timeSlotsList.length > 0 ? (
                <div>
                  <div className="grid grid-cols-3 gap-2">
                    {normalizedSlots.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${selectedSlot === slot ? "bg-[#0a2e5d] text-white shadow-md" : "bg-gray-100 text-gray-700 hover:bg-gray-200"} cursor-pointer`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-100">
                    {lang === "ru" 
                      ? "Выберите предпочитаемое время консультации:"
                      : "Select your preferred consultation time:"}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {(() => {
                      const times = [];
                      for (let hour = 9; hour <= 17; hour++) {
                        times.push(`${String(hour).padStart(2, "0")}:00`);
                        if (hour < 17) times.push(`${String(hour).padStart(2, "0")}:30`);
                      }
                      times.push("17:30");
                      return times;
                    })().map((time) => (
                      <button
                        key={time}
                        onClick={() => setSelectedSlot(time)}
                        className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${selectedSlot === time ? "bg-[#0a2e5d] text-white shadow-md" : "bg-gray-100 text-gray-700 hover:bg-gray-200"} cursor-pointer`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!selectedDoctor && !loadingAvailability && (
            <p className="text-center text-gray-400 text-sm mt-8">{lang === "ru" ? "Выберите врача, чтобы увидеть доступность" : "Select a doctor to view availability"}</p>
          )}

          {step1Complete && (
            <div className="mt-6 border-t border-gray-100 pt-5 space-y-4">
              <div className="flex items-center justify-between gap-3 text-sm">
                <div>
                  <p className="text-[11px] uppercase tracking-wide font-semibold text-gray-400">{lang === "ru" ? "Выбранный прием" : "Selected Appointment"}</p>
                  <p className="text-gray-800 font-semibold flex items-center gap-2 mt-1">
                    <Calendar size="14" /> {formatDateDisplay(selectedDate)} {selectedSlot ? `• ${selectedSlot}` : ""}
                  </p>
                </div>
                {/* <div className="text-right">
                  <p className="text-[11px] uppercase tracking-wide font-semibold text-gray-400">{lang === "ru" ? "Стоимость консультации" : "Consultation Fee"}</p>
                  <p className="text-gray-900 font-bold mt-1 flex items-center justify-end gap-1"><CreditCard size="14" /> {selectedFee}</p>
                </div> */}
              </div>

              <button
                onClick={token ? handleBookExisting : handleCreateAndBook}
                disabled={submitting || (!token && (!firstName || !lastName || phoneDigits.length < 10 || !dateOfBirth))}
                className="w-full bg-[#0a2e5d] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#0e3a72] transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div> : <>{lang === "ru" ? "Подтвердить запись" : "Confirm Appointment"} <ArrowRight size="16" /></>}
              </button>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}