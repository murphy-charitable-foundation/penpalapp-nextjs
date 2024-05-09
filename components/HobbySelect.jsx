import React, { useState, useEffect } from 'react';
import {
  collection,
  getDocs,
  query,
  startAfter,
  limit,
  where,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import CreatableSelect from 'react-select/creatable';

const createOption = (label) => ({
  label,
  value: label.toLowerCase().replace(/\W/g, ''),
});

const defaultOptions = [
  createOption('One'),
  createOption('Two'),
  createOption('Three'),
];

const FirebaseSelect = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [options, setOptions] = useState(defaultOptions);
  const [value, setValue] = useState(null);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const data = await fetchData();
        const optionData = data.map((item) => createOption(item.label));
        setOptions([...options, ...optionData]);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setIsLoading(false);
      }
    };

    fetchOptions();
  }, []);

  const fetchData = async () => {
    const snapshot = await collection(db, 'your_collection').get(); // Replace 'your_collection' with your collection name
    const data = snapshot.docs.map((doc) => doc.data());
    return data;
  };

  const handleCreate = async () => {
    setIsLoading(true);
    try {
      const newOption = createOption(inputValue);
      await collection(db, 'your_collection').add({ label: inputValue }); // Replace 'your_collection' with your collection name
      setIsLoading(false);
      setOptions([...options, newOption]);
      setValue(newOption);
    } catch (error) {
      console.error('Error creating option:', error);
      setIsLoading(false);
    }
  };

  return (
    <CreatableSelect
      isClearable
      isDisabled={isLoading}
      isLoading={isLoading}
      onChange={(newValue) => setValue(newValue)}
      onCreateOption={() => handleCreate()}
      onInputChange={(input) => setInputValue(input)}
      options={options}
      value={value}
    />
  );
};

export default FirebaseSelect;
