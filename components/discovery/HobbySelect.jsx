"use client";

import { useMemo, useState } from "react";

const DEFAULT_HOBBIES = [
  { id: "reading", label: "Reading" },
  { id: "drawing", label: "Drawing" },
  { id: "music", label: "Music" },
  { id: "sports", label: "Sports" },
  { id: "chess", label: "Chess" },
  { id: "coding", label: "Coding" },
];

function slugify(label) {
  return label.toLowerCase().trim().replace(/\s+/g, "-");
}

export default function HobbySelect(props) {
  const {
  value = [],
  onChange,
  allowCustom = false,
  placeholder = allowCustom ? "Select or add hobbies" : "Select hobbies",
  } = props;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  // merge defaults + selected custom hobbies (so custom ones don't disappear)
  const options = useMemo(() => {
    const selectedExtras = value.filter(function (v) {
      return !DEFAULT_HOBBIES.some(function (d) {
        return d.id === v.id;
      });
    });

    return DEFAULT_HOBBIES.concat(selectedExtras);
  }, [value]);

  const filteredOptions = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return options;
    return options.filter(function (o) {
      return o.label.toLowerCase().includes(q);
    });
  }, [options, query]);

  function isSelected(id) {
    return value.some(function (v) {
      return v.id === id;
    });
  }

  function toggle(opt) {
    if (isSelected(opt.id)) {
      onChange(
        value.filter(function (v) {
          return v.id !== opt.id;
        })
      );
    } else {
      onChange(value.concat(opt));
    }
  }

  function addCustom() {
    var label = query.trim();
    if (!label) return;

    var id = slugify(label);

    // if it matches an existing option, just toggle it
    var existing = options.find(function (o) {
      return o.id === id;
    });

    if (existing) {
      toggle(existing);
      setQuery("");
      return;
    }

    // otherwise create + select it
    var custom = { id: id, label: label };
    onChange(value.concat(custom));
    setQuery("");
  }

  var selectedLabels = value.map(function (v) {
    return v.label;
  }).join(", ");

  return (
    <div className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(function (s) { return !s; })}
        className="w-full h-11 flex items-center justify-between border-b-2 border-gray-300 bg-transparent"
      >
        <span className={"text-left " + (value.length ? "text-gray-900" : "text-gray-400")}>
          {value.length ? selectedLabels : placeholder}
        </span>
        <span className="text-gray-400">▾</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border bg-white shadow-lg p-3">
          {/* Search / Add */}
          <div className="flex gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search hobbies..."
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
            />
            {allowCustom && (
              <button
                type="button"
                onClick={addCustom}
                className="px-3 py-2 text-sm rounded-lg bg-gray-200"
              >
                Add
              </button>
            )}
          </div>

          {/* Options */}
          <div className="mt-3 max-h-52 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-sm text-gray-500 text-center">
                No options
              </div>
            ) : (
              <ul className="space-y-1">
                {filteredOptions.map(function (opt) {
                  var checked = isSelected(opt.id);
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
                        <span className="text-sm text-gray-900">{opt.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Footer */}
          <div className="mt-3 flex justify-between">
            <button
              type="button"
              onClick={() => {
                onChange([]);
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
