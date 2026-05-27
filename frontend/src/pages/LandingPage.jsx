import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Navbar from "../components/Navbar";
import background from "../assets/background.jpg";
import bg_1 from "../assets/bg_1.png"
import bg_2 from "../assets/bg_2.png"
import bg_3 from "../assets/bg_3.png"

const images = [
  background,
  bg_1,
  bg_2,
  bg_3,
  background,
  background,
];

const Landing = () => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 grid grid-cols-2 md:grid-cols-3">
        {images.map((img, i) => (
          <div
            key={i}
            className="bg-cover bg-center"
            style={{ backgroundImage: `url(${img})` }}
          />
        ))}
      </div>

      <div className="absolute inset-0 bg-black/60" />

      <div className="relative z-10">
        <Navbar />

        <div className="w-[60%] md:w-[40%] max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-4">
          <div className="text-center">
            <h1 className="text-3xl md:text-7xl font-bold text-white drop-shadow-lg">
              {t("landing.heading")}
            </h1>
            <p className="mt-4 text-lg md:text-xl text-white/90 max-w-3xl mx-auto drop-shadow">
              {t("landing.description")}
            </p>
          </div>

          <div className="mt-4 flex justify-center">
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center px-8 py-3 bg-[#00285c] text-white font-semibold rounded-full shadow-md hover:bg-[#001c44] transition"
            >
              {t("landing.without_login")}
            </Link>
          </div>

          <div className="mt-8 text-center">
            <p className="text-white text-lg mb-6 drop-shadow">
              {t("landing.prompt")}
            </p>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <Link
                to="/signin"
                className="px-8 py-3 bg-white text-[#00285c] font-semibold rounded-full shadow-md hover:bg-gray-100 transition"
              >
                {t("landing.signin")}
              </Link>

              <Link
                to="/signup"
                className="px-8 py-3 bg-[#00285c] text-white font-semibold rounded-full shadow-md hover:bg-[#001c44] transition"
              >
                {t("landing.register")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
