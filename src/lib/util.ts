import path from 'path'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// TODO: Delete this. It won't be needed once CLI args are used instead of hardcoded example paths
export function rootPath(...pathComponents: string[]) {
  return path.join(__dirname, '../../', ...pathComponents)
}
