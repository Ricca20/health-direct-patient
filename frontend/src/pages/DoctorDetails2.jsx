///Duplicate this page as for references
import React, { useContext, useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import {
  Star,
  Calendar as CalendarIcon,
  MapPin,
  Globe,
  Video,
  Users,
  User,
  Clock,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import axios from "axios";

const DoctorDetails = () => {
  const { id } = useParams();
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("about"); // 'about', 'experiences', 'reviews'

  // Appointment state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [bookingStatus, setBookingStatus] = useState(null);

  // Helper: get localized text
  const getLocalized = (obj) => {
    if (!obj) return "";
    return obj[i18n.language] || obj.en || "";
  };

  // Fetch doctor details
  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const config = {};
        if (token) {
          config.headers = { Authorization: `Bearer ${token}` };
        }
        const response = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/api/doctors/${id}`,
          config,
        );
        if (response.data && response.data.doctor) {
          setDoctor(response.data.doctor);
        } else {
          setError(t("doctorDetails.not_found"));
        }
      } catch (err) {
        console.error("Doctor fetch error:", err);
        setError(t("doctorDetails.fetch_error"));
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchDoctor();
    }
  }, [id, token, t]);

  // ----- Appointment calendar logic -----
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const daysArray = [];

    for (let i = 0; i < firstDay; i++) {
      daysArray.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      daysArray.push(new Date(year, month, i));
    }
    return daysArray;
  };

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const calendarDays = generateCalendarDays();

  const changeMonth = (increment) => {
    setCurrentMonth(
      new Date(currentMonth.setMonth(currentMonth.getMonth() + increment)),
    );
    setSelectedDate(null);
    setSelectedTimeSlot(null);
  };

  const isToday = (date) => {
    const today = new Date();
    return date && date.toDateString() === today.toDateString();
  };

  const isSelected = (date) => {
    return (
      selectedDate &&
      date &&
      selectedDate.toDateString() === date.toDateString()
    );
  };

  // Time slots (grouped by period)
  const timeSlots = {
    Morning: ["7:00 am", "8:00 am", "9:00 am", "10:00 am"],
    Afternoon: ["12:00 pm", "1:00 pm", "2:00 pm", "3:00 pm"],
    Evening: ["4:00 pm", "5:00 pm", "6:00 pm", "7:00 pm"],
    Night: ["8:00 pm", "9:00 pm", "10:00 pm"],
  };

  const handleBookAppointment = async () => {
    if (!selectedDate || !selectedTimeSlot) {
      alert(t("doctorDetails.select_date_time"));
      return;
    }
    setBookingStatus("loading");
    try {
      await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/appointments`,
        {
          doctorId: doctor._id,
          date: selectedDate.toISOString(),
          time: selectedTimeSlot,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setBookingStatus("success");
      setTimeout(() => setBookingStatus(null), 3000);
    } catch (err) {
      console.error("Booking error:", err);
      setBookingStatus("error");
      setTimeout(() => setBookingStatus(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#eff4f8] min-h-screen py-8 px-4 md:px-10 max-w-[1200px] mx-auto">
        <div className="max-w-6xl mx-auto animate-pulse">
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-64 h-64 bg-gray-200 rounded-xl"></div>
              <div className="flex-1 space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 h-96"></div>
        </div>
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="bg-[#eff4f8] min-h-screen py-8 px-4 md:px-10">
        <div className="max-w-6xl mx-auto bg-red-50 rounded-xl p-8 text-center text-red-600">
          {error || t("doctorDetails.not_found")}
        </div>
      </div>
    );
  }

  const imageSrc = doctor.fileData
    ? `data:image/jpeg;base64,${doctor.fileData}`
    : "/default-avatar.png";

  const getInitials = (fullName) => {
    if (!fullName) return "";
    const parts = fullName.trim().split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (
      parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  };

  const fullNameDisplay = getLocalized(doctor.fullName) || "Doctor";
  const initials = getInitials(fullNameDisplay);
  // Specialty
  let specialtyNames = "";
  if (doctor.specialtyIds && doctor.specialtyIds.length > 0) {
    const currentLang = i18n.language;
    const names = doctor.specialtyIds.map((spec) => {
      if (currentLang.startsWith("ru")) {
        return spec.name_ru || spec.ru || spec.name_en || spec.en || "";
      }
      return spec.name_en || spec.en || spec.name_ru || spec.ru || "";
    }).filter(Boolean);
    if (names.length) specialtyNames = names;
  }

  const rating = doctor.reviewStats?.averageRating;
  const experience = doctor.yearOfExperience;
  const location =
    getLocalized(doctor.location) || getLocalized(doctor.placeOfWork);
  const regalia = getLocalized(doctor.regalia);
  const languageList = doctor.languages
    ?.map((lang) => getLocalized(lang))
    .filter(Boolean)
    .join(", ");
  const fees = doctor.feesAmount
    ? `${doctor.currency} ${doctor.feesAmount}`
    : null;
  const about = getLocalized(doctor.about);
  const education = getLocalized(doctor.education);
  const workExperience = getLocalized(doctor.workExperience);
  const reviews = doctor.reviews || [];

  return (
    <div className="bg-[#eff4f8] h-[calc(100vh-5.5rem)] overflow-y-auto py-6 px-4 md:px-10">
      <div className="max-w-6xl mx-auto mt-12">
        {/* Doctor Profile Card */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
          <div className="flex flex-col md:flex-row">
            {/* Image */}
            <div className="w-full md:w-72 h-64 md:h-50 bg-[#0b3780] flex-shrink-0">
              {doctor.fileData ? (
                <img
                  src={imageSrc}
                  alt={fullNameDisplay}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-white">
                  <User size={80} className="mb-4 opacity-80" />
                  <span className="text-3xl font-bold">{initials}</span>
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex-1 p-5 md:p-6">
              <div className="flex flex-wrap justify-between items-start gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                    {fullNameDisplay}
                  </h1>
                  {regalia && <p className="text-gray-500 mt-1">{regalia}</p>}
                  <ul className="flex flex-wrap">
                    {specialtyNames.length > 0 &&
                      specialtyNames.map((name, i) => (
                        <span
                          key={i}
                          className="text-sm text-[#13597F] mx-1 mt-2 text-[0.6rem] bg-blue-100 p-1 rounded-lg"
                        >
                          {name}
                        </span>
                      ))}
                  </ul>
                </div>
                {rating > 0 && (
                  <div className="flex items-center bg-yellow-50 px-3 py-1.5 rounded-full">
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                    <span className="ml-1 font-semibold text-gray-700">
                      {rating.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                {/* {experience > 0 && (
                  <div className="flex items-center text-gray-600">
                    <CalendarIcon className="w-5 h-5 mr-2" />
                    <span>
                      {experience} {t("doctorDetails.years_exp")}
                    </span>
                  </div>
                )}
                {location && (
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-5 h-5 mr-2" />
                    <span>{location}</span>
                  </div>
                )}
                {languageList && (
                  <div className="flex items-center text-gray-600">
                    <Globe className="w-5 h-5 mr-2" />
                    <span>{languageList}</span>
                  </div>
                )} */}
                {fees && (
                  <div className="flex items-center text-gray-600">
                    <span className="font-semibold mr-2">
                      {t("doctorDetails.fee")}:
                    </span>
                    <span>{fees}</span>
                  </div>
                )}
                {/* <div className="flex items-center gap-3">
                  {doctor.services?.online && (
                    <div className="flex items-center text-green-700 bg-green-50 px-2 py-1 rounded-full text-sm">
                      <Video className="w-4 h-4 mr-1" />
                      {t("doctorDetails.online")}
                    </div>
                  )}
                  {doctor.services?.offline && (
                    <div className="flex items-center text-blue-700 bg-blue-50 px-2 py-1 rounded-full text-sm">
                      <Users className="w-4 h-4 mr-1" />
                      {t("doctorDetails.offline")}
                    </div>
                  )}
                </div> */}
              </div>
            </div>
          </div>

          {/* TABS Section - About / Experiences / Reviews */}
          <div className="border-t border-gray-100">
            {/* Tab Headers */}
            <div className="flex border-b border-gray-200 px-6 md:px-8">
              <button
                onClick={() => setActiveTab("about")}
                className={`py-3 px-4 font-medium text-sm transition ${
                  activeTab === "about"
                    ? "text-[#13597F] border-b-2 border-[#13597F]"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t("doctorDetails.tabs.about")}
              </button>
              <button
                onClick={() => setActiveTab("experiences")}
                className={`py-3 px-4 font-medium text-sm transition ${
                  activeTab === "experiences"
                    ? "text-[#13597F] border-b-2 border-[#13597F]"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t("doctorDetails.tabs.experiences")}
              </button>
              <button
                onClick={() => setActiveTab("reviews")}
                className={`py-3 px-4 font-medium text-sm transition ${
                  activeTab === "reviews"
                    ? "text-[#13597F] border-b-2 border-[#13597F]"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t("doctorDetails.tabs.reviews")} ({reviews.length})
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-6 md:p-8">
              {activeTab === "about" && (
                <div>
                  {about ? (
                    <div
                      className="prose max-w-none text-gray-600"
                      dangerouslySetInnerHTML={{ __html: about }}
                    />
                  ) : (
                    <p className="text-gray-500">
                      {t("doctorDetails.no_about")}
                    </p>
                  )}
                </div>
              )}

              {activeTab === "experiences" && (
                <div className="space-y-6">
                  {education && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        {t("doctorDetails.education")}
                      </h3>
                      <div
                        className="prose max-w-none text-gray-600"
                        dangerouslySetInnerHTML={{ __html: education }}
                      />
                    </div>
                  )}
                  {workExperience && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        {t("doctorDetails.work_experience")}
                      </h3>
                      <div
                        className="prose max-w-none text-gray-600"
                        dangerouslySetInnerHTML={{ __html: workExperience }}
                      />
                    </div>
                  )}
                  {!education && !workExperience && (
                    <p className="text-gray-500">
                      {t("doctorDetails.no_experiences")}
                    </p>
                  )}
                </div>
              )}

              {activeTab === "reviews" && (
                <div>
                  {reviews.length > 0 ? (
                    <div className="space-y-4">
                      {reviews.map((review, idx) => (
                        <div
                          key={idx}
                          className="border-b border-gray-100 pb-4 last:border-0"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                <User size={16} className="text-gray-500" />
                              </div>
                              <span className="font-medium text-gray-800">
                                {review.patientName ||
                                  t("doctorDetails.anonymous")}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <Star className="w-4 h-4 text-yellow-400 fill-current" />
                              <span className="ml-1 text-sm text-gray-600">
                                {review.rating?.toFixed(1) || "—"}
                              </span>
                            </div>
                          </div>
                          {review.description && (
                            <p className="mt-2 text-gray-600">
                              {review.description}
                            </p>
                          )}
                          {review.date && (
                            <p className="mt-1 text-xs text-gray-400">
                              {new Date(review.date).toLocaleDateString(
                                i18n.language,
                              )}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">
                      {t("doctorDetails.no_reviews")}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Appointment Scheduler Card (unchanged) */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 md:p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              {t("doctorDetails.schedules")}
            </h2>

            <div className="flex flex-col lg:flex-row gap-8">
              {/* Calendar Section */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => changeMonth(-1)}
                    className="p-2 hover:bg-gray-100 rounded-full transition"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-lg font-semibold">
                    {currentMonth.toLocaleString(i18n.language, {
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                  <button
                    onClick={() => changeMonth(1)}
                    className="p-2 hover:bg-gray-100 rounded-full transition"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Week days */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {weekDays.map((day) => (
                    <div
                      key={day}
                      className="text-center text-sm font-medium text-gray-500 py-2"
                    >
                      {t(`doctorDetails.weekdays.${day.toLowerCase()}`)}
                    </div>
                  ))}
                </div>

                {/* Dates grid */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((date, idx) => (
                    <button
                      key={idx}
                      onClick={() => date && setSelectedDate(date)}
                      disabled={!date || date < new Date().setHours(0, 0, 0, 0)}
                      className={`
                        aspect-square rounded-full flex items-center justify-center text-sm
                        transition duration-200
                        ${!date ? "invisible" : ""}
                        ${date && date < new Date().setHours(0, 0, 0, 0) ? "text-gray-300 cursor-not-allowed" : "hover:bg-[#13597F] hover:text-white"}
                        ${isToday(date) ? "border-2 border-[#13597F] font-bold" : ""}
                        ${isSelected(date) ? "bg-[#13597F] text-white" : "text-gray-700"}
                      `}
                    >
                      {date?.getDate()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Slots Section */}
              <div className="flex-1">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {selectedDate
                      ? selectedDate.toLocaleDateString(i18n.language, {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                        })
                      : t("doctorDetails.select_date_first")}
                  </h3>
                </div>

                {selectedDate && (
                  <div className="space-y-6">
                    {Object.entries(timeSlots).map(([period, slots]) => (
                      <div key={period}>
                        <h4 className="text-md font-medium text-gray-700 mb-2">
                          {t(
                            `doctorDetails.timePeriods.${period.toLowerCase()}`,
                          )}
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {slots.map((slot) => (
                            <button
                              key={slot}
                              onClick={() => setSelectedTimeSlot(slot)}
                              className={`
                                py-2 px-3 rounded-lg border text-sm transition
                                ${
                                  selectedTimeSlot === slot
                                    ? "bg-[#13597F] text-white border-[#13597F]"
                                    : "bg-white text-gray-700 border-gray-300 hover:border-[#13597F] hover:text-[#13597F]"
                                }
                              `}
                            >
                              {slot}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={handleBookAppointment}
                      disabled={bookingStatus === "loading"}
                      className="w-full mt-6 bg-[#13597F] hover:bg-[#0e4563] text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
                    >
                      {bookingStatus === "loading"
                        ? t("doctorDetails.booking")
                        : t("doctorDetails.book_appointment")}
                    </button>

                    {bookingStatus === "success" && (
                      <div className="mt-4 bg-green-50 text-green-700 p-3 rounded-lg flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        {t("doctorDetails.booking_success")}
                      </div>
                    )}
                    {bookingStatus === "error" && (
                      <div className="mt-4 bg-red-50 text-red-700 p-3 rounded-lg">
                        {t("doctorDetails.booking_error")}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDetails;