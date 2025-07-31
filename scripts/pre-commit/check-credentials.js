const { execSync } = require("child_process")

const patterns = [
  /PRIVATE_KEY\s*=/,
  /API_KEY\s*=/,
  /TOKEN\s*=/,
  /SECRET\s*=/,
  /PASSWORD\s*=/,
  /AWS_ACCESS_KEY_ID\s*=/,
  /AWS_SECRET_ACCESS_KEY\s*=/,
  /REPLICATE_API_TOKEN\s*=/,
  /ANTHROPIC_API_KEY\s*=/,
  /SENTRY_DSN\s*=/,
  /MASTER_KEY_CODE\s*=/,
  /NETLIFY_AUTH_TOKEN\s*=/,
  /_TOKEN\s*=/
]

try {
  // Get staged files
  const stagedFiles = execSync("git diff --cached --name-only", { encoding: "utf8" })
    .split("\n")
    .filter(Boolean)

  let foundCredentials = false

  for (const file of stagedFiles) {
    // Skip binary files and common false positives
    if (
      file.match(
        /\.(png|jpg|jpeg|gif|ico|woff|woff2|ttf|eot|mp3|wav|mov|mp4|avi|zip|tar|gz|rar|7z|pdf|db|sqlite)$/i
      )
    ) {
      continue
    }

    // Skip pre-commit scripts themselves to avoid self-blocking
    if (file.includes("scripts/pre-commit/")) {
      continue
    }

    // Skip GitHub workflow files that intentionally contain patterns for CI/CD
    if (file.includes(".github/workflows/")) {
      continue
    }

    try {
      const content = execSync(`git show :${file}`, { encoding: "utf8" })

      for (const pattern of patterns) {
        if (pattern.test(content)) {
          console.error(`❌ Found credential pattern in ${file}`)
          console.error(`   Pattern: ${pattern.source}`)
          foundCredentials = true
        }
      }
    } catch (error) {
      // Skip files that can't be read (binary files, etc.)
      continue
    }
  }

  if (foundCredentials) {
    console.error("\n CREDENTIALS DETECTED!")
    console.error("Please remove any access tokens, private keys, or secrets before committing.")
    console.error("Use environment variables (.env files) instead.")
    process.exit(1)
  }

  console.log("✅ No credentials found in staged files")
} catch (error) {
  console.error("Error checking credentials:", error.message)
  process.exit(1)
}
