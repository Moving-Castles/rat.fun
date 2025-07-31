const { execSync } = require("child_process")
const fs = require("fs")
const path = require("path")

function checkForEnvFiles() {
  try {
    // Check for .env files in staged changes
    const stagedFiles = execSync("git diff --cached --name-only", { encoding: "utf8" })
      .split("\n")
      .filter(Boolean)

    const envFiles = stagedFiles.filter(
      file => file.includes(".env") && !file.includes(".env.example") && !file.includes(".env.test")
    )

    if (envFiles.length > 0) {
      console.error("❌ Found .env files in staged changes:")
      envFiles.forEach(file => console.error(`   ${file}`))
      console.error("\n Please remove .env files before committing.")
      console.error("   Use .env.example for template files.")
      process.exit(1)
    }

    // Check for .env files in working directory
    const workingDirFiles = execSync("git ls-files --others --exclude-standard", {
      encoding: "utf8"
    })
      .split("\n")
      .filter(Boolean)

    const untrackedEnvFiles = workingDirFiles.filter(
      file => file.includes(".env") && !file.includes(".env.example") && !file.includes(".env.test")
    )

    if (untrackedEnvFiles.length > 0) {
      console.error("❌ Found untracked .env files:")
      untrackedEnvFiles.forEach(file => console.error(`   ${file}`))
      console.error("\n Please add .env files to .gitignore or remove them.")
      process.exit(1)
    }

    console.log("✅ No .env files found")
  } catch (error) {
    console.error("Error checking for .env files:", error.message)
    process.exit(1)
  }
}

function checkForHardcodedEnvVars() {
  try {
    const patterns = [
      /process\.env\.\w+\s*=\s*['"`][^'"`]+['"`]/,
      /import\.meta\.env\.\w+\s*=\s*['"`][^'"`]+['"`]/,
      /API_KEY\s*=\s*['"`][^'"`]+['"`]/,
      /SECRET\s*=\s*['"`][^'"`]+['"`]/,
      /PASSWORD\s*=\s*['"`][^'"`]+['"`]/,
      /TOKEN\s*=\s*['"`][^'"`]+['"`]/,
      /PRIVATE_KEY\s*=\s*['"`][^'"`]+['"`]/,
      /REPLICATE_API_TOKEN\s*=\s*['"`][^'"`]+['"`]/,
      /ANTHROPIC_API_KEY\s*=\s*['"`][^'"`]+['"`]/,
      /SENTRY_DSN\s*=\s*['"`][^'"`]+['"`]/,
      /MASTER_KEY_CODE\s*=\s*['"`][^'"`]+['"`]/,
      /NETLIFY_AUTH_TOKEN\s*=\s*['"`][^'"`]+['"`]/,
      /SANITY_TOKEN\s*=\s*['"`][^'"`]+['"`]/
    ]

    const stagedFiles = execSync("git diff --cached --name-only", { encoding: "utf8" })
      .split("\n")
      .filter(Boolean)

    let foundHardcoded = false

    for (const file of stagedFiles) {
      // Only check code files
      if (file.match(/\.(js|ts|jsx|tsx|svelte|vue|json|md|txt|yml|yaml)$/)) {
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
            if (pattern.test(content)) {
              console.error(`❌ Found hardcoded env var in ${file}`)
              console.error(`   Pattern: ${pattern.source}`)
              foundHardcoded = true
            }
          }
        } catch (error) {
          // Skip files that can't be read (binary files, etc.)
          continue
        }
      }
    }

    if (foundHardcoded) {
      console.error("\n HARDCODED ENV VARS DETECTED!")
      console.error("Please use environment variables instead of hardcoded values.")
      console.error('Example: process.env.API_KEY instead of API_KEY = "actual_key"')
      process.exit(1)
    }

    console.log("✅ No hardcoded env vars found")
  } catch (error) {
    console.error("Error checking for hardcoded env vars:", error.message)
    process.exit(1)
  }
}

// Run both checks
checkForEnvFiles()
checkForHardcodedEnvVars()
