import React, { useState, useEffect, useContext } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import {
  Search,
  ArrowRight,
} from "lucide-react";

const CATEGORY_IMAGES = [
  "https://images.unsplash.com/photo-1580281657521-1e258d9d85cd?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1511174511562-5f7f18b8721e?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1542736667-069246bdbc7b?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1526256262350-7da7584cf5eb?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1497215842964-222b430dc094?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1513672711769-443a38f9e36d?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1519494080410-f9aa6f4a5a84?auto=format&fit=crop&w=1200&q=80",
];

const SPECIALTY_IMAGE_MAP = {
  cardiologist: new URL("../assets/Specialist Images/Specialist Images/Cardiologist.png", import.meta.url).href,
  coloproctologist: new URL("../assets/Specialist Images/Specialist Images/Coloproctologist.png", import.meta.url).href,
  oncologist: new URL("../assets/Specialist Images/Specialist Images/Oncologist.png", import.meta.url).href,
  oncodermatologist: new URL("../assets/Specialist Images/Specialist Images/Oncodermatologist.png", import.meta.url).href,
  surgeon: new URL("../assets/Specialist Images/Specialist Images/Surgeon.png", import.meta.url).href,
  internist: new URL("../assets/Specialist Images/Specialist Images/Internist (General Physician).png", import.meta.url).href,
  ultrasound: new URL("../assets/Specialist Images/Specialist Images/Ultrasound.png", import.meta.url).href,
  ultrasonography: new URL("../assets/Specialist Images/Specialist Images/Ultrasound Diagnostics (Ultrasonography).png", import.meta.url).href,
};

const getSpecialtyImage = (name) => {
  const n = name.toLowerCase();
  if (n.includes("cardio") || n.includes("кардио")) return SPECIALTY_IMAGE_MAP.cardiologist;
  if (n.includes("coloprocto") || n.includes("колопро")) return SPECIALTY_IMAGE_MAP.coloproctologist;
  if (n.includes("oncoderm") || n.includes("онкодерм")) return SPECIALTY_IMAGE_MAP.oncodermatologist;
  if (n.includes("oncolo") || n.includes("онкол") || n.includes("oncologist")) return SPECIALTY_IMAGE_MAP.oncologist;
  if (n.includes("surge") || n.includes("хирур")) return SPECIALTY_IMAGE_MAP.surgeon;
  if (n.includes("intern") || n.includes("general physician") || n.includes("врач общей")) return SPECIALTY_IMAGE_MAP.internist;
  if (n.includes("ultrasound") || n.includes("ультра") || n.includes("ultrasonography")) return SPECIALTY_IMAGE_MAP.ultrasound;
  return null;
};


const Specialist = () => {
  const { t, i18n } = useTranslation();
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [specialists, setSpecialists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSpecialties = async () => {
      try {
        const config = {};
        // Only add auth header if token exists
        if (token) {
          config.headers = { Authorization: `Bearer ${token}` };
        }
        const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/doctors`, config);
        const doctors = response.data?.doctors || [];
        const specialtyMap = new Map();
        doctors.forEach((doctor) => {
          doctor.specialtyIds?.forEach((specialty) => {
            if (!specialty?._id) return;
            const existing = specialtyMap.get(specialty._id);
            if (!existing) {
              specialtyMap.set(specialty._id, {
                id: specialty._id,
                name_en: specialty.name_en || specialty.en || "",
                name_ru: specialty.name_ru || specialty.ru || specialty.name_en || "",
                icon: specialty.icon || null,
                count: 1,
              });
            } else {
              existing.count += 1;
            }
          });
        });

        const backendSpecialties = Array.from(specialtyMap.values())
          .sort((a, b) => b.count - a.count)
          .map((specialty, index) => {
            const name = i18n.language?.startsWith("ru")
              ? specialty.name_ru || specialty.name_en
              : specialty.name_en || specialty.name_ru;
            return {
              ...specialty,
              title: name,
              subtitle: "",
              colSpan:
                index % 4 === 0 || index % 4 === 3
                  ? "md:col-span-2"
                  : "md:col-span-1",
              height: "h-[320px]",
              icon: ArrowRight,
              image:
                getSpecialtyImage(name) ||
                CATEGORY_IMAGES[index % CATEGORY_IMAGES.length],
            };
          });

        setSpecialists(backendSpecialties);
      } catch (error) {
        console.error("Error loading specialties:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSpecialties();
  }, [i18n.language, t]);

  const filteredSpecialists = specialists.filter((specialist) =>
    specialist.title.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="min-h-screen w-full bg-[#eef7fb] py-10">
      <div className="mx-auto w-full max-w-[1200px] px-4 mt-4">
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
            {t("specialists.page_title")}
          </h1>
          <p className="mt-3 max-w-2xl text-base text-slate-600">
            {t("specialists.page_description")}
          </p>
        </div>

        <div className="mb-12">
          <div className="relative rounded-[32px] border border-slate-200 bg-white px-3  py-1 shadow-sm transition focus-within:shadow-md sm:px-7">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={22} />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("specialists.search_placeholder")}
              className="w-full rounded-[28px] border-none bg-transparent py-4 pl-16 pr-5 text-base text-slate-900 outline-none"
            />
          </div>
        </div>

        <div className="grid gap-6 grid-cols-1 md:grid-cols-4">
          {isLoading ? (
            // Loading Skeletons
            [1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="md:col-span-1 h-[320px] rounded-[32px] bg-slate-200 animate-pulse" />
            ))
          ) : filteredSpecialists.length > 0 ? (
            filteredSpecialists.map((specialist) => (
              <button
                key={specialist.id}
                type="button"
                onClick={() =>
                  navigate(
                    specialist.id
                      ? `/doctors?specialtyId=${encodeURIComponent(specialist.id)}`
                      : `/doctors?specialty=${encodeURIComponent(specialist.title)}`,
                  )
                }
                className={`${specialist.colSpan} rounded-[32px] bg-white shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-2xl text-left overflow-hidden`}
              >
                <div className={`relative overflow-hidden rounded-[32px] ${specialist.height} cursor-pointer`}>
                  <img
                    src={specialist.image}
                    alt={specialist.title}
                    className="h-full w-full object-cover transition duration-500 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-3">
                    <div className="rounded-[28px] border border-white/60 bg-white/80 p-1 pl-4 backdrop-blur-xl">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h2 className="text-lg font-semibold text-slate-900 line-clamp-1">
                            {specialist.title}
                          </h2>
                          {specialist.subtitle && (
                            <p className="mt-1 text-sm uppercase tracking-[0.16em] text-slate-500">
                              {specialist.subtitle}
                            </p>
                          )}
                        </div>
                        {specialist.icon ? (
                          <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#0b3780] text-white transition">
                            {(() => {
                              const Icon = specialist.icon;
                              return <Icon size={20} color="white" />;
                            })()}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="col-span-full rounded-[32px] border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
              {t("specialists.no_results")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Specialist;
