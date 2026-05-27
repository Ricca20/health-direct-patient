import React from 'react';

export default ({ formData, handleInputChange, handleCheckboxChange, t }) => {
  console.log('InstallationVenousPortSystem module loaded');

  const description = (
    <>
      <strong>{t('venous_port_system.description_title', 'Description of the service')}</strong><br />
      <strong>{t('venous_port_system.what_is_title', 'WHAT IS A PORT SYSTEM?')}</strong><br />
      {t('venous_port_system.what_is_description', 'The port system consists of a catheter, which is installed in the central vein, and a chamber with which the catheter is connected. It is installed under the skin in the subclavian area. With long courses of chemotherapy, this is the most optimal option for comfortable treatment. In addition, the port system can be used for blood sampling, long-term antibacterial therapy, parenteral nutrition and/or frequent blood transfusions. Like any catheter, the port system can be used to inject contrast agents during MRI and CT or for intravenous administration of any drugs.')}<br /><br />

      <strong>{t('venous_port_system.restrictions_title', 'POSSIBLE RESTRICTIONS FOR INSTALLING THE PORT SYSTEM')}</strong><br />
      {t('venous_port_system.restrictions_intro', 'The installation of the port system is recommended by the doctor based on clinical data and treatment plan. Each case is considered individually, since all prescribed contraindications are relative. However, the implantation of the port system should be approached with caution in the following cases:')}<br /><br />
      <ul style={{ margin: '5px 0', paddingLeft: '25px', fontFamily: "'Quicksand', sans-serif", fontSize: '14px', color: '#666', lineHeight: '1.6', listStyleType: 'disc' }}>
        <li>{t('venous_port_system.restrictions_item1', 'blood clotting disorders')}</li>
        <li>{t('venous_port_system.restrictions_item2', 'individual intolerance of port materials')}</li>
        <li>{t('venous_port_system.restrictions_item3', 'radiation therapy at the implantation site')}</li>
        <li>{t('venous_port_system.restrictions_item4', 'superior vena cava syndrome')}</li>
        <li>{t('venous_port_system.restrictions_item5', 'inflammation of the skin at the site of the port installation')}</li>
        <li>{t('venous_port_system.restrictions_item6', 'sepsis')}</li>
      </ul>
      <br />

      <strong>{t('venous_port_system.installation_title', 'HOW IS THE PORT SYSTEM INSTALLED?')}</strong><br />
      {t('venous_port_system.installation_description', 'The port system installation procedure is not an operation and takes 30-90 minutes. The patient is treated with the implant site, an injection is made, a drug for local anesthesia is administered, a vein is punctured and a catheter is inserted. Next, make a small incision of the skin no more than 3-4 cm long, form a subcutaneous pocket and place a port system in it. The incision is sutured with a cosmetic seam, which completely heals within 2-3 weeks. The implantation site is protected with a special sticker, which can be removed by yourself.')}<br /><br />

      <strong>{t('venous_port_system.post_procedure_feeling_title', 'HOW DOES THE PATIENT FEEL AFTER THE PROCEDURE?')}</strong><br />
      {t('venous_port_system.post_procedure_feeling_description', 'The port system is perceived by the body as a foreign body, so the normal reaction is pulling, aching and tingling sensations at the place of installation of the port system. All people have a different pain threshold, to reduce discomfort, you can immediately after installation, if necessary, take painkillers, which will be prescribed by the attending physician. A week after the procedure, the discomfort should completely go away. Any unpleasant sensations are a reason to consult a doctor immediately.')}<br /><br />

      {t('venous_port_system.post_procedure_restrictions_intro', 'In addition, in the first time after the installation of the port system, a number of usual actions should be limited:')}<br /><br />
      <ul style={{ margin: '5px 0', paddingLeft: '25px', fontFamily: "'Quicksand', sans-serif", fontSize: '14px', color: '#666', lineHeight: '1.6', listStyleType: 'disc' }}>
        <li>{t('venous_port_system.post_procedure_restrictions_item1', 'exclude weight lifting (more than 5 kg) for 7 days')}</li>
        <li>{t('venous_port_system.post_procedure_restrictions_item2', 'limit visits to the pool, bath, sauna for 14-28 days')}</li>
        <li>{t('venous_port_system.post_procedure_restrictions_item3', 'give up active physical activity for 7 days')}</li>
      </ul>
      <br />

      <strong>{t('venous_port_system.preparation_title', 'HOW TO PREPARE FOR THE PROCEDURE?')}</strong><br />
      <ol style={{ margin: '5px 0', paddingLeft: '25px', fontFamily: "'Quicksand', sans-serif", fontSize: '14px', color: '#666', lineHeight: '1.6', listStyleType: 'decimal' }}>
        <li>{t('venous_port_system.preparation_step1', 'Consult with the specialist installing the port system and discuss the timing and place of its installation.')}</li>
        <li>
          {t('venous_port_system.preparation_step2_intro', 'Prepare and hand over copies of tests and studies to the doctor:')}<br />
          <ul style={{ margin: '5px 0', paddingLeft: '25px', fontFamily: "'Quicksand', sans-serif", fontSize: '14px', color: '#666', lineHeight: '1.6', listStyleType: 'disc' }}>
            <li>{t('venous_port_system.preparation_tests_item1', 'general blood test with leukocyte formula and platelet count - expiration date of 14 days')}</li>
            <li>{t('venous_port_system.preparation_tests_item2', 'general urine test - life of 14 days')}</li>
            <li>{t('venous_port_system.preparation_tests_item3', 'biochemical blood test (total protein, glucose, total bilirubin, creatinine, urea, ALT, AST) - expiry date 14 days')}</li>
            <li>{t('venous_port_system.preparation_tests_item4', 'coagulogram (fibrinogen, ACHTV, MNO) - expirability for 14 days')}</li>
            <li>{t('venous_port_system.preparation_tests_item5', 'blood type, rhesus factor - shelf 3 months or after the last blood transfusion, if it was performed within the last 3 months (on the form with the original seal)')}</li>
            <li>{t('venous_port_system.preparation_tests_item6', 'phenotype - the ability of 3 months or after the last blood transfusion, if it was made within the last 3 months (on the form with the original seal)')}</li>
            <li>{t('venous_port_system.preparation_tests_item7', 'anti-erythrocyte antibodies - expirability for 3 months or after the last blood transfusion, if it was produced within the last 3 months (on the form with the original seal)')}</li>
            <li>{t('venous_port_system.preparation_tests_item8', 'tests for infectious diseases: RW, HBS antigen, antibodies to HCV, HIV - 3 months shelby')}</li>
            <li>{t('venous_port_system.preparation_tests_item9', 'electrocardiogram (ECG) - expirability for 14 days')}</li>
          </ul>
        </li>
        <li>{t('venous_port_system.preparation_step3', 'Give copies of medical documents about the oncological disease and previous treatment to the supervising doctor.')}</li>
      </ol>
      <br />
      {t('venous_port_system.preparation_tests_note', 'It is worth noting that usually the port system is installed before drug antitumor therapy (chemotherapy), and the package of tests and studies is identical to that for chemotherapy. Thus, you won\'t have to collect them 2 times. It is only necessary to competently determine the timing of the port installation.')}<br /><br />

      <strong>{t('venous_port_system.day_of_procedure_title', 'PREPARATION FOR THE INSTALLATION OF THE PORT SYSTEM ON THE DAY OF THE PROCEDURE:')}</strong><br />
      <ol style={{ margin: '5px 0', paddingLeft: '25px', fontFamily: "'Quicksand', sans-serif", fontSize: '14px', color: '#666', lineHeight: '1.6', listStyleType: 'decimal' }}>
        <li>{t('venous_port_system.day_of_procedure_item1', 'Be sure to bring your passport and copies of documents if you have not handed them over in advance.')}</li>
        <li>{t('venous_port_system.day_of_procedure_item2', 'In the morning, take a light breakfast, in the future exclude eating 6 hours in advance and taking any liquids 2 hours before the appointed time of installation of the port system.')}</li>
        <li>{t('venous_port_system.day_of_procedure_item3', 'Take planned medications, except for blood thinners (this issue must be agreed with the attending physician in advance).')}</li>
        <li>{t('venous_port_system.day_of_procedure_item4', 'Take a shower in advance and, if necessary, remove the hair at the installation site of the port system.')}</li>
      </ol>
      {t('venous_port_system.day_of_procedure_description', 'Note: we recommend wearing dark clothes.')}<br /><br />

      <strong>{t('venous_port_system.after_procedure_title', 'AFTER THE PROCEDURE')}</strong><br />
      {t('venous_port_system.after_procedure_description', 'Usually, 2 hours after implantation of the port system, the patient is ready to go home. Within a month, you can fully return to your normal way of life. The port system is one of the safest implantable devices: complications occur in less than 2% of patients.')}<br /><br />

      <strong>{t('venous_port_system.care_recommendations_title', 'RECOMMENDATIONS FOR PORT SYSTEM CARE')}</strong><br />
      {t('venous_port_system.care_recommendations_description', 'The port system can be installed for a long time (several years or for life). In case of regular use, no special care is required, as the system is washed before and after use.')}<br /><br />
      {t('venous_port_system.care_recommendations_washing', 'However, if a break is prescribed in treatment, the port system should be washed every 4 weeks.')}<br /><br />
      {t('venous_port_system.care_recommendations_removal', 'If the patient has entered the stage of stable remission, the port system can be removed. The procedure also takes place under local anesthesia.')}<br /><br />

      <strong>{t('venous_port_system.important_title', 'IMPORTANT:')}</strong><br />
      <ol style={{ margin: '5px 0', paddingLeft: '25px', fontFamily: "'Quicksand', sans-serif", fontSize: '14px', color: '#666', lineHeight: '1.6', listStyleType: 'decimal' }}>
        <li>{t('venous_port_system.important_documentation', 'Save the card with data about the installed port system and diagnosis, as well as the technical data sheet of the port system. Carry it with you, especially when moving to other cities and countries. Always warn the medical staff about the presence of a port system in case of CT or MRI (the port can be used to inject a contrast agent).')}</li>
        <li>{t('venous_port_system.important_needles', 'The use of the port system is possible ONLY with the use of special Huber needles. Always check their availability with medical staff to avoid deformation of the silicone membrane.')}</li>
        <li>
          {t('venous_port_system.important_symptoms_intro', 'Symptoms for which you should immediately consult a doctor:')}<br />
          <ul style={{ margin: '5px 0', paddingLeft: '25px', fontFamily: "'Quicksand', sans-serif", fontSize: '14px', color: '#666', lineHeight: '1.6', listStyleType: 'disc' }}>
            <li>{t('venous_port_system.important_symptoms_item1', 'burning sensation, pain, temperature rise above 38 degrees, redness and swelling at the implantation site')}</li>
            <li>{t('venous_port_system.important_symptoms_item2', 'swelling of the hand or blue skin on the side of the installed port system')}</li>
            <li>{t('venous_port_system.important_symptoms_item3', 'pain when drugs are introduced into the port system')}</li>
          </ul>
        </li>
      </ol>
      <br />
    </>
  );

  const renderFields = () => {
    return null; // No additional fields beyond the common ones
  };

  const result = {
    description,
    renderFields,
  };

  console.log('Returning from InstallationVenousPortSystem:', result);
  return result;
};