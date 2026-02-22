import { get } from "./lovatAPI";
import { scouterSchema } from "../models/scouter";
import { z } from "zod";
import { isTestMode, TEST_SCOUTERS } from "../testMode";

export const getTeamScouters = async () => {
  // Return mock scouters in test mode
  if (isTestMode()) {
    return TEST_SCOUTERS;
  }

  const response = await get(`/v1/manager/scouters`);

  if (!response.ok) {
    throw new Error("Error fetching scouters");
  }

  const json = z.array(scouterSchema).parse(await response.json());

  return json;
};
