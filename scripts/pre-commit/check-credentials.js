const { execSync } = require("child_process")

const patterns = [
  // Hardcoded credential patterns (excludes environment variable usage)
  /(?:^|[^.])\b(?:PRIVATE_KEY|API_KEY|TOKEN|SECRET|PASSWORD|AWS_ACCESS_KEY_ID|AWS_SECRET_ACCESS_KEY|REPLICATE_API_TOKEN|ANTHROPIC_API_KEY|SENTRY_DSN|MASTER_KEY_CODE|NETLIFY_AUTH_TOKEN)\b\s*=\s*["'][^"']{10,}["']/,
  // Check for long alphanumeric strings that might be credentials
  /(?:^|[^.])\b(?:PRIVATE_KEY|API_KEY|TOKEN|SECRET|PASSWORD|AWS_ACCESS_KEY_ID|AWS_SECRET_ACCESS_KEY|REPLICATE_API_TOKEN|ANTHROPIC_API_KEY|SENTRY_DSN|MASTER_KEY_CODE|NETLIFY_AUTH_TOKEN)\b\s*=\s*[^;\n]*[a-zA-Z0-9]{20,}[^;\n]*/
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

    // Skip our own credential checking files and documentation
    if (
      file.includes("scripts/pre-commit/") ||
      file.includes(".github/workflows/credential-check.yml") ||
      file.includes("scripts/README.md")
    ) {
      continue
    }

    try {
      const content = execSync(`git show :${file}`, { encoding: "utf8" })

      for (const pattern of patterns) {
        const matches = content.match(pattern, "g")
        if (matches) {
          const lines = content.split("\n")
          for (const match of matches) {
            const lineIndex = lines.findIndex(line => line.includes(match))
            if (lineIndex !== -1) {
              const line = lines[lineIndex]

              // Skip if it's environment variable usage
              if (line.includes("process.env.")) {
                continue
              }

              // Skip if it's a comment
              if (
                line.trim().startsWith("//") ||
                line.trim().startsWith("/*") ||
                line.trim().startsWith("*")
              ) {
                continue
              }

              console.error(`❌ Found credential pattern in ${file}`)
              console.error(`   Pattern: ${pattern.source}`)
              console.error(`   Line: ${line.trim()}`)
              foundCredentials = true
            }
          }
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
