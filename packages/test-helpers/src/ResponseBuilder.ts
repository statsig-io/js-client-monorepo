/* eslint-disable @typescript-eslint/no-unsafe-member-access */

/* eslint-disable @typescript-eslint/no-explicit-any */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import * as DcsResponse from './data/dcs_response.json';
import * as InitResponse from './data/initialize.json';

export function getInitializeResponseWithConfigValue(
  value: Record<string, unknown>,
): string {
  const result = InitResponse as any;

  result['dynamic_configs']['3495537376' /* DJB2('a_dynamic_config') */][
    'value'
  ] = value;

  return JSON.stringify(result);
}

export function getDcsResponseWithConfigValue(
  value: Record<string, unknown>,
): string {
  const result = DcsResponse as any;

  (result['dynamic_configs'] as any[]).forEach((config) => {
    if (config.name === 'a_dynamic_config') {
      config.value = value;
    }
  });

  return JSON.stringify(result);
}
