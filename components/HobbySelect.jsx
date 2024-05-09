import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, doc, setDoc } from "firebase/firestore";
import { db } from '@/app/firebaseConfig';
import CreatableSelect from 'react-select/creatable';

const HobbySelect = ({ setHobbies, hobbies }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [options, setOptions] = useState([]);
  const [value, setValue] = useState([]);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    const fetchHobbies = async () => {
      try {
        const hobbiesSnapshot = await getDocs(collection(db, 'hobbies'));
        const hobbyOptions = hobbiesSnapshot.docs.map(doc => ({
          id: doc.id,
          value: doc.id,
          label: doc.data().hobby
        }));
        setOptions(hobbyOptions);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching hobbies:', error);
        setIsLoading(false);
      }
    };

    fetchHobbies();
  }, []);

  const handleCreate = async () => {
    setIsLoading(true);
    try {
      const lowercaseInput = inputValue.toLowerCase().trim();
      const docRef = await addDoc(collection(db, 'hobbies'), { hobby: lowercaseInput }); // Add new hobby to Firestore
      const newOption = { id: docRef.id, value: docRef.id, label: lowercaseInput };
      setIsLoading(false);
      setOptions(prevOptions => [...prevOptions, newOption]);
      setValue(prevValue => [...prevValue, newOption]);
      setHobbies(prevHobbies => [...prevHobbies, docRef.id]);
      setInputValue('');
    } catch (error) {
      console.error('Error creating option:', error);
      setIsLoading(false);
    }
  };

  const customStyles = {
    input: (provided) => ({
      ...provided,
    //   border: '1px solid #ccc',
      borderRadius: '4px',
      padding: '10px',
      outline: 'none',
    }),
  };

  return (
    <CreatableSelect
      isMulti
      isClearable
      isDisabled={isLoading}
      isLoading={isLoading}
      onChange={newValue => setValue(newValue)}
      onCreateOption={handleCreate}
      onInputChange={input => setInputValue(input)}
      options={options}
      value={value}
      styles={customStyles}
      className='text-black'
    />
  );
};

export default HobbySelect;
