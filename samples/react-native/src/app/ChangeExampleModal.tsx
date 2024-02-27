import { Alert, Button, Modal, View } from 'react-native';

export default function ChangeExampleModal({
  visible,
  setVisible,
  setSample,
}: {
  visible: boolean;
  setVisible: (isVisible: boolean) => void;
  setSample: (sample: string) => void;
}): React.ReactNode {
  const changeSample = (sample: string) => {
    setVisible(false);
    setSample(sample);
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={() => {
        Alert.alert('Modal has been closed.');
        setVisible(!visible);
      }}
    >
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: 22,
          backgroundColor: 'rgba(0,0,0,0.2)',
        }}
      >
        <View
          style={{
            backgroundColor: 'white',
            padding: 16,
          }}
        >
          <Button title="Close Modal" onPress={() => setVisible(false)} />
          <Button
            title="On Device Evaluations"
            onPress={() => changeSample('on-device-eval')}
          />
          <Button
            title="Precomputed Evaluations"
            onPress={() => changeSample('precomputed-eval')}
          />
          <Button
            title="Delayed Init Evaluations"
            onPress={() => changeSample('delayed-init')}
          />
        </View>
      </View>
    </Modal>
  );
}
