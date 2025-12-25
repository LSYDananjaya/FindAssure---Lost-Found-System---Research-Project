// Main campus locations with directional information
export const MAIN_LOCATIONS = [
  {
    actual_location: "auditorium",
    directions: {
      left: "road",
      right: "sliit_islands",
      top: "n/a",
      bottom: "n/a",
      front: "main_entrance",
      back: "anohana_canteen"
    }
  },
  {
    actual_location: "anohana_canteen",
    directions: {
      left: "road",
      right: "auditorium",
      top: "n/a",
      bottom: "n/a",
      front: "road",
      back: "main_building"
    }
  },
  {
    actual_location: "main_building",
    directions: {
      left: "anohana_canteen",
      right: "road",
      top: "n/a",
      bottom: "basement_canteen",
      front: "sliit_islands",
      back: "road"
    }
  },
  {
    actual_location: "basement_canteen",
    directions: {
      left: "road",
      right: "anohana_canteen",
      top: "main_building",
      bottom: "n/a",
      front: "road",
      back: "sliit_islands"
    }
  },
  {
    actual_location: "business_faculty",
    directions: {
      left: "n/a",
      right: "car_park1",
      top: "n/a",
      bottom: "juice_bar",
      front: "road",
      back: "play_ground"
    }
  },
  {
    actual_location: "juice_bar",
    directions: {
      left: "road",
      right: "play_ground",
      top: "business_faculty",
      bottom: "n/a",
      front: "car_park1",
      back: "n/a"
    }
  },
  {
    actual_location: "play_ground",
    directions: {
      left: "sliit_beach",
      right: "lake_view",
      top: "n/a",
      bottom: "n/a",
      front: "road",
      back: "n/a"
    }
  },
  {
    actual_location: "bird_nest",
    directions: {
      left: "open_theater",
      right: "road",
      top: "n/a",
      bottom: "finagle_canteen",
      front: "road",
      back: "road"
    }
  },
  {
    actual_location: "volleyball_court",
    directions: {
      left: "basketball_court",
      right: "sliit_islands",
      top: "n/a",
      bottom: "n/a",
      front: "road",
      back: "n/a"
    }
  },
  {
    actual_location: "basketball_court",
    directions: {
      left: "vehicle_parking",
      right: "volleyball_court",
      top: "n/a",
      bottom: "n/a",
      front: "road",
      back: "n/a"
    }
  },
  {
    actual_location: "tennis_court",
    directions: {
      left: "engineering_faculty",
      right: "n/a",
      top: "n/a",
      bottom: "n/a",
      front: "road",
      back: "n/a"
    }
  },
  {
    actual_location: "engineering_faculty",
    directions: {
      left: "new_building",
      right: "tennis_court",
      top: "n/a",
      bottom: "n/a",
      front: "car_park2",
      back: "n/a"
    }
  },
  {
    actual_location: "new_building",
    directions: {
      left: "willium_angliss",
      right: "engineering_faculty",
      top: "n/a",
      bottom: "canteen",
      front: "road",
      back: "n/a"
    }
  },
  {
    actual_location: "willium_angliss",
    directions: {
      left: "n/a",
      right: "new_building",
      top: "n/a",
      bottom: "n/a",
      front: "road",
      back: "swimming_pool"
    }
  },
  {
    actual_location: "green_house",
    directions: {
      left: "lake",
      right: "n/a",
      top: "n/a",
      bottom: "n/a",
      front: "road",
      back: "n/a"
    }
  },
  {
    actual_location: "lake",
    directions: {
      left: "road",
      right: "green_house",
      top: "n/a",
      bottom: "n/a",
      front: "road",
      back: "n/a"
    }
  },
  {
    actual_location: "car_park1",
    directions: {
      left: "road",
      right: "business_faculty",
      top: "n/a",
      bottom: "n/a",
      front: "sliit_beach",
      back: "road"
    }
  },
  {
    actual_location: "reception",
    directions: {
      left: "sliit_islands",
      right: "road",
      top: "n/a",
      bottom: "gymnasium",
      front: "road",
      back: "p&S_canteen"
    }
  },
  {
    actual_location: "guard_room",
    directions: {
      left: "n/a",
      right: "road",
      top: "n/a",
      bottom: "n/a",
      front: "road",
      back: "main_entrance"
    }
  }
];

// New Building floor and hall data
export const NEW_BUILDING_FLOORS = [
  {
    floor_id: "1",
    up_flow: "2",
    down_flow: "n/a",
    hall_list: [
      {
        actual_location: "1_liftarea",
        directions: {
          left: "G1_washroom",
          right: "F1_washroom",
          front: "passage_1"
        }
      },
      {
        actual_location: "G1_washroom",
        directions: {
          left: "n/a",
          right: "1_liftarea",
          front: "passage_1"
        }
      },
      {
        actual_location: "F1_washroom",
        directions: {
          left: "1_liftarea",
          right: "n/a",
          front: "passage_1"
        }
      }
    ]
  },
  {
    floor_id: "2",
    up_flow: "3",
    down_flow: "1",
    hall_list: [
      {
        actual_location: "canteen",
        directions: {
          left: "F2_washroom",
          right: "n/a",
          front: "passage_2"
        }
      },
      {
        actual_location: "F2_washroom",
        directions: {
          left: "2_liftarea",
          right: "canteen",
          front: "passage_2"
        }
      },
      {
        actual_location: "2_liftarea",
        directions: {
          left: "G2_washroom",
          right: "F2_washroom",
          front: "passage_2"
        }
      },
      {
        actual_location: "G2_washroom",
        directions: {
          left: "Library",
          right: "2_liftarea",
          front: "passage_2"
        }
      },
      {
        actual_location: "Library",
        directions: {
          left: "n/a",
          right: "G2_washroom",
          front: "passage_2"
        }
      },
      {
        actual_location: "new_entrance",
        directions: {
          left: "n/a",
          right: "n/a",
          front: "passage_2"
        }
      }
    ]
  },
  {
    floor_id: "3",
    up_flow: "4",
    down_flow: "2",
    hall_list: [
      {
        actual_location: "G3_washroom",
        directions: {
          left: "n/a",
          right: "3_liftarea",
          front: "passage_3"
        }
      },
      {
        actual_location: "F301",
        directions: {
          left: "F302",
          right: "n/a",
          front: "passage_3"
        }
      },
      {
        actual_location: "F302",
        directions: {
          left: "F303",
          right: "F301",
          front: "passage_3"
        }
      },
      {
        actual_location: "F303",
        directions: {
          left: "n/a",
          right: "F302",
          front: "passage_3"
        }
      },
      {
        actual_location: "F304",
        directions: {
          left: "n/a",
          right: "F305",
          front: "passage_3"
        }
      },
      {
        actual_location: "F305",
        directions: {
          left: "F306",
          right: "F304",
          front: "passage_3"
        }
      },
      {
        actual_location: "F306",
        directions: {
          left: "F3_washroom",
          right: "F305",
          front: "passage_3"
        }
      },
      {
        actual_location: "F3_washroom",
        directions: {
          left: "3_liftarea",
          right: "F306",
          front: "passage_3"
        }
      },
      {
        actual_location: "3_liftarea",
        directions: {
          left: "G3_washroom",
          right: "F3_washroom",
          front: "passage_3"
        }
      }
    ]
  },
  {
    floor_id: "4",
    up_flow: "5",
    down_flow: "3",
    hall_list: [
      {
        actual_location: "G4_Reading_Room",
        directions: {
          left: "n/a",
          right: "G4_washroom",
          front: "passage_4"
        }
      },
      {
        actual_location: "G4_washroom",
        directions: {
          left: "G4_Reading_Room",
          right: "4_liftarea",
          front: "passage_4"
        }
      },
      {
        actual_location: "F401",
        directions: {
          left: "F402",
          right: "n/a",
          front: "passage_4"
        }
      },
      {
        actual_location: "F402",
        directions: {
          left: "F403",
          right: "F401",
          front: "passage_4"
        }
      },
      {
        actual_location: "F403",
        directions: {
          left: "n/a",
          right: "F402",
          front: "passage_4"
        }
      },
      {
        actual_location: "F404",
        directions: {
          left: "F405",
          right: "n/a",
          front: "passage_4"
        }
      },
      {
        actual_location: "F405",
        directions: {
          left: "F406",
          right: "F404",
          front: "passage_4"
        }
      },
      {
        actual_location: "F406",
        directions: {
          left: "F4_washroom",
          right: "n/a",
          front: "passage_4"
        }
      },
      {
        actual_location: "F4_washroom",
        directions: {
          left: "4_liftarea",
          right: "F406",
          front: "passage_4"
        }
      },
      {
        actual_location: "4_liftarea",
        directions: {
          left: "G4_washroom",
          right: "F4_washroom",
          front: "passage_4"
        }
      }
    ]
  },
  {
    floor_id: "5",
    up_flow: "6",
    down_flow: "4",
    hall_list: [
      {
        actual_location: "G501",
        directions: {
          left: "G502",
          right: "G5_washroom",
          front: "passage_5"
        }
      },
      {
        actual_location: "G502",
        directions: {
          left: "G503",
          right: "G501",
          front: "passage_5"
        }
      },
      {
        actual_location: "G503",
        directions: {
          left: "n/a",
          right: "G502",
          front: "passage_5"
        }
      },
      {
        actual_location: "G504",
        directions: {
          left: "G505",
          right: "n/a",
          front: "passage_5"
        }
      },
      {
        actual_location: "G505",
        directions: {
          left: "G506",
          right: "G504",
          front: "passage_5"
        }
      },
      {
        actual_location: "G506",
        directions: {
          left: "n/a",
          right: "G505",
          front: "passage_5"
        }
      },
      {
        actual_location: "G5_washroom",
        directions: {
          left: "G501",
          right: "5_liftarea",
          front: "passage_5"
        }
      },
      {
        actual_location: "F501",
        directions: {
          left: "F502",
          right: "n/a",
          front: "passage_5"
        }
      },
      {
        actual_location: "F502",
        directions: {
          left: "F503",
          right: "F501",
          front: "passage_5"
        }
      },
      {
        actual_location: "F503",
        directions: {
          left: "n/a",
          right: "F502",
          front: "passage_5"
        }
      },
      {
        actual_location: "F504",
        directions: {
          left: "n/a",
          right: "F505",
          front: "passage_5"
        }
      },
      {
        actual_location: "F505",
        directions: {
          left: "F506",
          right: "F504",
          front: "passage_5"
        }
      },
      {
        actual_location: "F506",
        directions: {
          left: "F5_washroom",
          right: "F505",
          front: "passage_5"
        }
      },
      {
        actual_location: "F5_washroom",
        directions: {
          left: "5_liftarea",
          right: "F506",
          front: "passage_5"
        }
      },
      {
        actual_location: "5_liftarea",
        directions: {
          left: "G5_washroom",
          right: "F5_washroom",
          front: "passage_5"
        }
      }
    ]
  },
  {
    floor_id: "6",
    up_flow: "7",
    down_flow: "5",
    hall_list: [
      {
        actual_location: "G601",
        directions: {
          left: "G602",
          right: "G6_washroom",
          front: "passage_6"
        }
      },
      {
        actual_location: "G602",
        directions: {
          left: "G603",
          right: "G601",
          front: "passage_6"
        }
      },
      {
        actual_location: "G603",
        directions: {
          left: "n/a",
          right: "G602",
          front: "passage_6"
        }
      },
      {
        actual_location: "G604",
        directions: {
          left: "G605",
          right: "n/a",
          front: "passage_6"
        }
      },
      {
        actual_location: "G605",
        directions: {
          left: "G606",
          right: "G604",
          front: "passage_6"
        }
      },
      {
        actual_location: "G606",
        directions: {
          left: "n/a",
          right: "G605",
          front: "passage_6"
        }
      },
      {
        actual_location: "G6_washroom",
        directions: {
          left: "G601",
          right: "6_liftarea",
          front: "passage_6"
        }
      },
      {
        actual_location: "F601",
        directions: {
          left: "F602",
          right: "n/a",
          front: "passage_6"
        }
      },
      {
        actual_location: "F602",
        directions: {
          left: "F603",
          right: "F601",
          front: "passage_6"
        }
      },
      {
        actual_location: "F603",
        directions: {
          left: "n/a",
          right: "F602",
          front: "passage_6"
        }
      },
      {
        actual_location: "F604",
        directions: {
          left: "n/a",
          right: "F605",
          front: "passage_6"
        }
      },
      {
        actual_location: "F605",
        directions: {
          left: "F606",
          right: "F604",
          front: "passage_6"
        }
      },
      {
        actual_location: "F606",
        directions: {
          left: "F6_washroom",
          right: "F605",
          front: "passage_6"
        }
      },
      {
        actual_location: "F6_washroom",
        directions: {
          left: "6_liftarea",
          right: "F606",
          front: "passage_6"
        }
      },
      {
        actual_location: "6_liftarea",
        directions: {
          left: "G6_washroom",
          right: "F6_washroom",
          front: "passage_6"
        }
      }
    ]
  },
  {
    floor_id: "7",
    up_flow: "8",
    down_flow: "6",
    hall_list: [
      {
        actual_location: "G701",
        directions: {
          left: "G702",
          right: "G7_washroom",
          front: "passage_7"
        }
      },
      {
        actual_location: "G702",
        directions: {
          left: "G703",
          right: "G701",
          front: "passage_7"
        }
      },
      {
        actual_location: "G703",
        directions: {
          left: "n/a",
          right: "G702",
          front: "passage_7"
        }
      },
      {
        actual_location: "G704",
        directions: {
          left: "G705",
          right: "n/a",
          front: "passage_7"
        }
      },
      {
        actual_location: "G705",
        directions: {
          left: "G706",
          right: "G704",
          front: "passage_7"
        }
      },
      {
        actual_location: "G706",
        directions: {
          left: "n/a",
          right: "G705",
          front: "passage_7"
        }
      },
      {
        actual_location: "G7_washroom",
        directions: {
          left: "G701",
          right: "7_liftarea",
          front: "passage_7"
        }
      },
      {
        actual_location: "F701",
        directions: {
          left: "F702",
          right: "n/a",
          front: "passage_7"
        }
      },
      {
        actual_location: "F702",
        directions: {
          left: "F703",
          right: "F701",
          front: "passage_7"
        }
      },
      {
        actual_location: "F703",
        directions: {
          left: "n/a",
          right: "F702",
          front: "passage_7"
        }
      },
      {
        actual_location: "F704",
        directions: {
          left: "n/a",
          right: "F705",
          front: "passage_7"
        }
      },
      {
        actual_location: "F705",
        directions: {
          left: "F706",
          right: "F704",
          front: "passage_7"
        }
      },
      {
        actual_location: "F706",
        directions: {
          left: "F7_washroom",
          right: "F705",
          front: "passage_7"
        }
      },
      {
        actual_location: "F7_washroom",
        directions: {
          left: "7_liftarea",
          right: "F706",
          front: "passage_7"
        }
      },
      {
        actual_location: "7_liftarea",
        directions: {
          left: "G7_washroom",
          right: "F7_washroom",
          front: "passage_7"
        }
      }
    ]
  },
  {
    floor_id: "8",
    up_flow: "9",
    down_flow: "7",
    hall_list: [
      {
        actual_location: "G801",
        directions: {
          left: "G802",
          right: "G8_washroom",
          front: "passage_8"
        }
      },
      {
        actual_location: "G802",
        directions: {
          left: "G803",
          right: "G801",
          front: "passage_8"
        }
      },
      {
        actual_location: "G803",
        directions: {
          left: "n/a",
          right: "G802",
          front: "passage_8"
        }
      },
      {
        actual_location: "G804",
        directions: {
          left: "G805",
          right: "n/a",
          front: "passage_8"
        }
      },
      {
        actual_location: "G805",
        directions: {
          left: "G806",
          right: "G804",
          front: "passage_8"
        }
      },
      {
        actual_location: "G806",
        directions: {
          left: "n/a",
          right: "G805",
          front: "passage_8"
        }
      },
      {
        actual_location: "G8_washroom",
        directions: {
          left: "G801",
          right: "8_liftarea",
          front: "passage_8"
        }
      },
      {
        actual_location: "F801",
        directions: {
          left: "F802",
          right: "n/a",
          front: "passage_8"
        }
      },
      {
        actual_location: "F802",
        directions: {
          left: "F803",
          right: "F801",
          front: "passage_8"
        }
      },
      {
        actual_location: "F803",
        directions: {
          left: "n/a",
          right: "F802",
          front: "passage_8"
        }
      },
      {
        actual_location: "F804",
        directions: {
          left: "n/a",
          right: "F805",
          front: "passage_8"
        }
      },
      {
        actual_location: "F805",
        directions: {
          left: "F806",
          right: "F804",
          front: "passage_8"
        }
      },
      {
        actual_location: "F806",
        directions: {
          left: "F8_washroom",
          right: "F805",
          front: "passage_8"
        }
      },
      {
        actual_location: "F8_washroom",
        directions: {
          left: "8_liftarea",
          right: "F806",
          front: "passage_8"
        }
      },
      {
        actual_location: "8_liftarea",
        directions: {
          left: "G8_washroom",
          right: "F8_washroom",
          front: "passage_8"
        }
      }
    ]
  },
  {
    floor_id: "9",
    up_flow: "10",
    down_flow: "8",
    hall_list: [
      {
        actual_location: "G901",
        directions: {
          left: "G902",
          right: "G9_washroom",
          front: "passage_9"
        }
      },
      {
        actual_location: "G902",
        directions: {
          left: "G903",
          right: "G901",
          front: "passage_9"
        }
      },
      {
        actual_location: "G903",
        directions: {
          left: "n/a",
          right: "G902",
          front: "passage_9"
        }
      },
      {
        actual_location: "G904",
        directions: {
          left: "G905",
          right: "n/a",
          front: "passage_9"
        }
      },
      {
        actual_location: "G905",
        directions: {
          left: "G906",
          right: "G904",
          front: "passage_9"
        }
      },
      {
        actual_location: "G906",
        directions: {
          left: "n/a",
          right: "G905",
          front: "passage_9"
        }
      },
      {
        actual_location: "G9_washroom",
        directions: {
          left: "G901",
          right: "9_liftarea",
          front: "passage_9"
        }
      },
      {
        actual_location: "F901",
        directions: {
          left: "F902",
          right: "n/a",
          front: "passage_9"
        }
      },
      {
        actual_location: "F902",
        directions: {
          left: "F903",
          right: "F901",
          front: "passage_9"
        }
      },
      {
        actual_location: "F903",
        directions: {
          left: "n/a",
          right: "F902",
          front: "passage_9"
        }
      },
      {
        actual_location: "F904",
        directions: {
          left: "n/a",
          right: "F905",
          front: "passage_9"
        }
      },
      {
        actual_location: "F905",
        directions: {
          left: "F906",
          right: "F904",
          front: "passage_9"
        }
      },
      {
        actual_location: "F906",
        directions: {
          left: "F9_washroom",
          right: "F905",
          front: "passage_9"
        }
      },
      {
        actual_location: "F9_washroom",
        directions: {
          left: "9_liftarea",
          right: "F906",
          front: "passage_9"
        }
      },
      {
        actual_location: "9_liftarea",
        directions: {
          left: "G9_washroom",
          right: "F9_washroom",
          front: "passage_9"
        }
      }
    ]
  },
  {
    floor_id: "10",
    up_flow: "11",
    down_flow: "9",
    hall_list: [
      {
        actual_location: "G1001",
        directions: {
          left: "G1002",
          right: "G10_washroom",
          front: "passage_10"
        }
      },
      {
        actual_location: "G1002",
        directions: {
          left: "G1003",
          right: "G1001",
          front: "passage_10"
        }
      },
      {
        actual_location: "G1003",
        directions: {
          left: "n/a",
          right: "G1002",
          front: "passage_10"
        }
      },
      {
        actual_location: "G1004",
        directions: {
          left: "G1005",
          right: "n/a",
          front: "passage_10"
        }
      },
      {
        actual_location: "G1005",
        directions: {
          left: "G1006",
          right: "G1004",
          front: "passage_10"
        }
      },
      {
        actual_location: "G1006",
        directions: {
          left: "n/a",
          right: "G1005",
          front: "passage_10"
        }
      },
      {
        actual_location: "G10_washroom",
        directions: {
          left: "G1001",
          right: "10_liftarea",
          front: "passage_10"
        }
      },
      {
        actual_location: "F1001",
        directions: {
          left: "F1002",
          right: "n/a",
          front: "passage_10"
        }
      },
      {
        actual_location: "F1002",
        directions: {
          left: "F1003",
          right: "F1001",
          front: "passage_10"
        }
      },
      {
        actual_location: "F1003",
        directions: {
          left: "n/a",
          right: "F1002",
          front: "passage_10"
        }
      },
      {
        actual_location: "F1004",
        directions: {
          left: "n/a",
          right: "F1005",
          front: "passage_10"
        }
      },
      {
        actual_location: "F1005",
        directions: {
          left: "F1006",
          right: "F1004",
          front: "passage_10"
        }
      },
      {
        actual_location: "F1006",
        directions: {
          left: "F10_washroom",
          right: "F1005",
          front: "passage_10"
        }
      },
      {
        actual_location: "F10_washroom",
        directions: {
          left: "10_liftarea",
          right: "F1006",
          front: "passage_10"
        }
      },
      {
        actual_location: "10_liftarea",
        directions: {
          left: "G10_washroom",
          right: "F10_washroom",
          front: "passage_10"
        }
      }
    ]
  },
  {
    floor_id: "11",
    up_flow: "12",
    down_flow: "10",
    hall_list: [
      {
        actual_location: "G1101",
        directions: {
          left: "G1102",
          right: "G11_washroom",
          front: "passage_11"
        }
      },
      {
        actual_location: "G1102",
        directions: {
          left: "G1103",
          right: "G1101",
          front: "passage_11"
        }
      },
      {
        actual_location: "G1103",
        directions: {
          left: "n/a",
          right: "G1102",
          front: "passage_11"
        }
      },
      {
        actual_location: "G1104",
        directions: {
          left: "G1105",
          right: "n/a",
          front: "passage_11"
        }
      },
      {
        actual_location: "G1105",
        directions: {
          left: "G1106",
          right: "G1104",
          front: "passage_11"
        }
      },
      {
        actual_location: "G1106",
        directions: {
          left: "n/a",
          right: "G1105",
          front: "passage_11"
        }
      },
      {
        actual_location: "G11_washroom",
        directions: {
          left: "G1101",
          right: "11_liftarea",
          front: "passage_11"
        }
      },
      {
        actual_location: "F1101",
        directions: {
          left: "F1102",
          right: "n/a",
          front: "passage_11"
        }
      },
      {
        actual_location: "F1102",
        directions: {
          left: "F1103",
          right: "F1101",
          front: "passage_11"
        }
      },
      {
        actual_location: "F1103",
        directions: {
          left: "n/a",
          right: "F1102",
          front: "passage_11"
        }
      },
      {
        actual_location: "F1104",
        directions: {
          left: "n/a",
          right: "F1105",
          front: "passage_11"
        }
      },
      {
        actual_location: "F1105",
        directions: {
          left: "F1106",
          right: "F1104",
          front: "passage_11"
        }
      },
      {
        actual_location: "F1106",
        directions: {
          left: "F11_washroom",
          right: "F1105",
          front: "passage_11"
        }
      },
      {
        actual_location: "F11_washroom",
        directions: {
          left: "11_liftarea",
          right: "F1106",
          front: "passage_11"
        }
      },
      {
        actual_location: "11_liftarea",
        directions: {
          left: "G11_washroom",
          right: "F11_washroom",
          front: "passage_11"
        }
      }
    ]
  },
  {
    floor_id: "12",
    up_flow: "13",
    down_flow: "11",
    hall_list: [
      {
        actual_location: "G1201",
        directions: {
          left: "G1202",
          right: "G12_washroom",
          front: "passage_12"
        }
      },
      {
        actual_location: "G1202",
        directions: {
          left: "G1203",
          right: "G1201",
          front: "passage_12"
        }
      },
      {
        actual_location: "G1203",
        directions: {
          left: "n/a",
          right: "G1202",
          front: "passage_12"
        }
      },
      {
        actual_location: "G1204",
        directions: {
          left: "G1205",
          right: "n/a",
          front: "passage_12"
        }
      },
      {
        actual_location: "G1205",
        directions: {
          left: "G1206",
          right: "G1204",
          front: "passage_12"
        }
      },
      {
        actual_location: "G1206",
        directions: {
          left: "n/a",
          right: "G1205",
          front: "passage_12"
        }
      },
      {
        actual_location: "G12_washroom",
        directions: {
          left: "G1201",
          right: "12_liftarea",
          front: "passage_12"
        }
      },
      {
        actual_location: "F1201",
        directions: {
          left: "F1202",
          right: "n/a",
          front: "passage_12"
        }
      },
      {
        actual_location: "F1202",
        directions: {
          left: "F1203",
          right: "F1201",
          front: "passage_12"
        }
      },
      {
        actual_location: "F1203",
        directions: {
          left: "n/a",
          right: "F1202",
          front: "passage_12"
        }
      },
      {
        actual_location: "F1204",
        directions: {
          left: "n/a",
          right: "F1205",
          front: "passage_12"
        }
      },
      {
        actual_location: "F1205",
        directions: {
          left: "F1206",
          right: "F1204",
          front: "passage_12"
        }
      },
      {
        actual_location: "F1206",
        directions: {
          left: "F12_washroom",
          right: "F1205",
          front: "passage_12"
        }
      },
      {
        actual_location: "F12_washroom",
        directions: {
          left: "12_liftarea",
          right: "F1206",
          front: "passage_12"
        }
      },
      {
        actual_location: "12_liftarea",
        directions: {
          left: "G12_washroom",
          right: "F12_washroom",
          front: "passage_12"
        }
      }
    ]
  },
  {
    floor_id: "13",
    up_flow: "14",
    down_flow: "12",
    hall_list: [
      {
        actual_location: "G1301",
        directions: {
          left: "G1302",
          right: "G13_washroom",
          front: "passage_13"
        }
      },
      {
        actual_location: "G1302",
        directions: {
          left: "G1303",
          right: "G1301",
          front: "passage_13"
        }
      },
      {
        actual_location: "G1303",
        directions: {
          left: "n/a",
          right: "G1302",
          front: "passage_13"
        }
      },
      {
        actual_location: "G1304",
        directions: {
          left: "G1305",
          right: "n/a",
          front: "passage_13"
        }
      },
      {
        actual_location: "G1305",
        directions: {
          left: "G1306",
          right: "G1304",
          front: "passage_13"
        }
      },
      {
        actual_location: "G1306",
        directions: {
          left: "n/a",
          right: "G1305",
          front: "passage_13"
        }
      },
      {
        actual_location: "G13_washroom",
        directions: {
          left: "G1301",
          right: "13_liftarea",
          front: "passage_13"
        }
      },
      {
        actual_location: "F1301",
        directions: {
          left: "F1302",
          right: "n/a",
          front: "passage_13"
        }
      },
      {
        actual_location: "F1302",
        directions: {
          left: "F1303",
          right: "F1301",
          front: "passage_13"
        }
      },
      {
        actual_location: "F1303",
        directions: {
          left: "n/a",
          right: "F1302",
          front: "passage_13"
        }
      },
      {
        actual_location: "F1304",
        directions: {
          left: "n/a",
          right: "F1305",
          front: "passage_13"
        }
      },
      {
        actual_location: "F1305",
        directions: {
          left: "F1306",
          right: "F1304",
          front: "passage_13"
        }
      },
      {
        actual_location: "F1306",
        directions: {
          left: "F13_washroom",
          right: "F1305",
          front: "passage_13"
        }
      },
      {
        actual_location: "F13_washroom",
        directions: {
          left: "13_liftarea",
          right: "F1306",
          front: "passage_13"
        }
      },
      {
        actual_location: "13_liftarea",
        directions: {
          left: "G13_washroom",
          right: "F13_washroom",
          front: "passage_13"
        }
      }
    ]
  },
  {
    floor_id: "14",
    down_flow: "13",
    up_flow: "n/a",
    hall_list: [
      {
        actual_location: "G1401",
        directions: {
          left: "n/a",
          right: "G14_washroom",
          front: "passage_14"
        }
      },
      {
        actual_location: "G1402",
        directions: {
          left: "n/a",
          right: "n/a",
          front: "passage_14"
        }
      },
      {
        actual_location: "G14_washroom",
        directions: {
          left: "G1401",
          right: "14_liftarea",
          front: "passage_14"
        }
      },
      {
        actual_location: "F1401",
        directions: {
          left: "n/a",
          right: "n/a",
          front: "passage_14"
        }
      },
      {
        actual_location: "F1402",
        directions: {
          left: "F14_washroom",
          right: "n/a",
          front: "passage_14"
        }
      },
      {
        actual_location: "F14_washroom",
        directions: {
          left: "14_liftarea",
          right: "F1402",
          front: "passage_14"
        }
      },
      {
        actual_location: "14_liftarea",
        directions: {
          left: "G14_washroom",
          right: "F14_washroom",
          front: "passage_14"
        }
      }
    ]
  }
];

// Buildings that have floor/hall structure
export const BUILDINGS_WITH_FLOORS = ['new_building'];

// Helper function to check if a location has floors
export const hasFloors = (location: string): boolean => {
  return BUILDINGS_WITH_FLOORS.includes(location);
};

// Helper function to get floors for a building
export const getFloorsForBuilding = (building: string) => {
  if (building === 'new_building') {
    return NEW_BUILDING_FLOORS;
  }
  return [];
};

// Helper function to format location names for display
export const formatLocationName = (location: string): string => {
  return location
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
