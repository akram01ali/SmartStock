import React, { useState } from 'react';
import {
  FormControl,
  FormLabel,
  Input,
  NumberInput,
  NumberInputField,
  Select,
  Text,
  Textarea,
  FormErrorMessage,
} from '@chakra-ui/react';

import { FormFieldProps, Measures, TypeOfComponent } from './types';

// Helper function to safely parse float values
const parseFloatSafe = (value: string): number => {
  if (!value || value.trim() === '') return 0;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
};

// Helper function to validate float input
const isValidFloatInput = (value: string): boolean => {
  if (!value || value.trim() === '') return true; // Empty is valid (will default to 0)
  const parsed = parseFloat(value);
  return !isNaN(parsed) && isFinite(parsed);
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
    
    // Validate the input
    if (!isValidFloatInput(inputValue)) {
      setLocalError('Please enter a valid number');
      onChange(name, inputValue); // Still update to show the invalid input
      return;
    }
    
    onChange(name, inputValue);
  };

  const handleFloatBlur = (inputValue: string) => {
    // On blur, convert to number and back to ensure clean format
    const numValue = parseFloatSafe(inputValue);
    const cleanedValue = numValue === 0 ? '0' : numValue.toString();
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
      {(type === 'number' || type === 'float') && !isFloatField && (
        <NumberInput
          value={value}
          onChange={(_, val) => onChange(name, val)}
          precision={precision}
          isReadOnly={isReadOnly}
        >
          <NumberInputField
            bg={inputBg}
            borderColor={borderColor}
            color={textColor}
          />
        </NumberInput>
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
    label: 'Development Duration (days)',
    type: 'float',
    placeholder: '0',
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
