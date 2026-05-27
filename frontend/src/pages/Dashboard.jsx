import React, {
  useContext,
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
  memo,
} from "react";
import { AuthContext } from "../context/AuthContext";
import ProfilePopup from "../components/ProfilePopup";
import { Search, Star, Calendar, User, Stethoscope, HeartPulse, ShieldCheck, Activity, UserCheck, Thermometer, Eye, Bandage, Bone, Hospital } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { getPromos } from "../utils/api";
import axios from "axios";

// ----- Skeleton for vertical card (grid) -----
const DoctorCardSkeleton = memo(() => (
  <div className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
    <div className="w-full h-48 bg-gray-200"></div>
    <div className="p-4 space-y-3">
      <div className="h-5 bg-gray-200 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      <div className="flex justify-between">
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
      </div>
    </div>
  </div>
));

// ----- Vertical Doctor Card (grid item) -----
const DoctorCard = memo(({ doctor, t, i18n }) => {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);
  const currentLang = i18n.language || "en";

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

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  const handleBookAppointment = () => {
    navigate("/bookAppointment", {
      state: {
        preselectedDoctorId: doctor._id,
        preselectedDoctor: doctor,
        autoSelectDateTime: true,
      },
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition duration-300 flex flex-col h-full">
      {/* Image */}
      <div className="relative w-full h-48 bg-[#0d3881]">
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
        {fullNameDisplay && (
          <h3 className="text-lg font-semibold text-gray-800 line-clamp-1">
            {fullNameDisplay}
          </h3>
        )}
        <ul className="flex flex-wrap mb-4">
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
        <button 
          onClick={handleBookAppointment}
          className="mt-auto w-full bg-[#0d3881] hover:bg-[#1a4fa3] text-white py-2 rounded-lg transition text-sm font-medium cursor-pointer">
          {t("doctors.book_appointment")}
        </button>
      </div>
    </div>
  );
});

// ----- Discount components (unchanged) -----
const DiscountSkeleton = memo(() => (
  <div className="w-full h-56 md:h-80 lg:h-96 bg-gray-200 animate-pulse rounded-xl"></div>
));

const DiscountError = memo(({ error }) => (
  <div className="w-full h-56 md:h-80 lg:h-96 bg-red-50 rounded-xl flex items-center justify-center text-red-600">
    {error}
  </div>
));



const getSpecialtyIcon = (name) => {
  const n = name.toLowerCase();
  if (n.includes("cardio") || n.includes("кардио")) return HeartPulse;
  if (n.includes("neuro") || n.includes("невро")) return Activity;
  if (n.includes("pediat") || n.includes("педиат")) return UserCheck;
  if (n.includes("ortho") || n.includes("орто")) return Bone;
  if (n.includes("derma") || n.includes("дерма")) return Bandage;
  if (n.includes("ophthal") || n.includes("офталь") || n.includes("eye")) return Eye;
  if (n.includes("ent") || n.includes("лор")) return Thermometer;
  if (n.includes("surger") || n.includes("хирур")) return Hospital;
  if (n.includes("dental") || n.includes("стомат")) return Bandage;
  if (n.includes("oncolog") || n.includes("онколог")) return Hospital;
  return Activity;
};

// ----- Main Dashboard Component -----
const Dashboard = () => {
  const { profileCompleted, token } = useContext(AuthContext);
  const [showPopup, setShowPopup] = useState(Boolean(token) && !profileCompleted);
  const [isLoading, setIsLoading] = useState(true);
  const [searchPlaceholder, setSearchPlaceholder] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const { t, i18n } = useTranslation();
  const placeholders = useMemo(
    () => [
      t("dashboard.search_placeholder_doctors"),
      t("dashboard.search_placeholder_specialty"),
    ],
    [i18n.language]
  );
  const [activeIndex, setActiveIndex] = useState(0);

  const [promos, setPromos] = useState([]);
  const [loadingPromos, setLoadingPromos] = useState(true);
  const [errorPromos, setErrorPromos] = useState(null);
  const swiperRef = useRef(null);

  const [doctors, setDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [errorDoctors, setErrorDoctors] = useState(null);
  const doctorCarouselRef = useRef(null);
  const doctorCardWidthRef = useRef(0);
  const doctorDuplicateCount = 3;
  const currentLang = (i18n.resolvedLanguage || i18n.language || "en")
    .split("-")[0]
    .toLowerCase();

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [placeholders]);

  useEffect(() => {
    setSearchPlaceholder(placeholders[placeholderIndex]);
  }, [placeholderIndex, placeholders]);

  useEffect(() => {
    const fetchPromos = async () => {
      try {
        const response = await getPromos();
        if (response.data && Array.isArray(response.data.promos)) {
          setPromos(response.data.promos);
        } else {
          setPromos([]);
        }
      } catch (error) {
        console.error("Promo fetch error:", error);
        setErrorPromos(t("dashboard.err_load_promos"));
      } finally {
        setLoadingPromos(false);
      }
    };
    fetchPromos();
  }, []);

  useEffect(() => {
    if (doctors.length > 0) {
      const specialtyMap = new Map();
      doctors.forEach((doctor) => {
        doctor.specialtyIds?.forEach((spec) => {
          if (!spec?._id) return;
          const isRu = i18n.language?.startsWith("ru");
          const specName = isRu
            ? spec.name_ru || spec.ru || spec.name_en || spec.en
            : spec.name_en || spec.en || spec.name_ru || spec.ru;

          if (!specialtyMap.has(spec._id)) {
            specialtyMap.set(spec._id, {
              _id: spec._id,
              name: specName,
              count: 1,
              icon: getSpecialtyIcon(specName),
            });
          } else {
            specialtyMap.get(spec._id).count++;
          }
        });
      });
      setSpecialties(
        Array.from(specialtyMap.values())
          .sort((a, b) => b.count - a.count)
          .slice(0, 10),
      );
    }
  }, [doctors, i18n.language]);

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
          const sorted = [...response.data.doctors].sort(
            (a, b) =>
              (b.reviewStats?.averageRating || 0) -
              (a.reviewStats?.averageRating || 0),
          );
          setDoctors(sorted);
        } else {
          setDoctors([]);
        }
      } catch (error) {
        console.error("Doctors fetch error:", error);
        setErrorDoctors(t("dashboard.err_load_doctors"));
      } finally {
        setLoadingDoctors(false);
      }
    };
    // Always fetch for both guests and logged-in users
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (!doctorCarouselRef.current || doctors.length === 0) return;
    const firstCard = doctorCarouselRef.current.querySelector(
      ".doctor-carousel-card",
    );
    if (!firstCard) return;

    const gap = 24; // gap-6
    doctorCardWidthRef.current = firstCard.offsetWidth + gap;
  }, [doctors.length, loadingDoctors]);

  useEffect(() => {
    const container = doctorCarouselRef.current;
    if (!container || doctorCardWidthRef.current === 0 || doctors.length === 0)
      return;

    const interval = setInterval(() => {
      if (container.scrollLeft >= doctors.length * doctorCardWidthRef.current) {
        container.scrollLeft -= doctors.length * doctorCardWidthRef.current;
      }
      container.scrollBy({
        left: doctorCardWidthRef.current,
        behavior: "smooth",
      });
    }, 4500);

    return () => clearInterval(interval);
  }, [doctors.length, loadingDoctors]);

  const hasValidMedia = useCallback((promo) => {
    return Boolean(
      (promo.fileData && promo.fileData.length > 0) || promo.imageUrl,
    );
  }, []);

  const promoSlides = React.useMemo(() => {
    return promos.filter((promo) => hasValidMedia(promo));
  }, [promos, hasValidMedia]);

  const handleSlideChange = useCallback(
    (swiper) => {
      setActiveIndex(swiper.realIndex);
    },
    [],
  );

  const handleTransitionEnd = useCallback(
    (swiper) => {
      setActiveIndex(swiper.realIndex);
    },
    [],
  );

  const getLocalizedValue = useCallback(
    (multiLangValue) => {
      if (!multiLangValue) return "";
      if (typeof multiLangValue === "string") return multiLangValue;
      return (
        multiLangValue[currentLang] || multiLangValue.en || multiLangValue.ru || ""
      );
    },
    [currentLang],
  );

  const getPromoTitle = useCallback(
    (promo) => {
      return (
        getLocalizedValue(promo.promoBannerTitle) ||
        getLocalizedValue(promo.title) ||
        ""
      );
    },
    [getLocalizedValue],
  );

  const getPromoDescription = useCallback(
    (promo) => {
      return (
        getLocalizedValue(promo.promoBannerDescription) ||
        getLocalizedValue(promo.description) ||
        ""
      );
    },
    [getLocalizedValue],
  );

  const memoizedDoctors = React.useMemo(() => doctors, [doctors]);

  return (
    <>
      <div
        className={`bg-[#eff4f8] h-[calc(100vh-5.5rem)] mt-5 overflow-y-auto pb-8 ${token && !profileCompleted ? "opacity-50 pointer-events-none grayscale" : ""
          }`}
      >
        <div className="mx-auto w-full max-w-[1200px]">

        {/* Main Content */}
        {isLoading ? (
          <div className="px-4 md:px-10 mt-6 space-y-6 ">
            <DiscountSkeleton />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <DoctorCardSkeleton key={i} />
              ))}
            </div>
          </div>
        ) : (
          <div className="px-4 md:px-10 mt-10 space-y-10">
            {/* Promo Carousel */}
            {promoSlides.length > 0 && (
              <section>
              <div className="relative w-full h-56 md:h-80 lg:h-80">
                {loadingPromos ? (
                  <DiscountSkeleton />
                ) : (
                  <>
                    <Swiper
                      modules={[Autoplay, Pagination]}
                      autoplay={{ delay: 5000, disableOnInteraction: false }}
                      loop={promoSlides.length > 1}
                      pagination={false} // Disable default pagination
                      className="w-full h-full rounded-t-xl rounded-b-3xl overflow-hidden shadow-none"
                      onSwiper={(swiper) => {
                        swiperRef.current = swiper;
                        handleSlideChange(swiper);
                        setActiveIndex(swiper.realIndex);
                      }}
                      onSlideChange={(swiper) => {
                        handleSlideChange(swiper);
                        setActiveIndex(swiper.realIndex);
                      }}
                      onTransitionEnd={handleTransitionEnd}
                    >
                      {promoSlides.map((promo, idx) => {
                        const hasData = hasValidMedia(promo);
                        const title = getPromoTitle(promo);
                        const description = getPromoDescription(promo);

                        if (!hasData) {
                          return (
                            <SwiperSlide key={promo._id || idx}>
                              <div className="relative w-full h-full bg-gradient-to-r from-blue-400 to-indigo-500">
                                <div className="absolute inset-0 bg-black/40 z-10"></div>
                                <div className="relative z-20 flex flex-col items-center justify-center h-full text-white text-center p-6">
                                  {title ? (
                                    <h2
                                      className="text-2xl md:text-4xl font-bold mb-4 drop-shadow-lg"
                                      dangerouslySetInnerHTML={{ __html: title }}
                                    />
                                  ) : (
                                    <h2 className="text-2xl md:text-4xl font-bold mb-4">
                                      {t("dashboard.special_offer")}
                                    </h2>
                                  )}
                                  {description ? (
                                    <p
                                      className="text-lg md:text-xl max-w-2xl drop-shadow-md"
                                      dangerouslySetInnerHTML={{
                                        __html: description,
                                      }}
                                    />
                                  ) : (
                                    <p className="text-lg md:text-xl">
                                      {t("dashboard.check_back_soon")}
                                    </p>
                                  )}
                                  <button className="mt-4 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white font-semibold py-2 px-5 rounded-full transition text-sm md:text-base">
                                    {t("dashboard.learn_more")}
                                  </button>
                                </div>
                              </div>
                            </SwiperSlide>
                          );
                        }

                        const mediaSrc = promo.fileData
                          ? `data:image/jpeg;base64,${promo.fileData}`
                          : promo.imageUrl;
                        const startColor = promo.startColor || "#0d3881";
                        const endColor = promo.endColor || "#13597F";

                        return (
                          <SwiperSlide key={promo._id || idx}>
                            <div
                              className="relative w-full h-full flex overflow-hidden"
                              style={{
                                background: `linear-gradient(135deg, ${startColor} 0%, ${endColor} 100%)`,
                              }}
                            >
                              {/* Left Content (Text) */}
                              <div className="w-full md:w-3/5 lg:w-1/2 p-6 md:p-10 lg:p-12 flex flex-col justify-center z-20 text-white">
                                {title && (
                                  <h2
                                    className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 drop-shadow-lg leading-tight"
                                    dangerouslySetInnerHTML={{ __html: title }}
                                  />
                                )}
                                {description && (
                                  <p
                                    className="text-sm md:text-base lg:text-lg max-w-lg mb-6 drop-shadow-md line-clamp-3 opacity-90"
                                    dangerouslySetInnerHTML={{
                                      __html: description,
                                    }}
                                  />
                                )}
                                <div>
                                  <button className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white font-semibold py-2.5 px-6 rounded-full transition text-sm md:text-base border border-white/30">
                                    {t("dashboard.learn_more")}
                                  </button>
                                </div>
                              </div>

                              {/* Right Content (Image) */}
                              <div className="absolute top-0 right-0 w-1/2 h-full z-10 hidden md:block">
                                <div className="relative w-full h-full">
                                  <img
                                    src={mediaSrc}
                                    alt={promo.filename || "Promo"}
                                    className="absolute inset-0 w-full h-full object-cover"
                                    style={{
                                      maskImage:
                                        "linear-gradient(to right, transparent, black 40%)",
                                      WebkitMaskImage:
                                        "linear-gradient(to right, transparent, black 40%)",
                                    }}
                                    onError={(e) => {
                                      console.error("Image error", e);
                                      e.currentTarget.style.display = "none";
                                    }}
                                  />
                                </div>
                              </div>

                              {/* Mobile Overlay (to ensure text readability if image covers background) */}
                              <div className="absolute inset-0 bg-black/20 md:hidden z-0"></div>
                            </div>
                          </SwiperSlide>
                        );
                      })}
                    </Swiper>

                    {/* White curved gap below image */}
                    <div
                      className="absolute bottom-[-23px] left-1/2 -translate-x-1/2 z-20 w-25 h-10 bg-[#eff4f8] rounded-full "
                    />                    {/* Custom Pagination Indicators */}
                    {promoSlides.length > 0 && (
                      <div className="absolute bottom-[-18px] left-1/2 -translate-x-1/2 z-30 ">
                        <div className="bg-white px-4 py-2 rounded-full flex gap-2 items-center">
                          {promoSlides.map((_, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                if (swiperRef.current) {
                                  swiperRef.current.slideTo(idx);
                                  setActiveIndex(idx);
                                }
                              }}
                              className={`w-3 h-3 rounded-full transition-all duration-300 cursor-pointer ${activeIndex === idx
                                ? 'bg-black'
                                : 'bg-gray-300 hover:bg-gray-400'
                                }`}
                              aria-label={`Go to slide ${idx + 1}`}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {errorPromos && (
                      <p className="mt-2 text-xs text-red-600 text-center">{errorPromos}</p>
                    )}
                  </>
                )}
              </div>
            </section>
            )}

            {/* Search Bar */}
            <section className="px-4 md:px-10 pt-6 w-[1200px] max-w-full">
              <div className="w-[1120px] ml-[-40px]">
                <div className="flex items-center bg-white rounded-2xl shadow-sm border border-gray-200 focus-within:shadow-md px-4 py-2 w-full">
                  <Search className="text-gray-400 mr-3" size={20} />
                  <input
                    type="search"
                    placeholder={searchPlaceholder}
                    className="flex-1 border-none outline-none bg-transparent text-gray-700 py-2 text-base"
                    aria-label="Search"
                  />
                </div>
              </div>
            </section>

            {/* Doctors Section - Top Rated (grid) */}
            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl md:text-2xl font-bold text-gray-800">
                  {t("dashboard.top_rated_doctors")}
                </h2>
                <button className="text-[#13597F] hover:underline text-sm font-medium">
                  {t("dashboard.view_all")}
                </button>
              </div>
              {loadingDoctors ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <DoctorCardSkeleton key={i} />
                  ))}
                </div>
              ) : errorDoctors ? (
                <div className="bg-red-50 rounded-xl p-6 text-center text-red-600">
                  {errorDoctors}
                </div>
              ) : memoizedDoctors.length === 0 ? (
                <div className="bg-gray-50 rounded-xl p-6 text-center text-gray-500">
                  {t("dashboard.no_doctors")}
                </div>
              ) : (
                <div
                  ref={doctorCarouselRef}
                  className="flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4"
                >
                  {memoizedDoctors
                    .concat(memoizedDoctors.slice(0, doctorDuplicateCount))
                    .map((doctor, index) => (
                      <div
                        key={`${doctor._id}-${index}`}
                        className="doctor-carousel-card flex-shrink-0 snap-start min-w-full md:min-w-[calc((100%-24px)/2)] lg:min-w-[calc((100%-48px)/3)] max-w-full"
                      >
                        <DoctorCard doctor={doctor} t={t} i18n={i18n} />
                      </div>
                    ))}
                </div>
              )}
            </section>

            {/* Specialist Categories */}
            {specialties.length > 0 && (
              <section className="mb-5">
                <div className="flex justify-between items-center mb-5">
                  <h2 className="text-xl md:text-2xl font-bold text-gray-800">
                    {t("dashboard.specialist_categories")}
                  </h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {specialties.map((spec) => {
                    const Icon = spec.icon;
                    return (
                      <div
                        key={spec._id}
                        onClick={() => navigate(`/doctors?specialtyId=${spec._id}`)}
                        className="bg-white rounded-3xl border border-gray-100 p-2 shadow-sm hover:shadow-md transition flex items-center gap-3 cursor-pointer group"
                      >
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-[#dbeafe] group-hover:bg-[#0d3881] transition-colors">
                          <Icon className="w-5 h-5 text-[#0d3881] group-hover:text-white transition-colors" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-gray-800 leading-tight">
                            {spec.name}
                          </h3>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        )}
        </div>
      </div>

      {/* Profile Popup */}
      {token && !profileCompleted && showPopup && (
        <ProfilePopup onClose={() => setShowPopup(false)} />
      )}
    </>
  );
};

export default Dashboard;
