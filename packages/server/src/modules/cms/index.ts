export class CMSError extends Error {
    constructor(message: string, public code: string = 'CMS_ERROR') {
      super(message);
      this.name = 'CMSError';
    }
  }
  
  export class CMSAPIError extends CMSError {
    constructor(message: string, public originalError?: unknown) {
      super(message, 'CMS_API_ERROR');
      this.name = 'CMSAPIError';
      this.originalError = originalError;
    }
  }
  
  export class CMSDataError extends CMSError {
    constructor(message: string, public data?: unknown) {
      super(message, 'CMS_DATA_ERROR');
      this.name = 'CMSDataError';
      this.data = data;
    }
  }