import { useTeamStore } from "./storage/userStores";
import { Scouter } from "./models/scouter";
import { Tournament } from "./lovatAPI/getTournaments";

// Test mode team code — enter "TEST" in the team code screen to bypass API calls
export const TEST_MODE_CODE = "TEST";

export const isTestMode = () => {
  return useTeamStore.getState().code === TEST_MODE_CODE;
};

export const TEST_TEAM = {
  number: 8033,
  code: TEST_MODE_CODE,
  email: "test@example.com",
  emailVerified: true,
  teamApproved: true,
  website: null,
};

export const TEST_SCOUTERS: Scouter[] = [
  {
    name: "Test Scouter",
    uuid: "test-scouter-0001",
    sourceTeamNumber: 8033,
    strikes: 0,
    scouterReliability: 1.0,
  },
  {
    name: "Demo Scouter",
    uuid: "test-scouter-0002",
    sourceTeamNumber: 8033,
    strikes: 0,
    scouterReliability: 0.95,
  },
];

export const TEST_TOURNAMENTS: Tournament[] = [
  {
    key: "2026test",
    name: "Test Regional",
    location: "Test City, TS",
    date: "2026-03-15",
  },
  {
    key: "2026demo",
    name: "Demo Championship",
    location: "Demo Town, DM",
    date: "2026-04-20",
  },
];
