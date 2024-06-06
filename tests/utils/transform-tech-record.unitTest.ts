import { DynamoDBRecord } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { transformTechRecord } from '../../src/utils/transform-tech-record';

const dbRecordOld: DynamoDBRecord = {
  dynamodb: {
    NewImage: {
      systemNumber: {
        S: '11000017',
      },
      vin: {
        S: 'P012301957486',
      },
      partialVin: {
        S: '957486',
      },
      primaryVrm: {
        S: 'AD35GHT',
      },
      secondaryVrms: {
        L: [
          {
            S: 'CT96DRG',
          },
        ],
      },
      techRecord: {
        L: [
          {
            M: {
              axles: {
                L: [
                  {
                    M: {
                      axleNumber: {
                        N: '1',
                      },
                      tyres: {
                        M: {
                          dataTrAxles: {
                            N: '345',
                          },
                          fitmentCode: {
                            S: 'single',
                          },
                          plyRating: {
                            S: 'AB',
                          },
                          speedCategorySymbol: {
                            S: 'a7',
                          },
                          tyreCode: {
                            N: '1234',
                          },
                          tyreSize: {
                            S: '9.23648E+11',
                          },
                        },
                      },
                      weights: {
                        M: {
                          designWeight: {
                            N: '1800',
                          },
                          gbWeight: {
                            N: '1400',
                          },
                        },
                      },
                    },
                  },
                  {
                    M: {
                      axleNumber: {
                        N: '2',
                      },
                      tyres: {
                        M: {
                          dataTrAxles: {
                            N: '345',
                          },
                          fitmentCode: {
                            S: 'single',
                          },
                          plyRating: {
                            S: 'AB',
                          },
                          speedCategorySymbol: {
                            S: 'a7',
                          },
                          tyreCode: {
                            N: '5678',
                          },
                          tyreSize: {
                            S: '9.23648E+11',
                          },
                        },
                      },
                      weights: {
                        M: {
                          designWeight: {
                            N: '1900',
                          },
                          gbWeight: {
                            N: '1600',
                          },
                        },
                      },
                    },
                  },
                  {
                    M: {
                      axleNumber: {
                        N: '3',
                      },
                      tyres: {
                        M: {
                          dataTrAxles: {
                            N: '345',
                          },
                          fitmentCode: {
                            S: 'single',
                          },
                          plyRating: {
                            S: 'AB',
                          },
                          speedCategorySymbol: {
                            S: 'a7',
                          },
                          tyreCode: {
                            N: '5678',
                          },
                          tyreSize: {
                            S: '9.23648E+11',
                          },
                        },
                      },
                      weights: {
                        M: {
                          designWeight: {
                            N: '1900',
                          },
                          gbWeight: {
                            N: '1600',
                          },
                        },
                      },
                    },
                  },
                  {
                    M: {
                      axleNumber: {
                        N: '4',
                      },
                      tyres: {
                        M: {
                          dataTrAxles: {
                            N: '345',
                          },
                          fitmentCode: {
                            S: 'single',
                          },
                          plyRating: {
                            S: 'AB',
                          },
                          speedCategorySymbol: {
                            S: 'a7',
                          },
                          tyreCode: {
                            N: '5678',
                          },
                          tyreSize: {
                            S: '9.23648E+11',
                          },
                        },
                      },
                      weights: {
                        M: {
                          designWeight: {
                            N: '1900',
                          },
                          gbWeight: {
                            N: '1600',
                          },
                        },
                      },
                    },
                  },
                  {
                    M: {
                      axleNumber: {
                        N: '5',
                      },
                      tyres: {
                        M: {
                          dataTrAxles: {
                            N: '345',
                          },
                          fitmentCode: {
                            S: 'single',
                          },
                          plyRating: {
                            S: 'AB',
                          },
                          speedCategorySymbol: {
                            S: 'a7',
                          },
                          tyreCode: {
                            N: '5678',
                          },
                          tyreSize: {
                            S: '9.23648E+11',
                          },
                        },
                      },
                      weights: {
                        M: {
                          designWeight: {
                            N: '1900',
                          },
                          gbWeight: {
                            N: '1600',
                          },
                        },
                      },
                    },
                  },
                ],
              },
              bodyType: {
                M: {
                  code: {
                    S: 'r',
                  },
                  description: {
                    S: 'refuse',
                  },
                },
              },
              brakeCode: {
                S: '178202',
              },
              brakes: {
                M: {
                  antilockBrakingSystem: {
                    BOOL: true,
                  },
                  brakeCode: {
                    S: '123',
                  },
                  brakeCodeOriginal: {
                    S: '12412',
                  },
                  brakeForceWheelsNotLocked: {
                    M: {
                      parkingBrakeForceA: {
                        N: '2332',
                      },
                      secondaryBrakeForceA: {
                        N: '2512',
                      },
                      serviceBrakeForceA: {
                        N: '6424',
                      },
                    },
                  },
                  brakeForceWheelsUpToHalfLocked: {
                    M: {
                      parkingBrakeForceB: {
                        N: '3512',
                      },
                      secondaryBrakeForceB: {
                        N: '2512',
                      },
                      serviceBrakeForceB: {
                        N: '5521',
                      },
                    },
                  },
                  dataTrBrakeOne: {
                    S: 'None',
                  },
                  dataTrBrakeThree: {
                    S: 'None',
                  },
                  dataTrBrakeTwo: {
                    S: 'None',
                  },
                  dtpNumber: {
                    S: 'sdgs',
                  },
                  loadSensingValve: {
                    BOOL: true,
                  },
                  retarderBrakeOne: {
                    S: 'electric',
                  },
                  retarderBrakeTwo: {
                    S: 'exhaust',
                  },
                },
              },
              conversionRefNo: {
                S: '7891234',
              },
              createdAt: {
                S: '2019-06-24T10:26:54.903Z',
              },
              dimensions: {
                M: {
                  length: {
                    N: '7500',
                  },
                  width: {
                    N: '2200',
                  },
                },
              },
              drawbarCouplingFitted: {
                BOOL: true,
              },
              euroStandard: {
                S: '7',
              },
              frontVehicleTo5thWheelCouplingMax: {
                N: '1900',
              },
              frontVehicleTo5thWheelCouplingMin: {
                N: '1700',
              },
              frontAxleTo5thWheelMax: {
                N: '1500',
              },
              frontAxleTo5thWheelMin: {
                N: '1200',
              },
              functionCode: {
                S: 'A',
              },
              grossKerbWeight: {
                N: '2500',
              },
              grossLadenWeight: {
                N: '3000',
              },
              lastUpdatedAt: {
                S: '2019-06-24T10:28:58.999Z',
              },
              make: {
                S: 'Isuzu',
              },
              manufactureYear: {
                N: '2018',
              },
              maxTrainDesignWeight: {
                N: '500',
              },
              maxTrainGbWeight: {
                N: '1000',
              },
              model: {
                S: 'FM',
              },
              noOfAxles: {
                N: '5',
              },
              notes: {
                S: 'test notes',
              },
              ntaNumber: {
                S: '123456',
              },
              numberOfWheelsDriven: {
                NULL: true,
              },
              reasonForCreation: {
                S: 'new vehicle',
              },
              recordCompleteness: {
                S: 'complete',
              },
              regnDate: {
                S: '2019-06-24',
              },
              roadFriendly: {
                BOOL: true,
              },
              speedLimiterMrk: {
                BOOL: true,
              },
              statusCode: {
                S: 'current',
              },
              tachoExemptMrk: {
                BOOL: true,
              },
              trainDesignWeight: {
                N: '2000',
              },
              trainGbWeight: {
                N: '1500',
              },
              tyreUseCode: {
                S: '2B',
              },
              vehicleClass: {
                M: {
                  code: {
                    S: 'v',
                  },
                  description: {
                    S: 'heavy goods vehicle',
                  },
                },
              },
              vehicleConfiguration: {
                S: 'centre axle drawbar',
              },
              vehicleSubclass: {
                L: [
                  {
                    S: 'string',
                  },
                ],
              },
              vehicleType: {
                S: 'hgv',
              },
            },
          },
        ],
      },
    },
  },
};

const dbRecordNew = {
  dynamodb: {
    NewImage: {
      systemNumber: {
        S: '11000017',
      },
      createdTimestamp: {
        S: '2019-06-24T10:26:54.903Z',
      },
      partialVin: {
        S: '957486',
      },
      primaryVrm: {
        S: 'AD35GHT',
      },
      secondaryVrms: {
        L: [
          {
            S: 'CT96DRG',
          },
        ],
      },
      techRecord_axles_0_axleNumber: {
        N: '1',
      },
      techRecord_axles_0_tyres_dataTrAxles: {
        N: '345',
      },
      techRecord_axles_0_tyres_fitmentCode: {
        S: 'single',
      },
      techRecord_axles_0_tyres_plyRating: {
        S: 'AB',
      },
      techRecord_axles_0_tyres_speedCategorySymbol: {
        S: 'a7',
      },
      techRecord_axles_0_tyres_tyreCode: {
        N: '1234',
      },
      techRecord_axles_0_tyres_tyreSize: {
        S: '9.23648E+11',
      },
      techRecord_axles_0_weights_designWeight: {
        N: '1800',
      },
      techRecord_axles_0_weights_gbWeight: {
        N: '1400',
      },
      techRecord_axles_1_axleNumber: {
        N: '2',
      },
      techRecord_axles_1_tyres_dataTrAxles: {
        N: '345',
      },
      techRecord_axles_1_tyres_fitmentCode: {
        S: 'single',
      },
      techRecord_axles_1_tyres_plyRating: {
        S: 'AB',
      },
      techRecord_axles_1_tyres_speedCategorySymbol: {
        S: 'a7',
      },
      techRecord_axles_1_tyres_tyreCode: {
        N: '5678',
      },
      techRecord_axles_1_tyres_tyreSize: {
        S: '9.23648E+11',
      },
      techRecord_axles_1_weights_designWeight: {
        N: '1900',
      },
      techRecord_axles_1_weights_gbWeight: {
        N: '1600',
      },
      techRecord_axles_2_axleNumber: {
        N: '3',
      },
      techRecord_axles_2_tyres_dataTrAxles: {
        N: '345',
      },
      techRecord_axles_2_tyres_fitmentCode: {
        S: 'single',
      },
      techRecord_axles_2_tyres_plyRating: {
        S: 'AB',
      },
      techRecord_axles_2_tyres_speedCategorySymbol: {
        S: 'a7',
      },
      techRecord_axles_2_tyres_tyreCode: {
        N: '5678',
      },
      techRecord_axles_2_tyres_tyreSize: {
        S: '9.23648E+11',
      },
      techRecord_axles_2_weights_designWeight: {
        N: '1900',
      },
      techRecord_axles_2_weights_gbWeight: {
        N: '1600',
      },
      techRecord_axles_3_axleNumber: {
        N: '4',
      },
      techRecord_axles_3_tyres_dataTrAxles: {
        N: '345',
      },
      techRecord_axles_3_tyres_fitmentCode: {
        S: 'single',
      },
      techRecord_axles_3_tyres_plyRating: {
        S: 'AB',
      },
      techRecord_axles_3_tyres_speedCategorySymbol: {
        S: 'a7',
      },
      techRecord_axles_3_tyres_tyreCode: {
        N: '5678',
      },
      techRecord_axles_3_tyres_tyreSize: {
        S: '9.23648E+11',
      },
      techRecord_axles_3_weights_designWeight: {
        N: '1900',
      },
      techRecord_axles_3_weights_gbWeight: {
        N: '1600',
      },
      techRecord_axles_4_axleNumber: {
        N: '5',
      },
      techRecord_axles_4_tyres_dataTrAxles: {
        N: '345',
      },
      techRecord_axles_4_tyres_fitmentCode: {
        S: 'single',
      },
      techRecord_axles_4_tyres_plyRating: {
        S: 'AB',
      },
      techRecord_axles_4_tyres_speedCategorySymbol: {
        S: 'a7',
      },
      techRecord_axles_4_tyres_tyreCode: {
        N: '5678',
      },
      techRecord_axles_4_tyres_tyreSize: {
        S: '9.23648E+11',
      },
      techRecord_axles_4_weights_designWeight: {
        N: '1900',
      },
      techRecord_axles_4_weights_gbWeight: {
        N: '1600',
      },
      techRecord_bodyType_code: {
        S: 'r',
      },
      techRecord_bodyType_description: {
        S: 'refuse',
      },
      techRecord_brakeCode: {
        S: '178202',
      },
      techRecord_brakes_antilockBrakingSystem: {
        BOOL: true,
      },
      techRecord_brakes_brakeCode: {
        S: '123',
      },
      techRecord_brakes_brakeCodeOriginal: {
        S: '12412',
      },
      techRecord_brakes_brakeForceWheelsNotLocked_parkingBrakeForceA: {
        N: '2332',
      },
      techRecord_brakes_brakeForceWheelsNotLocked_secondaryBrakeForceA: {
        N: '2512',
      },
      techRecord_brakes_brakeForceWheelsNotLocked_serviceBrakeForceA: {
        N: '6424',
      },
      techRecord_brakes_brakeForceWheelsUpToHalfLocked_parkingBrakeForceB: {
        N: '3512',
      },
      techRecord_brakes_brakeForceWheelsUpToHalfLocked_secondaryBrakeForceB: {
        N: '2512',
      },
      techRecord_brakes_brakeForceWheelsUpToHalfLocked_serviceBrakeForceB: {
        N: '5521',
      },
      techRecord_brakes_dataTrBrakeOne: {
        S: 'None',
      },
      techRecord_brakes_dataTrBrakeThree: {
        S: 'None',
      },
      techRecord_brakes_dataTrBrakeTwo: {
        S: 'None',
      },
      techRecord_brakes_dtpNumber: {
        S: 'sdgs',
      },
      techRecord_brakes_loadSensingValve: {
        BOOL: true,
      },
      techRecord_brakes_retarderBrakeOne: {
        S: 'electric',
      },
      techRecord_brakes_retarderBrakeTwo: {
        S: 'exhaust',
      },
      techRecord_conversionRefNo: {
        S: '7891234',
      },
      techRecord_createdAt: {
        S: '2019-06-24T10:26:54.903Z',
      },
      techRecord_dimensions_length: {
        N: '7500',
      },
      techRecord_dimensions_width: {
        N: '2200',
      },
      techRecord_drawbarCouplingFitted: {
        BOOL: true,
      },
      techRecord_euroStandard: {
        S: '7',
      },
      techRecord_frontVehicleTo5thWheelCouplingMax: {
        N: '1900',
      },
      techRecord_frontVehicleTo5thWheelCouplingMin: {
        N: '1700',
      },
      techRecord_frontAxleTo5thWheelMax: {
        N: '1500',
      },
      techRecord_frontAxleTo5thWheelMin: {
        N: '1200',
      },
      techRecord_functionCode: {
        S: 'A',
      },
      techRecord_grossKerbWeight: {
        N: '2500',
      },
      techRecord_grossLadenWeight: {
        N: '3000',
      },
      techRecord_lastUpdatedAt: {
        S: '2019-06-24T10:28:58.999Z',
      },
      techRecord_make: {
        S: 'Isuzu',
      },
      techRecord_manufactureYear: {
        N: '2018',
      },
      techRecord_maxTrainDesignWeight: {
        N: '500',
      },
      techRecord_maxTrainGbWeight: {
        N: '1000',
      },
      techRecord_model: {
        S: 'FM',
      },
      techRecord_noOfAxles: {
        N: '5',
      },
      techRecord_notes: {
        S: 'test notes',
      },
      techRecord_ntaNumber: {
        S: '123456',
      },
      techRecord_numberOfWheelsDriven: {
        NULL: true,
      },
      techRecord_reasonForCreation: {
        S: 'new vehicle',
      },
      techRecord_recordCompleteness: {
        S: 'complete',
      },
      techRecord_regnDate: {
        S: '2019-06-24',
      },
      techRecord_roadFriendly: {
        BOOL: true,
      },
      techRecord_speedLimiterMrk: {
        BOOL: true,
      },
      techRecord_statusCode: {
        S: 'current',
      },
      techRecord_tachoExemptMrk: {
        BOOL: true,
      },
      techRecord_trainDesignWeight: {
        N: '2000',
      },
      techRecord_trainGbWeight: {
        N: '1500',
      },
      techRecord_tyreUseCode: {
        S: '2B',
      },
      techRecord_vehicleClass_code: {
        S: 'v',
      },
      techRecord_vehicleClass_description: {
        S: 'heavy goods vehicle',
      },
      techRecord_vehicleConfiguration: {
        S: 'centre axle drawbar',
      },
      techRecord_vehicleSubclass_0: {
        S: 'string',
      },
      techRecord_vehicleType: {
        S: 'hgv',
      },
      vin: {
        S: 'P012301957486',
      },
    },
  },
};

describe('transformTechRecord', () => {
  it('should transform tech record', () => {
    transformTechRecord(dbRecordNew);

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const result = DynamoDB.Converter.unmarshall(dbRecordNew.dynamodb.NewImage);

    expect(result.systemNumber).toBeTruthy();
    expect(result.vin).toBeTruthy();
    expect(result.partialVin).toBeTruthy();
    expect(result.primaryVrm).toBeTruthy();
    expect(Array.isArray(result.secondaryVrms)).toBeTruthy();
    expect(Array.isArray(result.techRecord)).toBeTruthy();
    expect(dbRecordOld).toEqual(dbRecordNew);
  });
});
