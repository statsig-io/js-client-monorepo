import React, { useState } from 'react';
import { Button, SafeAreaView, StatusBar, View } from 'react-native';

import ChangeExampleModal from './ChangeExampleModal';
import ClientEventStreamExample from './ClientEventStreamExample';
import DelayedInitExample from './DelayedInitExample';
import OnDeviceEvaluationsExample from './OnDeviceEvaluationsExample';
import PrecomputedEvaluationsExample from './PrecomputedEvaluationsExample';

export default function App(): React.ReactNode {
  const [sample, setSample] = useState('on-device-eval');
  const [isModalVisible, setIsModalVisible] = useState(false);

  return (
    <View
      style={{
        height: '100%',
      }}
    >
      <StatusBar barStyle="dark-content" />
      <SafeAreaView
        style={{
          display: 'flex',
          flex: 1,
        }}
      >
        <ChangeExampleModal
          visible={isModalVisible}
          setVisible={setIsModalVisible}
          setSample={setSample}
        />
        <Button
          title="Change Example"
          onPress={() => setIsModalVisible(true)}
        ></Button>
        {(() => {
          switch (sample) {
            case 'on-device-eval':
              return <OnDeviceEvaluationsExample />;
            case 'precomputed-eval':
              return <PrecomputedEvaluationsExample />;
            case 'delayed-init':
              return <DelayedInitExample />;
            case 'client-event-stream':
              return <ClientEventStreamExample />;
            default:
              throw new Error('No such sample: ' + sample);
          }
        })()}
      </SafeAreaView>
    </View>
  );
}
