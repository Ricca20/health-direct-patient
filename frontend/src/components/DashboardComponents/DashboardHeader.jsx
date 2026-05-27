import React, { useContext, useEffect, useState } from "react";
import { BiSolidBellRing } from "react-icons/bi";
import { IoLanguage } from "react-icons/io5";
import { MdOutlineLogout } from "react-icons/md";
import { AuthContext } from "../../context/AuthContext";
import defaultUserPic from "../../assets/default-user.png";
import { getProfilePicture } from "../../utils/api";
import { useTranslation } from "react-i18next";

const DashboardHeader = () => {
  const { patient, logout } = useContext(AuthContext);
  const [profileImage, setProfileImage] = useState(defaultUserPic);
  const { t } = useTranslation();

  const fullName = patient
    ? `${patient.firstName || ""} ${patient.lastName || ""}`.trim()
    : t("dashboard_header.placeholder_name");

  // Fetch image using fileId
  useEffect(() => {
    const loadProfilePicture = async () => {
      if (patient?.profileFileId) {
        try {
          const buffer = await getProfilePicture(patient.profileFileId);
          const base64 = btoa(
            new Uint8Array(buffer).reduce(
              (data, byte) => data + String.fromCharCode(byte),
              ""
            )
          );
          setProfileImage(`data:image/jpeg;base64,${base64}`);
        } catch (error) {
          console.warn("Could not load profile picture:", error);
        }
      }
    };

    loadProfilePicture();
  }, [patient?.profileFileId]);

  return (
    <div className="bg-[#f7f7f7] p-2 md:p-4 rounded-lg mb-4">
      <div className="flex items-center flex-col space-y-4 md:flex-row justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-full overflow-hidden border">
            <img
              src={profileImage}
              alt="Profile"
              className="w-full h-full object-cover"
              onError={(e) => (e.target.src = defaultUserPic)}
            />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#c66aa8]">
              {t("dashboard_header.welcome")} {fullName}
            </h1>
            <p className="text-gray-800">{t("dashboard_header.greeting")}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            className="p-2 bg-[#195e83] text-white rounded-full hover:bg-blue-700 transition-colors"
            title={t("dashboard_header.language_tooltip")}
            onClick={() => alert(t("dashboard_header.language_alert"))}
          >
            <IoLanguage size={20} />
          </button>
          <button
            className="p-2 bg-[#195e83] text-white rounded-full hover:bg-blue-700 transition-colors"
            title={t("dashboard_header.notifications_tooltip")}
            onClick={() => alert(t("dashboard_header.notifications_alert"))}
          >
            <BiSolidBellRing size={20} />
          </button>
          <button
            className="p-2 bg-[#195e83] text-white rounded-full hover:bg-blue-700 transition-colors"
            title={t("dashboard_header.logout_tooltip")}
            onClick={logout}
          >
            <MdOutlineLogout size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;