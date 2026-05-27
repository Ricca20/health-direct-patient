import React from 'react';

export default ({ formData, handleInputChange, handleCheckboxChange, t }) => {
  console.log('MedicalSupport module loaded');

  const description = (
    <>
      <strong>{t('medical_support.description_title', 'Description of the service')}</strong><br />
      {t('medical_support.description_intro', 'The success of treatment depends on the doctor\'s involvement in the process. Unfortunately, the realities of the health care system involve a multi-stage approach to examination and treatment, where each specialist is limited by his area of responsibility. In order not to miss the important thing, Health-Direct offers to fix the supervising doctor who will always be aware of the events taking place: to control appointments, the sufficiency of drug therapy, the stability of the patient\'s condition, provide support to relatives, give recommendations on care, select a diet. At the same time, the patient can be treated in any medical institution (both in budget and private clinics), but be in touch and receive an independent assessment of what is happening (second opinion).')}<br /><br />

      {t('medical_support.alternative_treatment', 'If the points of view on treatment are fundamentally different, Health-Direct will redirect the patient to proven specialists and continue to monitor the quality of medical services provided.')}<br />
    </>
  );

  const renderFields = () => {
    return null; // No additional fields beyond the common ones
  };

  const result = {
    description,
    renderFields,
  };

  console.log('Returning from MedicalSupport:', result);
  return result;
};