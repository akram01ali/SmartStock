import React, { useState, useEffect } from 'react';
import { Input, FormLabel, FormControl, Text, Box } from '@chakra-ui/react';

interface TimeInputProps {
  value: number; // Value in hours (float)
  onChange: (value: number) => void;
  placeholder?: string;
  bg: string;
  borderColor: string;
  color: string;
  textColorSecondary: string;
  isReadOnly?: boolean;
  label?: string;
}

const TimeInput: React.FC<TimeInputProps> = ({
  value,
  onChange,
  placeholder = "00:00",
  bg,
  borderColor,
  color,
  textColorSecondary,
  isReadOnly = false,
  label = "Production Time"
}) => {
  const [timeString, setTimeString] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Convert hours (float) to HH:MM format
  const hoursToTimeString = (hours: number): string => {
    if (hours === 0) return '00:00';
    
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    
    return `${wholeHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  // Convert HH:MM format to hours (float)
  const timeStringToHours = (timeStr: string): number => {
    if (!timeStr || timeStr === '') return 0;
    
    const timeRegex = /^(\d{1,2}):(\d{2})$/;
    const match = timeStr.match(timeRegex);
    
    if (!match) {
      throw new Error('Invalid time format. Use HH:MM');
    }
    
    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    
    if (minutes >= 60) {
      throw new Error('Minutes must be less than 60');
    }
    
    return hours + (minutes / 60);
  };

  useEffect(() => {
    setTimeString(hoursToTimeString(value));
  }, [value]);

  const handleChange = (inputValue: string) => {
    setTimeString(inputValue);
    setError(null);
    
    if (inputValue === '') {
      onChange(0);
      return;
    }
    
    try {
      const hours = timeStringToHours(inputValue);
      onChange(hours);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid time format');
    }
  };

  const handleBlur = () => {
    // Format the time string on blur
    if (timeString && !error) {
      try {
        const hours = timeStringToHours(timeString);
        setTimeString(hoursToTimeString(hours));
      } catch (err) {
        // Keep the error state
      }
    }
  };

  return (
    <FormControl>
      <FormLabel color={color}>{label}</FormLabel>
      <Input
        type="text"
        value={timeString}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        placeholder={placeholder}
        bg={bg}
        borderColor={borderColor}
        color={color}
        isReadOnly={isReadOnly}
        _placeholder={{ color: textColorSecondary }}
        h="44px"
        maxH="44px"
      />
      {error && (
        <Text color="red.500" fontSize="sm" mt={1}>
          {error}
        </Text>
      )}
      <Text color={textColorSecondary} fontSize="xs" mt={1}>
        Format: HH:MM (e.g., 02:30 = 2.5 hours)
      </Text>
    </FormControl>
  );
};

export default TimeInput;
