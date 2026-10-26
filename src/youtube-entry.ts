import { GET } from './app/api/youtube/route';
export default { fetch(request: Request) {
  if (request.method !== 'GET') return new Response('Method not allowed', {status:405,headers:{Allow:'GET'}});
  return GET();
}};
