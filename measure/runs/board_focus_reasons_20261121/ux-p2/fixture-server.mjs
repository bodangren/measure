// Serve unchanged committed assets and a read-only audit host.
import http from 'node:http'
import { readFile } from 'node:fs/promises'
const root = 'measure/runs/board_focus_reasons_20261121/ux-p2'
export const startFixtureServer = async () => {
  const routes = {
    '/fixture-harness.html': [`${root}/fixture-harness.html`, 'text/html'],
    '/fixtures.json': ['extensions/measure-status/mockup/fixtures.json', 'application/json'],
    '/api/guest-files/fixture/panel/index.html': ['extensions/measure-status/panel/index.html', 'text/html'],
    '/api/guest-files/fixture/panel/main.js': ['extensions/measure-status/panel/main.js', 'text/javascript'],
  }
  const server = http.createServer(async (req,res) => {
    const route=routes[new URL(req.url,'http://localhost').pathname]
    if(!route){res.writeHead(404);res.end();return}
    try {res.writeHead(200,{'Content-Type':route[1],'Cache-Control':'no-store','Access-Control-Allow-Origin':'*'});res.end(await readFile(route[0]))}
    catch(error){res.writeHead(500);res.end(String(error))}
  })
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve))
  return {server,url:`http://127.0.0.1:${server.address().port}/fixture-harness.html`}
}
