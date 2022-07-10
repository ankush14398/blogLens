const generateMeta = (
  title: string,
  description: string,
  image: string
): string => {
  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <title>${title}</title>
      <meta name="description" content="${description}" />    
    </head>
  </html>`
}

export default generateMeta
