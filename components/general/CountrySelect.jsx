// components/CountrySelect.jsx
'use client';

import React, { useEffect, useState } from 'react';
import countries from 'i18n-iso-countries';
import enLocale from 'i18n-iso-countries/langs/en.json'; // 你也可以换成 zh.json

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

  return (
    <select
      className="w-full border-b border-gray-400 focus:outline-none focus:border-blue-500 bg-transparent py-2"
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">Select a country</option>
      {countryList.map((country) => (
        <option key={country.code} value={country.name}>
          {country.name}
        </option>
      ))}
    </select>
  );
}
