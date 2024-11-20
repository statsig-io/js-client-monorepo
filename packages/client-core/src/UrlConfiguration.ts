import { Endpoint, NetworkDefault } from './NetworkConfig';

export type EndpointDnsKey = 'i' | 'e' | 'd';

const ENDPOINT_DNS_KEY_MAP: Record<Endpoint, EndpointDnsKey> = {
  [Endpoint._initialize]: 'i',
  [Endpoint._rgstr]: 'e',
  [Endpoint._download_config_specs]: 'd',
};

export class UrlConfiguration {
  public readonly endpoint: Endpoint;
  public readonly endpointDnsKey: EndpointDnsKey;
  public readonly defaultUrl: string;
  public readonly customUrl: string | null = null;
  public readonly fallbackUrls: string[] | null = null;

  constructor(
    endpoint: Endpoint,
    customUrl: string | undefined | null,
    customApi: string | undefined | null,
    fallbackUrls: string[] | undefined | null,
  ) {
    this.endpoint = endpoint;
    this.endpointDnsKey = ENDPOINT_DNS_KEY_MAP[endpoint];

    if (customUrl) {
      this.customUrl = customUrl;
    }

    if (!customUrl && customApi) {
      this.customUrl = customApi.endsWith('/')
        ? `${customApi}${endpoint}`
        : `${customApi}/${endpoint}`;
    }

    if (fallbackUrls) {
      this.fallbackUrls = fallbackUrls;
    }

    const defaultApi = NetworkDefault[endpoint];
    this.defaultUrl = `${defaultApi}/${endpoint}`;
  }

  getUrl(): string {
    return this.customUrl ?? this.defaultUrl;
  }
}
