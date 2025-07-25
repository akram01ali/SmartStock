import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export interface ImagePickerResult {
  uri: string;
  base64?: string;
}

export const requestCameraPermission = async (): Promise<boolean> => {
  const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
  if (!permissionResult.granted) {
    Alert.alert('Permission required', 'Camera permission is required to take photos.');
    return false;
  }
  return true;
};

export const openCamera = async (): Promise<ImagePicker.ImageInfo | null> => {
  const hasPermission = await requestCameraPermission();
  if (!hasPermission) return null;

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 1,
  });

  if (!result.canceled && result.assets && result.assets.length > 0) {
    return result.assets[0];
  }
  return null;
};

export const openImagePicker = async (): Promise<ImagePicker.ImageInfo | null> => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 1,
  });

  if (!result.canceled && result.assets && result.assets.length > 0) {
    return result.assets[0];
  }
  return null;
};

export const showImagePickerAlert = (
  onCamera: () => void,
  onGallery: () => void
) => {
  Alert.alert(
    "Select Image",
    "Choose how you'd like to add an image:",
    [
      { text: "Cancel", style: "cancel" },
      { text: "Take Photo", onPress: onCamera },
      { text: "Choose from Gallery", onPress: onGallery },
    ]
  );
};

export const convertImageToBase64 = async (imageUri: string): Promise<string | null> => {
  try {
    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error converting image to base64:", error);
    return null;
  }
}; 