import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, Text, View, Pressable } from 'react-native';
import { Device } from 'react-native-ble-plx';

import useBLE from '@/components/useBLE';
import useSensorData from '@/components/useSensorData';

import DevicePickerModal from '@/components/deviceSelectionModal';
import DeviceList from '@/components/deviceList';

import DeviceConnectingModal from '@/components/deviceConnectingModal';
import DeviceDisconnectedModal from '@/components/deviceDisconnectedModal';
import CalibratingDeviceModal from '@/components/calibrateDeviceModal';

import MyChart from '@/components/myCharts';




export default function App() {

  const {
    requestPermissions, 
    scanForPeripherals,
    allDevices,
    connectToDevice,
    connectionStatus,
    connectedDevice,
    disconnectFromDevice,
    startRecording, 
    requestData,
    accelArray, 
    gyroArray,
  } = useBLE();

  const {
    gravitilessAccelerationData,
    orientationDataRef,
    updateOrientation,
    smooothedAccelerationDataRef,
    smoothedGyroDataRef,
    smoothData,
  } = useSensorData();



  const [isDeviceSelectionVisible, setIsDeviceSelectionVisible] = useState<boolean>(false);
  const [isDeviceDisconnectedVisible, setIsDeviceDisconnectedVisible] = useState<boolean>(false);
  const [isCalibratingDevice, setIsCalibratingDevice] = useState<boolean>(false);

  const [displayData, setDisplayData] = useState<boolean>(false);



  const onPromptDeviceConnection = async () => {
    const havePermissions = await requestPermissions();
    if (havePermissions) {
      setIsDeviceSelectionVisible(true);
      scanForPeripherals();
    }
  };

  const onCloseDeviceSelection = () => {
    setIsDeviceSelectionVisible(false);
  };

  const onCloseDeviceDisconnected = () => {
    setIsDeviceDisconnectedVisible(false);
  };

  const onDeviceSelected = async (device: Device) => {
    connectToDevice(device);
    onCloseDeviceSelection();
  };

  const startDeviceCalibration = () => {
    console.log("Need to calibrate the device!");
    setIsCalibratingDevice(true);
  };

  const finishedDeviceCalibration = () => {
    console.log("Device Calibration Finished!");
    setIsCalibratingDevice(false);
  };


  const tellDeviceToRecordData = () => {  

  };

  
  return (
      <>
      <View style={styles.container}>
        <Text style={styles.javRingTitle}>Jav Ring</Text>

        {connectedDevice ? (
          <>

            <View style={{height: 400, width: 400, position: "absolute", top: 0, backgroundColor: "grey"}}>
              <MyChart 
                accelData={accelArray} 
                gyroData={gyroArray} 
                orientationDataRef={orientationDataRef}
                smoothAccelDataRef={smooothedAccelerationDataRef}
                smoothGyroDataRef={smoothedGyroDataRef}
              />
              <Text>Display Data</Text>
            </View>

            {/* <View style={styles.sensorReadings}>
              <Text style={styles.sensorReadingText}>xAcceleration: {xAcceleration} m/s/s</Text>
              <Text style={styles.sensorReadingText}>yAcceleration: {yAcceleration} m/s/s</Text>
              <Text style={styles.sensorReadingText}>zAcceleration: {zAcceleration} m/s/s</Text>
              <Text style={styles.sensorReadingText}>Current Acceleration: {acceleration} m/s/s</Text>
              <Text style={styles.sensorReadingText}>Maximum Acceleration: {maximumAccleration} m/s/s</Text>
            </View> */}

            <View style={styles.buttonContainer}>

              <TouchableOpacity style={styles.button} onPress={() => {
                smoothData("accel", accelArray);
                smoothData("gyro", gyroArray);
              }}>
                    <Text style={styles.buttonText}>
                      Calculate the smoothed data
                    </Text>
                </TouchableOpacity>
            

              <TouchableOpacity style={styles.button} onPress={() => updateOrientation(smooothedAccelerationDataRef.current, smoothedGyroDataRef.current, null)}>
                  <Text style={styles.buttonText}>
                    Calculate Orientation with Smooth Data
                  </Text>
              </TouchableOpacity>



              <TouchableOpacity style={styles.button} onPress={() => updateOrientation(accelArray, gyroArray, null)}>
                  <Text style={styles.buttonText}>
                    Calculate Orientation with Raw Data
                  </Text>
              </TouchableOpacity>

              
              <TouchableOpacity style={styles.button} onPress={startRecording}>
                <Text style={styles.buttonText}>
                  Click Here to Start Recording Data
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.button} onPress={requestData}>
                <Text style={styles.buttonText}>
                  Click Here to Request Data
                </Text>
              </TouchableOpacity>
{/* 
              <TouchableOpacity style={styles.button} onPress={startDeviceCalibration}>
                <Text style={styles.buttonText}>
                  Click Here to Calibrate Device
                </Text>
              </TouchableOpacity> */}
              
              <TouchableOpacity style={styles.button} onPress={disconnectFromDevice}>
                <Text style={styles.buttonText}> 
                  Disconnect from Device
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.title}>Connect to a Device to Get Started</Text>

            <TouchableOpacity style={styles.button} onPress={onPromptDeviceConnection}>
              <Text style={styles.buttonText}>Connect to Device</Text>
            </TouchableOpacity>
          </>
        )}

        
        <DevicePickerModal
          isVisible={isDeviceSelectionVisible}
          onClose={onCloseDeviceSelection}
        >
          <DeviceList
            onSelect={connectToDevice}
            availibleDevices={allDevices}
            onCloseModal={onCloseDeviceSelection}
          ></DeviceList>
        </DevicePickerModal>

        <DeviceConnectingModal isVisible={false} status={connectionStatus}></DeviceConnectingModal>
        <DeviceDisconnectedModal isVisible={isDeviceDisconnectedVisible} onClose={onCloseDeviceDisconnected}></DeviceDisconnectedModal>
        <CalibratingDeviceModal isVisible={isCalibratingDevice} onClose={finishedDeviceCalibration}></CalibratingDeviceModal>
      </View>


      </>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContainer: {
    backgroundColor: "black",
    height: 300,
    width: 400,
    justifyContent: 'center',
    position: 'absolute',
    bottom: 50
  },
  javRingTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    position: 'absolute', 
    top: 20
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    position: 'absolute', 
    top: 60
  },
  sensorReadings: {
  },
  sensorReadingText: {
    fontSize: 20,
  },
  trackingDataButton: {
    backgroundColor: '#ff69b4', // Pinkish color
    borderRadius: 25, // Rounded corners
    paddingVertical: 10,
    paddingHorizontal: 20,
    position: 'absolute',
    bottom: 120,
  },
  trackingDataButtonText: {
    color: "white", 
    fontSize: 16,
    fontWeight: 'bold',
  },
  calibrationButton: {
    backgroundColor: '#ff69b4', // Pinkish color
    borderRadius: 25, // Rounded corners
    paddingVertical: 10,
    paddingHorizontal: 20,
    position: 'absolute',
    bottom: 70,
  },
  calibrationButtonText: {
    color: "white", 
    fontSize: 16,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
  button: {
    backgroundColor: '#ff69b4', // Pinkish color
    borderRadius: 5, // Rounded corners
    paddingVertical: 10,
    paddingHorizontal: 20,
    margin: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
