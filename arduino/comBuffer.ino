#include <ArduinoBLE.h>
#include <Arduino_BMI270_BMM150.h>

const char* serviceUUID = "87654321-4321-6789-4321-fedcba987654";
const char* accelCharUUID = "abcdef01-2345-6789-abcd-ef0123456789";
const char* gyroCharUUID = "811958ba-dd5b-468e-b773-119f007fe62c";
const char* magnCharUUID = "1d1f6589-3b77-4ea4-8780-0e4e1401f06a";

const char* controlServiceUUID = "fd96b93d-5821-42b7-8f69-a6b09117aa04";
const char* startRecordingCharUUID = "1d651730-eaf2-4647-8d61-fe95357a2dba";
const char* bufferStatusCharUUID = "085d1a3c-b26a-42db-b69b-f919dd137884";
const char* requestDataCharUUID = "e5e6bcee-d52d-44a7-b47e-4a94af177daa";


const char* deviceDataServiceUUID = "a9356f7a-5a17-42e7-8fcc-f3987f974fda";
const char* bufferSizeCharUUID = "644abc84-5015-402c-b390-82baff2368df";



// set up the sensor service's characteristics
BLEService sensor(serviceUUID);

BLECharacteristic acceleromterCharacteristic(accelCharUUID, BLERead | BLENotify, 8);
BLEDescriptor acceleromterDescriptor("2901", "Acceleromter Characteristic");

BLECharacteristic gyroscopeCharacteristic(gyroCharUUID, BLERead | BLENotify, 8);
BLEDescriptor gyroscopeDescriptor("2901", "Gyroscope Characteristic");

BLECharacteristic magnetometerCharacteristic(magnCharUUID, BLERead | BLENotify, 8);
BLEDescriptor magnetometerDescriptor("2901", "Magnetometer Characteristic");


// set up the control service
BLEService controlService(controlServiceUUID);

BLEByteCharacteristic startRecordingChar(startRecordingCharUUID, BLERead | BLEWrite);  // connected device can turn this to 1 when wants the device to start recording data
BLEDescriptor startRecordingDescriptor("2901", "Start Recording Characteristic");


BLEByteCharacteristic bufferStatusChar(bufferStatusCharUUID, BLERead | BLENotify);  // 0 if buffer empty or recording, 1 buffer full
BLEDescriptor bufferStatusDescriptor("2901", "Buffer Status Characteristic");


BLEByteCharacteristic requestDataChar(requestDataCharUUID, BLERead | BLEWrite);     // 0 means not sending data, 1 means sending data in process (may not be actively sending bits)
BLEDescriptor requestDataDescriptor("2901", "Request Data Characteristic");

// set up the device data service
BLEService deviceDataService(deviceDataServiceUUID);
BLECharacteristic bufferSizeChar(bufferSizeCharUUID, BLERead, 2);




bool recording = false;


const uint16_t BUFFER_SIZE = 1000;  // Adjust size as needed
const int ENTRY_SIZE = 8;

// AccelData accelBuffer[BUFFER_SIZE];
// GyroData gyroBuffer[BUFFER_SIZE];
// MagnData magnBuffer[BUFFER_SIZE];

uint8_t accelBuffer[BUFFER_SIZE][ENTRY_SIZE];
uint8_t gyroBuffer[BUFFER_SIZE][ENTRY_SIZE];
uint8_t magnBuffer[BUFFER_SIZE][ENTRY_SIZE];


void setupBluetoothCharacteristicsAndServices() {
  acceleromterCharacteristic.addDescriptor(acceleromterDescriptor);
  gyroscopeCharacteristic.addDescriptor(gyroscopeDescriptor);
  magnetometerCharacteristic.addDescriptor(magnetometerDescriptor);

  sensor.addCharacteristic(acceleromterCharacteristic);
  sensor.addCharacteristic(gyroscopeCharacteristic);
  sensor.addCharacteristic(magnetometerCharacteristic);

  startRecordingChar.addDescriptor(startRecordingDescriptor);
  bufferStatusChar.addDescriptor(bufferStatusDescriptor);
  requestDataChar.addDescriptor(requestDataDescriptor);

  controlService.addCharacteristic(startRecordingChar);
  controlService.addCharacteristic(bufferStatusChar);
  controlService.addCharacteristic(requestDataChar);

  deviceDataService.addCharacteristic(bufferSizeChar);


  // Set event handlers
  BLE.setEventHandler(BLEConnected, onConnect);
  BLE.setEventHandler(BLEDisconnected, onDisconnect);

  // set local name, device name, and appearence
  BLE.setLocalName("Jav Ring");                  // will be displayed for humans to read
  BLE.setDeviceName("Derek's Jav Ring Pro!!!");  // will be displayed once centrals connect
  BLE.setAppearance(0x0541);                     // set motion sensor appearence - there is standards for these somewhere, maybe will post link if i find it
  
  BLE.addService(controlService);
  BLE.addService(sensor);
  BLE.addService(deviceDataService);
  BLE.setAdvertisedService(sensor);

  Serial.println("BLE initialized.");
}





int accelIndex = 0;
int gyroIndex = 0;
int magnIndex = 0;


void onConnect(BLEDevice central) {
  Serial.print("Connected to central: ");
  Serial.println(central.address());
}

void onDisconnect(BLEDevice central) {
  Serial.println("On Disconnect go!");
  clearBuffer();
}

const int16_t ACCELEROMETER_SCALING_FACTOR = 835;
const int16_t GYROSCOPE_SCALING_FACTOR = 938;
const int16_t MAGNETOMETER_SCALING_FACTOR = 1000;

int16_t floatToInt16(float value, int whichSensor) {
  // 0 for accelerometer
  // 1 for gyroscope
  // 2 for magnetometer
  if (whichSensor == 0) { return (int16_t)(value * ACCELEROMETER_SCALING_FACTOR); }
  if (whichSensor == 1) { return (int16_t)(value * GYROSCOPE_SCALING_FACTOR); }
  if (whichSensor == 2) { return (int16_t)(value * MAGNETOMETER_SCALING_FACTOR); }
}

void addToBuffer(uint8_t buffer[][ENTRY_SIZE], int whichSensor, int index,  uint16_t delta, float x, float y, float z) {

  int16_t new_x = floatToInt16(x, whichSensor);
  int16_t new_y = floatToInt16(y, whichSensor);
  int16_t new_z = floatToInt16(z, whichSensor);

  // Store the int16_t values and uint16_t delta into the buffer
  buffer[index][0] = delta & 0xFF;
  buffer[index][1] = (delta >> 8) & 0xFF;

  buffer[index][2] = new_x & 0xFF;
  buffer[index][3] = (new_x >> 8) & 0xFF;

  buffer[index][4] = new_y & 0xFF;
  buffer[index][5] = (new_y >> 8) & 0xFF;

  buffer[index][6] = new_z & 0xFF;
  buffer[index][7] = (new_z >> 8) & 0xFF;

}

void setup() {

  // The goal of this is to 1. set up the IMU and 2. Set up the bluetooth.

  // set up the IMU
  if (!IMU.begin()) {
    Serial.println("Failed to properly set up IMU!");
    while (true);  // just loop forever. Don't want to break anything else
  }

  // Set up the bluetooth
  if (!BLE.begin()) {
    Serial.println("starting Bluetooth® Low Energy module failed!");
    while (1);
  }

  setupBluetoothCharacteristicsAndServices();

  bufferSizeChar.writeValue((uint16_t)((BUFFER_SIZE >> 8) | (BUFFER_SIZE << 8) & 0xFF00)); // convert to big endian


  // advertise the service
  if (BLE.advertise()) {
    Serial.println("Device is now discoverable.");
  } else {
    Serial.println("ERROR - Device is unale to be advertised");
    while (1);
  }
}

void clearBuffer() {
  memset(accelBuffer, 0, sizeof(accelBuffer));
  memset(gyroBuffer, 0, sizeof(gyroBuffer));
  memset(magnBuffer, 0, sizeof(magnBuffer));
  
  accelIndex = 0;
  gyroIndex = 0;
  magnIndex = 0;

  bufferStatusChar.writeValue(0);
}



void sendBuffer() {

  // loop through the buffer size
  for (int i = 0; i < BUFFER_SIZE; i ++) {
    acceleromterCharacteristic.writeValue(accelBuffer[i], ENTRY_SIZE);
    gyroscopeCharacteristic.writeValue(gyroBuffer[i], ENTRY_SIZE);
    magnetometerCharacteristic.writeValue(magnBuffer[i], ENTRY_SIZE);
  }

  Serial.println("Buffer Successfully Sent");

}

unsigned long currentTime, baseTime, magnCurrentTime, magnBaseTime;
float x_acc, y_acc, z_acc;     // create x, y, z variable for acceleration
float x_gyro, y_gyro, z_gyro;  // create x, y, z variable for gyro
float x_magn, y_magn, z_magn;  // create x, y, z variable for magnetometer

void loop() {

  // poll devices
  BLE.poll();

  if (BLE.connected()) {

    Serial.println("connected");
    uint8_t isRecording, requestDataStatus;
    startRecordingChar.readValue(isRecording);
    requestDataChar.readValue(requestDataStatus);

    // Check if a central is connected
    if (isRecording) {
      
      if (accelIndex < BUFFER_SIZE && gyroIndex < BUFFER_SIZE && magnIndex < BUFFER_SIZE) {
        if (IMU.accelerationAvailable() && IMU.gyroscopeAvailable()) {

          IMU.readAcceleration(x_acc, y_acc, z_acc);
          IMU.readGyroscope(x_gyro, y_gyro, z_gyro);


          currentTime = millis();

          if (accelIndex == 0) { baseTime = currentTime; }
          if (gyroIndex == 0) { baseTime = currentTime; }


          addToBuffer(accelBuffer, 0, accelIndex++, (uint16_t)(currentTime - baseTime), x_acc, y_acc, z_acc);
          addToBuffer(gyroBuffer, 1,  gyroIndex++, (uint16_t)(currentTime - baseTime), x_gyro, y_gyro, z_gyro);

          Serial.print(accelIndex - 1);
          Serial.print(" ");
          Serial.print(currentTime - baseTime);
          Serial.print(" ");
          Serial.print(x_acc);
          Serial.print(" ");
          Serial.print(y_acc);
          Serial.print(" ");
          Serial.println(z_acc);
        }


        if (IMU.magneticFieldAvailable()) {

          IMU.readMagneticField(x_magn, y_magn, z_magn);

          magnCurrentTime = millis();

          if (magnIndex == 0) { magnBaseTime = magnCurrentTime; }

          addToBuffer(magnBuffer, 2, magnIndex++, (uint16_t)(magnCurrentTime - magnBaseTime), x_magn, y_magn, z_magn);
        }
      } else { 
        // this only reaches if the buffer is reached in accel, gyro, or magn,
        // which means it is not full and we do not need to record data
        startRecordingChar.writeValue(0); 
        bufferStatusChar.writeValue(1); 
      }
    } 
    
    if (requestDataStatus) {
      Serial.println("Requested to send data");

      sendBuffer();

      // Once data has been sent, set back to 0
      requestDataChar.writeValue(0);

    }

  }
}
