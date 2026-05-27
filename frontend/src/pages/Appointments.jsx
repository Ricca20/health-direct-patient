import React, {
  useState,
  useEffect,
  useCallback,
  useContext,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import { FaThList } from "react-icons/fa";
import { BsFillGridFill } from "react-icons/bs";
import { LuAlarmClockCheck } from "react-icons/lu";
import { useTranslation } from "react-i18next";
import { AuthContext } from "../context/AuthContext";
import { getUserApplications } from "../utils/api";
import DatePicker from "react-datepicker";
import ProfilePopup from "../components/ProfilePopup";
import ListItem from "../components/ListItem";
import CardItem from "../components/CardItem";
import "../styles/Appointments.css";
import "react-datepicker/dist/react-datepicker.css";
import AppointmentsSkeleton from "../components/Skeleton/AppointmentsSkeleton";

function parseDate(date) {
  if (!date) return null;
  if (date instanceof Date) return date;

  const iso = new Date(date);
  if (!isNaN(iso)) return iso;

  if (typeof date === "string" && date.includes("/")) {
    const [day, month, year] = date.split("/");
    if (day && month && year) {
      const d = new Date(`${year}-${month}-${day}`);
      return isNaN(d.getTime()) ? null : d;
    }
  }

  return null;
}

const Appointments = () => {
  const { t } = useTranslation();
  const { patient, profileCompleted, token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(!!token && !profileCompleted);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!profileCompleted || !patient?.patientId) {
        setLoading(false);
        return;
      }

      try {
        const response = await getUserApplications(patient?.patientId);
        console.log(response.data)
        const data = response.data.map((app) => ({
          id: app._id,
          applicationId: app.applicationId,
          serviceName: app.serviceType || "No Service Name",
          appointmentDate: parseDate(app.date),
          appointmentTime: `${app.startTime || ""} - ${app.endTime || ""}`,
          status: app.appointmentStatus || "Pending",
          createdAt: parseDate(app.createdAt),
        }));
        setOrders(data);
      } catch (error) {
        console.error("Error fetching applications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [profileCompleted, patient]);

  useEffect(() => {
    // Show skeleton for 2 seconds
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer); // cleanup
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowFilterDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filterOrders = useCallback(() => {
    return orders.filter((order) => {
      const matchesSearch =
        !searchTerm ||
        order.serviceName?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = !statusFilter || order.status === statusFilter;
      const matchesDateRange =
        (!startDate || (order.createdAt && order.createdAt >= startDate)) &&
        (!endDate || (order.createdAt && order.createdAt <= endDate));
      return matchesSearch && matchesStatus && matchesDateRange;
    });
  }, [orders, searchTerm, statusFilter, startDate, endDate]);

  const filteredOrders = filterOrders();

  const handleOrderServiceClick = () => {
    navigate("/order-service");
  };

  const toggleFilterDropdown = () => {
    setShowFilterDropdown(!showFilterDropdown);
  };

  const applyFilters = () => {
    setShowFilterDropdown(false);
  };

  const handleViewDetails = (id) => {
    const encodedId = encodeURIComponent(id);
    navigate(`/appointments/${encodedId}`);
  };

  return (
    <>
      <div
        className={`appointments-wrapper max-w-[1200px] mx-auto px-4 md:px-10 py-6 ${
          token && !profileCompleted ? "grayed-out" : ""
        }` }
      >
        <div className="appointments-content custom-scrollbar-2">
          <div className="appointments-header">
            <div className="appointments-header-top">
              <div>
                <h1 className="appointments-title">
                  {t("appointments.title")}
                </h1>
                <p className="appointments-subtitle">
                  {t("appointments.subtitle")}
                </p>
              </div>
              <div className="appointments-actions">
                <button
                  onClick={() =>
                    setViewMode(viewMode === "grid" ? "list" : "grid")
                  }
                  className="view-toggle-button"
                  disabled={token && !profileCompleted}
                >
                  {viewMode === "grid" ? (
                    <FaThList className="toggle-icon-switch" />
                  ) : (
                    <BsFillGridFill className="toggle-icon-switch" />
                  )}
                </button>
                {/*
                <div className="clock-icon">
                  <LuAlarmClockCheck className="clock-icon-size" />
                </div>
                */}
              </div>
            </div>

            <div className="appointments-filters">
              <input
                type="text"
                placeholder={t("appointments.search_placeholder")}
                className="appointments-search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={token && !profileCompleted}
              />
              <div className="custom-filter-dropdown" ref={dropdownRef}>
                <button
                  className="filter-dropdown-toggle"
                  onClick={toggleFilterDropdown}
                  disabled={token && !profileCompleted}
                >
                  {t("appointments.filter_label")}
                </button>
                {showFilterDropdown && (
                  <div className="filter-dropdown-content">
                    <div className="filter-section">
                      <label className="filter-label">
                        {t("appointments.status_label")}
                      </label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="appointments-status-select"
                      >
                        <option value="">{t("appointments.filter_all")}</option>
                        <option value="pending">
                          {t("appointments.status.pending")}
                        </option>
                        <option value="processing">
                          {t("appointments.status.processing")}
                        </option>
                        <option value="completed">
                          {t("appointments.status.completed")}
                        </option>
                        <option value="failed">
                          {t("appointments.status.failed")}
                        </option>
                      </select>
                    </div>
                    <div className="filter-section">
                      <label className="filter-label">
                        {t("appointments.date_range_label")}
                      </label>
                      <div className="date-range-filter">
                        <DatePicker
                          selected={startDate}
                          onChange={(date) => setStartDate(date)}
                          selectsStart
                          startDate={startDate}
                          endDate={endDate}
                          dateFormat="MMM dd, yyyy"
                          placeholderText={t("appointments.date_from")}
                          className="appointments-date-picker"
                        />
                        <DatePicker
                          selected={endDate}
                          onChange={(date) => setEndDate(date)}
                          selectsEnd
                          startDate={startDate}
                          endDate={endDate}
                          minDate={startDate}
                          dateFormat="MMM dd, yyyy"
                          placeholderText={t("appointments.date_to")}
                          className="appointments-date-picker"
                        />
                      </div>
                    </div>
                    <button
                      className="apply-filters-button"
                      onClick={applyFilters}
                    >
                      {t("appointments.apply_filters")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="appointments-body">
            {loading ? (
              <AppointmentsSkeleton viewMode={viewMode} />
            ) : filteredOrders.length === 0 ? (
              <p className="no-appointments">{t("appointments.no_results")}</p>
            ) : viewMode === "grid" ? (
              <div className="appointments-grid">
                {filteredOrders.map((order) => (
                  <CardItem
                    key={order.applicationId || order.id}
                    item={order}
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </div>
            ) : (
              <div className="appointments-list">
                {filteredOrders.map((order) => (
                  <ListItem
                    key={order.applicationId || order.id}
                    item={order}
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="appointments-button-wrapper">
          <button
            className="appointments-button"
            disabled={token && !profileCompleted}
            onClick={handleOrderServiceClick}
          >
            {t("appointments.button")}
          </button>
        </div>
        <div className="appointments-spacer"></div>
      </div>

      {token && !profileCompleted && (
        <ProfilePopup onClose={() => setShowPopup(false)} />
      )}
    </>
  );
};

export default Appointments;
