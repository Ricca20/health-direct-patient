import React, { useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AuthContext } from "../context/AuthContext";
import {
  MdDashboard,
  MdMail,
  MdOutlineLogout,
  MdPayments,
} from "react-icons/md";
import {
  FaPhoneAlt,
  FaWhatsapp,
  FaTelegramPlane,
  FaBars,
  FaTimes,
  FaCalendarPlus,
  FaUserCircle,
  FaUserMd,
} from "react-icons/fa";
import { GiHealthNormal } from "react-icons/gi";
import { PiTelegramLogoDuotone } from "react-icons/pi";
import { HeartHandshake } from 'lucide-react'

const SideNavbar = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { patient } = useContext(AuthContext);

  const navigationItems = [
    { icon: MdDashboard, label: t("side_navbar.home"), src: "/dashboard" },
    { icon: FaUserMd, label: t("side_navbar.doctors"), src: "/doctors" },
    {
      icon: GiHealthNormal,
      label: t("side_navbar.specialist"),
      src: "/specialist",
    },
    {
      icon: FaCalendarPlus,
      label: t("side_navbar.book_appointments"),
      src: "/bookAppointment",
    },
       {
      icon: HeartHandshake,
      label: t("side_navbar.early_detection"),
      src: "/early-detection",
    },
    { icon: FaUserCircle, label: t("side_navbar.profile"), src: "/profile" },
  ];

  const activeIndex = Math.max(
    navigationItems.findIndex((item) => item.src === location.pathname),
    0
  );
  const itemWidth = 100 / navigationItems.length;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] pointer-events-none">
      <style>
        {`
          @keyframes activeTabGlow {
            0%, 100% {
              box-shadow: 0 8px 22px rgba(13, 56, 129, 0.42), 0 0 0 0 rgba(13, 56, 129, 0.3);
            }
            50% {
              box-shadow: 0 10px 28px rgba(13, 56, 129, 0.55), 0 0 0 8px rgba(13, 56, 129, 0);
            }
          }
        `}
      </style>
      {/* Actual Navbar */}
      <div className="pointer-events-auto mb-6 mx-auto w-[96%] max-w-[700px]">
        <div className="bg-white/80 backdrop-blur-md rounded-full shadow-2xl border border-white/20 px-2 py-2 overflow-hidden">
          <div className="relative flex items-center h-20">
            {/* Smooth Active Indicator (Precisely Centered on Icon Area) */}
            <div
              className="absolute rounded-full transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)"
              style={{
                width: "48px",
                height: "48px",
                top: "4px", // Matches top padding of IconContainer area
                left: `calc(${activeIndex * itemWidth + itemWidth / 2}% - 24px)`,
                backgroundColor: "#0d3881",
                boxShadow: "0 8px 25px -5px rgba(13, 56, 129, 0.5)",
              }}
            />
            
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.src;
              const isProfileItem = item.src === "/profile";
              const isGuest = !patient;

              // Shared content wrapper for perfect alignment
              const ItemContent = (
                <div className="flex flex-col items-center h-full w-full px-1">
                  {/* Icon Area (Fixed Height for Vertical Centering) */}
                  <div className={`
                    relative flex items-center justify-center
                    w-full h-[56px] transition-all duration-300
                    ${isActive ? "text-white" : "text-gray-400 group-hover:text-[#00235c]"}
                  `}>
                    <Icon
                      className={`
                        text-2xl transition-all duration-300 
                        ${isActive ? "scale-110" : "group-hover:scale-110 hover:text-[#00235c]"}
                      `}
                    />
                  </div>

                  {/* Label Area (Fixed Height for Consistent Leveling) */}
                  <div className="flex items-center justify-center h-[20px] w-full overflow-hidden">
                    <span className={`
                      text-[11px] transition-all duration-300 hidden md:block whitespace-nowrap
                      ${isActive ? "font-bold text-[#0d3881]" : "text-gray-400 group-hover:text-[#00235c] opacity-80"}
                    `}>
                      {item.label}
                    </span>
                  </div>
                </div>
              );

              return isProfileItem && isGuest ? (
                <button
                  key={item.src}
                  onClick={() => navigate("/signin")}
                  className="relative z-10 flex-1 h-full group"
                >
                  {ItemContent}
                </button>
              ) : (
                <Link
                  key={item.src}
                  to={item.src}
                  className="relative z-10 flex-1 h-full group"
                >
                  {ItemContent}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SideNavbar;

//  <div className="social-container">
//           <div className="social-links">
//             <a href="#" className="social-link bg-green-500">
//               <FaPhoneAlt className="social-icon" />
//             </a>
//             <a href="#" className="social-link bg-[#c66aa8]">
//               <MdMail className="social-icon" />
//             </a>
//             <a href="#" className="social-link bg-green-400">
//               <FaWhatsapp className="social-icon" />
//             </a>
//             <a href="#" className="social-link bg-[#007bb5]">
//               <PiTelegramLogoDuotone className="social-icon" />
//             </a>
//           </div>
//         </div>
