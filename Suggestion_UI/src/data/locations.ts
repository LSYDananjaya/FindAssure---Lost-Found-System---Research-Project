// Campus-wide locations
export const campusLocations = [
  "auditorium",
  "anohana_canteen",
  "main_building",
  "basement_canteen",
  "business_faculty",
  "juice_bar",
  "play_ground",
  "bird_nest",
  "volleyball_court",
  "basketball_court",
  "tennis_court",
  "engineering_faculty",
  "new_building",
  "willium_angliss",
  "green_house",
  "lake",
  "car_park1",
  "reception",
  "guard_room"
];

// New Building floor and hall data
export interface Hall {
  actual_location: string;
}

export interface Floor {
  floor_id: string;
  up_flow: string;
  down_flow: string;
  hall_list: Hall[];
}

export const newBuildingFloors: Floor[] = [
  {
    floor_id: "1",
    up_flow: "2",
    down_flow: "n/a",
    hall_list: [
      { actual_location: "1_liftarea" },
      { actual_location: "G1_washroom" },
      { actual_location: "F1_washroom" }
    ]
  },
  {
    floor_id: "2",
    up_flow: "3",
    down_flow: "1",
    hall_list: [
      { actual_location: "canteen" },
      { actual_location: "F2_washroom" },
      { actual_location: "2_liftarea" },
      { actual_location: "G2_washroom" },
      { actual_location: "Library" },
      { actual_location: "new_entrance" }
    ]
  },
  {
    floor_id: "3",
    up_flow: "4",
    down_flow: "2",
    hall_list: [
      { actual_location: "G3_washroom" },
      { actual_location: "F301" },
      { actual_location: "F302" },
      { actual_location: "F303" },
      { actual_location: "F304" },
      { actual_location: "F305" },
      { actual_location: "F306" },
      { actual_location: "F3_washroom" },
      { actual_location: "3_liftarea" }
    ]
  },
  {
    floor_id: "4",
    up_flow: "5",
    down_flow: "3",
    hall_list: [
      { actual_location: "G4_Reading_Room" },
      { actual_location: "G4_washroom" },
      { actual_location: "F401" },
      { actual_location: "F402" },
      { actual_location: "F403" },
      { actual_location: "F404" },
      { actual_location: "F405" },
      { actual_location: "F406" },
      { actual_location: "F4_washroom" },
      { actual_location: "4_liftarea" }
    ]
  },
  {
    floor_id: "5",
    up_flow: "6",
    down_flow: "4",
    hall_list: [
      { actual_location: "G501" },
      { actual_location: "G502" },
      { actual_location: "G503" },
      { actual_location: "G504" },
      { actual_location: "G505" },
      { actual_location: "G506" },
      { actual_location: "G5_washroom" },
      { actual_location: "F501" },
      { actual_location: "F502" },
      { actual_location: "F503" },
      { actual_location: "F504" },
      { actual_location: "F505" },
      { actual_location: "F506" },
      { actual_location: "F5_washroom" },
      { actual_location: "5_liftarea" }
    ]
  },
  {
    floor_id: "6",
    up_flow: "7",
    down_flow: "5",
    hall_list: [
      { actual_location: "G601" },
      { actual_location: "G602" },
      { actual_location: "G603" },
      { actual_location: "G604" },
      { actual_location: "G605" },
      { actual_location: "G606" },
      { actual_location: "G6_washroom" },
      { actual_location: "F601" },
      { actual_location: "F602" },
      { actual_location: "F603" },
      { actual_location: "F604" },
      { actual_location: "F605" },
      { actual_location: "F606" },
      { actual_location: "F6_washroom" },
      { actual_location: "6_liftarea" }
    ]
  },
  {
    floor_id: "7",
    up_flow: "8",
    down_flow: "6",
    hall_list: [
      { actual_location: "G701" },
      { actual_location: "G702" },
      { actual_location: "G703" },
      { actual_location: "G704" },
      { actual_location: "G705" },
      { actual_location: "G706" },
      { actual_location: "G7_washroom" },
      { actual_location: "F701" },
      { actual_location: "F702" },
      { actual_location: "F703" },
      { actual_location: "F704" },
      { actual_location: "F705" },
      { actual_location: "F706" },
      { actual_location: "F7_washroom" },
      { actual_location: "7_liftarea" }
    ]
  },
  {
    floor_id: "8",
    up_flow: "9",
    down_flow: "7",
    hall_list: [
      { actual_location: "G801" },
      { actual_location: "G802" },
      { actual_location: "G803" },
      { actual_location: "G804" },
      { actual_location: "G805" },
      { actual_location: "G806" },
      { actual_location: "G8_washroom" },
      { actual_location: "F801" },
      { actual_location: "F802" },
      { actual_location: "F803" },
      { actual_location: "F804" },
      { actual_location: "F805" },
      { actual_location: "F806" },
      { actual_location: "F8_washroom" },
      { actual_location: "8_liftarea" }
    ]
  },
  {
    floor_id: "9",
    up_flow: "10",
    down_flow: "8",
    hall_list: [
      { actual_location: "G901" },
      { actual_location: "G902" },
      { actual_location: "G903" },
      { actual_location: "G904" },
      { actual_location: "G905" },
      { actual_location: "G906" },
      { actual_location: "G9_washroom" },
      { actual_location: "F901" },
      { actual_location: "F902" },
      { actual_location: "F903" },
      { actual_location: "F904" },
      { actual_location: "F905" },
      { actual_location: "F906" },
      { actual_location: "F9_washroom" },
      { actual_location: "9_liftarea" }
    ]
  },
  {
    floor_id: "10",
    up_flow: "11",
    down_flow: "9",
    hall_list: [
      { actual_location: "G1001" },
      { actual_location: "G1002" },
      { actual_location: "G1003" },
      { actual_location: "G1004" },
      { actual_location: "G1005" },
      { actual_location: "G1006" },
      { actual_location: "G10_washroom" },
      { actual_location: "F1001" },
      { actual_location: "F1002" },
      { actual_location: "F1003" },
      { actual_location: "F1004" },
      { actual_location: "F1005" },
      { actual_location: "F1006" },
      { actual_location: "F10_washroom" },
      { actual_location: "10_liftarea" }
    ]
  },
  {
    floor_id: "11",
    up_flow: "12",
    down_flow: "10",
    hall_list: [
      { actual_location: "G1101" },
      { actual_location: "G1102" },
      { actual_location: "G1103" },
      { actual_location: "G1104" },
      { actual_location: "G1105" },
      { actual_location: "G1106" },
      { actual_location: "G11_washroom" },
      { actual_location: "F1101" },
      { actual_location: "F1102" },
      { actual_location: "F1103" },
      { actual_location: "F1104" },
      { actual_location: "F1105" },
      { actual_location: "F1106" },
      { actual_location: "F11_washroom" },
      { actual_location: "11_liftarea" }
    ]
  },
  {
    floor_id: "12",
    up_flow: "13",
    down_flow: "11",
    hall_list: [
      { actual_location: "G1201" },
      { actual_location: "G1202" },
      { actual_location: "G1203" },
      { actual_location: "G1204" },
      { actual_location: "G1205" },
      { actual_location: "G1206" },
      { actual_location: "G12_washroom" },
      { actual_location: "F1201" },
      { actual_location: "F1202" },
      { actual_location: "F1203" },
      { actual_location: "F1204" },
      { actual_location: "F1205" },
      { actual_location: "F1206" },
      { actual_location: "F12_washroom" },
      { actual_location: "12_liftarea" }
    ]
  },
  {
    floor_id: "13",
    up_flow: "14",
    down_flow: "12",
    hall_list: [
      { actual_location: "G1301" },
      { actual_location: "G1302" },
      { actual_location: "G1303" },
      { actual_location: "G1304" },
      { actual_location: "G1305" },
      { actual_location: "G1306" },
      { actual_location: "G13_washroom" },
      { actual_location: "F1301" },
      { actual_location: "F1302" },
      { actual_location: "F1303" },
      { actual_location: "F1304" },
      { actual_location: "F1305" },
      { actual_location: "F1306" },
      { actual_location: "F13_washroom" },
      { actual_location: "13_liftarea" }
    ]
  },
  {
    floor_id: "14",
    down_flow: "13",
    up_flow: "n/a",
    hall_list: [
      { actual_location: "G1401" },
      { actual_location: "G1402" },
      { actual_location: "F1401" },
      { actual_location: "F1402" },
      { actual_location: "G14_washroom" },
      { actual_location: "F14_washroom" }
    ]
  }
];

// Helper function to format location names for display
export const formatLocationName = (location: string): string => {
  return location
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
