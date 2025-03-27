import { DynamoDbImage } from '../services/dynamodb-images';
import { Maybe } from './optionals';

export interface Microfilm {
  microfilmDocumentType?: MicrofilmDocumentType;
  microfilmRollNumber?: string;
  microfilmSerialNumber?: string;
}

export type MicrofilmDocumentType =
  | 'PSV Miscellaneous'
  | 'AAT - Trailer Annual Test'
  | 'AIV - HGV International App'
  | 'COIF Modification'
  | 'Trailer COC + Int Plate'
  | 'RCT - Trailer Test Cert paid'
  | 'HGV COC + Int Plate'
  | 'PSV Carry/Auth'
  | 'OMO Report'
  | 'AIT - Trailer International App'
  | 'IPV - HGV EEC Plate/Cert'
  | 'XCV - HGV Test Cert free'
  | 'AAV - HGV Annual Test'
  | 'COIF Master'
  | 'Tempo 100 Sp Ord'
  | 'Deleted'
  | 'PSV N/ALT'
  | 'XPT - Tr Plating Cert paid'
  | 'FFV - HGV First Test'
  | 'Repl Vitesse 100'
  | 'TCV - HGV Test Cert'
  | 'ZZZ -  Miscellaneous'
  | 'Test Certificate'
  | 'XCT - Trailer Test Cert free'
  | 'C52 - COC and VTG52A'
  | 'Tempo 100 Report'
  | 'Main File Amendment'
  | 'PSV Doc'
  | 'PSV COC'
  | 'PSV Repl COC'
  | 'TAV - COC'
  | 'NPT - Trailer Alteration'
  | 'OMO Certificate'
  | 'PSV Repl COIF'
  | 'PSV Repl COF'
  | 'COIF Application'
  | 'XPV - HGV Plating Cert Free'
  | 'TCT  - Trailer Test Cert'
  | 'Tempo 100 App'
  | 'PSV Decision on N/ALT'
  | 'Special Order PSV'
  | 'NPV - HGV Alteration'
  | 'No Description Found'
  | 'Vitesse 100 Sp Ord'
  | 'Brake Test Details'
  | 'COIF Productional'
  | 'RDT - Test Disc Paid'
  | 'RCV -  HGV Test Cert'
  | 'FFT -  Trailer First Test'
  | 'IPT - Trailer EEC Plate/Cert'
  | 'XDT - Test Disc Free'
  | 'PRV - HGV Plating Cert paid'
  | 'COF Cert'
  | 'PRT - Tr Plating Cert paid'
  | 'Tempo 100 Permit';

export const parseMicrofilm = (microfilm?: DynamoDbImage): Maybe<Microfilm> => {
  if (!microfilm) {
    return undefined;
  }

  return {
    microfilmDocumentType: microfilm.getString(
      'microfilmDocumentType',
    ) as MicrofilmDocumentType,
    microfilmRollNumber: microfilm.getString('microfilmRollNumber'),
    microfilmSerialNumber: microfilm.getString('microfilmSerialNumber'),
  };
};
