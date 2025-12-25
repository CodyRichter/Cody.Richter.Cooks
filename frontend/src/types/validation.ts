/**
 * Validation schema types and utilities
 * These types define validation rules and error structures
 */

// Field validation rules
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: unknown) => string | null;
}

// Validation schema for forms
export interface ValidationSchema {
  [fieldName: string]: ValidationRule;
}

// Validation result
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
}

// Field error structure
export interface FieldError {
  field: string;
  message: string;
  code?: string;
}

// Form validation state
export interface FormValidationState {
  isValidating: boolean;
  isValid: boolean;
  errors: Record<string, string[]>;
  touched: Record<string, boolean>;
}

// User validation schemas
export const UserValidationSchemas = {
  login: {
    username: {
      required: true,
      minLength: 1,
    },
    password: {
      required: true,
      minLength: 1,
    },
  } as ValidationSchema,

  register: {
    username: {
      required: true,
      minLength: 3,
      maxLength: 50,
    },
    email: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    password: {
      required: true,
      minLength: 8,
      maxLength: 128,
    },
  } as ValidationSchema,

  updateProfile: {
    username: {
      minLength: 3,
      maxLength: 50,
    },
    email: {
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    password: {
      minLength: 8,
      maxLength: 128,
    },
  } as ValidationSchema,
};

// Recipe validation schemas
export const RecipeValidationSchemas = {
  create: {
    title: {
      required: true,
      minLength: 1,
      maxLength: 255,
    },
    cooking_time: {
      min: 1,
    },
    serving_size: {
      min: 1,
    },
  } as ValidationSchema,

  update: {
    title: {
      minLength: 1,
      maxLength: 255,
    },
    cooking_time: {
      min: 1,
    },
    serving_size: {
      min: 1,
    },
  } as ValidationSchema,
};

// Ingredient validation schema
export const IngredientValidationSchema = {
  name: {
    required: true,
    minLength: 1,
    maxLength: 255,
  },
  quantity: {
    required: true,
    min: 0,
  },
  unit: {
    required: true,
    minLength: 1,
    maxLength: 50,
  },
  subtext: {
    maxLength: 255,
  },
  order_index: {
    required: true,
    min: 0,
  },
} as ValidationSchema;

// Instruction validation schema
export const InstructionValidationSchema = {
  title: {
    required: true,
    minLength: 1,
    maxLength: 255,
  },
  description: {
    required: true,
    minLength: 1,
  },
  step_number: {
    required: true,
    min: 1,
  },
  timing: {
    min: 1,
  },
} as ValidationSchema;

// HTML content validation
export interface HtmlValidationOptions {
  allowedTags?: string[];
  maxLength?: number;
  stripDisallowed?: boolean;
}

export const DefaultHtmlValidationOptions: HtmlValidationOptions = {
  allowedTags: [
    'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'img', 'a', 'span', 'div', 'blockquote'
  ],
  stripDisallowed: true,
};

// Search parameter validation
export const SearchValidationSchema = {
  q: {
    maxLength: 255,
  },
  cooking_time_max: {
    min: 1,
  },
  serving_size_min: {
    min: 1,
  },
  serving_size_max: {
    min: 1,
  },
  page: {
    min: 1,
  },
  limit: {
    min: 1,
    max: 100,
  },
} as ValidationSchema;
