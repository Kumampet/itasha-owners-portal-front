"use client";

import React from "react";

interface LabeledTextInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "id"> {
  label?: string;
  required?: boolean;
  id?: string;
  helpText?: string;
}

export function LabeledTextInput({
  label,
  required = false,
  id,
  className = "",
  helpText,
  ...inputProps
}: LabeledTextInputProps) {
  const inputId = id || (label ? `input-${label.replace(/\s+/g, "-").toLowerCase()}` : undefined);

  return (
    <div>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-zinc-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        id={inputId}
        className={`mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 ${className}`}
        required={required}
        {...inputProps}
      />
      {helpText && (
        <p className="mt-1 text-xs text-zinc-500">
          {helpText}
        </p>
      )}
    </div>
  );
}
