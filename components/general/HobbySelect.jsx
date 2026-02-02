"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "../../app/firebaseConfig";

function slugify(label) {
  return label.toLowerCase().trim().replace(/\s+/g, "-");
}

function capFirst(s) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function HobbySelect({
  value = [],
  onChange,
  editable = false, 
  allowCustom = false, 
  placeholder,
  collectionName = "hobbies",
}) {
  const safePlaceholder =
    placeholder || (allowCustom ? "Select or add hobbies" : "Select hobbies");

  const safeOnChange = typeof onChange === "function" ? onChange : () => {};

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [serverOptions, setServerOptions] = useState([]); // [{id,label}]

  // ================== FETCH HOBBIES ==================
  useEffect(() => {
    let alive = true;

    async function fetchHobbies() {
      try {
        setIsLoading(true);
        const snap = await getDocs(collection(db, collectionName));

        const opts = snap.docs
          .map((d) => {
            const data = d.data() || {};
            const raw = (data.hobby || data.label || data.name || "")
              .toString()
              .trim();
            if (!raw) return null;

            const id = slugify(raw);
            return { id, label: capFirst(raw.toLowerCase()) };
          })
          .filter(Boolean);

        const uniq = Array.from(new Map(opts.map((o) => [o.id, o])).values());
        if (alive) setServerOptions(uniq);
      } catch (e) {
        console.error("Failed to fetch hobbies:", e);
        if (alive) setServerOptions([]);
      } finally {
        if (alive) setIsLoading(false);
      }
    }

    fetchHobbies();
    return () => {
      alive = false;
    };
  }, [collectionName]);

  // ================== MERGE SERVER + SELECTED ==================
  const options = useMemo(() => {
    const selectedExtras = value.filter(
      (v) => !serverOptions.some((o) => o.id === v.id)
    );
    return serverOptions.concat(selectedExtras);
  }, [serverOptions, value]);

  const filteredOptions = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  // ================== HELPERS ==================
  function isSelected(id) {
    return value.some((v) => v.id === id);
  }

  function toggle(opt) {
    if (isSelected(opt.id)) {
      safeOnChange(value.filter((v) => v.id !== opt.id));
    } else {
      safeOnChange(value.concat(opt));
    }
  }

  // ================== ADD CUSTOM ==================
  async function addCustom() {
    if (!allowCustom) return;

    const label = query.trim();
    if (!label) return;

    const id = slugify(label);
    const existing = options.find((o) => o.id === id);

    if (existing) {
      toggle(existing);
      setQuery("");
      return;
    }

    const newOption = { id, label: capFirst(label) };

    // write --> Firestore
    if (editable) {
      try {
        setIsLoading(true);
        await addDoc(collection(db, collectionName), {
          hobby: label.toLowerCase().trim(),
        });
      } catch (e) {
        console.error("Error creating hobby:", e);
      } finally {
        setIsLoading(false);
      }
    }

    safeOnChange(value.concat(newOption));
    setQuery("");
  }

  const selectedText = value.map((v) => v.label).join(", ");

  // ================== RENDER ==================
  return (
    <div className="relative">
      <button
        type="button"
        disabled={isLoading}
        onClick={() => setOpen((s) => !s)}
        className="w-full h-11 flex items-center justify-between font-semibold border-b-2 border-gray-300 bg-transparent disabled:opacity-60"
      >
        <span className={value.length ? "text-gray-900" : "text-gray-400"}>
          {value.length ? selectedText : safePlaceholder}
        </span>
        <span className="text-gray-400">▾</span>
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full max-h-[60vh] overflow-y-auto rounded-xl border bg-white shadow-lg p-3">
          <div className="flex gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search hobbies..."
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
            />
            {allowCustom && editable && (
              <button
                type="button"
                onClick={addCustom}
                className="px-3 py-2 text-sm rounded-lg bg-gray-200"
              >
                Add
              </button>
            )}
          </div>

          <div className="mt-3 max-h-52 overflow-y-auto">
            {isLoading ? (
              <div className="py-6 text-sm text-gray-500 text-center">
                Loading…
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="py-6 text-sm text-gray-500 text-center">
                No options
              </div>
            ) : (
              <ul className="space-y-1">
                {filteredOptions.map((opt) => {
                  const checked = isSelected(opt.id);
                  return (
                    <li key={opt.id}>
                      <button
                        type="button"
                        onClick={() => toggle(opt)}
                        className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-gray-50 text-left"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          readOnly
                          className="h-4 w-4"
                        />
                        <span className="text-sm text-gray-900">
                          {opt.label}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="mt-3 flex justify-between">
            <button
              type="button"
              onClick={() => {
                safeOnChange([]);
                setQuery("");
              }}
              className="text-xs text-gray-600 underline"
            >
              Clear hobbies
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs text-gray-600 underline"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
