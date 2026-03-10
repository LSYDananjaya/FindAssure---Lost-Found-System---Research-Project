export const MAIN_BUILDING_FLOORS = [
  {
    floor_id: "basement",
    up_flow: "1",
    down_flow: "n/a",
    hall_list: [
      {
        actual_location: "basement_liftarea",
        directions: {
          left: "basement_staircase",
          right: "n/a",
          front: "passage_basement"
        }
      },
      {
        actual_location: "basement_staircase",
        directions: {
          left: "n/a",
          right: "basement_liftarea",
          front: "passage_basement"
        }
      },
      {
        actual_location: "passage_basement",
        directions: {
          left: "n/a",
          right: "n/a",
          front: "n/a"
        }
      }
    ]
  },
  {
    floor_id: "1",
    up_flow: "2",
    down_flow: "basement",
    hall_list: [
      {
        actual_location: "1_liftarea",
        directions: {
          left: "1_staircase",
          right: "reception",
          front: "passage_1"
        }
      },
      {
        actual_location: "1_staircase",
        directions: {
          left: "n/a",
          right: "1_liftarea",
          front: "passage_1"
        }
      },
      {
        actual_location: "reception",
        directions: {
          left: "1_liftarea",
          right: "n/a",
          front: "passage_1"
        }
      },
      {
        actual_location: "sliit_island",
        directions: {
          left: "n/a",
          right: "n/a",
          front: "passage_1"
        }
      },
      {
        actual_location: "passage_1",
        directions: {
          left: "n/a",
          right: "n/a",
          front: "n/a"
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
        actual_location: "2_liftarea",
        directions: {
          left: "2_staircase",
          right: "sport_room",
          front: "passage_2"
        }
      },
      {
        actual_location: "2_staircase",
        directions: {
          left: "n/a",
          right: "2_liftarea",
          front: "passage_2"
        }
      },
      {
        actual_location: "study_area",
        directions: {
          left: "left_washrooms_2",
          right: "2_liftarea",
          front: "passage_2"
        }
      },
      {
        actual_location: "left_washrooms_2",
        directions: {
          left: "n/a",
          right: "study_area",
          front: "passage_2"
        }
      },
      {
        actual_location: "sport_room",
        directions: {
          left: "2_liftarea",
          right: "counseling_area",
          front: "passage_2"
        }
      },
      {
        actual_location: "counseling_area",
        directions: {
          left: "sport_room",
          right: "right_washrooms_2",
          front: "passage_2"
        }
      },
      {
        actual_location: "right_washrooms_2",
        directions: {
          left: "counseling_area",
          right: "n/a",
          front: "passage_2"
        }
      },
      {
        actual_location: "passage_2",
        directions: {
          left: "n/a",
          right: "n/a",
          front: "n/a"
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
        actual_location: "3_liftarea",
        directions: {
          left: "3_staircase",
          right: "A303",
          front: "passage_3"
        }
      },
      {
        actual_location: "3_staircase",
        directions: {
          left: "n/a",
          right: "3_liftarea",
          front: "passage_3"
        }
      },
      {
        actual_location: "A301",
        directions: {
          left: "A302",
          right: "n/a",
          front: "passage_3"
        }
      },
      {
        actual_location: "A302",
        directions: {
          left: "left_washroom_3",
          right: "A301",
          front: "passage_3"
        }
      },
      {
        actual_location: "left_washroom_3",
        directions: {
          left: "n/a",
          right: "A302",
          front: "passage_3"
        }
      },
      {
        actual_location: "A303",
        directions: {
          left: "3_liftarea",
          right: "right_washrooms_3",
          front: "passage_3"
        }
      },
      {
        actual_location: "right_washrooms_3",
        directions: {
          left: "A303",
          right: "library",
          front: "passage_3"
        }
      },
      {
        actual_location: "library",
        directions: {
          left: "right_washrooms_3",
          right: "n/a",
          front: "passage_3"
        }
      },
      {
        actual_location: "passage_3",
        directions: {
          left: "n/a",
          right: "n/a",
          front: "n/a"
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
        actual_location: "4_liftarea",
        directions: {
          left: "4_staircase",
          right: "A405",
          front: "passage_4"
        }
      },
      {
        actual_location: "4_staircase",
        directions: {
          left: "n/a",
          right: "4_liftarea",
          front: "passage_4"
        }
      },
      {
        actual_location: "A410_left",
        directions: {
          left: "left_washrooms_4",
          right: "n/a",
          front: "passage_4"
        }
      },
      {
        actual_location: "left_washrooms_4",
        directions: {
          left: "n/a",
          right: "A410_left",
          front: "passage_4"
        }
      },
      {
        actual_location: "A405",
        directions: {
          left: "4_liftarea",
          right: "A407_ITS_division",
          front: "passage_4"
        }
      },
      {
        actual_location: "A407_ITS_division",
        directions: {
          left: "A405",
          right: "A410",
          front: "passage_4"
        }
      },
      {
        actual_location: "A410",
        directions: {
          left: "A407_ITS_division",
          right: "A411",
          front: "passage_4"
        }
      },
      {
        actual_location: "A411",
        directions: {
          left: "A410",
          right: "A412",
          front: "passage_4"
        }
      },
      {
        actual_location: "A412",
        directions: {
          left: "A411",
          right: "right_washrooms_4",
          front: "passage_4"
        }
      },
      {
        actual_location: "right_washrooms_4",
        directions: {
          left: "A412",
          right: "n/a",
          front: "passage_4"
        }
      },
      {
        actual_location: "passage_4",
        directions: {
          left: "n/a",
          right: "n/a",
          front: "n/a"
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
        actual_location: "5_liftarea",
        directions: {
          left: "5_staircase",
          right: "A505",
          front: "passage_5"
        }
      },
      {
        actual_location: "5_staircase",
        directions: {
          left: "n/a",
          right: "5_liftarea",
          front: "passage_5"
        }
      },
      {
        actual_location: "A506",
        directions: {
          left: "A507",
          right: "n/a",
          front: "passage_5"
        }
      },
      {
        actual_location: "A507",
        directions: {
          left: "left_washrooms_5",
          right: "A506",
          front: "passage_5"
        }
      },
      {
        actual_location: "left_washrooms_5",
        directions: {
          left: "n/a",
          right: "A507",
          front: "passage_5"
        }
      },
      {
        actual_location: "A505",
        directions: {
          left: "5_liftarea",
          right: "A504",
          front: "passage_5"
        }
      },
      {
        actual_location: "A504",
        directions: {
          left: "A505",
          right: "A503",
          front: "passage_5"
        }
      },
      {
        actual_location: "A503",
        directions: {
          left: "A504",
          right: "right_washroom_5",
          front: "A501"
        }
      },
      {
        actual_location: "right_washroom_5",
        directions: {
          left: "A503",
          right: "n/a",
          front: "passage_5"
        }
      },
      {
        actual_location: "A501",
        directions: {
          left: "n/a",
          right: "A502",
          front: "passage_5"
        }
      },
      {
        actual_location: "A502",
        directions: {
          left: "A501",
          right: "n/a",
          front: "passage_5"
        }
      },
      {
        actual_location: "passage_5",
        directions: {
          left: "n/a",
          right: "n/a",
          front: "n/a"
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
        actual_location: "6_liftarea",
        directions: {
          left: "6_staircase",
          right: "CSSE_unit",
          front: "passage_6"
        }
      },
      {
        actual_location: "6_staircase",
        directions: {
          left: "n/a",
          right: "6_liftarea",
          front: "passage_6"
        }
      },
      {
        actual_location: "CSSE_unit",
        directions: {
          left: "6_liftarea",
          right: "n/a",
          front: "passage_6"
        }
      },
      {
        actual_location: "passage_6",
        directions: {
          left: "n/a",
          right: "n/a",
          front: "n/a"
        }
      }
    ]
  },
  {
    floor_id: "7",
    up_flow: "n/a",
    down_flow: "6",
    hall_list: [
      {
        actual_location: "7_liftarea",
        directions: {
          left: "7_staircase",
          right: "DS_unit",
          front: "passage_7"
        }
      },
      {
        actual_location: "7_staircase",
        directions: {
          left: "n/a",
          right: "7_liftarea",
          front: "passage_7"
        }
      },
      {
        actual_location: "DS_unit",
        directions: {
          left: "7_liftarea",
          right: "IT_unit",
          front: "passage_7"
        }
      },
      {
        actual_location: "IT_unit",
        directions: {
          left: "DS_unit",
          right: "n/a",
          front: "passage_7"
        }
      },
      {
        actual_location: "passage_7",
        directions: {
          left: "n/a",
          right: "n/a",
          front: "n/a"
        }
      }
    ]
  }
];
