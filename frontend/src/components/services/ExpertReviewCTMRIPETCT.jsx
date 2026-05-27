import React from 'react';

export default ({ formData, handleInputChange, handleCheckboxChange, t }) => {
  console.log('ExpertReviewCTMRIPETCT module loaded');

  const description = (
    <>
      <strong>{t('expert_review.description_title', 'Description of the service')}</strong><br />
      {t('expert_review.description_intro', 'Computed tomography (CT), magnetic resonance imaging (MRI), as well as positron emission tomography (PET-CT) belong to modern methods of radiation diagnostics, which allow to obtain images of internal organs, make a diagnosis or evaluate the effectiveness of the treatment. The success of therapy directly depends on the correct interpretation of the data.')}<br /><br />

      {t('expert_review.second_opinion', 'If you doubt the correctness of the conclusion on the study, or want to get a second competent opinion, our specialists can remotely study the results of radiation diagnostics and give an expert opinion.')}<br /><br />

      {t('expert_review.convenience', 'It\'s convenient: the courier will deliver the disk (for Moscow) or our technical service will help you download data from your disk to the cloud storage.')}<br /><br />

      <strong>{t('expert_review.term_title', 'TERM OF EXPERT REVIEW')}</strong><br />
      {t('expert_review.term_details', '3-7 working days depending on the complexity of the case and the number of studies. As a result, you will receive a conclusion in the format of a PDF file.')}<br />
    </>
  );

  const renderFields = () => {
    return (
      <div style={{ marginBottom: '15px' }}>
        <label
          htmlFor="expertReviewService"
          style={{
            display: 'block',
            fontFamily: "'Quicksand', sans-serif",
            fontSize: '14px',
            color: '#333',
            marginBottom: '5px',
          }}
        >
          {t('expert_review.service_label', 'Service')}
        </label>
        <select
          id="expertReviewService"
          name="expertReviewService"
          value={formData.expertReviewService || 'Expert review of CT'}
          onChange={handleInputChange}
          style={{
            width: '100%',
            padding: '8px',
            fontFamily: "'Quicksand', sans-serif",
            fontSize: '14px',
            color: '#333',
            border: '1px solid #ccc',
            borderRadius: '4px',
            backgroundColor: '#fff',
            boxSizing: 'border-box',
          }}
        >
          <option value="Expert review of CT">
            {t('expert_review.option1', 'Expert review of CT')}
          </option>
          <option value="Expert review of MRI">
            {t('expert_review.option2', 'Expert review of MRI')}
          </option>
          <option value="Expert review of PET-CT">
            {t('expert_review.option3', 'Expert review of PET-CT')}
          </option>
          <option value="Expert review of CT+MRI">
            {t('expert_review.option4', 'Expert review of CT+MRI')}
          </option>
        </select>
      </div>
    );
  };

  const result = {
    description,
    renderFields,
  };

  console.log('Returning from ExpertReviewCTMRIPETCT:', result);
  return result;
};