import type { Agent, Mission } from './types';

// In a real application, this data would come from a database.
// For this example, we're using a static in-memory array.

let agents: Omit<Agent, 'avatar'>[] = [
  { id: '1', name: 'Jean Dupont', registrationNumber: 'A123', rank: 'Sergent', contact: '0612345678', address: '1 Rue de la Paix, Paris' },
  { id: '2', name: 'Marie Curie', registrationNumber: 'B456', rank: 'Caporal', contact: '0687654321', address: '2 Avenue des Champs, Lyon' },
  { id: '3', name: 'Pierre Martin', registrationNumber: 'C789', rank: 'Lieutenant', contact: '0712345678', address: '3 Place de la Bourse, Marseille' },
  { id: '4', name: 'Sophie Bernard', registrationNumber: 'D101', rank: 'Sergent-chef', contact: '0787654321', address: '4 Boulevard de la Liberté, Lille' },
  { id: '5', name: 'Luc Moreau', registrationNumber: 'E112', rank: 'Adjudant', contact: '0611223344', address: '5 Rue Sainte-Catherine, Bordeaux' },
];

let missions: Mission[] = [
  { id: 'm1', name: 'Opération Aube Rouge', details: 'Reconnaissance en territoire hostile.', agentId: '1', startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), priority: 5 },
  { id: 'm2', name: 'Mission Logistique Alpha', details: 'Approvisionnement du poste avancé 3.', agentId: '5', startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), priority: 3 },
  { id: 'm3', name: 'Exercice Feu de Forêt', details: 'Simulation de combat et extraction.', agentId: null, startDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(), priority: 2 },
  { id: 'm4', name: 'Opération Serpent de Mer', details: 'Infiltration et sabotage.', agentId: '4', startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), endDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), priority: 4 },
  { id: 'm5', name: 'Soutien Médical Bravo', details: 'Mise en place d\'un hôpital de campagne.', agentId: '2', startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), endDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), priority: 4 },
];


export const getAgents = () => agents as Agent[];
export const getMissions = () => missions;

export const getAgentById = (id: string) => agents.find(agent => agent.id === id);
export const getMissionById = (id: string) => missions.find(mission => mission.id === id);

// --- CUD Operations for demonstration ---
// In a real app, these would be server actions talking to a database.

export const addAgent = (agent: Omit<Agent, 'id' | 'avatar'>) => {
  const newAgent: Agent = {
    ...agent,
    id: (agents.length + 1).toString(),
  };
  agents.push(newAgent);
  return newAgent;
};

export const updateAgent = (id: string, updatedAgent: Partial<Omit<Agent, 'id'>>) => {
  agents = agents.map(agent => 
    agent.id === id ? { ...agent, ...updatedAgent } : agent
  );
  return getAgentById(id);
};

export const deleteAgent = (id: string) => {
  agents = agents.filter(agent => agent.id !== id);
  // Also unassign from any missions
  missions = missions.map(mission => mission.agentId === id ? { ...mission, agentId: null } : mission);
  return true;
};

export const addMission = (mission: Omit<Mission, 'id'>) => {
  const newMission: Mission = {
    ...mission,
    id: `m${missions.length + 1}`,
  };
  missions.push(newMission);
  return newMission;
};

export const updateMission = (id: string, updatedMission: Partial<Omit<Mission, 'id'>>) => {
  missions = missions.map(mission =>
    mission.id === id ? { ...mission, ...updatedMission } : mission
  );
  return getMissionById(id);
};

export const deleteMission = (id: string) => {
  missions = missions.filter(mission => mission.id !== id);
  return true;
};

export const isRegistrationNumberTaken = (regNum: string, currentId?: string) => {
  return agents.some(agent => agent.registrationNumber === regNum && agent.id !== currentId);
}
