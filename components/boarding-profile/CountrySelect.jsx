// components/CountrySelect.jsx
'use client';

import React, { useEffect, useState } from 'react';
import countries from 'i18n-iso-countries';
import enLocale from 'i18n-iso-countries/langs/en.json'; 

import Dropdown from "../general/Dropdown";

countries.registerLocale(enLocale);

export default function CountrySelect({ onChange }) {
  const [countryList, setCountryList] = useState([]);

  useEffect(() => {
    const countryNames = countries.getNames('en', { select: 'official' });
    const formatted = Object.entries(countryNames).map(([code, name]) => ({
      code,
      name,
    }));
    console.log(formatted);
    setCountryList(formatted);
  }, []);

  const [countryName, setCountryName] = useState("");
  return (
    <>
      <Dropdown
        options={countryList.map(item => item.name)}
        valueChange={(option) => {
          setCountryName(option);
          onChange(countryList.find(item => item.name === option)?.code);
          
        }}
        currentValue={countryName}
        text="Select a country"
      />
    </>
  );
}
