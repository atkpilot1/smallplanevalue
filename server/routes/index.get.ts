export default defineEventHandler(async (event) => {
  const html = await useStorage('assets:server').getItem('page.html')
  setHeader(event, 'Content-Type', 'text/html; charset=utf-8')
  return html
})
