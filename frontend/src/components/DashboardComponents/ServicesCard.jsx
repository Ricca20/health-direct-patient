import { Monitor } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { FaXRay } from "react-icons/fa";
import { FaPeopleGroup } from "react-icons/fa6";
import { LuDna, LuFilePlus2, LuUsers } from "react-icons/lu";
import { RiMicroscopeFill } from "react-icons/ri";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import "../../styles/ServicesCard.css";

const ServicesCard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate(); // Initialize the navigate function
  
  const services = [
    {
      icon: Monitor,
      title: t("services_card.service1"),
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      icon: RiMicroscopeFill,
      title: t("services_card.service2"),
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      icon: LuDna,
      title: t("services_card.service3"),
      bgColor: "bg-blue-900",
      iconColor: "text-white",
      textColor: "text-white",
    },
    {
      icon: LuUsers,
      title: t("services_card.service4"),
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      icon: FaPeopleGroup,
      title: t("services_card.service5"),
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      icon: FaXRay,
      title: t("services_card.service6"),
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600",
    },
  ];

  // Function to handle navigation to order service page
  const handleOrderService = () => {
    navigate("/order-service");
  };

  return (
    <div className="services-card">
      <div className="services-header">
        <div>
          <h3 className="services-title">{t("services_card.title")}</h3>
          <p className="services-subtitle">{t("services_card.subtitle")}</p>
        </div>
        <div className="service-card-rh">
          {/* Add onClick handler to the button */}
          <button onClick={handleOrderService}>
            {t("services_card.title")}
          </button>
          <LuFilePlus2 size={60} className="icon-right" />
        </div>
      </div>

      <div className="services-list">
        {services.map((service, index) => {
          const IconComponent = service.icon;
          return (
            <button key={index} className="service-button">
              <div className="service-icon">
                <IconComponent size={20} className="icon-white" />
              </div>
              <span className="service-title">{service.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
export default ServicesCard;