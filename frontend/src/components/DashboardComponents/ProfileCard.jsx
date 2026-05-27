import React, { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AuthContext } from "../../context/AuthContext";
import {
  getProfile,
  getProfilePicture,
  getPatientIdFromToken,
} from "../../utils/api";
import defaultUserPic from "../../assets/default-user.png";
import "../../styles/ProfileCard.css";

const ProfileCard = () => {
  const { t } = useTranslation();
  const { patient } = useContext(AuthContext);
  const [profileImage, setProfileImage] = useState(defaultUserPic);
  const [profileData, setProfileData] = useState(null);

  const patientId = getPatientIdFromToken() || patient?.patientId || null;

  // calculate age helper
  const calculateAge = (dobString) => {
    if (!dobString) return t("profile_card.ageUnknown");
    const dob = new Date(dobString);
    if (isNaN(dob)) return t("profile_card.ageUnknown");
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return `${age} ${t("profile_card.years")}`;
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await getProfile(patientId);
        const data = response.data;
        setProfileData(data);

        if (data?.profileFileId) {
          try {
            const res = await getProfilePicture(data.profileFileId);
            const base64 = btoa(
              new Uint8Array(res.data).reduce(
                (str, byte) => str + String.fromCharCode(byte),
                ""
              )
            );
            setProfileImage(`data:image/jpeg;base64,${base64}`);
          } catch {
            setProfileImage(defaultUserPic);
          }
        } else {
          setProfileImage(defaultUserPic);
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        setProfileData(null);
        setProfileImage(defaultUserPic);
      }
    };

    fetchProfile();
  }, [patientId]);

  
  const fullName = profileData
    ? `${profileData.firstName || ""} ${profileData.lastName || ""}`.trim() ||
      t("profile_card.name")
    : t("profile_card.name");

  const ageText = profileData?.dateOfBirth
    ? calculateAge(profileData.dateOfBirth)
    : t("profile_card.ageUnknown");

  const phoneText = profileData?.phoneNumber || t("profile_card.phoneUnknown");
  const emailText = profileData?.email || t("profile_card.emailUnknown");

  return (
    <div className="profile-card">
      <div className="profile-content">
        <div className="profile-image">
          <img
            src={profileImage}
            alt="Profile"
            onError={(e) => {
              e.target.src = defaultUserPic;
            }}
          />
        </div>
        <h3 className="profile-name">{fullName}</h3>
        <div className="profile-details">
          <p>{ageText}</p>
          <p>+{phoneText}</p>
          <p>{emailText}</p>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
