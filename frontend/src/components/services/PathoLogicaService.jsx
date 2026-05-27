import React from 'react';

export default ({ formData, handleInputChange, handleCheckboxChange, t }) => {
  console.log('PathoLogicaService module loaded');

  const description = (
    <>
      <strong>{t('pathologica_service.description_title', 'Description of the service')}</strong><br />
      {t('pathologica_service.description_intro', 'PathoLogica Service is a unique remote service that provides a full range of pathophorological studies (cytological, histological, immunohistochemical, molecular genetic).')}<br /><br />

      <strong>{t('pathologica_service.services_title', 'SERVICES:')}</strong><br /><br />

      1. {t('pathologica_service.service1', 'Primary cytological / histological examination.')}<br /><br />
      {t('pathologica_service.service1_cytological', 'Cytological examination involves the study of the features of the structure of cells and non-cellular elements in order to diagnose benign or malignant neoplasms. The cytological method is also used to assess changes in cells during treatment and to diagnose recurrence of the disease. The advantages of this study are ease of execution, minimal invasiveness for the patient, relative safety and painlessness of obtaining the material, speed of the study.')}<br /><br />
      {t('pathologica_service.service1_histological', 'The difference between histological examination and cytological examination is that not cells are studied, but tissue samples. This is a more complex research method, since the studied tissues undergo multi-level processing and preparation.')}<br /><br />
      {t('pathologica_service.service1_additional', 'If clarifying diagnostics is necessary, immunohistochemical, immunocytochemical and molecular genetic studies are used.')}<br /><br />

      2. {t('pathologica_service.service2', 'Expert primary cytological/histological examination.')}<br /><br />
      {t('pathologica_service.service2_details', 'The study will be carried out by leading experts of PathoLogica Service. If necessary, foreign experts will be involved in the study.')}<br /><br />

      3. {t('pathologica_service.service3', 'Consultative review of finished cytological / histological preparations.')}<br /><br />
      {t('pathologica_service.service3_details', 'If you have ready-made drugs (glasses, paraffin blocks) that have previously been tested, but you doubt the correctness of the diagnosis and want to get a second opinion, PathoLogica Service employees will perform a consultative review of the submitted material. If necessary, additional consultants will be involved in the review.')}<br /><br />

      4. {t('pathologica_service.service4', 'Expert review of finished cytological / histological preparations.')}<br /><br />
      {t('pathologica_service.service4_details', 'The consultative review will be carried out by the leading experts of PathoLogica Service. If necessary, foreign experts will be involved in the revision.')}<br /><br />
      {t('pathologica_service.service4_process', 'On the day of application, the courier will pick up the glass and blocks. Next, the pathologist will conduct a review, if necessary, convene a consilium with the involvement of both domestic and foreign specialists from leading institutions and send a final conclusion with a digital image of suspicious (pathological) areas in high resolution.')}<br /><br />
      {t('pathologica_service.service4_conclusion', 'Convenient, fast, high-quality!')}<br /><br />

      <strong>{t('pathologica_service.how_to_use_title', 'HOW TO USE PATHOLOGICA SERVICE?')}</strong><br /><br />

      <strong>{t('pathologica_service.step1_title', 'Step 1. Submit an application')}</strong><br />
      {t('pathologica_service.step1_details', 'To do this, you need to register in your personal account and provide all the necessary information about the current disease, attach the available documents, fill in the delivery data. You can also make an application with the help of the PathoLogica Service manager in the office.')}<br /><br />

      <strong>{t('pathologica_service.step2_title', 'Step 2. Pay for the study')}</strong><br />
      {t('pathologica_service.step2_details', 'After filling out the application on the website, you will receive a letter to the specified e-mail with a link to the payment, by clicking on which you can make the payment. Payment is made through one of the online services. The electronic cash receipt will come to the mail specified during payment.')}<br /><br />

      <strong>{t('pathologica_service.step3_title', 'Step 3. Transfer the material and documents to the courier')}</strong><br />
      {t('pathologica_service.step3_details', 'After filling out the application, the PathoLogica Service manager will contact you during working hours to agree on the date and time of transfer of material and documents to the courier at the specified address. If you wish, you can deliver the materials to the office yourself, having previously contacted the managers of PathoLogica Service.')}<br /><br />

      <strong>{t('pathologica_service.step4_title', 'Step 4. Delivery')}</strong><br />
      {t('pathologica_service.step4_details', 'We provide free courier delivery throughout Russia. Delivery time is 1-7 days (depending on the distance of the settlement from the city of Moscow) by the courier service ')}
      <a
        href="https://dostavista.ru/?utm_source=google.com&utm_medium=organic&utm_campaign=google.com&utm_referrer=google.com"
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: '#0000FF', textDecoration: 'underline' }}
      >
        Dostavista
      </a>
      {t('pathologica_service.step4_details_middle', ' or ')}
      <a
        href="https://www.cdek.ru/ru"
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: '#0000FF', textDecoration: 'underline' }}
      >
        SDEC
      </a>
      {t('pathologica_service.step4_details_end', '.')}<br /><br />

      <strong>{t('pathologica_service.step5_title', 'Step 5. Conducting a study')}</strong><br />
      {t('pathologica_service.step5_details', 'The study is carried out within 2-15 working days from the date of payment, receipt of the material and all necessary documentation in the laboratory. Please note that the final price may be changed after the first stage of the study, depending on the amount of work. If it is necessary to manufacture additional blocks, glasses, additional staining, including IGH and molecular genetic studies, the price may be increased. The final cost of the study depends on the amount of work and will be agreed with you.')}<br /><br />

      <strong>{t('pathologica_service.step6_title', 'Step 6. Obtaining a conclusion and material')}</strong><br />
      {t('pathologica_service.step6_details', 'After the study is completed, we will send you the original conclusion, material and documents by courier service (')}
      <a
        href="https://dostavista.ru/?utm_source=google.com&utm_medium=organic&utm_campaign=google.com&utm_referrer=google.com"
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: '#0000FF', textDecoration: 'underline' }}
      >
        Dostavista
      </a>
      {t('pathologica_service.step6_details_middle', ', ')}
      <a
        href="https://www.cdek.ru/ru"
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: '#0000FF', textDecoration: 'underline' }}
      >
        SDEC
      </a>
      {t('pathologica_service.step6_details_end', '). A copy of the conclusion in PDF format will be sent to you by e-mail on the day of completion of the study.')}<br />
    </>
  );

  const renderFields = () => {
    return (
      <div style={{ marginBottom: '15px' }}>
        <label
          htmlFor="pathologicaService"
          style={{
            display: 'block',
            fontFamily: "'Quicksand', sans-serif",
            fontSize: '14px',
            color: '#333',
            marginBottom: '5px',
          }}
        >
          {t('pathologica_service.service_label', 'Service')}
        </label>
        <select
          id="pathologicaService"
          name="pathologicaService"
          value={formData.pathologicaService || 'Cytological examination'}
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
          <option value="Cytological examination">
            {t('pathologica_service.option1', 'Cytological examination')}
          </option>
          <option value="Histological examination">
            {t('pathologica_service.option2', 'Histological examination')}
          </option>
          <option value="Comprehensive Study (cytological + histological)">
            {t('pathologica_service.option3', 'Comprehensive Study (cytological + histological)')}
          </option>
          <option value="Pathologist Consultation">
            {t('pathologica_service.option4', 'Pathologist Consultation')}
          </option>
        </select>
      </div>
    );
  };

  const result = {
    description,
    renderFields,
  };

  console.log('Returning from PathoLogicaService:', result);
  return result;
};