import React from 'react';

export default ({ formData, handleInputChange, handleCheckboxChange, t }) => {
  console.log('MolecularConsilium module loaded');

  const description = (
    <>
      <strong>{t('molecular_consilium.description_title', 'Description of the service')}</strong><br />
      {t('molecular_consilium.description_intro', 'Increasingly, complex genomic sequencing is carried out in various malignant neoplasms. Among the well-known programs are FoundationOne, OncoAtlas. The main task of such studies is to find molecular targets for individual selection of targeted therapy of malignant tumors in case of ineffectiveness of standard therapy. Patients often do these studies on their own. The result of the study is a multi-page conclusion, which can only be interpreted by specialists.')}<br /><br />
      {t('molecular_consilium.service_details', 'The Health-Direct team offers the "Molecular Consilium" service. Leading specialists in drug therapy and molecular geneticists interpret the results of complex genomic sequencing, offer possible options for personalized targeted treatment.')}<br />
    </>
  );

  const renderFields = () => {
    // No additional fields beyond the common ones for this service
    return null;
  };

  const result = {
    description,
    renderFields,
  };

  console.log('Returning from MolecularConsilium:', result);
  return result;
};