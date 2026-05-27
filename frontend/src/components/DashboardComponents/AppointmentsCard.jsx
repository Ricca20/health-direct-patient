import React, { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { LuAlarmClockCheck } from 'react-icons/lu';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { getUserApplications } from '../../utils/api';
import moment from 'moment-timezone';
import '../../styles/AppointmentsCard.css';

const AppointmentCard = () => {
  const { t } = useTranslation();
  const { patient, profileCompleted } = useContext(AuthContext);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!profileCompleted) {
        setLoading(false);
        return;
      }
      try {
        const response = await getUserApplications(patient?.patientId);
        const data = response.data;

        const formattedAppointments = data.map(app => {
          const date = app.date
            ? moment.utc(app.date).tz('Europe/Moscow').format('DD MMM YYYY')
            : t('appointments.no_date');

          const start = app.startTime
            ? moment.utc(app.startTime).tz('Europe/Moscow').format('HH:mm')
            : null;

          const end = app.endTime
            ? moment.utc(app.endTime).tz('Europe/Moscow').format('HH:mm')
            : null;

          return {
            service: app.serviceType || t('appointments.no_service_name'),
            date,
            time: start && end ? `${start} - ${end}` : t('appointments.no_time'),
          };
        });

        setAppointments(formattedAppointments);
      } catch (error) {
        console.error('Error fetching appointments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [profileCompleted, t, patient]);

  return (
    <div className="appointment-card">
      <div className="appointment-card-gradient" />
      <div className="appointment-card-header">
        <div>
          <h3 className="appointment-title">{t('appointments_card.title')}</h3>
          <p className="appointment-subtitle">
            {t('appointments_card.subtitle')}
          </p>
        </div>
        <LuAlarmClockCheck className="appointment-icon" />
      </div>

      <div className="appointment-list">
        {loading ? (
          <p className="appointment-loading">{t('appointments.loading')}</p>
        ) : appointments.length === 0 ? (
          <div
            className="appointment-card"
            style={{
              background: '#ffffff',
              color: '#13597F',
              borderRadius: '8px',
              overflow: 'hidden',
              marginBottom: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            <div
              style={{
                padding: '16px',
                textAlign: 'center',
              }}
            >
              <p
                style={{
                  fontSize: '0.9rem',
                  color: '#13597F',
                  margin: '0',
                }}
              >
                {t('appointments.no_appointments_available')}
              </p>
            </div>
          </div>
        ) : (
          appointments.slice(0, 3).map((appointment, index) => (
            <div key={index} className="appointment-item">
              <h4 className="appointment-service">{appointment.service}</h4>
              <p className="appointment-date">{appointment.date}</p>
              <p className="appointment-time">{appointment.time}</p>
            </div>
          ))
        )}
        <Link to="/appointments">
          <button className="appointment-button">
            {t('appointments_card.button')}
          </button>
        </Link>
      </div>
    </div>
  );
};

export default AppointmentCard;
