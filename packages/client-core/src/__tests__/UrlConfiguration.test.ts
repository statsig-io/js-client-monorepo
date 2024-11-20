import { Endpoint } from '../NetworkConfig';
import { UrlConfiguration } from '../UrlConfiguration';

describe('UrlConfiguration', () => {
  it('gets default urls', () => {
    const config = new UrlConfiguration(Endpoint._rgstr, null, null, null);
    expect(config.getUrl()).toBe('https://prodregistryv2.org/v1/rgstr');
  });

  it('gets custom api urls', () => {
    const config = new UrlConfiguration(
      Endpoint._rgstr,
      null,
      'https://my-server.api',
      null,
    );
    expect(config.getUrl()).toBe('https://my-server.api/rgstr');
  });

  it('gets custom api urls with slashes', () => {
    const config = new UrlConfiguration(
      Endpoint._rgstr,
      null,
      'https://my-server.api/',
      null,
    );
    expect(config.getUrl()).toBe('https://my-server.api/rgstr');
  });

  it('gets custom url instead of api', () => {
    const config = new UrlConfiguration(
      Endpoint._rgstr,
      'https://specific.url/log',
      'https://my-server.api/',
      null,
    );
    expect(config.getUrl()).toBe('https://specific.url/log');
  });
});
