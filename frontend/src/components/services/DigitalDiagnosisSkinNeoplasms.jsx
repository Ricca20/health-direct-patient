import React from 'react';

export default ({ formData, handleInputChange, handleCheckboxChange, t }) => {
  console.log('DigitalDiagnosisSkinNeoplasms module loaded');

  const description = (
    <>
      <strong>{t('digital_diagnosis.description_title', 'Description of the service')}</strong><br />
      {t('digital_diagnosis.description_intro', 'Digital diagnosis of skin neoplasms is a modern and highly accurate method of skin research, which allows you to recognize any formations, such as moles, pigment spots, nevi, etc., as well as to determine whether they are benign or not. Such a computer examination allows you to detect malignant skin neoplasms, in particular melanoma, as early as possible. According to scientific data, planned dermatoscopy using artificial intelligence increases the detection of skin melanoma in the early stages by 20%.')}<br /><br />

      <strong>{t('digital_diagnosis.why_title', 'WHY DO DERMATOSCOPY USING ARTIFICIAL INTELLIGENCE?')}</strong><br /><br />
      {t('digital_diagnosis.why_intro', 'Digital diagnostics of skin neoplasms is used for:')}<br /><br />
      <ul style={{ margin: '5px 0', paddingLeft: '25px', fontFamily: "'Quicksand', sans-serif", fontSize: '14px', color: '#666', lineHeight: '1.6', listStyleType: 'disc' }}>
        <li>{t('digital_diagnosis.why_item1', 'early detection of malignant skin neoplasms, including melanomas')}</li>
        <li>{t('digital_diagnosis.why_item2', 'differential diagnosis between benign and malignant neoplasms')}</li>
        <li>{t('digital_diagnosis.why_item3', 'detection of parasitic skin pathology (pediculosis, demodicosis, "scabies", etc.)')}</li>
        <li>{t('digital_diagnosis.why_item4', 'detection of bacterial, viral and fungal skin lesions')}</li>
        <li>{t('digital_diagnosis.why_item5', 'assessment of the condition of nail plates')}</li>
        <li>{t('digital_diagnosis.why_item6', 'search for the cause of alopecia')}</li>
      </ul>
      <br />

      <strong>{t('digital_diagnosis.when_title', 'WHEN IS IT IMPORTANT TO UNDERGO DIGITAL DIAGNOSIS OF SKIN NEOFORMATIONS?')}</strong><br /><br />
      {t('digital_diagnosis.when_intro', 'The list of indications for digital diagnostics of skin neoplasms is diverse:')}<br /><br />
      <ul style={{ margin: '5px 0', paddingLeft: '25px', fontFamily: "'Quicksand', sans-serif", fontSize: '14px', color: '#666', lineHeight: '1.6', listStyleType: 'disc' }}>
        <li>{t('digital_diagnosis.when_item1', 'uneven growths on the skin surface')}</li>
        <li>{t('digital_diagnosis.when_item2', 'heterogeneous skin color (black and blue shades are especially dangerous)')}</li>
        <li>{t('digital_diagnosis.when_item3', 'changes in the shape, color and size of the formation')}</li>
        <li>{t('digital_diagnosis.when_item4', 'itching, burning or pain in the area of the pigment spot')}</li>
        <li>{t('digital_diagnosis.when_item5', 'bleeding and ulceration of formation of any size')}</li>
        <li>{t('digital_diagnosis.when_item6', 'a large number of moles on the body combined with light hair color')}</li>
        <li>{t('digital_diagnosis.when_item7', 'moles more than 0.5 cm in diameter')}</li>
        <li>{t('digital_diagnosis.when_item8', 'appearance of neoplasms on the skin during pregnancy')}</li>
        <li>{t('digital_diagnosis.when_item9', 'the appearance of a neoplasm on the skin in people over 60 years of age')}</li>
        <li>{t('digital_diagnosis.when_item10', 'detection of melanoma in close relatives')}</li>
        <li>{t('digital_diagnosis.when_item11', 'examination before removal of any skin neoplasm')}</li>
      </ul>
      <br />
      {t('digital_diagnosis.when_important', 'Important: the symptoms listed above may be the first signs of malignant skin neoplasms. If they are detected, it is necessary to contact a specialist.')}<br />
      {t('digital_diagnosis.health_direct_info', 'At Health-Direct, experienced dermatologists conduct a comprehensive digital diagnosis of skin neoplasms using the FotoFinder hardware complex and artificial intelligence.')}<br /><br />

      {t('digital_diagnosis.annual_dermatoscopy_intro', 'Dermatoscopy using artificial intelligence should be carried out annually in the presence of risk factors for malignant skin neoplasms:')}<br /><br />
      <ul style={{ margin: '5px 0', paddingLeft: '25px', fontFamily: "'Quicksand', sans-serif", fontSize: '14px', color: '#666', lineHeight: '1.6', listStyleType: 'disc' }}>
        <li>{t('digital_diagnosis.annual_dermatoscopy_item1', 'frequent prolonged exposure to the sun')}</li>
        <li>{t('digital_diagnosis.annual_dermatoscopy_item2', 'frequent trauma to birthmarks and moles (comb, clothes, etc.)')}</li>
        <li>{t('digital_diagnosis.annual_dermatoscopy_item3', 'regular contact with chemicals')}</li>
        <li>{t('digital_diagnosis.annual_dermatoscopy_item4', 'age-related skin changes')}</li>
      </ul>
      <br />

      <strong>{t('digital_diagnosis.how_title', 'HOW IS DIGITAL DIAGNOSIS OF SKIN NEOPLASMS PERFORMED?')}</strong><br /><br />
      {t('digital_diagnosis.how_description', 'No preparation for the procedure is required, you can undergo diagnostics on any convenient day.')}<br />
      {t('digital_diagnosis.how_process', 'The doctor will ask you to undress to your underwear and apply a special gel to your skin. With the help of the FotoFinder hardware complex, the body surface is photographed from different angles. FotoFinder detects skin neoplasms at the preclinical stage, when skin changes cannot yet be seen by the human eye, because it gives an increase of 140 times.')}<br />
      {t('digital_diagnosis.how_duration', 'The duration of the study of one education takes from 1 to 3 minutes. The procedure usually takes about an hour. After the procedure, the data enters the Moleanalyzer program. It stores millions of images of other patients from all over the world. With the help of artificial intelligence, the program automatically compares the patient\'s neoplasms with neoplasms from the world base and generates a conclusion about the malignancy, benignity or borderline nature of the identified changes.')}<br />
      {t('digital_diagnosis.how_accuracy', 'The combination of artificial intelligence and the experience of an oncologist-dermatologist allows you to determine the nature of neoplasms with an accuracy of up to 98%. As a result of the study, you receive a detailed expert opinion, as well as a map of moles, which will allow you to track the appearance of new skin formations in the future.')}<br /><br />

      <strong>{t('digital_diagnosis.important_title', 'IMPORTANT!')}</strong><br /><br />
      {t('digital_diagnosis.important_message', 'EARLY DETECTION OF MALIGNANT SKIN NEOPLASMS ALLOWS FOR LOW-TRAUMATIC TREATMENT WITH A GUARANTEED POSITIVE RESULT. TAKE CARE OF YOURSELF AND YOUR LOVED ONES! PERFORM DIGITAL DIAGNOSTICS OF SKIN NEOPLASMS ONCE A YEAR.')}<br /><br />

      {t('digital_diagnosis.sign_up', 'Sign up for the study by calling +74996853000 or through your personal account at www.health-direct.info.')}<br /><br />

      <strong>{t('digital_diagnosis.cost_title', 'THE COST IS 30,000 RUBLES')}</strong><br />
    </>
  );

  const doctors = [
    "I don't know which doctor I need",
    "Dr. John Smith",
    "Dr. Emily Johnson",
    "Dr. Michael Brown",
    "Dr. Sarah Davis",
    "Dr. David Wilson",
  ];

  const renderFields = () => {
    return (
      <div style={{ marginBottom: '15px' }}>
        <label
          htmlFor="doctor"
          style={{
            display: 'block',
            fontFamily: "'Quicksand', sans-serif",
            fontSize: '14px',
            color: '#333',
            marginBottom: '5px',
          }}
        >
          {t('inface_remote_consultations.doctor_label', 'Doctor')}
        </label>
        <select
          id="doctor"
          name="doctor"
          value={formData.doctor || "I don't know which doctor I need"}
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
          {doctors.map((doctor, index) => (
            <option key={index} value={doctor}>
              {doctor}
            </option>
          ))}
        </select>
      </div>
    );
  };
  const result = {
    description,
    renderFields,
  };

  console.log('Returning from DigitalDiagnosisSkinNeoplasms:', result);
  return result;
};