/**
 * Centralized error handling system
 */

export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  context?: string;
}

export class CameraError extends Error {
  public code: string;
  public details?: any;
  public context?: string;

  constructor(code: string, message: string, details?: any, context?: string) {
    super(message);
    this.name = 'CameraError';
    this.code = code;
    this.details = details;
    this.context = context;
  }
}

export const ErrorCodes = {
  CAMERA_PERMISSION_DENIED: 'CAMERA_PERMISSION_DENIED',
  CAMERA_NOT_FOUND: 'CAMERA_NOT_FOUND',
  CAMERA_IN_USE: 'CAMERA_IN_USE',
  RECORDING_FAILED: 'RECORDING_FAILED',
  STORAGE_ERROR: 'STORAGE_ERROR',
  ZOOM_ERROR: 'ZOOM_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export const createError = (
  code: keyof typeof ErrorCodes,
  message: string,
  details?: any,
  context?: string
): CameraError => {
  return new CameraError(ErrorCodes[code], message, details, context);
};

export const handleError = (error: unknown, context?: string): AppError => {
  const timestamp = new Date();
  
  if (error instanceof CameraError) {
    return {
      code: error.code,
      message: error.message,
      details: error.details,
      timestamp,
      context: error.context || context,
    };
  }
  
  if (error instanceof Error) {
    return {
      code: ErrorCodes.UNKNOWN_ERROR,
      message: error.message,
      details: { originalError: error.name },
      timestamp,
      context,
    };
  }
  
  return {
    code: ErrorCodes.UNKNOWN_ERROR,
    message: 'An unknown error occurred',
    details: { originalError: error },
    timestamp,
    context,
  };
};

export const getErrorMessage = (error: AppError): string => {
  const messages: Record<string, string> = {
    [ErrorCodes.CAMERA_PERMISSION_DENIED]: 'Permissions caméra refusées. Activez-les dans les paramètres.',
    [ErrorCodes.CAMERA_NOT_FOUND]: 'Aucune caméra détectée sur cet appareil.',
    [ErrorCodes.CAMERA_IN_USE]: 'Caméra déjà utilisée par une autre application.',
    [ErrorCodes.RECORDING_FAILED]: 'Impossible de démarrer l\'enregistrement.',
    [ErrorCodes.STORAGE_ERROR]: 'Erreur de sauvegarde des fichiers.',
    [ErrorCodes.ZOOM_ERROR]: 'Erreur lors du changement de zoom.',
    [ErrorCodes.UNKNOWN_ERROR]: 'Une erreur inattendue s\'est produite.',
  };
  
  return messages[error.code] || error.message;
};