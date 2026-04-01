import { readFile } from 'node:fs/promises'
import path from 'node:path'

export const size = { width: 1024, height: 1024 }
export const contentType = 'image/png'

export default async function AppleIcon() {
  const iconPath = path.join(process.cwd(), 'public', 'tastebook.png')
  const iconBuffer = await readFile(iconPath)

  return new Response(iconBuffer, {
    headers: {
      'Content-Type': contentType,
    },
  })
}
