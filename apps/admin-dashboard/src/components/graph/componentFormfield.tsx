import React, { useState } from 'react';
import {
  FormControl,
  FormLabel,
  Input,
  Select,
  Text,
  Textarea,
  FormErrorMessage,
} from '@chakra-ui/react';

import { FormFieldProps, Measures, TypeOfComponent } from './types';
import TimeInput from '../fields/TimeInput';

// Helper function to safely parse float values with comprehensive validation
const parseFloatSafe = (value: string): { value: number; error: string | null } => {
  if (!value || value.trim() === '') {
    return { value: 0, error: null };
  }
  
  const trimmed = value.trim();
  
  // Check for invalid characters (allow numbers, decimals, negative signs)
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(trimmed)) {
    return { value: 0, error: 'Please enter a valid number' };
  }
  
  const parsed = parseFloat(trimmed);
  
  if (isNaN(parsed)) {
    return { value: 0, error: 'Please enter a valid number' };
  }
  
  if (!isFinite(parsed)) {
    return { value: 0, error: 'Number is too large' };
  }
  
  // Check for reasonable bounds
  if (parsed < -1000000 || parsed > 1000000) {
    return { value: 0, error: 'Number must be between -1,000,000 and 1,000,000' };
  }
  
  return { value: parsed, error: null };
};

// Helper function to validate float input during typing
const isValidFloatInput = (value: string): boolean => {
  if (!value || value.trim() === '') return true; // Empty is valid (will default to 0)
  
  const trimmed = value.trim();
  
  // Allow partial input during typing: numbers, decimal point, negative sign
  // This regex allows: -123, 123., .123, -, . (partial inputs)
  return /^-?(\d*\.?\d*|\.\d*)$/.test(trimmed);
};

// Helper function to format display value
const formatDisplayValue = (value: string, precision?: number): string => {
  const parseResult = parseFloatSafe(value);
  if (parseResult.error || value === '') return value;
  
  if (precision !== undefined) {
    return parseResult.value.toFixed(precision);
  }
  
  return parseResult.value.toString();
};

export const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  value,
  onChange,
  type,
  options,
  placeholder,
  precision,
  textColor,
  inputBg,
  borderColor,
  optionBg,
  optionColor,
  isReadOnly = false,
}) => {
  const [localError, setLocalError] = useState<string>('');
  
  // Handle floating point fields
  const isFloatField = type === 'float' || (type === 'number' && ['amount', 'triggerMinAmount', 'cost', 'durationOfDevelopment'].includes(name));

  const handleFloatChange = (inputValue: string) => {
    setLocalError('');
    
    // Allow empty input
    if (inputValue === '') {
      onChange(name, '');
      return;
    }
    
    // Validate the input during typing
    if (!isValidFloatInput(inputValue)) {
      setLocalError('Please enter a valid number');
      onChange(name, inputValue); // Still update to show the invalid input
      return;
    }
    
    onChange(name, inputValue);
  };

  const handleFloatBlur = (inputValue: string) => {
    // On blur, validate and format the value
    const parseResult = parseFloatSafe(inputValue);
    
    if (parseResult.error) {
      setLocalError(parseResult.error);
      return;
    }
    
    // Format the value based on precision
    const cleanedValue = formatDisplayValue(inputValue, precision);
    onChange(name, cleanedValue);
    setLocalError('');
  };

  return (
    <FormControl isInvalid={!!localError}>
      <FormLabel color={textColor}>{label}</FormLabel>
      {type === 'text' && (
        <Input
          value={value}
          onChange={(e) => onChange(name, e.target.value)}
          placeholder={placeholder}
          bg={inputBg}
          borderColor={borderColor}
          color={textColor}
          isReadOnly={isReadOnly}
        />
      )}
      {type === 'textarea' && (
        <Textarea
          value={value || ''}
          onChange={(e) => onChange(name, e.target.value)}
          placeholder={placeholder}
          bg={inputBg}
          borderColor={borderColor}
          color={textColor}
          isReadOnly={isReadOnly}
          resize="vertical"
          minH="100px"
        />
      )}
      {(type === 'number' || type === 'float') && isFloatField && (
        <Input
          value={value}
          onChange={(e) => handleFloatChange(e.target.value)}
          onBlur={(e) => handleFloatBlur(e.target.value)}
          placeholder={placeholder || '0'}
          bg={inputBg}
          borderColor={borderColor}
          color={textColor}
          isReadOnly={isReadOnly}
          type="text"
        />
      )}
      {type === 'time' && (
        <TimeInput
          value={value}
          onChange={(timeValue) => onChange(name, timeValue)}
          placeholder={placeholder || '00:00'}
          bg={inputBg}
          borderColor={borderColor}
          color={textColor}
          textColorSecondary={textColor}
          isReadOnly={isReadOnly}
          label=""
        />
      )}
      {type === 'select' && options && (
        <Select
          value={value}
          onChange={(e) => onChange(name, e.target.value)}
          bg={inputBg}
          borderColor={borderColor}
          color={textColor}
          isDisabled={isReadOnly}
        >
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              style={{ backgroundColor: optionBg, color: optionColor }}
            >
              {option.label}
            </option>
          ))}
        </Select>
      )}
      {localError && <FormErrorMessage>{localError}</FormErrorMessage>}
    </FormControl>
  );
};

export const componentFormFields = [
  {
    id: 'amount',
    label: 'Amount',
    type: 'float',
    placeholder: '0',
  },
  {
    id: 'measure',
    label: 'Measure',
    type: 'select',
    options: [
      { value: Measures.Centimeters, label: 'Centimeters' },
      { value: Measures.Meters, label: 'Meters' },
      { value: Measures.Amount, label: 'Amount' },
    ],
  },
  {
    id: 'triggerMinAmount',
    label: 'Trigger Min Amount',
    type: 'float',
    placeholder: '0',
  },
  {
    id: 'supplier',
    label: 'Supplier',
    type: 'text',
  },
  {
    id: 'scannedBy',
    label: 'Scanned By',
    type: 'text',
    placeholder: 'Enter who scanned this component',
  },
  {
    id: 'cost',
    label: 'Cost',
    type: 'float',
    precision: 2,
    placeholder: '0.00',
  },
  {
    id: 'durationOfDevelopment',
    label: 'Production Time',
    type: 'time',
    placeholder: '00:00',
  },
  {
    id: 'type',
    label: 'Type',
    type: 'select',
    options: [
      { value: TypeOfComponent.Printer, label: 'Printer' },
      { value: TypeOfComponent.Group, label: 'Group' },
      { value: TypeOfComponent.Component, label: 'Component' },
      { value: TypeOfComponent.Assembly, label: 'Assembly' },
    ],
  },
  {
    id: 'description',
    label: 'Description',
    type: 'textarea',
    placeholder: 'Enter component description (optional)',
  },
];
