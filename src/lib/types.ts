export type Agent = {
  id: string;
  name: string;
  registrationNumber: string;
  rank: string;
  contact: string;
  address: string;
  skills: string[];
};

export type Mission = {
  id: string;
  name: string;
  details: string;
  agentId: string | null;
  startDate: string;
  endDate: string;
  priority: number;
  requiredSkills: string[];
  notes?: string;
};
