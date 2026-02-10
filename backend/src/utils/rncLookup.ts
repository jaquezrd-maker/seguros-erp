import fs from 'fs'
import path from 'path'
import readline from 'readline'

interface RNCData {
  rnc: string
  name: string
  commercialName: string
  activity: string
  registrationDate: string
  status: string
  type: string
}

const RNC_FILE_PATH = path.join(__dirname, '../../..', 'DGII_RNC.TXT')

/**
 * Search for RNC/Cédula in the DGII database file
 * @param rncOrCedula - RNC or Cédula to search
 * @returns RNCData if found, null otherwise
 */
export async function lookupRNC(rncOrCedula: string): Promise<RNCData | null> {
  // Normalize input: remove dashes and spaces
  const normalized = rncOrCedula.replace(/[-\s]/g, '')

  // Check if file exists
  if (!fs.existsSync(RNC_FILE_PATH)) {
    console.warn(`RNC database file not found at: ${RNC_FILE_PATH}`)
    return null
  }

  return new Promise((resolve, reject) => {
    const fileStream = fs.createReadStream(RNC_FILE_PATH, { encoding: 'latin1' })
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    })

    let found = false

    rl.on('line', (line) => {
      if (found) return

      const parts = line.split('|')
      if (parts.length >= 11) {
        const [rnc, name, commercialName, activity, , , , , date, status, type] = parts

        // Check if RNC matches
        if (rnc.trim() === normalized) {
          found = true
          rl.close()
          fileStream.close()

          resolve({
            rnc: rnc.trim(),
            name: name.trim(),
            commercialName: commercialName.trim(),
            activity: activity.trim(),
            registrationDate: date.trim(),
            status: status.trim(),
            type: type.trim(),
          })
        }
      }
    })

    rl.on('close', () => {
      if (!found) {
        resolve(null)
      }
    })

    rl.on('error', (error) => {
      console.error('Error reading RNC file:', error)
      reject(error)
    })
  })
}

/**
 * Search for companies by name in the DGII database file
 * @param companyName - Company name to search (partial match)
 * @param limit - Maximum number of results to return (default: 10)
 * @returns Array of RNCData matches, sorted by relevance
 */
export async function searchByName(companyName: string, limit: number = 10): Promise<RNCData[]> {
  // Normalize input: uppercase and remove extra spaces
  const searchTerm = companyName.trim().toUpperCase()

  if (searchTerm.length < 3) {
    return [] // Require at least 3 characters to search
  }

  // Check if file exists
  if (!fs.existsSync(RNC_FILE_PATH)) {
    console.warn(`RNC database file not found at: ${RNC_FILE_PATH}`)
    return []
  }

  return new Promise((resolve, reject) => {
    const fileStream = fs.createReadStream(RNC_FILE_PATH, { encoding: 'latin1' })
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    })

    interface ScoredMatch extends RNCData {
      score: number
    }

    const matches: ScoredMatch[] = []
    const searchWords = searchTerm.split(/\s+/).filter(w => w.length > 0)

    rl.on('line', (line) => {
      const parts = line.split('|')
      if (parts.length >= 11) {
        const [rnc, name, commercialName, activity, , , , , date, status, type] = parts

        // Search in both name and commercial name
        const nameUpper = name.trim().toUpperCase()
        const commercialNameUpper = commercialName.trim().toUpperCase()

        // Calculate relevance score
        let score = 0

        // Check exact match (highest priority)
        if (nameUpper === searchTerm || commercialNameUpper === searchTerm) {
          score = 1000
        }
        // Check if starts with search term
        else if (nameUpper.startsWith(searchTerm) || commercialNameUpper.startsWith(searchTerm)) {
          score = 500
        }
        // Check if all search words are present as separate words (word boundary matching)
        else {
          const nameWords = nameUpper.split(/\s+/)
          const commercialWords = commercialNameUpper.split(/\s+/)

          let nameWordMatches = 0
          let commercialWordMatches = 0

          for (const searchWord of searchWords) {
            // Check if any word in the name starts with the search word
            if (nameWords.some(w => w.startsWith(searchWord))) {
              nameWordMatches++
            }
            if (commercialWords.some(w => w.startsWith(searchWord))) {
              commercialWordMatches++
            }
          }

          // Only match if all search words are found
          if (nameWordMatches === searchWords.length) {
            score = 100 + nameWordMatches * 10
          } else if (commercialWordMatches === searchWords.length) {
            score = 100 + commercialWordMatches * 10
          }
        }

        // Only add if there's a match (score > 0)
        if (score > 0) {
          matches.push({
            rnc: rnc.trim(),
            name: name.trim(),
            commercialName: commercialName.trim(),
            activity: activity.trim(),
            registrationDate: date.trim(),
            status: status.trim(),
            type: type.trim(),
            score,
          })
        }
      }
    })

    rl.on('close', () => {
      // Sort by score (highest first) and limit results
      const sortedMatches = matches
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(({ score, ...rest }) => rest) // Remove score from final results

      resolve(sortedMatches)
    })

    rl.on('error', (error) => {
      console.error('Error reading RNC file:', error)
      reject(error)
    })
  })
}
