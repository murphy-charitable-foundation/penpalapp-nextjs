import React, { useState, useEffect } from "react";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "@/app/firebaseConfig";
import CreatableSelect from "react-select/creatable";

const HobbySelect = ({ setHobbies, hobbies }) => {
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

  const customStyles = {
    input: (provided) => ({
      ...provided,
      borderRadius: "4px",
      padding: "10px",
      outline: "none",
    }),
  };

  return (
    <CreatableSelect
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
