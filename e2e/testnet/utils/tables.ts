import mudConfig from "contracts/mud.config"

// TODO fix .default hack being necessary
export const mudTables = (mudConfig.tables ??
  (mudConfig as any).default.tables) as typeof mudConfig.tables
