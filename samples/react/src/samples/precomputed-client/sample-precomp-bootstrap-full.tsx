/* eslint-disable @typescript-eslint/no-non-null-assertion */

/* eslint-disable no-console */
import Statsig, { StatsigUser } from 'statsig-node';

import { StatsigClient } from '@statsig/js-client';

import { STATSIG_CLIENT_KEY as YOUR_CLIENT_KEY } from '../../Contants';

type Request = {
  body: { user: StatsigUser };
};
type Response = {
  json: (input: ResponseType) => void;
};
type RequestHandler = (
  req: Request & { cookies: Record<string, string> },
  res: Response & { cookie: (k: string, v: string, m: unknown) => void },
) => Promise<void>;
type ResponseType = {
  values: string;
  user: StatsigUser;
};

const app = {
  post: (url: string, handler: RequestHandler) => {
    console.log('req', url, handler);
  },
};

function generateStableID(): string {
  return '';
}

// <snippet>
// --------------
//  Server Side
// --------------
const isStatsigServerReady = Statsig.initialize(
  process.env['STATSIG_SERVER_KEY']!,
);

function getCookieFromRequest(req: Request, name: string): string {
  // reads the value from a cookie
  // </snippet>
  console.log(req, name);
  return '';
  // <snippet>
}

function setCookieOnResponse(res: Response, name: string, value: string): void {
  // stores the cookie on the response
  // </snippet>
  console.log(res, name, value);
  // <snippet>
}

app.post('/init-statsig-client', async (req, res) => {
  await isStatsigServerReady;

  const user = req.body.user;
  let stableID = getCookieFromRequest(req, 'my_stable_id');

  if (!stableID) {
    stableID = generateStableID();
    setCookieOnResponse(res, 'my_stable_id', stableID);
  }

  user.customIDs = {
    ...user.customIDs,
    stableID,
  };

  const values = Statsig.getClientInitializeResponse(
    user,
    YOUR_CLIENT_KEY, // <- Client Key
    {
      hash: 'djb2',
    },
  );

  res.json({ values: JSON.stringify(values), user });
});
// </snippet>

// prettier-ignore
//<snippet>

// --------------
//  Client Side
// --------------
function loadUserData(): string {
  // Creates a JSON string for your request containing your StatsigUser object. 
// </snippet>
  return '';
//<snippet>
}

// </snippet>

// prettier-ignore
export async function Sample(): Promise<void> {
  // <snippet>
const { values, user: serverVerifiedUser } = await fetch(
  '/init-statsig-client', 
  {
    method: 'POST',
    body: loadUserData(),
  }
).then((res) => res.json() as Promise<ResponseType>);

const myStatsigClient = new StatsigClient(YOUR_CLIENT_KEY, serverVerifiedUser);
myStatsigClient.dataAdapter.setData(values);
myStatsigClient.initializeSync();
// </snippet>
}
