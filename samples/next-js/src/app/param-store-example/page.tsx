import { getStatsigValues } from '../../utils/statsig-server';
import ParamStoreExample from './ParamStoreExample';

export default async function Index(): Promise<JSX.Element> {
  const user = { userID: 'a-user' };
  let values = await getStatsigValues(user);

  // until the server side is complete
  const json = JSON.parse(values) as Record<string, unknown>;
  json['param_stores'] = {
    my_param_store: {
      my_static_value_string: {
        ref_type: 'static',
        param_type: 'string',
        value: 'hello',
      },

      my_gated_value_string: {
        ref_type: 'gate',
        param_type: 'string',
        gate_name: 'a_gate',
        pass_value: 'Gate Passed',
        fail_value: 'Gate Failed',
      },

      my_gated_value_boolean: {
        ref_type: 'gate',
        param_type: 'boolean',
        gate_name: 'a_gate',
        pass_value: true,
        fail_value: false,
      },

      my_failing_gated_value_boolean: {
        ref_type: 'gate',
        param_type: 'boolean',
        gate_name: 'third_gate',
        pass_value: true,
        fail_value: false,
      },
    },
  };
  values = JSON.stringify(json);

  return <ParamStoreExample user={user} values={values} />;
}
