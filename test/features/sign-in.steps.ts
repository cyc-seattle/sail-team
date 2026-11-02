import { createBdd } from "playwright-bdd";

// The sign-in journey's steps. Each is written when its scenario stops being @fixme.
export const { Given, When, Then } = createBdd();
