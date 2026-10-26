import { POST } from './app/api/message/route';
export default { fetch(request: Request) {
  if (request.method !== 'POST') return new Response('Method not allowed', {status:405,headers:{Allow:'POST'}});
  return POST(request);
}};
