import React, { useState, useEffect, useContext } from "react";
import {
  ChevronDown,
  Venus,
  Mars,
  BookOpen,
  CreditCard,
  Monitor,
  LogOut,
  ChevronRight,
  Calendar,
  DollarSign,
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  Heart,
  Shield,
  Award,
  Activity,
  Users 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

import {
  getProfile,
  updateProfile,
  getPatientIdFromToken,
  uploadProfilePicture,
  getProfilePicture,
  getUserApplications,
  getUserPayments,
} from "../utils/api";
import defaultUserPic from "../assets/default-user.png";
import { useTranslation } from "react-i18next";
import { AuthContext } from "../context/AuthContext";
import "../styles/Profile.css";
import ProfileSkeleton from "../components/Skeleton/ProfileSkeleton";

const DATE_FIELDS = [
  "dateOfBirth",
  "cmipDate",
  "documentIssuedDate",
  "disabilityFrom",
  "disabilityTo",
];

const BOOLEAN_FIELDS = ["newsletter", "egisz", "disabilityIndefinitely"];

const SUBSCHEMA_TRANSLATION_GROUP = {
  diseases: "diseaseRecords",
  finalDiagnoses: "finalDiagnosisRecords",
  radiationDoses: "radiationDoseRecords",
  legalRepresentatives: "legalRepresentatives",
};

const SUBSCHEMA_CONFIG = {
  diseases: {
    title: "Disease Records",
    translationKey: "profile.diseaseRecords.title",
    fields: [
      { name: "startDate", label: "Start Date", type: "date" },
      { name: "endDate", label: "End Date", type: "date" },
      { name: "diagnosis", label: "Diagnosis", type: "text" },
      { name: "icdCode", label: "ICD Code", type: "text" },
      { name: "doctor", label: "Doctor", type: "text" },
    ],
  },
  finalDiagnoses: {
    title: "Final Diagnosis Records",
    translationKey: "profile.finalDiagnosisRecords.title",
    fields: [
      { name: "date", label: "Date", type: "date" },
      { name: "diagnosis", label: "Diagnosis", type: "text" },
      { name: "icdCode", label: "ICD Code", type: "text" },
      {
        name: "primary",
        label: "Primary/Secondary",
        type: "select",
        options: [
          { value: "1", label: "Primary" },
          { value: "2", label: "Secondary" },
        ],
      },
      { name: "doctorName", label: "Doctor Name", type: "text" },
      { name: "jobTitle", label: "Job Title", type: "text" },
      { name: "speciality", label: "Speciality", type: "text" },
    ],
  },
  radiationDoses: {
    title: "Radiation Dose Records",
    translationKey: "profile.radiationDoseRecords.title",
    fields: [
      { name: "date", label: "Date", type: "date" },
      { name: "researchType", label: "Research Type", type: "text" },
      { name: "effectiveDose", label: "Effective Dose", type: "text" },
      { name: "note", label: "Note", type: "text" },
    ],
  },
  legalRepresentatives: {
    title: "Legal Representatives",
    translationKey: "profile.legalRepresentatives.title",
    fields: [
      { name: "lastName", label: "Last Name", type: "text" },
      { name: "firstName", label: "First Name", type: "text" },
      { name: "middleName", label: "Middle Name", type: "text" },
      { name: "isCurrent", label: "Is Current", type: "checkbox" },
      { name: "birthday", label: "Birthday", type: "date" },
      {
        name: "gender",
        label: "Gender",
        type: "select",
        options: [
          { value: "", label: "Not Set" },
          { value: "Male", label: "Male" },
          { value: "Female", label: "Female" },
          { value: "Other", label: "Other" },
        ],
      },
      { name: "relationship", label: "Relationship", type: "text" },
      { name: "attitudeToPatient", label: "Attitude To Patient", type: "text" },
      { name: "documentOfAuthority", label: "Document Of Authority", type: "text" },
      { name: "documentType", label: "Document Type", type: "text" },
      { name: "series", label: "Series", type: "text" },
      { name: "number", label: "Number", type: "text" },
      { name: "whenIssued", label: "When Issued", type: "date" },
      { name: "issuedBy", label: "Issued By", type: "text" },
      { name: "snils", label: "SNILS", type: "text" },
      { name: "address", label: "Address", type: "text" },
      { name: "addressType", label: "Address Type", type: "text" },
      { name: "tenant", label: "Tenant", type: "text" },
      { name: "subjectOfRussia", label: "Subject Of Russia", type: "text" },
      { name: "district", label: "District", type: "text" },
      { name: "city", label: "City", type: "text" },
      { name: "settlement", label: "Settlement", type: "text" },
      { name: "street", label: "Street", type: "text" },
      { name: "house", label: "House", type: "text" },
      { name: "apartment", label: "Apartment", type: "text" },
      { name: "state", label: "State", type: "text" },
    ],
  },
};

const EMPTY_SUBSCHEMA_ITEMS = {
  diseases: {
    startDate: "",
    endDate: "",
    diagnosis: "",
    icdCode: "",
    doctor: "",
  },
  finalDiagnoses: {
    date: "",
    diagnosis: "",
    icdCode: "",
    primary: "1",
    doctorName: "",
    jobTitle: "",
    speciality: "",
  },
  radiationDoses: {
    date: "",
    researchType: "",
    effectiveDose: "",
    note: "",
  },
  legalRepresentatives: {
    lastName: "",
    firstName: "",
    middleName: "",
    isCurrent: false,
    birthday: "",
    gender: "",
    relationship: "",
    attitudeToPatient: "",
    documentOfAuthority: "",
    documentType: "",
    series: "",
    number: "",
    whenIssued: "",
    issuedBy: "",
    snils: "",
    address: "",
    addressType: "",
    tenant: "",
    subjectOfRussia: "",
    district: "",
    city: "",
    settlement: "",
    street: "",
    house: "",
    apartment: "",
    state: "",
  },
};

const baseInitialFormData = {
  patientId: "",
  email: "",
  firstName: "",
  middleName: "",
  lastName: "",
  gender: "Male",
  dateOfBirth: "",
  phoneNumber: "",
  additionalPhone: "",
  notes: "",
  comments: "",
  maxId: "",
  telegramNickname: "",
  telegramId: "",
  newsletter: false,
  egisz: false,
  instagram: "",
  vk: "",
  facebook: "",
  ok: "",
  contactPerson: "",
  contactPersonPhone: "",
  cmip: "",
  cmipDate: "",
  cmipOrgCode: "",
  snils: "",
  medInsuranceOrg: "",
  socialSupportCode: "",
  citizenship: "",
  documentType: "",
  documentSeries: "",
  documentNumber: "",
  documentIssuedDate: "",
  departmentCode: "",
  documentIssuedBy: "",
  inn: "",
  addressType: "",
  region: "",
  district: "",
  city: "",
  settlement: "",
  street: "",
  house: "",
  terrain: "",
  apartment: "",
  postcode: "",
  geocoordinates: "",
  registrationChange: "",
  maritalStatus: "",
  education: "",
  employment: "",
  placeOfWork: "",
  workSpecialty: "",
  changePlaceOfWork: "",
  changeOfPosition: "",
  disability: "",
  disabilityFrom: "",
  disabilityTo: "",
  disabilityIndefinitely: false,
  invalidGroup: "",
  disabilityType: "",
  disabilityPrimaryRepeated: "",
  notificationLanguage: "en",
  diseases: [],
  finalDiagnoses: [],
  radiationDoses: [],
  legalRepresentatives: [],
};

const sectionFields = [
  {
    translationKey: "profile.sections.basicInformation",
    icon: User,
    fields: [
      { name: "patientId", translationKey: "profile.patientId", type: "text", disabled: true, fullWidth: true },
      { name: "firstName", translationKey: "profile.firstName", type: "text", required: true },
      { name: "middleName", translationKey: "profile.middleName", type: "text" },
      { name: "lastName", translationKey: "profile.lastName", type: "text", required: true },
      {
        name: "gender",
        translationKey: "profile.gender",
        type: "select",
        required: true,
        options: [
          { value: "Male", label: "Male" },
          { value: "Female", label: "Female" },
          { value: "Other", label: "Other" },
        ],
      },
      { name: "dateOfBirth", translationKey: "profile.dateOfBirth", type: "date", required: true },
      { name: "email", translationKey: "profile.email", type: "email", disabled: true },
      {
        name: "notificationLanguage",
        translationKey: "profile.notificationLanguage",
        type: "select",
        options: [
          { value: "en", label: "English" },
          { value: "ru", label: "Russian" },
        ],
      },
    ],
  },
  {
    translationKey: "profile.sections.contacts",
    icon: Phone,
    fields: [
      { name: "phoneNumber", translationKey: "profile.phoneNumber", type: "phone", required: true },
      { name: "additionalPhone", translationKey: "profile.additionalPhone", type: "phone" },
      { name: "contactPerson", translationKey: "profile.contactPerson", type: "text" },
      { name: "contactPersonPhone", translationKey: "profile.contactPersonPhone", type: "phone" },
      { name: "maxId", translationKey: "profile.maxId", type: "text" },
      { name: "telegramNickname", translationKey: "profile.telegramNickname", type: "text" },
      { name: "telegramId", translationKey: "profile.telegramId", type: "text" },
      { name: "instagram", translationKey: "profile.instagram", type: "text" },
      { name: "vk", translationKey: "profile.vk", type: "text" },
      { name: "facebook", translationKey: "profile.facebook", type: "text" },
      { name: "ok", translationKey: "profile.ok", type: "text" },
      { name: "newsletter", translationKey: "profile.subscribedToNewsletter", type: "checkbox" },
      { name: "egisz", translationKey: "profile.egiszEnabled", type: "checkbox" },
    ],
  },
  {
    translationKey: "profile.sections.documents",
    icon: FileText,
    fields: [
      { name: "cmip", translationKey: "profile.cmip", type: "text" },
      { name: "cmipDate", translationKey: "profile.cmipDate", type: "date" },
      { name: "cmipOrgCode", translationKey: "profile.cmipOrgCode", type: "text" },
      { name: "snils", translationKey: "profile.snils", type: "text" },
      { name: "medInsuranceOrg", translationKey: "profile.medInsuranceOrg", type: "text" },
      { name: "socialSupportCode", translationKey: "profile.socialSupportCode", type: "text" },
      { name: "citizenship", translationKey: "profile.citizenship", type: "text" },
      { name: "documentType", translationKey: "profile.documentType", type: "text" },
      { name: "documentSeries", translationKey: "profile.documentSeries", type: "text" },
      { name: "documentNumber", translationKey: "profile.documentNumber", type: "text" },
      { name: "documentIssuedDate", translationKey: "profile.documentIssuedDate", type: "date" },
      { name: "departmentCode", translationKey: "profile.departmentCode", type: "text" },
      { name: "documentIssuedBy", translationKey: "profile.documentIssuedBy", type: "text" },
      { name: "inn", translationKey: "profile.inn", type: "text" },
    ],
  },
  {
    translationKey: "profile.sections.address",
    icon: MapPin,
    fields: [
      { name: "addressType", translationKey: "profile.addressType", type: "text" },
      { name: "region", translationKey: "profile.region", type: "text" },
      { name: "district", translationKey: "profile.district", type: "text" },
      { name: "city", translationKey: "profile.city", type: "text" },
      { name: "settlement", translationKey: "profile.settlement", type: "text" },
      { name: "street", translationKey: "profile.street", type: "text" },
      { name: "house", translationKey: "profile.house", type: "text" },
      { name: "terrain", translationKey: "profile.terrain", type: "text" },
      { name: "apartment", translationKey: "profile.apartment", type: "text" },
      { name: "postcode", translationKey: "profile.postcode", type: "text" },
      { name: "geocoordinates", translationKey: "profile.geocoordinates", type: "text" },
      { name: "registrationChange", translationKey: "profile.registrationChange", type: "text" },
    ],
  },
  {
    translationKey: "profile.sections.personalData",
    icon: Heart,
    fields: [
      { name: "maritalStatus", translationKey: "profile.maritalStatus", type: "text" },
      { name: "education", translationKey: "profile.education", type: "text" },
      { name: "employment", translationKey: "profile.employment", type: "text" },
      { name: "placeOfWork", translationKey: "profile.placeOfWork", type: "text" },
      { name: "workSpecialty", translationKey: "profile.workSpecialty", type: "text" },
      { name: "changePlaceOfWork", translationKey: "profile.changePlaceOfWork", type: "text" },
      { name: "changeOfPosition", translationKey: "profile.changeOfPosition", type: "text" },
    ],
  },
  {
    translationKey: "profile.sections.disability",
    icon: Shield,
    fields: [
      {
        name: "disability",
        translationKey: "profile.disability",
        type: "select",
        options: [
          { value: "", label: "Not Set" },
          { value: "Yes", label: "Yes" },
          { value: "No", label: "No" },
        ],
      },
      { name: "disabilityFrom", translationKey: "profile.disabilityFrom", type: "date" },
      { name: "disabilityTo", translationKey: "profile.disabilityTo", type: "date" },
      { name: "disabilityIndefinitely", translationKey: "profile.disabilityIndefinitely", type: "checkbox" },
      { name: "invalidGroup", translationKey: "profile.invalidGroup", type: "text" },
      { name: "disabilityType", translationKey: "profile.disabilityType", type: "text" },
      { name: "disabilityPrimaryRepeated", translationKey: "profile.disabilityPrimaryRepeated", type: "text" },
    ],
  },
  {
    translationKey: "profile.diseaseRecords.title",
    type: "subschema",
    schemaKey: "diseases",
    icon: Activity,
  },
  {
    translationKey: "profile.finalDiagnosisRecords.title",
    type: "subschema",
    schemaKey: "finalDiagnoses",
    icon: Award,
  },
  {
    translationKey: "profile.radiationDoseRecords.title",
    type: "subschema",
    schemaKey: "radiationDoses",
    icon: Activity,
  },
  {
    translationKey: "profile.legalRepresentatives.title",
    type: "subschema",
    schemaKey: "legalRepresentatives",
    icon: Users,
  },
  {
    translationKey: "profile.sections.additionalNotes",
    icon: FileText,
    fields: [
      { name: "notes", translationKey: "profile.notes", type: "textarea", fullWidth: true, rows: 4 },
      { name: "comments", translationKey: "profile.comments", type: "textarea", fullWidth: true, rows: 4 },
    ],
  },
];

const parseDate = (date) => {
  if (!date) return null;
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDateForInput = (value) => {
  if (!value) return "";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? ""
    : parsed.toISOString().split("T")[0];
};

const mapSubschemaArray = (value, key) => {
  if (!Array.isArray(value)) return [];

  if (key === "diseases") {
    return value.map((item) => ({
      ...EMPTY_SUBSCHEMA_ITEMS.diseases,
      ...item,
      startDate: formatDateForInput(item.startDate),
      endDate: formatDateForInput(item.endDate),
    }));
  }

  if (key === "finalDiagnoses") {
    return value.map((item) => ({
      ...EMPTY_SUBSCHEMA_ITEMS.finalDiagnoses,
      ...item,
      date: formatDateForInput(item.date),
      primary: item.primary || "1",
    }));
  }

  if (key === "radiationDoses") {
    return value.map((item) => ({
      ...EMPTY_SUBSCHEMA_ITEMS.radiationDoses,
      ...item,
      date: formatDateForInput(item.date),
    }));
  }

  if (key === "legalRepresentatives") {
    return value.map((item) => ({
      ...EMPTY_SUBSCHEMA_ITEMS.legalRepresentatives,
      ...item,
      birthday: formatDateForInput(item.birthday),
      whenIssued: formatDateForInput(item.whenIssued),
      isCurrent: Boolean(item.isCurrent),
    }));
  }

  return [];
};

const Profile = () => {
  const { t } = useTranslation();
  const { token, logout, syncPatientProfile, patient } = useContext(AuthContext);
  const navigate = useNavigate();
  const patientId = getPatientIdFromToken() || patient?.patientId || null;
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAppointments: 0,
    upcomingAppointments: 0,
    totalPayments: 0,
    currency: "USD",
  });

  const [formData, setFormData] = useState(baseInitialFormData);

  const [profileImage, setProfileImage] = useState(null);
  const [errors, setErrors] = useState({});
  const [fetchError, setFetchError] = useState("");

  const formatPatientIdForDisplay = (rawPatientId) => {
    if (!rawPatientId) return "";
    const sourcePrefix = "СОФ/Мос/Пац-";
    const translatedPrefix = t("profile.patientIdPrefix", sourcePrefix);

    if (typeof rawPatientId === "string" && rawPatientId.startsWith(sourcePrefix)) {
      return `${translatedPrefix}${rawPatientId.slice(sourcePrefix.length)}`;
    }

    return rawPatientId;
  };

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      if (!token) {
        return;
      }

      try {
        const response = await getProfile(patientId);
        const user = response.data;

        setFormData({
          ...baseInitialFormData,
          patientId: user.patientId || "",
          email: user.email || "",
          firstName: user.firstName || "",
          middleName: user.middleName || "",
          lastName: user.lastName || "",
          gender: user.gender || "Male",
          dateOfBirth: formatDateForInput(user.dateOfBirth),
          phoneNumber: user.phoneNumber || "",
          additionalPhone: user.additionalPhone || "",
          notes: user.notes || "",
          comments: user.comments || "",
          maxId: user.maxId || "",
          telegramNickname: user.telegramNickname || "",
          telegramId: user.telegramId || "",
          newsletter: Boolean(user.newsletter),
          egisz: Boolean(user.egisz),
          instagram: user.instagram || "",
          vk: user.vk || "",
          facebook: user.facebook || "",
          ok: user.ok || "",
          contactPerson: user.contactPerson || "",
          contactPersonPhone: user.contactPersonPhone || "",
          cmip: user.cmip || "",
          cmipDate: formatDateForInput(user.cmipDate),
          cmipOrgCode: user.cmipOrgCode || "",
          snils: user.snils || "",
          medInsuranceOrg: user.medInsuranceOrg || "",
          socialSupportCode: user.socialSupportCode || "",
          citizenship: user.citizenship || "",
          documentType: user.documentType || "",
          documentSeries: user.documentSeries || "",
          documentNumber: user.documentNumber || "",
          documentIssuedDate: formatDateForInput(user.documentIssuedDate),
          departmentCode: user.departmentCode || "",
          documentIssuedBy: user.documentIssuedBy || "",
          inn: user.inn || "",
          addressType: user.addressType || "",
          region: user.region || "",
          district: user.district || "",
          city: user.city || "",
          settlement: user.settlement || "",
          street: user.street || "",
          house: user.house || "",
          terrain: user.terrain || "",
          apartment: user.apartment || "",
          postcode: user.postcode || "",
          geocoordinates: user.geocoordinates || "",
          registrationChange: user.registrationChange || "",
          maritalStatus: user.maritalStatus || "",
          education: user.education || "",
          employment: user.employment || "",
          placeOfWork: user.placeOfWork || "",
          workSpecialty: user.workSpecialty || "",
          changePlaceOfWork: user.changePlaceOfWork || "",
          changeOfPosition: user.changeOfPosition || "",
          disability: user.disability || "",
          disabilityFrom: formatDateForInput(user.disabilityFrom),
          disabilityTo: formatDateForInput(user.disabilityTo),
          disabilityIndefinitely: Boolean(user.disabilityIndefinitely),
          invalidGroup: user.invalidGroup || "",
          disabilityType: user.disabilityType || "",
          disabilityPrimaryRepeated: user.disabilityPrimaryRepeated || "",
          notificationLanguage: user.notificationLanguage || "en",
          diseases: mapSubschemaArray(user.diseases, "diseases"),
          finalDiagnoses: mapSubschemaArray(user.finalDiagnoses, "finalDiagnoses"),
          radiationDoses: mapSubschemaArray(user.radiationDoses, "radiationDoses"),
          legalRepresentatives: mapSubschemaArray(user.legalRepresentatives, "legalRepresentatives"),
        });

        if (user.profileFileId) {
          try {
            const imgRes = await getProfilePicture(user.profileFileId);
            const base64 = btoa(
              new Uint8Array(imgRes.data).reduce(
                (data, byte) => data + String.fromCharCode(byte),
                ""
              )
            );
            if (isMounted) setProfileImage(`data:image/jpeg;base64,${base64}`);
          } catch {
            if (isMounted) setProfileImage(defaultUserPic);
          }
        } else {
          if (isMounted) setProfileImage(defaultUserPic);
        }
      } catch (error) {
        const errorMessage =
          error.response?.data?.message || t("profile.fetchFailed") ||
          "Failed to load profile.";
        setFetchError(errorMessage);
        toast.error(errorMessage);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, [patientId, t]);

  useEffect(() => {
    let isMounted = true;

    const fetchStats = async () => {
      if (!patientId) {
        if (isMounted) setStatsLoading(false);
        return;
      }

      try {
        const [applicationsRes, paymentsRes] = await Promise.all([
          getUserApplications(patientId),
          getUserPayments(patientId),
        ]);

        const applications = Array.isArray(applicationsRes?.data)
          ? applicationsRes.data
          : [];
        const now = new Date();
        const upcomingAppointments = applications.filter((app) => {
          const appointmentDate = parseDate(app.date || app.startTime);
          return appointmentDate && appointmentDate >= now && app.appointmentStatus !== "Cancelled";
        }).length;

        const paymentsArray = Array.isArray(paymentsRes?.data?.payments)
          ? paymentsRes.data.payments
          : [];
        const totalPayments = paymentsArray.reduce((sum, payment) => {
          const amount = Number(payment.finalAmount ?? payment.amount ?? 0);
          return sum + (Number.isFinite(amount) ? amount : 0);
        }, 0);
        const currency = paymentsArray?.[0]?.currency || "USD";

        if (isMounted) {
          setStats({
            totalAppointments: applications.length,
            upcomingAppointments,
            totalPayments,
            currency,
          });
        }
      } catch (error) {
        console.error("Profile stats fetch failed:", error);
      } finally {
        if (isMounted) setStatsLoading(false);
      }
    };

    fetchStats();

    return () => {
      isMounted = false;
    };
  }, [patientId]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handlePhoneChange = (name, phone) => {
    setFormData((prev) => ({ ...prev, [name]: phone }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubschemaChange = (schemaKey, index, fieldName, value) => {
    setFormData((prev) => {
      const list = Array.isArray(prev[schemaKey]) ? [...prev[schemaKey]] : [];
      const current = list[index] || { ...EMPTY_SUBSCHEMA_ITEMS[schemaKey] };
      list[index] = { ...current, [fieldName]: value };
      return { ...prev, [schemaKey]: list };
    });
  };

  const addSubschemaRecord = (schemaKey) => {
    setFormData((prev) => ({
      ...prev,
      [schemaKey]: [
        ...(Array.isArray(prev[schemaKey]) ? prev[schemaKey] : []),
        { ...EMPTY_SUBSCHEMA_ITEMS[schemaKey] },
      ],
    }));
  };

  const removeSubschemaRecord = (schemaKey, index) => {
    setFormData((prev) => {
      const list = Array.isArray(prev[schemaKey]) ? [...prev[schemaKey]] : [];
      list.splice(index, 1);
      return { ...prev, [schemaKey]: list };
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
      toast.error(t("profile.errors.invalidImage"));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(t("profile.errors.imageSize"));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setProfileImage(e.target.result);
    };
    reader.readAsDataURL(file);

    try {
      await uploadProfilePicture(file, patientId);
      toast.success(t("profile.uploadSuccess") || "Profile picture uploaded!");
    } catch (error) {
      console.error("Image upload failed:", error);
      toast.error(error.response?.data?.message || t("profile.uploadFailed"));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName)
      newErrors.firstName = t("profile.errors.firstName", "First name is required.");
    if (!formData.lastName)
      newErrors.lastName = t("profile.errors.lastName", "Last name is required.");
    if (!formData.gender)
      newErrors.gender = t("profile.errors.gender", "Gender is required.");
    if (!formData.dateOfBirth)
      newErrors.dateOfBirth = t("profile.errors.dateOfBirth", "Date of birth is required.");
    else {
      const dob = new Date(formData.dateOfBirth);
      if (Number.isNaN(dob.getTime())) {
        newErrors.dateOfBirth = t("profile.errors.invalidDateOfBirth", "Invalid date of birth.");
      }
      else if (dob > new Date())
        newErrors.dateOfBirth = t("profile.errors.futureDateOfBirth", "Date of birth cannot be in the future.");
    }
    if (!formData.phoneNumber)
      newErrors.phoneNumber = t("profile.errors.phoneNumber", "Phone number is required.");
    else if (!/^\+?\d{10,15}$/.test(formData.phoneNumber))
      newErrors.phoneNumber = t("profile.errors.invalidPhoneNumber", "Invalid phone number format.");
    if (
      formData.additionalPhone &&
      !/^\+?\d{10,15}$/.test(formData.additionalPhone)
    ) {
      newErrors.additionalPhone = t("profile.errors.invalidAdditionalPhone", "Invalid additional phone number format.");
    }
    if (
      formData.contactPersonPhone &&
      !/^\+?\d{10,15}$/.test(formData.contactPersonPhone)
    ) {
      newErrors.contactPersonPhone = "Invalid emergency contact phone format.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const normalizeSubschemaDate = (value) => (value ? value : null);

  const buildSubschemaPayload = (schemaKey) => {
    const values = Array.isArray(formData[schemaKey]) ? formData[schemaKey] : [];

    if (schemaKey === "diseases") {
      return values
        .map((item) => ({
          startDate: normalizeSubschemaDate(item.startDate),
          endDate: normalizeSubschemaDate(item.endDate),
          diagnosis: item.diagnosis || "",
          icdCode: item.icdCode || "",
          doctor: item.doctor || "",
        }))
        .filter((item) => Object.values(item).some((value) => value));
    }

    if (schemaKey === "finalDiagnoses") {
      return values
        .map((item) => ({
          date: normalizeSubschemaDate(item.date),
          diagnosis: item.diagnosis || "",
          icdCode: item.icdCode || "",
          primary: item.primary || "1",
          doctorName: item.doctorName || "",
          jobTitle: item.jobTitle || "",
          speciality: item.speciality || "",
        }))
        .filter((item) => Object.values(item).some((value) => value && value !== "1"));
    }

    if (schemaKey === "radiationDoses") {
      return values
        .map((item) => ({
          date: normalizeSubschemaDate(item.date),
          researchType: item.researchType || "",
          effectiveDose: item.effectiveDose || "",
          note: item.note || "",
        }))
        .filter((item) => Object.values(item).some((value) => value));
    }

    if (schemaKey === "legalRepresentatives") {
      return values
        .map((item) => ({
          lastName: item.lastName || "",
          firstName: item.firstName || "",
          middleName: item.middleName || "",
          isCurrent: Boolean(item.isCurrent),
          birthday: normalizeSubschemaDate(item.birthday),
          gender: item.gender || "",
          relationship: item.relationship || "",
          attitudeToPatient: item.attitudeToPatient || "",
          documentOfAuthority: item.documentOfAuthority || "",
          documentType: item.documentType || "",
          series: item.series || "",
          number: item.number || "",
          whenIssued: normalizeSubschemaDate(item.whenIssued),
          issuedBy: item.issuedBy || "",
          snils: item.snils || "",
          address: item.address || "",
          addressType: item.addressType || "",
          tenant: item.tenant || "",
          subjectOfRussia: item.subjectOfRussia || "",
          district: item.district || "",
          city: item.city || "",
          settlement: item.settlement || "",
          street: item.street || "",
          house: item.house || "",
          apartment: item.apartment || "",
          state: item.state || "",
        }))
        .filter((item) => Object.values(item).some((value) => value));
    }

    return [];
  };

  const buildPayload = () => {
    const payload = { ...formData };

    for (const key of DATE_FIELDS) {
      payload[key] = payload[key] || null;
    }

    for (const key of BOOLEAN_FIELDS) {
      payload[key] = Boolean(payload[key]);
    }

    payload.diseases = buildSubschemaPayload("diseases");
    payload.finalDiagnoses = buildSubschemaPayload("finalDiagnoses");
    payload.radiationDoses = buildSubschemaPayload("radiationDoses");
    payload.legalRepresentatives = buildSubschemaPayload("legalRepresentatives");

    return payload;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error(t("profile.errors.fixErrors"));
      return;
    }

    try {
      const response = await updateProfile(buildPayload());

      if (response.data?.patient) {
        syncPatientProfile(response.data.patient);
        toast.success(response.data.message || t("profile.saveSuccess"));
      } else {
        toast.warn(t("profile.saveWarning"));
      }
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error(error.response?.data?.message || t("profile.saveFailed"));
    }
  };

  if (loading) {
    return <ProfileSkeleton />;
  }

  const renderField = (field) => {
    const value = formData[field.name];
    const wrapperClass = `form-group ${field.fullWidth ? "full-width" : ""}`;
    const fieldLabel = field.translationKey ? t(field.translationKey) : field.label;

    if (field.type === "phone") {
      return (
        <div className={wrapperClass} key={field.name}>
          <label className="form-label">
            {fieldLabel} {field.required ? "*" : ""}
          </label>
          <PhoneInput
            country={"us"}
            value={value || ""}
            onChange={(phone) => handlePhoneChange(field.name, phone)}
            inputClass="form-input"
            containerClass="phone-input-container"
            buttonClass="phone-input-button"
          />
          {errors[field.name] && <p className="error-text">{errors[field.name]}</p>}
        </div>
      );
    }

    if (field.type === "select") {
      return (
        <div className={wrapperClass} key={field.name}>
          <label className="form-label">
            {fieldLabel} {field.required ? "*" : ""}
          </label>
          <div className="select-wrapper">
            <select
              name={field.name}
              value={value ?? ""}
              onChange={handleInputChange}
              className="form-select"
              disabled={field.disabled}
            >
              {field.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown size={20} className="select-icon" />
          </div>
          {errors[field.name] && <p className="error-text">{errors[field.name]}</p>}
        </div>
      );
    }

    if (field.type === "checkbox") {
      return (
        <div className={wrapperClass} key={field.name}>
          <label className="form-label" htmlFor={field.name}>
            {fieldLabel}
          </label>
          <input
            id={field.name}
            type="checkbox"
            name={field.name}
            checked={Boolean(value)}
            onChange={handleInputChange}
            className="h-5 w-5"
          />
          {errors[field.name] && <p className="error-text">{errors[field.name]}</p>}
        </div>
      );
    }

    if (field.type === "textarea") {
      return (
        <div className={wrapperClass} key={field.name}>
          <label className="form-label">
            {fieldLabel} {field.required ? "*" : ""}
          </label>
          <textarea
            name={field.name}
            value={value || ""}
            onChange={handleInputChange}
            rows={field.rows || 4}
            className="form-input"
          />
          {errors[field.name] && <p className="error-text">{errors[field.name]}</p>}
        </div>
      );
    }

    return (
      <div className={wrapperClass} key={field.name}>
        <label className="form-label">
          {fieldLabel} {field.required ? "*" : ""}
        </label>
        <input
          type={field.type || "text"}
          name={field.name}
          value={field.name === "patientId" ? formatPatientIdForDisplay(value) : value || ""}
          onChange={handleInputChange}
          className="form-input"
          disabled={field.disabled}
        />
        {errors[field.name] && <p className="error-text">{errors[field.name]}</p>}
      </div>
    );
  };

  const renderSubschemaSection = (schemaKey) => {
    const config = SUBSCHEMA_CONFIG[schemaKey];
    const records = Array.isArray(formData[schemaKey]) ? formData[schemaKey] : [];
    const configTitle = config.translationKey ? t(config.translationKey) : config.title;
    const translationGroup = SUBSCHEMA_TRANSLATION_GROUP[schemaKey];

    return (
      <div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "12px" }}>
          <button
            type="button"
            onClick={() => addSubschemaRecord(schemaKey)}
            className="save-button"
            style={{ width: "auto", padding: "8px 14px", fontSize: "14px" }}
          >
            + {t("profile.common.add", "Add")} {configTitle}
          </button>
        </div>

        {records.length === 0 && (
          <p style={{ color: "#64748b", marginBottom: "12px" }}>
            {t("profile.common.noRecordsAddedYet", "No records added yet.")}
          </p>
        )}

        {records.map((record, index) => (
          <div
            key={`${schemaKey}-${index}`}
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              padding: "14px",
              marginBottom: "12px",
              background: "#f8fafc",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
              <strong>{configTitle} #{index + 1}</strong>
              <button
                type="button"
                onClick={() => removeSubschemaRecord(schemaKey, index)}
                style={{ color: "#b91c1c", fontSize: "13px" }}
              >
                {t("profile.common.remove", "Remove")}
              </button>
            </div>

            <div className="form-grid">
              {config.fields.map((field) => {
                const value = record[field.name];
                const fieldLabel = translationGroup
                  ? t(`profile.${translationGroup}.${field.name}`, field.label)
                  : field.label;

                if (field.type === "checkbox") {
                  return (
                    <div className="form-group" key={`${schemaKey}-${index}-${field.name}`}>
                      <label className="form-label" htmlFor={`${schemaKey}-${index}-${field.name}`}>
                        {fieldLabel}
                      </label>
                      <input
                        id={`${schemaKey}-${index}-${field.name}`}
                        type="checkbox"
                        checked={Boolean(value)}
                        onChange={(e) =>
                          handleSubschemaChange(schemaKey, index, field.name, e.target.checked)
                        }
                        className="h-5 w-5"
                      />
                    </div>
                  );
                }

                if (field.type === "select") {
                  const localizedOptions = (field.options || []).map((option) => {
                    if (schemaKey === "finalDiagnoses" && field.name === "primary") {
                      if (option.value === "1") {
                        return { ...option, label: t("profile.common.primary", "Primary") };
                      }
                      if (option.value === "2") {
                        return { ...option, label: t("profile.common.secondary", "Secondary") };
                      }
                    }

                    if (schemaKey === "legalRepresentatives" && field.name === "gender") {
                      if (option.value === "") {
                        return { ...option, label: t("profile.common.notSet", "Not Set") };
                      }
                      if (option.value === "Male") {
                        return { ...option, label: t("profile.genderMale", "Male") };
                      }
                      if (option.value === "Female") {
                        return { ...option, label: t("profile.genderFemale", "Female") };
                      }
                      if (option.value === "Other") {
                        return { ...option, label: t("profile.genderOther", "Other") };
                      }
                    }

                    return option;
                  });

                  return (
                    <div className="form-group" key={`${schemaKey}-${index}-${field.name}`}>
                      <label className="form-label">{fieldLabel}</label>
                      <div className="select-wrapper">
                        <select
                          value={value || ""}
                          onChange={(e) =>
                            handleSubschemaChange(schemaKey, index, field.name, e.target.value)
                          }
                          className="form-select"
                        >
                          {localizedOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={20} className="select-icon" />
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="form-group" key={`${schemaKey}-${index}-${field.name}`}>
                    <label className="form-label">{fieldLabel}</label>
                    <input
                      type={field.type || "text"}
                      value={value || ""}
                      onChange={(e) =>
                        handleSubschemaChange(schemaKey, index, field.name, e.target.value)
                      }
                      className="form-input"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const footerActions = [
    {
      key: "applications",
      title: t("profile.footer.myApplications", "My Applications"),
      subtitle: t(
        "profile.footer.myApplicationsDesc",
        "View your appointments and consultation history"
      ),
      icon: BookOpen,
      iconClass: "bg-blue-100 text-blue-600",
      onClick: () => navigate("/bookAppointment", { state: { showAppointments: true } }),
    },
    {
      key: "payments",
      title: t("profile.footer.myPayments", "My Payments"),
      subtitle: t(
        "profile.footer.myPaymentsDesc",
        "View invoices and payment history"
      ),
      icon: CreditCard,
      iconClass: "bg-emerald-100 text-emerald-600",
      onClick: () => navigate("/payments"),
    },
    {
      key: "devices",
      title: t("profile.footer.myDevices", "My Devices"),
      subtitle: t(
        "profile.footer.myDevicesDesc",
        "Manage trusted devices and active sessions"
      ),
      icon: Monitor,
      iconClass: "bg-purple-100 text-purple-600",
      onClick: () => navigate("/devices"),
    },
    {
      key: "logout",
      title: t("profile.logout", "Logout"),
      subtitle: t("profile.footer.logoutDesc", "Sign out from your account"),
      icon: LogOut,
      iconClass: "bg-red-100 text-red-600",
      onClick: () => logout(),
    },
  ];

  return (
    <div className="profile-wrapper min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Fixed Save Button */}
      <div className="fixed top-24 right-8 z-50">
        <button
          onClick={handleSave}
          className="px-5 py-2.5 bg-[#0b3780] hover:bg-[#092f67] text-white font-semibold rounded-xl shadow-lg transition-all duration-200 mr-[175px] mt-8 cursor-pointer"
        >
          {t("profile.saveButton", "Save Changes")}
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero / Profile Header - Modern Card */}
          <div className="flex flex-col md:flex-row gap-6 items-start mt-8 mb-4">
            <div className="w-full md:w-48 shrink-0">
              <div className="relative group w-full">
                <div className="w-full h-56 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 shadow-sm">
                  <img
                    src={profileImage || defaultUserPic}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = defaultUserPic;
                    }}
                  />
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer rounded-xl"
                  title="Change photo"
                />
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-end mt-22">
              <div className="mt-4 rounded-xl w-[250px] border border-slate-200 bg-slate-50 p-4 space-y-3 self-stretch">
                <div className="flex items-center gap-2 text-slate-900">
                  <p className="text-lg font-bold leading-tight break-words">
                    {formData.lastName} {formData.firstName}
                  </p>
                  {formData.gender === "Female" ? (
                    <Venus size={18} className="text-pink-500" />
                  ) : (
                    <Mars size={18} className="text-blue-500" />
                  )}
                </div>
                <p className="text-sm text-slate-600 break-words">
                  <span className="font-medium">Patient ID:</span> {formatPatientIdForDisplay(formData.patientId) || "-"}
                </p>
                <p className="text-sm text-slate-600">
                  <span className="font-medium">Date of Birth:</span>{" "}
                  {formData.dateOfBirth ? new Date(formData.dateOfBirth).toLocaleDateString() : "-"}
                </p>
              </div>
            </div>
          </div>

        {/* Stats Cards - Modern Design */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-500 text-sm font-medium">My Appointments</p>
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
                <Calendar size={20} className="text-indigo-500" />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-800">
              {statsLoading ? "..." : stats.totalAppointments}
            </p>
            <p className="text-xs text-slate-400 mt-1">Total appointments made</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-500 text-sm font-medium">Total Payments</p>
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                <DollarSign size={20} className="text-emerald-500" />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-800">
              {statsLoading ? "..." : `${stats.currency} ${stats.totalPayments.toLocaleString()}`}
            </p>
            <p className="text-xs text-slate-400 mt-1">Total amount paid</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-500 text-sm font-medium">Upcoming</p>
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                <Clock size={20} className="text-amber-500" />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-800">
              {statsLoading ? "..." : stats.upcomingAppointments}
            </p>
            <p className="text-xs text-slate-400 mt-1">Appointments scheduled soon</p>
          </div>
        </div>

        {/* Form Sections - Accordion style or card groups */}
        <div className="space-y-6">
          {sectionFields.map((section) => {
            const SectionIcon = section.icon || FileText;
            return (
              <div key={section.translationKey || section.title} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <SectionIcon size={18} className="text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800">
                    {section.translationKey ? t(section.translationKey) : section.title}
                  </h3>
                </div>
                <div className="p-6">
                  {section.type === "subschema" ? (
                    renderSubschemaSection(section.schemaKey)
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {section.fields.map((field) => renderField(field))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          {footerActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.key}
                type="button"
                className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-all group text-left"
                onClick={action.onClick}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className={`w-10 h-10 rounded-full ${action.iconClass} flex items-center justify-center shrink-0`}>
                    <Icon size={20} />
                  </div>
                  <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-500 transition-colors mt-1" />
                </div>
                <p className="font-semibold text-slate-700 mt-3">{action.title}</p>
                <p className="text-sm text-slate-400 mt-1">{action.subtitle}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Profile;