import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function CalibratingDeviceModal({ isVisible, onClose }) {
    return (
      <Modal animationType="slide" transparent={true} visible={isVisible}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Calibrating Device</Text>
          <Text style={styles.title}>Set on the Runway</Text>
          <Pressable style={styles.closingButton} onPress={onClose}>
              <MaterialIcons name="close" color="#fff" size={32} />
            </Pressable>
        </View>
      </Modal>
    );
  }

  const styles = StyleSheet.create({
    modalContent: {
      backgroundColor: "#25292e",
      height: '40%',
      width: '90%',
      borderRadius: 50,
      position: 'absolute',
      top: 250,
      left: 25,
    },
    title: {
      color: '#fff',
      fontSize: 32,
      textAlign: "center",
      margin: "auto",
    },
    closingButton: {
      position: "absolute",
      top: 35,
      right: 35
    }
  });
  