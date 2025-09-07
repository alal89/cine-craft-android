import { useState, useCallback } from 'react';

export interface StorageLocation {
  id: string;
  name: string;
  path: string;
  type: 'internal' | 'external' | 'cloud';
  available: boolean;
  freeSpace?: string;
}

export const useStorage = () => {
  const [locations, setLocations] = useState<StorageLocation[]>([
    {
      id: 'downloads',
      name: 'Téléchargements',
      path: '/storage/emulated/0/Download',
      type: 'internal',
      available: true,
      freeSpace: 'Auto-détecté'
    },
    {
      id: 'dcim',
      name: 'Appareil Photo (DCIM)',
      path: '/storage/emulated/0/DCIM/Camera',
      type: 'internal',
      available: true,
      freeSpace: 'Auto-détecté'
    },
    {
      id: 'custom',
      name: 'Dossier personnalisé',
      path: '/storage/emulated/0/CineCraft',
      type: 'internal',
      available: true,
      freeSpace: 'Auto-détecté'
    }
  ]);

  const [selectedLocation, setSelectedLocation] = useState<StorageLocation>(locations[0]);

  const checkStoragePermissions = useCallback(async (): Promise<boolean> => {
    try {
      // Check if we're in a Capacitor environment
      if ('Capacitor' in window) {
        const { Capacitor } = window as any;
        if (Capacitor.isNativePlatform()) {
          // For now, assume permissions are granted
          // In a real implementation, you'd use @capacitor/permissions
          console.log('Checking storage permissions...');
          return true;
        }
      }
      return true; // Web environment
    } catch (error) {
      console.error('Storage permission check failed:', error);
      return false;
    }
  }, []);

  const saveFile = useCallback(async (
    blob: Blob, 
    filename: string, 
    location?: StorageLocation
  ): Promise<void> => {
    const targetLocation = location || selectedLocation;
    
    try {
      // Check permissions first
      const hasPermission = await checkStoragePermissions();
      if (!hasPermission) {
        throw new Error('Storage permissions not granted');
      }

      // In Capacitor environment, use native file system
      if ('Capacitor' in window) {
        const { Capacitor } = window as any;
        if (Capacitor.isNativePlatform()) {
          const { Filesystem, Directory } = await import('@capacitor/filesystem');
          
          // Convert blob to base64
          const base64Data = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              resolve(result.split(',')[1]); // Remove data:... prefix
            };
            reader.readAsDataURL(blob);
          });

          // Save to the selected directory
          let directory = Directory.Documents;
          if (targetLocation.id === 'dcim') {
            directory = Directory.ExternalStorage;
          } else if (targetLocation.id === 'downloads') {
            directory = Directory.Documents; // Use Documents as fallback
          }

          await Filesystem.writeFile({
            path: filename,
            data: base64Data,
            directory: directory,
            recursive: true
          });

          console.log(`File saved to: ${targetLocation.name}/${filename}`);
          return;
        }
      }

      // Web fallback - download to browser
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('File save failed:', error);
      throw error;
    }
  }, [selectedLocation, checkStoragePermissions]);

  const generateFilename = useCallback((type: 'photo' | 'video', extension: string): string => {
    const now = new Date();
    const timestamp = now.toISOString()
      .replace(/[:.]/g, '-')
      .replace('T', '_')
      .slice(0, -5); // Remove milliseconds and Z
    
    const prefix = type === 'photo' ? 'IMG' : 'VID';
    return `${prefix}_${timestamp}.${extension}`;
  }, []);

  const savePhoto = useCallback(async (blob: Blob, location?: StorageLocation): Promise<void> => {
    const filename = generateFilename('photo', 'jpg');
    await saveFile(blob, filename, location);
  }, [saveFile, generateFilename]);

  const saveVideo = useCallback(async (blob: Blob, location?: StorageLocation): Promise<void> => {
    const filename = generateFilename('video', 'webm');
    await saveFile(blob, filename, location);
  }, [saveFile, generateFilename]);

  const updateStorageInfo = useCallback(async (): Promise<void> => {
    try {
      if ('Capacitor' in window) {
        const { Capacitor } = window as any;
        if (Capacitor.isNativePlatform()) {
          // Get storage info from native layer
          // This would require a custom plugin or use device info
          console.log('Getting storage info...');
        }
      }
    } catch (error) {
      console.error('Failed to update storage info:', error);
    }
  }, []);

  return {
    locations,
    selectedLocation,
    setSelectedLocation,
    savePhoto,
    saveVideo,
    saveFile,
    generateFilename,
    checkStoragePermissions,
    updateStorageInfo
  };
};