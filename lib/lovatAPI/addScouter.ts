import { Scouter } from "../models/scouter";
import { post } from "./lovatAPI";
import { isTestMode } from "../testMode";

export const addScouter = async (name: string, teamNumber: number) => {
  // Return a mock scouter in test mode
  if (isTestMode()) {
    return {
      name,
      uuid: `test-scouter-${Date.now()}`,
      sourceTeamNumber: teamNumber,
      strikes: 0,
      scouterReliability: 1.0,
    } as Scouter;
  }

  const response = await post(`/v1/manager/scouter`, {
    name,
    teamNumber,
  });

  if (!response.ok) {
    throw new Error("Error adding scouter");
  }

  const json = await response.json();

  return json as Scouter;
};
