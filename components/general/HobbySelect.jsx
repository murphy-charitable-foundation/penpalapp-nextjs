"use client";

import React, { useState, useEffect } from "react";
import { collection, getDocs, addDoc } from "firebase/firestore";
import CreatableSelect from "react-select/creatable";
import { db } from "../../app/firebaseConfig";

const normalize = (str) => str.toLowerCase().trim();

const HobbySelect = ({ setHobbies, hobbies = [], wantBorder = true }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [options, setOptions] = useState([]);
  const [value, setValue] = useState([]);

  /* ================== FETCH ONCE ================== */
  useEffect(() => {
    const fetchHobbies = async () => {
      try {
        setIsLoading(true);
        const snapshot = await getDocs(collection(db, "hobbies"));

        const hobbyOptions = snapshot.docs.map((doc) => {
          const hobby = normalize(doc.data().hobby);
          return {
            id: doc.id,
            value: hobby,
            label: hobby.charAt(0).toUpperCase() + hobby.slice(1),
          };
        });

        setOptions(hobbyOptions);

        // sync initial value
        const selected = hobbyOptions.filter((opt) =>
          hobbies.map(normalize).includes(opt.value)
        );
        setValue(selected);
      } catch (err) {
        console.error("Error fetching hobbies:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHobbies();
    // fetch only once
  }, []);

  /* ================== SYNC EXTERNAL CHANGES ================== */
  useEffect(() => {
    const selected = options.filter((opt) =>
      hobbies.map(normalize).includes(opt.value)
    );
    setValue(selected);
  }, [hobbies, options]);

  /* ================== CREATE ================== */
  const handleCreate = async (input) => {
    const normalized = normalize(input);
    if (!normalized) return;

    const exists = options.some((opt) => opt.value === normalized);
    if (exists) return;

    setIsLoading(true);
    try {
      await addDoc(collection(db, "hobbies"), {
        hobby: normalized,
      });

      const newOption = {
        value: normalized,
        label: normalized.charAt(0).toUpperCase() + normalized.slice(1),
      };

      setOptions((prev) => [...prev, newOption]);
      setValue((prev) => [...prev, newOption]);
      setHobbies((prev) => [...prev, normalized]);
    } catch (err) {
      console.error("Error creating hobby:", err);
    } finally {
      setIsLoading(false);
    }
  };

  /* ================== CHANGE ================== */
  const handleChange = (newValue) => {
    const selected = newValue || [];
    setValue(selected);
    setHobbies(selected.map((opt) => opt.value));
  };

  /* ================== STYLES ================== */
  const customStyles = {
    control: (base) => ({
      ...base,
      width: "100%",
      fontWeight: 500,
      backgroundColor: "transparent",
      border: "none",
      borderBottom: wantBorder ? "1px solid #d1d5db" : "none",
      borderRadius: 0,
      boxShadow: "none",
      "&:hover": {
        borderBottom: wantBorder ? "1px solid #9ca3af" : "none",
      },
    }),
    valueContainer: (base) => ({
      ...base,
      padding: 0,
    }),
    input: (base) => ({
      ...base,
      color: "#111827",
    }),
    dropdownIndicator: (base) => ({
      ...base,
      color: "#9ca3af",
    }),
    indicatorSeparator: () => ({
      display: "none",
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: "#E6EDF4",
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: "#1f2937",
      fontWeight: 500,
    }),
  };

  return (
    <CreatableSelect
      placeholder="Select or add hobbies"
      isMulti
      isClearable
      isDisabled={isLoading}
      isLoading={isLoading}
      onChange={handleChange}
      onCreateOption={handleCreate}
      options={options}
      value={value}
      styles={customStyles}
      className="text-black"
    />
  );
};

export default HobbySelect;
