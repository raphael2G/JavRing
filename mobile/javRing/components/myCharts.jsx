

import React, { useState, useEffect } from 'react';
import { View, Button } from 'react-native';
import spaceMono from '@/assets/fonts/SpaceMono-Regular.ttf';
import { useFont, Circle } from '@shopify/react-native-skia';

import { CartesianChart, Line, useChartPressState } from 'victory-native';


const MyChart = ({accelData, gyroData, orientationDataRef, smoothAccelDataRef, smoothGyroDataRef}) => {
  const font = useFont(spaceMono, 12);
  const { state, isActive } = useChartPressState({ x: 0, y: { x: 0, y:0, z:0 } });
  const [currentData, setCurrentData] = useState('gyroData');

  const getData = () => {
    switch (currentData) {
      case 'accelData':
        return accelData;
      case 'smoothAccelData':
        if (smoothAccelDataRef?.current.length > 0) {
          return smoothAccelDataRef.current;
        } else {
          return accelData
        }
      case 'smoothGyroData':
        if (smoothGyroDataRef?.current.length > 0) {
          console.log(smoothGyroDataRef.current);
          return smoothGyroDataRef.current;
        } else {
          console.log("ovveride gyroData");
          console.log(smoothGyroDataRef.current);
          return gyroData
        }
      case 'gyroData':
        return gyroData;
      case 'orientationData':
        if (orientationDataRef?.current.length > 0) {
          return orientationDataRef.current;
        } else {
          return accelData
        }
      default:
        return gyroData;
    }
  };

  useEffect(() => {
    console.log('currentData', currentData);
  }, [currentData]);


  const ToolTip = ({ x, y }) => {
    return <Circle cx={x} cy={y} r={4} color="black" />;
  }


  return (
    <View style={{ height: "80%", width: "100%", marginVertical: 50, backgroundColor: "white"}}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20}}>
        <Button title="Accel Data" onPress={() => setCurrentData('accelData')} />
        <Button title="Gyro Data" onPress={() => setCurrentData('gyroData')} />
        <Button title="Orientation Data" onPress={() => setCurrentData('orientationData')} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20}}>
        <Button title="Smooth Accel Data" onPress={() => setCurrentData('smoothAccelData')} />
        <Button title="Smooth Gyro Data" onPress={() => setCurrentData('smoothGyroData')} />
      </View>
      <CartesianChart
        data={getData()} 
        xKey={"delta"} 
        yKeys={["x", "y", "z"]}
        axisOptions={{ font }}
        chartPressState={state}
        connectMissingData={false}
      >
          {({ points }) => (
            <>
              <Line
                points={points["x"]}
                color={"red"}
                strokeWidth={3}
                animate={{ type: "timing", duration: 300 }}
                connectMissingData={false}
              />
              <Line
                points={points["y"]}
                color={"blue"}
                strokeWidth={2}
                animate={{ type: "timing", duration: 300 }}
                connectMissingData={false}
              />
              <Line
                points={points["z"]}
                color={"green"}
                strokeWidth={1}
                animate={{ type: "timing", duration: 300 }}
                connectMissingData={false}
              />
              
              {isActive ? (
                <>
                <ToolTip x={state.x.position} y={state.y.x.position} />
                <ToolTip x={state.x.position} y={state.y.y.position} />
                <ToolTip x={state.x.position} y={state.y.z.position} />
                </>
              ) : null}
            </> 
          )} 
      </CartesianChart>
    </View>
  );
};

export default MyChart;

