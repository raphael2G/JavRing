import { StyleSheet, FlatList, Text, Pressable } from 'react-native';


export default function DeviceList({ onSelect, availibleDevices, onCloseModal }) {
  return (
    <FlatList
      data={availibleDevices}
      contentContainerStyle={styles.listContainer}
      renderItem={({ item, index }) => (
        <Pressable
          style={styles.itemContainer}
          onPress={() => {
            onSelect(item);
            onCloseModal();
          }}>
          <Text key={index} style={styles.temporaryItemStyling}>{item.name}</Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  listContainer: {
    borderRadius: 10,
    backgroundColor: "#fff",
    marginTop: 10,
    justifyContent: "space-around"
  },
  temporaryItemStyling: {
    color: "#fff",
    fontSize: 32,
  }, 
  itemContainer: {
    backgroundColor: "#999", 
    width: "90%",
    marginHorizontal: "5%",
    marginVertical: 10,
    borderRadius: 5,
  }
});
