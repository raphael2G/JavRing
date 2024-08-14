import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function DeviceConnectingModal({ isVisible, status }) {
    return (
      <Modal animationType="slide" transparent={false} visible={isVisible}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Connecting To Device</Text>
          <Text style={styles.title}>{status}</Text>
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
  