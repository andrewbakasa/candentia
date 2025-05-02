import { EyeIcon, EyeOffIcon } from 'lucide-react';
import React, { useState } from 'react';
//import { EyeIcon, EyeOffIcon } from '@heroicons/react/outline'; // Import icons

interface PasswordInputProps {
  label: string;
  onChange: (value: string) => void;
}

const PasswordInput: React.FC<PasswordInputProps> = ({ label, onChange }) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const handleToggleVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <div className="flex items-center mb-4">
      <label htmlFor="password" className="mr-4 text-sm font-medium">
        {label}
      </label>
      <input
        id="password"
        type={isPasswordVisible ? 'text' : 'password'}
        className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter password"
        autoComplete="off" // Prevent browser autocompletion
      />
      <button
        type="button"
        onClick={handleToggleVisibility}
        className="ml-2 focus:outline-none"
      >
        {isPasswordVisible ? <EyeOffIcon className="h-5 w-5 text-gray-500" /> : <EyeIcon className="h-5 w-5 text-gray-500" />}
      </button>
    </div>
  );
};

export default PasswordInput;

