// Todo: re-implement support for StatsigOnDeviceEvalClient

// /* eslint-disable @typescript-eslint/no-unused-vars */

// /* eslint-disable @typescript-eslint/no-unsafe-return */

// /* eslint-disable @typescript-eslint/no-unsafe-assignment */

// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { Text } from 'react-native';

// // <snippet>
// import { StatsigOnDeviceEvalClient } from '@statsig/js-on-device-eval-client';
// import type {
//   StatsigProviderRN,
//   useFeatureGate,
// } from '@statsig/react-native-bindings';

// // </snippet>
// import { STATSIG_CLIENT_KEY as YOUR_CLIENT_KEY } from '../../Contants';

// type TText = typeof Text;
// type TStatsigProviderRN = typeof StatsigProviderRN;
// type TuseFeatureGate = typeof useFeatureGate;

// // prettier-ignore
// export default async function Sample(): Promise<void> {
// App();
// }

// const myStatsigClient = {} as StatsigOnDeviceEvalClient;

// // prettier-ignore
// function Setup() {
// const myStatsigClient = new StatsigOnDeviceEvalClient(YOUR_CLIENT_KEY);
//   // </snippet>
// }

// // <snippet>
// function Content() {
//   // </snippet>
//   const useFeatureGate: TuseFeatureGate = () => {
//     return { value: true } as any;
//   };
//   const Text: TText = (() => {
//     return null;
//   }) as any;
//   // <snippet>
//   const gate = useFeatureGate('a_gate');

//   return <Text>a_gate: {gate.value ? 'Passing' : 'Failing'}</Text>;
// }

// function App() {
//   // </snippet>
//   const StatsigProviderRN: TStatsigProviderRN = () => {
//     return null;
//   };
//   // <snippet>
//   return (
//     <StatsigProviderRN client={myStatsigClient}>
//       <Content />
//     </StatsigProviderRN>
//   );
// }
// // </snippet>
