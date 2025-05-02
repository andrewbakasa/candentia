import { useEffect, useState } from "react";

interface DebouncedInputProps {
  value?: string;
  onChange: (value: string) => void;
  debounce?: number;
  // Add other props as needed (use keyof for better type safety)
  [propName: string]: any;
}

const DebouncedInput: React.FC<DebouncedInputProps> = ({
  value = "",
  onChange,
  debounce = 500,
  ...props
}) => {
  const [internalValue, setInternalValue] = useState(value);

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(internalValue);
    }, debounce);

    return () => clearTimeout(timeout);
  }, [internalValue, debounce]);

  return (
    <input {...props} value={internalValue} onChange={(e) => setInternalValue(e.target.value)} />
  );
};

export default DebouncedInput;
