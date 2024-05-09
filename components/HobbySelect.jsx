import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, addDoc } from "firebase/firestore";
import { db } from '@/app/firebaseConfig';
import CreatableSelect from 'react-select/creatable';

const createOption = (label) => ({
  label,
  value: label

});

const HobbySelect = ({setHobbies, hobbies}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [options, setOptions] = useState([]);
  const [value, setValue] = useState([]);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    const fetchHobbies = async () => {
      try {
        const hobbies = await getHobbies();
        const hobbyOptions = hobbies.map(hobby => createOption(hobby.id, hobby.label));
        setOptions(hobbyOptions);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching hobbies:', error);
        setIsLoading(false);
      }
    };

    fetchHobbies();
  }, []);

  const getHobbies = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'hobbies'));
      const hobbies = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      console.log(hobbies);
      return hobbies;
    } catch (error) {
      console.error('Error getting hobbies:', error);
      return [];
    }
  };

  const handleCreate = async () => {
    setIsLoading(true);
    try {
      const lowercaseInput = inputValue.toLowerCase().trim();
      const newOption = createOption(lowercaseInput);
      await addDoc(collection(db, 'hobbies'), { label: lowercaseInput }); // Add new hobby to Firestore
      setIsLoading(false);
      setOptions(prevOptions => [...prevOptions, newOption]);
      setValue(prevValue => [...prevValue, newOption]);
      setHobbies(prevHobbies => [...prevHobbies, lowercaseInput]);
      setInputValue(''); // Clear input value after creating option
    } catch (error) {
      console.error('Error creating option:', error);
      setIsLoading(false);
    }
  };
  

  return (
    <CreatableSelect
      isMulti
      isClearable
      isDisabled={isLoading}
      isLoading={isLoading}
      onChange={(newValue) => setValue(newValue)}
      onCreateOption={() => handleCreate()}
      onInputChange={(input) => setInputValue(input)}
      options={options}
      value={value}
      className='text-black'
    />
  );
};

export default HobbySelect;
