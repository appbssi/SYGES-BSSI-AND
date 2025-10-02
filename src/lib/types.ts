export type Agent = {
  id: string;
  firstName: string;
  lastName: string;
  registrationNumber: string;
  rank: string;
  contactNumber: string;
  address: string;
};

export type Mission = {
  id: string;
  name: string;
  details: string;
  agentIds: string[];
  startDate: string;
  endDate: string;
  notes?: string;
};
