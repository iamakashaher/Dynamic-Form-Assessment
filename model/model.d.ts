export interface Question {
  type: 'text' | 'choice' | 'checkbox';
  label: string;
  options?: string[];
  required?: boolean;
  description?: string;
  id?: string;
}

export interface FormResponse {
  id: string;
  formId: string;
  responses: (string | string[])[];
  submittedAt?: Date;
  submittedBy?: string;
  isDraft?: boolean;
}

export interface Form {
  id: string;
  published: boolean;
  title: string;
  questions: Question[];
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
}
