type ExtendedRequestInit = RequestInit & {
  duplex?: 'half' | 'full';
};

export async function POST(request: Request): Promise<Response> {
  const tail = request.url.split('?').pop();
  const logEventUrl = `https://events.statsigapi.net/v1/log_event?${tail}`;

  const fetchOptions: ExtendedRequestInit = {
    method: 'POST',
    body: request.body,
    headers: request.headers,
    duplex: 'half',
  };

  return fetch(logEventUrl, fetchOptions);
}
