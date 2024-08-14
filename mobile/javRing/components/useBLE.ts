import { BleManager, Characteristic, Service, Device, BleError, Subscription } from 'react-native-ble-plx';
import { Platform, PermissionsAndroid } from 'react-native';
import { useState, useRef, useMemo, useEffect } from 'react';
import {Buffer} from 'buffer';



const ACCELEROMTER_UUID = "87654321-4321-6789-4321-fedcba987654";
const ACCELEROMTER_CHARACTERISTIC = "abcdef01-2345-6789-abcd-ef0123456789";
const GYROSCOPE_CHARACTERISTIC = "811958ba-dd5b-468e-b773-119f007fe62c";

const CONTROL_SERVICE_UUID = "fd96b93d-5821-42b7-8f69-a6b09117aa04";
const START_RECORDING_CHAR_UUID = "1d651730-eaf2-4647-8d61-fe95357a2dba";
const REQUEST_DATA_CHAR_UUID = "e5e6bcee-d52d-44a7-b47e-4a94af177daa";



interface BluetoothLowEnergyApi {
    requestPermissions: () => Promise<boolean>;
    scanForPeripherals: () => void; 
    allDevices: Device[];
    connectToDevice: (device: Device) => Promise<boolean>;
    connectionStatus: string;
    connectedDevice: Device | null; 
    disconnectFromDevice: () => Promise<void>; 
    startRecording: () => void; 
    requestData: () => void; 
    accelArray: Array<{delta: number, x: number, y: number, z: number}>;
    gyroArray: Array<{delta: number, x: number, y: number, z: number}>;
};

function useBLE(): BluetoothLowEnergyApi {

    useEffect(() => {
        disconnectFromDevice();
      }, []);

    // const BLEManager = new BleManager(); // this does not work because it creates a new BLEManager every time the component is re-rendered!
    const BLEManager = useMemo(() => new BleManager(), []); // use memo does work, but I do not really know what it does, so I will just create the BLEManager outside of the function
    
    const [allDevices, setAllDevices] = useState<Device[]>([]);
    const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<string>("");

    const accelerationSubscriptionRef = useRef<Subscription | null>(null);
    const gyroscopeSubscriptionRef = useRef<Subscription | null>(null);

    const SIZE = 1000;
    const accelArrayRef = useRef(new Array(SIZE).fill({ delta: -1, x: -1, y: -1, z: -1 }));
    const gyroArrayRef = useRef(new Array(SIZE).fill({ delta: -1, x: -1, y: -1, z: -1 }));
    const accelCounterRef = useRef<number>(0);
    const gyroCounterRef = useRef<number>(0);

    const requestPermissions = async () => {
        if (Platform.OS === 'android') {
            const granted = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            ]);
            return (
            granted[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED &&
            granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED &&
            granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === PermissionsAndroid.RESULTS.GRANTED &&
            granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === PermissionsAndroid.RESULTS.GRANTED);
        } else {
            // return true if IOS
            // i do not know if this is actually correct. I have not tested this on IOS, but there is a chance that it will work from what I have read
            return true; 
        }
    };
 


    const isDuplicteDevice = (devices: Device[], nextDevice: Device) =>
        devices.findIndex((device) => nextDevice.id === device.id) > -1;

    const scanForPeripherals = () => {
        BLEManager.startDeviceScan(null, null, (error: BleError | null, device: Device | null) => {
            if (error) {
                console.log(error);
            }

            if (device?.name?.includes("Jav Ring")) {
                setAllDevices((prevState: Device[]) => {
                    if (!isDuplicteDevice(prevState, device)) {
                        return [...prevState, device];
                    } else {
                        return prevState;
                    }
                });
            }
        });
    };


    const onAcceleromterUpdate = (error: BleError | null, characteristic: Characteristic | null) => {
        if (error) {
          console.log(error);
          return -1;
        } else if (!characteristic?.value) {
          console.log("No Data was recieved");
          return -1;
        }
        // Now, we know that there is no error, and the characteristic has a value
    
        const rawData = characteristic.value; // This is a base64 string
        // console.log("Received Update from Bluetooth Device (Base64): ", rawData);
    
        // Convert base64 to byte array
        const buffer = Buffer.from(rawData, 'base64');
        const byteArray = new Uint8Array(buffer);
    
        // Check if we received 8 bytes
        if (byteArray.length !== 8) {
          console.error(`Expected 8 bytes, but received ${byteArray.length} bytes`);
          return;
        }

    
        // Assuming you want to use these bytes as 16-bit integers (as done in Arduino)
        const delta = byteArray[0] | (byteArray[1] << 8);
        const x = byteArray[2] | (byteArray[3] << 8);
        const y = byteArray[4] | (byteArray[5] << 8);
        const z = byteArray[6] | (byteArray[7] << 8);


        // Convert from unsigned to signed 16-bit integers if necessary
        const convertToSigned = (num: number) => (num > 32767 ? num - 65536 : num); // account for overflow

        // convert to signed and scale down
        const accelX = convertToSigned(x) / 938;
        const accelY = convertToSigned(y) / 938;
        const accelZ = convertToSigned(z) / 938;

        // store in datapoint 
        // setAccelerationDataPoint({delta: delta, x: accelX, y: accelY, z: accelZ});
        // console.log({delta: delta, x: accelX, y: accelY, z: accelZ});
        accelArrayRef.current[accelCounterRef.current] = {delta: delta, x: accelX, y: accelY, z: accelZ};
        accelCounterRef.current = (accelCounterRef.current + 1) % SIZE;

        console.log(delta,", ", accelX,", ", accelY,", ", accelZ,", ");
    };

    const onGyroscopeUpdate = (error: BleError | null, characteristic: Characteristic | null) => {
        if (error) {
          console.log(error);
          return -1;
        } else if (!characteristic?.value) {
          console.log("No Data was recieved");
          return -1;
        }
        // Now, we know that there is no error, and the characteristic has a value
    
        const rawData = characteristic.value; // This is a base64 string
        // console.log("Received Update from Bluetooth Device (Base64): ", rawData);
    
        // Convert base64 to byte array
        const buffer = Buffer.from(rawData, 'base64');
        const byteArray = new Uint8Array(buffer);
    
        // Check if we received 8 bytes
        if (byteArray.length !== 8) {
          console.error(`Expected 8 bytes, but received ${byteArray.length} bytes`);
          return;
        }
    
        // Assuming you want to use these bytes as 16-bit integers (as done in Arduino)
        const delta = byteArray[0] | (byteArray[1] << 8);
        const x = byteArray[2] | (byteArray[3] << 8);
        const y = byteArray[4] | (byteArray[5] << 8);
        const z = byteArray[6] | (byteArray[7] << 8);
    
        // Convert from unsigned to signed 16-bit integers if necessary
        const convertToSigned = (num: number) => (num > 32767 ? num - 65536 : num); // account for overflow
        
        // convert to signed and scale down
        const gyroX = convertToSigned(x) / 938;
        const gyroY = convertToSigned(y) / 938;
        const gyroZ = convertToSigned(z) / 938;
    
        // store in datapoint 
        // setAccelerationDataPoint({delta: delta, x: accelX, y: accelY, z: accelZ});
        // console.log({delta: delta, x: gyroX, y: gyroY, z: gyroZ});
        gyroArrayRef.current[gyroCounterRef.current] = {delta: delta, x: gyroX - 0.4, y: gyroY - 0.1, z: gyroZ + 0.4};
        gyroCounterRef.current = (gyroCounterRef.current + 1) % SIZE;
    };
    
    const subscribeToRelevantCharacteristics = async (device: Device) => {
        if (device) {
            accelerationSubscriptionRef.current = await device.monitorCharacteristicForService(ACCELEROMTER_UUID, ACCELEROMTER_CHARACTERISTIC, onAcceleromterUpdate);
            gyroscopeSubscriptionRef.current = await device.monitorCharacteristicForService(ACCELEROMTER_UUID, GYROSCOPE_CHARACTERISTIC, onGyroscopeUpdate);
            console.log("Subscribed to Peripheral");
        } else {
            console.log("Unable to subscribe. No device connected");
            accelerationSubscriptionRef.current = null;
            throw Error ("Unable to subscribe to peripheral. No Device connected");
        }
    };

    const connectToDevice = async (device: Device) => {
        try {
            setConnectionStatus("Attempting to Connect")
            const thisConnectedDevice = await BLEManager.connectToDevice(device.id);

            setConnectionStatus("Connecting")
            console.log("able to connect");

            BLEManager.stopDeviceScan(); // why scan once you are already have device
            console.log("able to stop scan");
            setConnectionStatus("Discovering all Services");

            await thisConnectedDevice.discoverAllServicesAndCharacteristics(); // documentation says need to do this
            setConnectionStatus("Services Discovered.");

            setConnectedDevice(thisConnectedDevice);


            await subscribeToRelevantCharacteristics(thisConnectedDevice);
            setConnectionStatus("Subscribed to Accelerometer");
            

            setConnectionStatus("");
            return true;
        } catch (error) {
            alert("Unable to connect to device");
            console.log(error);
            return false;
        }
    };

    const disconnectFromDevice = async () => {
        if (connectedDevice) {
            await BLEManager.cancelDeviceConnection(connectedDevice?.id)
        }
        console.log("Disconnected from Device");
        setConnectedDevice(null);
    }

    // write a function which turns the recordingCharacteristic on
    const startRecording = async () => {
        if (connectedDevice) {
            connectedDevice.writeCharacteristicWithResponseForService(
                CONTROL_SERVICE_UUID, 
                START_RECORDING_CHAR_UUID,
                Buffer.from([1]).toString('base64')
            ).then((characteristic) => {
                console.log('Recording started');
            }).catch((error) => {
                console.error(error);
            });

        } else {
            console.log("no device connected. Unable to start recording");
        }
    };

    // write a function which requests the data
    const requestData = async () => {
        if (connectedDevice) {
            connectedDevice.writeCharacteristicWithResponseForService(
                CONTROL_SERVICE_UUID, 
                REQUEST_DATA_CHAR_UUID,
                Buffer.from([1]).toString('base64')
            ).then((characteristic) => {
                console.log('Requested Data');
            }).catch((error) => {
                console.error(error);
            });

        } else {
            console.log("no device connected. Unable to start recording");
        }
    };


    return {
        requestPermissions, 
        scanForPeripherals,
        allDevices,
        connectToDevice,
        connectionStatus,
        connectedDevice,
        disconnectFromDevice,
        startRecording,
        requestData,
        accelArray: accelArrayRef.current,
        gyroArray: gyroArrayRef.current, 
    }
}

export default useBLE;