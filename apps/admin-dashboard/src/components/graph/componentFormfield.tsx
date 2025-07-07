import React from 'react';
import {
  FormControl,
  FormLabel,
  Input,
  NumberInput,
  NumberInputField,
  Select,
  Text,
  Textarea,
} from '@chakra-ui/react';

import { FormFieldProps, Measures, TypeOfComponent } from './types';

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
  return (
    <FormControl>
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
      {type === 'number' && (
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
    </FormControl>
  );
};

export const componentFormFields = [
  {
    id: 'amount',
    label: 'Amount',
    type: 'number',
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
    type: 'number',
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
    type: 'number',
    precision: 2,
  },
  {
    id: 'durationOfDevelopment',
    label: 'Development Duration (days)',
    type: 'number',
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
