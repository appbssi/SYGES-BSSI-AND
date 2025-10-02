export type Agent = {
  id: string;
  name: string;
  registrationNumber: string;
  rank: string;
  contact: string;
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
