import React from 'react';

export default ({ formData, handleInputChange, handleCheckboxChange, t }) => {
  console.log('PETCT module loaded');

  const description = (
    <>
      <strong>{t('petct.description_title', 'Description of the service')}</strong><br />
      {t('petct.description_intro', 'PET-CT is an effective and modern method of diagnosing cancer, which combines the capabilities of positron emission and computed tomography. The introduction of a special substance that accumulates in the foci of a malignant tumor allows you to establish the stage of a malignant tumor with a high degree of confidence. PET-CT is able to diagnose those foci that cannot be detected by ultrasound, radiography, CT or MRI.')}<br /><br />

      {t('petct.waiting_period', 'The standard waiting period for PET-CT for MHI can reach several months. Cancer patients do not always have that much time at their disposal. The Health-Direct project can enroll you for PET-CT diagnostics within 3-5 working days from the date of application, depending on your location.')}<br />
    </>
  );

  const renderFields = () => {
    return null; // No additional fields beyond the common ones
  };

  const result = {
    description,
    renderFields,
  };

  console.log('Returning from PETCT:', result);
  return result;
};