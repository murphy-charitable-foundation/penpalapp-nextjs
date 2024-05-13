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
        const hobbiesSnapshot = await getDocs(collection(db, "hobbies"));
        const hobbyOptions = hobbiesSnapshot.docs.map((doc) => ({
          id: doc.id,
          value: doc.id,
          label: doc.data().hobby,
        }));
        setOptions(hobbyOptions);
      // Get the IDs and labels of the user's hobbies
      // Prepare default value based on user's hobbies
    //   const userHobbyData = hobbies.map(hobby => ({
    //     id: hobby.id,
    //     label: hobby.hobby
    //   }));
    console.log(hobbies)

    //   console.log(userHobbyData)
    //   const defaultValue = hobbyOptions.filter(option => userHobbyData.some(userHobby => userHobby.id === option.id));

    //   console.log('Default Value:', defaultValue);

    //   setValue(defaultValue);

        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching hobbies:", error);
        setIsLoading(false);
      }
    };

    fetchHobbies();
  }, [hobbies]);

  const handleCreate = async () => {
    setIsLoading(true);
    try {
      const lowercaseInput = inputValue.toLowerCase().trim();
      const docRef = await addDoc(collection(db, "hobbies"), {
        hobby: lowercaseInput,
      });
      const newOption = {
        id: docRef.id,
        value: docRef.id,
        label: lowercaseInput,
      };
      setIsLoading(false);
      setOptions((prevOptions) => [...prevOptions, newOption]);
      setValue((prevValue) => [...prevValue, newOption]);
      setHobbies((prevHobbies) => [
        ...prevHobbies,
        { id: docRef.id, name: lowercaseInput },
      ]); // Save both ID and name
      setInputValue("");
    } catch (error) {
      console.error("Error creating option:", error);
      setIsLoading(false);
    }
  };

  const handleChange = (newValue, actionMeta) => {
    if (actionMeta.action === "select-option") {
      // A new option is selected
      const selectedHobbies = newValue
        ? newValue.map((option) => ({ id: option.id, hobby: option.label }))
        : [];
      setHobbies(selectedHobbies);
    } else if (actionMeta.action === "remove-value" || actionMeta.action === "deselect-option") {
      // An option is removed
      const removedOptionId = actionMeta.removedValue.id;
      setHobbies((prevHobbies) =>
        prevHobbies.filter((hobby) => hobby.id !== removedOptionId)
      );
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
