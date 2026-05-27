import React from 'react';

export default ({ formData, handleInputChange, handleCheckboxChange, t }) => {
  console.log('InternationalOncologyConsilium module loaded');

  const description = (
    <>
      <strong>{t('oncology_consilium.description_title', 'Description of the service')}</strong><br />
      {t('oncology_consilium.description_intro', 'The oncological consilium is a prerequisite for the start of specific treatment (according to Order №116n of 19.02.2021 "On the procedure for providing medical care to the adult population in cancer"). The high flow of patients in public medical institutions and the load on in-hospital laboratories lead to irreversible consequences: mandatory consultations become a formality, examinations are not carried out in full. Patients are forced to go to private clinics, take scattered tests and, as a result, lose precious time.')}<br /><br />

      <strong>{t('oncology_consilium.why_needed_title', 'WHY DO YOU NEED A CONSILIUM?')}</strong><br />
      <ul style={{ margin: '5px 0', paddingLeft: '25px', fontFamily: "'Quicksand', sans-serif", fontSize: '14px', color: '#666', lineHeight: '1.6', listStyleType: 'disc' }}>
        <li>{t('oncology_consilium.why_needed_item1', 'confirm or refute the diagnosis of a malignant neoplasm')}</li>
        <li>{t('oncology_consilium.why_needed_item2', 'adjust the already prescribed treatment or examination plan')}</li>
        <li>{t('oncology_consilium.why_needed_item3', 'develop effective treatment tactics')}</li>
        <li>{t('oncology_consilium.why_needed_item4', 'get a second expert opinion')}</li>
        <li>{t('oncology_consilium.why_needed_item5', 'make sure that the treatment is correct')}</li>
      </ul>
      <br />

      <strong>{t('oncology_consilium.diseases_title', 'WHAT ONCOLOGICAL DISEASES ARE CONSIDERED AT THE CONSILIUM?')}</strong><br />
      {t('oncology_consilium.diseases_intro', 'At the international oncology consilium Health-Direct, a multidisciplinary team of specialists analyzes the tactics of examination, treatment and monitoring of the following diseases:')}<br /><br />
      <ul style={{ margin: '5px 0', paddingLeft: '25px', fontFamily: "'Quicksand', sans-serif", fontSize: '14px', color: '#666', lineHeight: '1.6', listStyleType: 'disc' }}>
        <li>{t('oncology_consilium.diseases_item1', 'malignant diseases of the head and neck (laryngeal cancer, nasopharyngeal cancer, thyroid cancer, parotid salivary cancer, pharyngeal cancer, etc.)')}</li>
        <li>{t('oncology_consilium.diseases_item2', 'melanoma of the skin and other localizations')}</li>
        <li>{t('oncology_consilium.diseases_item3', 'stomach cancer')}</li>
        <li>{t('oncology_consilium.diseases_item4', 'lung cancer')}</li>
        <li>{t('oncology_consilium.diseases_item5', 'adrenal cancer')}</li>
        <li>{t('oncology_consilium.diseases_item6', 'esophageal cancer')}</li>
        <li>{t('oncology_consilium.diseases_item7', 'prostate cancer')}</li>
        <li>{t('oncology_consilium.diseases_item8', 'rectal cancer')}</li>
        <li>{t('oncology_consilium.diseases_item9', 'cervical cancer')}</li>
        <li>{t('oncology_consilium.diseases_item10', 'uterine body cancer')}</li>
        <li>{t('oncology_consilium.diseases_item11', 'ovarian cancer')}</li>
        <li>{t('oncology_consilium.diseases_item12', 'Hodgkin\'s lymphoma')}</li>
        <li>{t('oncology_consilium.diseases_item13', 'non-Hodgkin\'s lymphomas')}</li>
        <li>{t('oncology_consilium.diseases_item14', 'brain tumors')}</li>
        <li>{t('oncology_consilium.diseases_item15', 'breast cancer')}</li>
        <li>{t('oncology_consilium.diseases_item16', 'breast cancer in men')}</li>
        <li>{t('oncology_consilium.diseases_item17', 'gallbladder cancer')}</li>
        <li>{t('oncology_consilium.diseases_item18', 'cancer of the anal canal')}</li>
        <li>{t('oncology_consilium.diseases_item19', 'skin cancer')}</li>
        <li>{t('oncology_consilium.diseases_item20', 'liver cancer')}</li>
        <li>{t('oncology_consilium.diseases_item21', 'pancreatic cancer')}</li>
        <li>{t('oncology_consilium.diseases_item22', 'colon cancer')}</li>
        <li>{t('oncology_consilium.diseases_item23', 'soft tissue sarcomas')}</li>
      </ul>
      <br />
      {t('oncology_consilium.diseases_additional', 'Malignant tumors can be accompanied by diabetes, hypertension, myocardial infarction, stroke and other chronic diseases. In such situations, an integrated approach to the choice of treatment tactics and prediction of possible complications in order to prevent them is necessary.')}<br /><br />
      {t('oncology_consilium.specialists_involved', 'The consilium attracts specialists who will be required at different stages of specific antitumor treatment: oncologists, chemotherapists, radiation therapists.')}<br /><br />

      <strong>{t('oncology_consilium.members_title', 'WHO IS A MEMBER OF THE INTERNATIONAL ONCOLOGY COUNCIL HEALTH-DIRECT?')}</strong><br />
      {t('oncology_consilium.members_intro', 'Your case will be evaluated by experienced doctors and candidates of medical sciences: at least 2 surgeon-oncologists, 2 radiation therapists and 3 chemotherapists, as well as an anesthesiologist-resuscitator who will determine the tolerance of a particular method of treatment, taking into account the state of health. Our team will carefully study your medical history, tests and conclusions to find the optimal treatment plan.')}<br /><br />
      {t('oncology_consilium.members_additional', 'The Health-Direct project attracts not only domestic experts, but also foreign practitioners, which expands the patient\'s opportunities to undergo treatment both in Russia and in foreign partner clinics, according to international standards and treatment protocols.')}<br /><br />
      <strong>{t('oncology_consilium.permanent_members_title', 'Permanent composition of experts of the international oncological consilium Health-Direct:')}</strong><br />
      <ol style={{ margin: '5px 0', paddingLeft: '25px', fontFamily: "'Quicksand', sans-serif", fontSize: '14px', color: '#666', lineHeight: '1.6', listStyleType: 'decimal' }}>
        <li>{t('oncology_consilium.permanent_members_item1', 'Valentina Mikhailovna Nechushkina - Chairman of the International Oncology Council Health-Direct, oncologist, surgeon, obstetrician-gynecologist, MD, professor')}</li>
        <li>{t('oncology_consilium.permanent_members_item2', 'Anton Vladimirovich Snegovoy - oncologist, chemotherapist, MD, professor')}</li>
        <li>{t('oncology_consilium.permanent_members_item3', 'Inessa Borisovna Kononenko - oncologist, chemotherapist, Ph.D.')}</li>
        <li>{t('oncology_consilium.permanent_members_item4', 'Dmitry Yurievich Sinyavin - oncologist, chemotherapist')}</li>
        <li>{t('oncology_consilium.permanent_members_item5', 'Dzhugashvili Maya Shalikoevna - oncologist, radiotherapist, Ph.D.')}</li>
        <li>{t('oncology_consilium.permanent_members_item6', 'Mikhail Yurievich Valkov - oncologist, radiotherapist, MD, professor')}</li>
        <li>{t('oncology_consilium.permanent_members_item7', 'Sergey Nikolaevich Novikov - oncologist, radiotherapist, MD, professor')}</li>
        <li>{t('oncology_consilium.permanent_members_item8', 'Subramanian Somasundaram - oncologist, surgeon, plastic surgeon')}</li>
        <li>{t('oncology_consilium.permanent_members_item9', 'Alexey Olegovich Prikhodchenko - anesthesiologist-resuscitator, Ph.D.')}</li>
      </ol>
      <br />

      <strong>{t('oncology_consilium.documents_title', 'WHAT DOCUMENTS DO I NEED TO SUBMIT TO THE CONSILIUM?')}</strong><br />
      {t('oncology_consilium.documents_intro', 'For the correspondence consultation, it is necessary to attach all available medical documentation to the application:')}<br /><br />
      <ul style={{ margin: '5px 0', paddingLeft: '25px', fontFamily: "'Quicksand', sans-serif", fontSize: '14px', color: '#666', lineHeight: '1.6', listStyleType: 'disc' }}>
        <li>{t('oncology_consilium.documents_item1', 'extracts of the treatment')}</li>
        <li>{t('oncology_consilium.documents_item2', 'conclusions of oncologists')}</li>
        <li>{t('oncology_consilium.documents_item3', 'surgical treatment protocols')}</li>
        <li>{t('oncology_consilium.documents_item4', 'results of radiation examination methods (CT, MRI, PET-CT)')}</li>
        <li>{t('oncology_consilium.documents_item5', 'results of laboratory and other instrumental studies for the period from diagnosis to the current time')}</li>
        <li>{t('oncology_consilium.documents_item6', 'conclusions of histological and cytological studies')}</li>
      </ul>
      <br />

      <strong>{t('oncology_consilium.how_it_works_title', 'HOW IS THE ONCOLOGY CONSILIUM IN HEALTH-DIRECT?')}</strong><br />
      {t('oncology_consilium.how_it_works_details', 'The patient\'s face-to-face presence is not required. You can be anywhere in the world. The attending physician is preparing a presentation of the clinical case. Experts study the attached documents in advance. In a closed mode, specialists discuss your case and build the optimal tactics of examination or treatment.')}<br /><br />
      {t('oncology_consilium.how_it_works_standards', 'Diagnosis and recommendations for examination, treatment and observation are made exclusively in accordance with international protocols and standards for the treatment of malignant neoplasms.')}<br /><br />
      {t('oncology_consilium.how_it_works_result', 'As a result, you will receive the conclusion of the international oncology board Health-Direct in the shortest possible time and the opportunity to start a follow-up examination and specific treatment in one of the specialized medical institutions of both the public and private sectors from a designated specialist.')}<br /><br />

      {t('oncology_consilium.contact_info', 'Leave a request on the website or by phone ')}
      <a
        href="tel:+74996853000"
        style={{ color: '#0000FF', textDecoration: 'underline' }}
      >
        +7 (499) 685 3000
      </a>
      {t('oncology_consilium.contact_info_end', '.')}<br />
    </>
  );

  const renderFields = () => {
    return null; // No additional fields beyond the common ones
  };

  const result = {
    description,
    renderFields,
  };

  console.log('Returning from InternationalOncologyConsilium:', result);
  return result;
};