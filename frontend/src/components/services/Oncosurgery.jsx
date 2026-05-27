import React from 'react';

export default ({ formData, handleInputChange, handleCheckboxChange, t, handleServiceClick }) => {
  console.log('Oncosurgery module loaded');

  const handleConsiliumRedirect = () => {
    handleServiceClick('International Oncology Consilium');
  };

  const description = (
    <>
      <strong>{t('oncosurgery.description_title', 'Description of the service')}</strong><br />
      {t('oncosurgery.description_intro', 'The Health-Direct project team implements all stages of specific oncological treatment, including one of the most difficult - surgical.')}<br /><br />

      {t('oncosurgery.surgery_details', 'Any surgical treatment is a serious test for the patient. Surgery in Health-Direct is distinguished by an individualized approach, starting from the preparation stage. Even before the operation, the patient under the supervision of specialists begins to receive therapy to minimize postoperative complications and "stabilize" current chronic diseases. In the early postoperative period, a team of anesthesiologists-resuscitators works personally with the patient, which distinguishes assistance in Health-Direct from "flow" surgery.')}<br /><br />

      {t('oncosurgery.postoperative_care', 'Even after major cytoreductive operations, patients are adequately anesthetized (minimum use of narcotic analgesics), quickly get in shape: they begin to eat and drink while in the intensive care unit (both special enteral nutrition and specially selected diet food), sit in bed and walk. On average, it takes no more than 1.5-2 days to be in the intensive care unit even after the most extensive interventions. After the transfer to the specialized department, the doctors continue rehabilitation. After the control examination on the 7-9th day, there is an discharge. These terms, as well as the physical status of the patient, are extremely important for the appointment of further drug or radiation therapy.')}<br /><br />

      {t('oncosurgery.consilium_prompt', 'To determine the tactics of further treatment after surgery, use the "')}
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          handleConsiliumRedirect();
        }}
        style={{ color: '#0000FF', textDecoration: 'underline' }}
      >
        {t('oncosurgery.consilium_link', 'International Consilium')}
      </a>
      {t('oncosurgery.consilium_prompt_end', '" service in Health-Direct.')}<br /><br />

      {t('oncosurgery.consultation_prompt', 'For surgical treatment, make an appointment for an initial consultation with our expert surgeons.')}<br />
    </>
  );

  const renderFields = () => {
    return null; // No additional fields beyond the common ones
  };

  const result = {
    description,
    renderFields,
  };

  console.log('Returning from Oncosurgery:', result);
  return result;
};