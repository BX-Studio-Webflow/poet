// BambooHR Job Types

export interface BambooHRJob {
  id: number;
  title: LabeledField;
  postedDate: string;
  location: JobLocation;
  department: LabeledField;
  status: JobStatus;
  hiringLead: HiringLead;
  newApplicantsCount: number;
  activeApplicantsCount: number;
  totalApplicantsCount: number;
  postingUrl: string;
}

export interface LabeledField {
  id: number | null;
  label: string | null;
}

export interface JobLocation {
  id: number;
  label: string;
  address: JobAddress;
}

export interface JobAddress {
  name: string;
  description: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  zipcode: string;
  country: string;
  phoneNumber: string | null;
}

export interface JobStatus {
  id: number;
  label: 'Open' | 'Filled' | 'On Hold' | 'Canceled' | 'Draft';
}

export interface HiringLead {
  employeeId: number;
  firstName: string;
  lastName: string;
  avatar: string;
  jobTitle: LabeledField;
}

// Transformed job type for API response
export interface TransformedJob {
  id: number;
  title: string;
  postedDate: string;
  location: {
    city: string;
    state: string;
    label: string;
    address: {
      line1: string;
      line2: string | null;
      city: string;
      state: string;
      zipcode: string;
      country: string;
    };
  };
  department: string;
  status: {
    id: number;
    label: string;
  };
  hiringLead: {
    name: string;
    avatar: string;
  };
  applicants: {
    new: number;
    active: number;
    total: number;
  };
  postingUrl: string;
}
