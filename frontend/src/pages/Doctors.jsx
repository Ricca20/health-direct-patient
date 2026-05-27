import React, {
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { AuthContext } from "../context/AuthContext";
import {
  Search,
  Star,
  Calendar,
  MapPin,
  Globe,
  Video,
  Users,
  User,
  Filter,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { Link, useLocation } from "react-router-dom";

// Detailed doctor card (grid item) – shows all available fields from doctor object
const DoctorDetailedCard = ({ doctor, t, i18n }) => {
  const [imageError, setImageError] = useState(false);
  const currentLang = i18n.language;

  const getLocalized = (obj) => {
    if (!obj) return "";
    return obj[currentLang] || obj.en || "";
  };

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

  const fullNameDisplay =
    doctor.fullName?.[currentLang] || doctor.fullName?.en || "";
  const initials = getInitials(fullNameDisplay);

  // Specialty
  let specialtyNames = "";
  if (doctor.specialtyIds && doctor.specialtyIds.length > 0) {
    const names = doctor.specialtyIds.map((spec) => {
      if (currentLang.startsWith("ru")) {
        return spec.name_ru || spec.ru || spec.name_en || spec.en || "";
      }
      return spec.name_en || spec.en || spec.name_ru || spec.ru || "";
    }).filter(Boolean);

    if (names.length) specialtyNames = names;
  }

  const rating = doctor.reviewStats?.averageRating;
  const hasRating = rating !== undefined && rating !== null && rating > 0;
  const experience = doctor.yearOfExperience;
  const location =
    getLocalized(doctor.location) || getLocalized(doctor.placeOfWork);
  const regalia = getLocalized(doctor.regalia);
  const languageList = doctor.languages
    ?.map((lang) => getLocalized(lang))
    .filter(Boolean)
    .slice(0, 2)
    .join(", ");
  const fees = doctor.feesAmount
    ? `${doctor.currency} ${doctor.feesAmount}`
    : null;
  const isExpert = doctor.expert === true;
  const onlineService = doctor.services?.online;
  const offlineService = doctor.services?.offline;

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  console.log(doctor);
  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition duration-300 overflow-hidden flex flex-col h-full">
      <Link to={`/doctors/${doctor._id}`} className="flex-1 flex flex-col">
        {/* Image */}
        <div className="relative w-full h-56 bg-[#0d3881]">
          {!imageError ? (
            <img
              src={imageSrc}
              alt={fullNameDisplay || "Doctor"}
              className="w-full h-full object-cover"
              onError={handleImageError}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-white">
              <User size={48} className="mb-2 opacity-80" />
              <span className="text-xl font-bold">{initials}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex-1 flex flex-col">
          <div className="mb-2">
          {fullNameDisplay && (
            <h3 className="text-lg font-bold text-gray-800 line-clamp-1">
              {fullNameDisplay}
            </h3>
          )}
          {regalia && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{regalia}</p>
          )}
          <ul className="flex flex-wrap">
            {specialtyNames.length > 0 &&
              specialtyNames.map((name, i) => (
                <span
                  key={i}
                  className="text-sm text-[#13597F] mx-1 mt-2 text-[0.6rem]  bg-blue-100 p-1 rounded-lg"
                >
                  {name}
                </span>
              ))}
          </ul>
        </div>

        {/* Rating & Experience */}
        {/* <div className="flex items-center justify-between mt-3">
          {
            <div className="flex items-center">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="ml-1 text-sm text-gray-600">{rating}</span>
            </div>
          }
          {experience > 0 && (
            <div className="flex items-center text-sm text-gray-500">
              <Calendar className="w-4 h-4 mr-1" />
              <span>
                {experience} {t("doctors.years_exp")}
              </span>
            </div>
          )}
        </div> */}

        {/* Location */}
        {/* {location && (
          <div className="flex items-center text-xs text-gray-500 mt-2">
            <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
            <span className="truncate">{location}</span>
          </div>
        )} */}

        {/* Languages */}
        {/* {languageList && (
          <div className="flex items-center text-xs text-gray-500 mt-1">
            <Globe className="w-3 h-3 mr-1 flex-shrink-0" />
            <span className="truncate">{languageList}</span>
          </div>
        )} */}

        {/* Fee & Service Icons */}
        {/* <div className="mt-3 flex items-center justify-between">
          {fees && (
            <div className="text-md font-bold text-gray-900">{fees}</div>
          )}
          <div className="flex space-x-2">
            {onlineService && (
              <Video
                className="w-4 h-4 text-green-600"
                title={t("doctors.online")}
              />
            )}
            {offlineService && (
              <Users
                className="w-4 h-4 text-blue-600"
                title={t("doctors.offline")}
              />
            )}
          </div>
        </div> */}

        </div>
      </Link>

      <div className="px-4 pb-4">
        <Link
          to={`/bookAppointment?doctorId=${encodeURIComponent(doctor._id)}`}
          state={{ preselectedDoctorId: doctor._id, preselectedDoctor: doctor }}
          className="block mt-auto w-full bg-[#0d3881] hover:bg-[#1a4fa3] text-white py-2 rounded-lg transition text-sm font-medium cursor-pointer text-center"
        >
          {t("doctors.book_appointment")}
        </Link>
      </div>
    </div>
  );
};

// Main Doctors Page
const Doctors = () => {
  const { token } = useContext(AuthContext);
  const { t, i18n } = useTranslation();
  const INITIAL_VISIBLE_COUNT = 1000;
  const LOAD_MORE_COUNT = 1;
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState("");
  const [specialties, setSpecialties] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);
  const scrollContainerRef = useRef(null);
  const loadMoreTriggerRef = useRef(null);
  const location = useLocation();

  // Fetch doctors
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const config = {};
        // Only add auth header if token exists
        if (token) {
          config.headers = { Authorization: `Bearer ${token}` };
        }
        const response = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/api/doctors`,
          config,
        );
        if (response.data && Array.isArray(response.data.doctors)) {
          const doctorsData = response.data.doctors;
          setDoctors(doctorsData);

          // Extract unique specialties (localized)
          const specialtyMap = new Map();
          doctorsData.forEach((doc) => {
            doc.specialtyIds?.forEach((spec) => {
              if (!spec?._id) return;
              const isRu = i18n.language?.startsWith("ru");
              const specName = isRu
                ? spec.name_ru || spec.ru || spec.name_en || spec.en
                : spec.name_en || spec.en || spec.name_ru || spec.ru;
              if (specName) {
                specialtyMap.set(spec._id, specName);
              }
            });
          });
          const specialtyList = Array.from(specialtyMap.entries())
            .map(([id, name]) => ({ id, name }))
            .sort((a, b) => a.name.localeCompare(b.name));
          setSpecialties(specialtyList);
        } else {
          setDoctors([]);
        }
      } catch (err) {
        console.error("Doctors fetch error:", err);
        setError(t("doctors.fetch_error"));
      } finally {
        setLoading(false);
      }
    };
    // Always fetch for both guests and logged-in users
    fetchDoctors();
  }, [t, i18n.language]);

  // Filter doctors
  const filteredDoctors = useMemo(() => {
    let filtered = [...doctors];
    const currentLang = i18n.language;

    const getLocalized = (obj) => {
      if (!obj) return "";
      if (typeof obj === "string") return obj;
      return (
        obj[currentLang] ||
        obj[`name_${currentLang}`] ||
        obj.en ||
        obj.name_en ||
        obj.name_ru ||
        obj.ru ||
        ""
      );
    };

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((doc) => {
        const fullName = getLocalized(doc.fullName).toLowerCase();
        const specialty = doc.specialtyIds
          ?.map((s) => getLocalized(s).toLowerCase())
          .join(" ");
        return (
          fullName.includes(term) || (specialty && specialty.includes(term))
        );
      });
    }

    if (selectedSpecialtyId) {
      const selectedNormalized = selectedSpecialtyId.toLowerCase();
      filtered = filtered.filter((doc) =>
        doc.specialtyIds?.some((spec) => {
          const localized = getLocalized(spec);
          return (
            String(spec._id) === String(selectedSpecialtyId) ||
            localized === selectedSpecialtyId ||
            localized.toLowerCase() === selectedNormalized ||
            localized.toLowerCase().includes(selectedNormalized)
          );
        }),
      );
    }

    // Sort by rating (highest first)
    filtered.sort(
      (a, b) =>
        (b.reviewStats?.averageRating || 0) -
        (a.reviewStats?.averageRating || 0),
    );
    return filtered;
  }, [doctors, searchTerm, selectedSpecialtyId, i18n.language]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const specialtyIdFromUrl = params.get("specialtyId") || "";
    const specialtyNameFromUrl = params.get("specialty") || "";
    setSelectedSpecialtyId(specialtyIdFromUrl || specialtyNameFromUrl);
  }, [location.search]);

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  }, [searchTerm, selectedSpecialtyId, i18n.language, doctors]);

  const visibleDoctors = useMemo(() => {
    return filteredDoctors.slice(0, visibleCount);
  }, [filteredDoctors, visibleCount]);

  const hasMoreDoctors = visibleCount < filteredDoctors.length;

  useEffect(() => {
    const trigger = loadMoreTriggerRef.current;
    if (!trigger || !hasMoreDoctors) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry.isIntersecting) return;

        setVisibleCount((prev) =>
          Math.min(prev + LOAD_MORE_COUNT, filteredDoctors.length),
        );
      },
      {
        root: scrollContainerRef.current,
        rootMargin: "0px 0px 120px 0px",
        threshold: 0.1,
      },
    );

    observer.observe(trigger);
    return () => observer.disconnect();
  }, [hasMoreDoctors, filteredDoctors.length]);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedSpecialtyId("");
  };

  return (
    <div
      ref={scrollContainerRef}
      className="bg-[#eff4f8] h-[calc(100vh-5.5rem)] overflow-y-auto py-6 mt-8"
    >
      <div className="mx-auto w-full max-w-[1200px] px-4 md:px-10">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            {t("doctors.page_title")}
          </h1>
        <p className="text-gray-500 mt-1">{t("doctors.subtitle")}</p>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={t("doctors.search_placeholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#13597F] focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-full transition md:w-auto relative"
          >
            <Filter className="w-4 h-4" />
            {t("doctors.filter")}
            {selectedSpecialtyId && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </button>
          {(searchTerm || selectedSpecialtyId) && (
            <button
              onClick={clearFilters}
              className="flex items-center justify-center gap-1 text-red-500 hover:text-red-700 text-sm"
            >
              <X className="w-4 h-4" />
              {t("doctors.clear_filters")}
            </button>
          )}
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-gray-700">
                {t("doctors.specialty")}:
              </span>
              <select
                value={selectedSpecialtyId}
                onChange={(e) => setSelectedSpecialtyId(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-[#13597F] focus:border-[#13597F]"
              >
                <option value="">{t("doctors.all_specialties")}</option>
                {specialties.map((spec) => (
                  <option key={spec.id} value={spec.id}>
                    {spec.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Results count */}
      {!loading && (
        <div className="mb-4 text-sm text-gray-500">
          {selectedSpecialtyId ? (
            <>
              {filteredDoctors.length} {t("doctors.doctors_found")} 
              <span className="text-xs text-gray-400 ml-2">
                ({t("doctors.filter_applied", "filtered by specialty")})
              </span>
            </>
          ) : (
            <>{doctors.length} {t("doctors.doctors_found")}</>
          )}
        </div>
      )}

      {/* Doctors grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl shadow-md animate-pulse"
            >
              <div className="w-full h-56 bg-gray-200 rounded-t-xl"></div>
              <div className="p-4 space-y-3">
                <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-10 bg-gray-200 rounded w-32"></div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 rounded-xl p-8 text-center text-red-600">
          {error}
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center text-gray-500">
          {t("doctors.no_doctors_found")}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleDoctors.map((doctor) => (
              <div key={doctor._id}>
                <DoctorDetailedCard
                  doctor={doctor}
                  t={t}
                  i18n={i18n}
                />
              </div>
            ))}
          </div>

          {hasMoreDoctors && (
            <div ref={loadMoreTriggerRef} className="py-4 text-center text-sm text-gray-500">
              {t("doctors.loading_more", "Loading more doctors...")}
            </div>
          )}

          {!hasMoreDoctors && visibleDoctors.length > 0 && (
            <div className="py-4 text-center text-sm text-gray-400">
              {t("doctors.end_of_results", "You have reached the end.")}
            </div>
          )}
        </>
      )}
    </div>
    </div>
  );
};

export default Doctors;
