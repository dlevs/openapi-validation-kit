import path from 'path'

export function rootPath(...pathComponents: string[]) {
  return path.join(__dirname, '../../', ...pathComponents)
}
