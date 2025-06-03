import React, { useState, useEffect } from "react";
import { collection, getDocs, addDoc } from "firebase/firestore";
import CreatableSelect from "react-select/creatable";
import { db } from "../../app/firebaseConfig";

const HobbySelect = ({ setHobbies, hobbies, wantBorder = true }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [options, setOptions] = useState([]);
  const [value, setValue] = useState([]);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    const fetchHobbies = async () => {
      try {
        setIsLoading(true);
        const hobbiesSnapshot = await getDocs(collection(db, "hobbies"));
        const hobbyOptions = hobbiesSnapshot.docs.map((doc) => ({
          id: doc.id,
          value: doc.data().hobby,
          label: doc.data().hobby,
        }));
        setOptions(hobbyOptions);

        // Set default values based on existing hobbies
        const defaultValues = hobbyOptions.filter((option) =>
          hobbies.includes(option.value)
        );
        setValue(defaultValues);

        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching hobbies:", error);
        setIsLoading(false);
      }
    };

    fetchHobbies();
  }, [hobbies]);

  const handleCreate = async (inputValue) => {
    setIsLoading(true);
    try {
      const lowercaseInput = inputValue.toLowerCase().trim();
      const existingHobby = options.find(
        (option) => option.value === lowercaseInput
      );
      if (!existingHobby) {
        const docRef = await addDoc(collection(db, "hobbies"), {
          hobby: lowercaseInput,
        });
        const newOption = {
          value: lowercaseInput,
          label: inputValue,
        };
        setOptions((prevOptions) => [...prevOptions, newOption]);
        setValue((prevValue) => [...prevValue, newOption]);
        setHobbies((prevHobbies) => [...prevHobbies, lowercaseInput]);
      }
    } catch (error) {
      console.error("Error creating option:", error);
    }
    setIsLoading(false);
    setInputValue("");
  };

  const handleChange = (newValue, actionMeta) => {
    if (actionMeta.action === "select-option" || actionMeta.action === "remove-value") {
      const selectedHobbies = newValue
        ? newValue.map((option) => option.value)
        : [];
      setHobbies(selectedHobbies);
    }
    setValue(newValue);
  };

  const customStyles={
    control: (base, state) => ({
      ...base,
      width: '100%',
      fontWeight: 500,
      color: '#1f2937', // Tailwind's text-gray-900
      backgroundColor: 'transparent',
      border: 'none',
      borderBottom: '1px solid #d1d5db', // Tailwind's border-gray-300
      borderRadius: 0, //
      padding: '0.5rem',
      textAlign: 'left',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: 'none', // Remove react-select's default focus shadow
      '&:hover': {
        borderBottom: '1px solid #9ca3af', // Tailwind's border-gray-400 on hover
      },
    }),
    singleValue: (base) => ({
      ...base,
      color: 'black', // Ensures the selected value is visible
      margin: 0, // Remove extra margin if needed
    }),
    valueContainer: (base) => ({
    ...base,
    color: 'black',
    padding: 0, // Remove default padding around the value
    }),
    input: (base) => ({
      ...base,
      color: '#1f2937',
    }),
    dropdownIndicator: (base) => ({
      ...base,
       color: '#9ca3af', // lighter gray (Tailwind's text-gray-400)
       marginLeft: '3rem',
       paddingLeft: '0rem', // move it to the right
    }),
    indicatorSeparator: () => ({
      display: 'none',
    }),
  }

  return (
    <CreatableSelect
      placeholder="Select your hobbies"
      isMulti
      isClearable
      isDisabled={isLoading}
      isLoading={isLoading}
      onChange={handleChange}
      onCreateOption={handleCreate}
      onInputChange={(input) => setInputValue(input)}
      options={options}
      value={value}
      styles={customStyles}
      className="text-black"
    />
  );
};

export default HobbySelect;
