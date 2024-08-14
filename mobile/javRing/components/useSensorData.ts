import { useState, useRef } from 'react';

const { KalmanFilter } = require('kalman-filter');
const AHRS = require('ahrs');


interface SensorDataInterface {
    gravitilessAccelerationData: Array<{delta: number, x: number, y: number, z: number}>;

    orientationDataRef: React.MutableRefObject<{ delta: number; x: number; y: number; z: number; }[]>;

    updateOrientation: (        
                            rawAccelerationData: Array<{delta: number, x:number, y:number, z:number}>,
                            rawGyroData: Array<{delta: number, x:number, y:number, z:number}>,
                            rawMagnetometerData: Array<{delta: number, x:number, y:number, z:number}> | null ) => void; // must have accel and gyro but magn is optional

    smooothedAccelerationDataRef: React.MutableRefObject<{ delta: number; x: number; y: number; z: number; }[]>;
    smoothedGyroDataRef: React.MutableRefObject<{ delta: number; x: number; y: number; z: number; }[]>;
    smoothData: (gyroOrAccel: string, rawData: Array<{delta: number, x:number, y:number, z:number}>) => void;
};


function useSensorData():SensorDataInterface {

    const gravitilessAccelerationDataRef = useRef<Array<{delta: number, x: number, y: number, z: number}>>([]);

    const orientationDataRef = useRef<Array<{delta: number, x: number, y: number, z: number}>>([]);

    const smooothedAccelerationDataRef = useRef<Array<{delta: number, x: number, y: number, z: number}>>([]);
    const smoothedGyroDataRef = useRef<Array<{delta: number, x: number, y: number, z: number}>>([]);


    const smoothData = (gyroOrAccel: string, rawData: Array<{delta: number, x:number, y:number, z:number}>) => {
        console.log("entered smoothing data with ", gyroOrAccel);
        const tempX = rawData.map((data) => data.x);
        const tempY = rawData.map((data) => data.y);
        const tempZ = rawData.map((data) => data.z);


        const kFilterX = new KalmanFilter();
        const kFilterY = new KalmanFilter();
        const kFilterZ = new KalmanFilter();



        const smoothedX = kFilterX.filterAll(tempX);
        const smoothedY = kFilterY.filterAll(tempY);
        const smoothedZ = kFilterZ.filterAll(tempZ);


        if (gyroOrAccel == "accel") {
            smooothedAccelerationDataRef.current = rawData.map((data, index) => {
                return {
                    delta: data.delta,
                    x: smoothedX[index][0],
                    y: smoothedY[index][0],
                    z: smoothedZ[index][0],
                };
            });
        } else if (gyroOrAccel == "gyro") {
            smoothedGyroDataRef.current = rawData.map((data, index) => {
                return {
                    delta: data.delta,
                    x: smoothedX[index][0],
                    y: smoothedY[index][0],
                    z: smoothedZ[index][0],
                };
            });
        } else {
            console.log("Error: gyroOrAccel must be either 'accel' or 'gyro'");
        }

        console.log(gyroOrAccel + " has been data smoothed");

    };

    
    const updateOrientation = (         
                                    accelData: Array<{delta: number, x:number, y:number, z:number}>,
                                    gyroData: Array<{delta: number, x:number, y:number, z:number}>,
                                    magnData: Array<{delta: number, x:number, y:number, z:number}> | null,  
                                ) => {

        const madgwick = new AHRS({
            sampleInterval: 40,
            algorithm: 'Madgwick',
            beta: 0.4,
            kp: 0.5,
            ki: 0,
            doInitialisation: false,
        });

        // reset orientation data
        orientationDataRef.current = [];

        for (let i = 0; i < 800; i++) {

            // this does not include the magnetometer data, or utilizing the delta data. 
            // convert gyro to radians / second
            // convert accel to gs
            madgwick.update(    
                            gyroData[i].x / (180 / Math.PI), 
                            gyroData[i].y / (180 / Math.PI), 
                            gyroData[i].z / (180 / Math.PI), 
                            accelData[i].x, 
                            accelData[i].y,  
                            accelData[i].z, 
                            undefined, 
                            undefined, 
                            undefined, 
                            i == 0 ?  accelData[i].delta : accelData[i].delta - accelData[i-1].delta
                        );

            const eulerAngles = madgwick.getEulerAngles();
            console.log(eulerAngles);

            // add the euler angles to the end of the orientationData array
            orientationDataRef.current.push({
                                            delta: accelData[i].delta, 
                                            x: eulerAngles.heading * (180 / Math.PI), 
                                            y: eulerAngles.pitch * (180 / Math.PI), 
                                            z: eulerAngles.roll * (180 / Math.PI),
                                        });
        }

        console.log(orientationDataRef.current);

    }            


    return {
        gravitilessAccelerationData: gravitilessAccelerationDataRef.current, 
        orientationDataRef: orientationDataRef,
        updateOrientation: updateOrientation,
        smooothedAccelerationDataRef: smooothedAccelerationDataRef,
        smoothedGyroDataRef: smoothedGyroDataRef,
        smoothData: smoothData,
    };
};


export default useSensorData;