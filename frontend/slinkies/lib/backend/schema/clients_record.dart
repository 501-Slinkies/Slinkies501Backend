import 'dart:async';

import 'package:collection/collection.dart';

import '/backend/schema/util/firestore_util.dart';
import '/backend/schema/util/schema_util.dart';

import 'index.dart';
import '/flutter_flow/flutter_flow_util.dart';

class ClientsRecord extends FirestoreRecord {
  ClientsRecord._(
    DocumentReference reference,
    Map<String, dynamic> data,
  ) : super(reference, data) {
    _initializeFields();
  }

  // "city" field.
  String? _city;
  String get city => _city ?? '';
  bool hasCity() => _city != null;

  // "first_name" field.
  String? _firstName;
  String get firstName => _firstName ?? '';
  bool hasFirstName() => _firstName != null;

  // "last_name" field.
  String? _lastName;
  String get lastName => _lastName ?? '';
  bool hasLastName() => _lastName != null;

  // "state" field.
  String? _state;
  String get state => _state ?? '';
  bool hasState() => _state != null;

  // "address2" field.
  String? _address2;
  String get address2 => _address2 ?? '';
  bool hasAddress2() => _address2 != null;

  // "car_height_needed" field.
  String? _carHeightNeeded;
  String get carHeightNeeded => _carHeightNeeded ?? '';
  bool hasCarHeightNeeded() => _carHeightNeeded != null;

  // "client_status" field.
  String? _clientStatus;
  String get clientStatus => _clientStatus ?? '';
  bool hasClientStatus() => _clientStatus != null;

  // "comments" field.
  String? _comments;
  String get comments => _comments ?? '';
  bool hasComments() => _comments != null;

  // "date_enrolled" field.
  String? _dateEnrolled;
  String get dateEnrolled => _dateEnrolled ?? '';
  bool hasDateEnrolled() => _dateEnrolled != null;

  // "email_address" field.
  String? _emailAddress;
  String get emailAddress => _emailAddress ?? '';
  bool hasEmailAddress() => _emailAddress != null;

  // "emergency_contact_name" field.
  String? _emergencyContactName;
  String get emergencyContactName => _emergencyContactName ?? '';
  bool hasEmergencyContactName() => _emergencyContactName != null;

  // "emergency_contact_phone" field.
  String? _emergencyContactPhone;
  String get emergencyContactPhone => _emergencyContactPhone ?? '';
  bool hasEmergencyContactPhone() => _emergencyContactPhone != null;

  // "how_did_they_hear_about_us" field.
  String? _howDidTheyHearAboutUs;
  String get howDidTheyHearAboutUs => _howDidTheyHearAboutUs ?? '';
  bool hasHowDidTheyHearAboutUs() => _howDidTheyHearAboutUs != null;

  // "live_alone" field.
  bool? _liveAlone;
  bool get liveAlone => _liveAlone ?? false;
  bool hasLiveAlone() => _liveAlone != null;

  // "mobility_assistance" field.
  String? _mobilityAssistance;

  /// mobility_aid_type
  String get mobilityAssistance => _mobilityAssistance ?? '';
  bool hasMobilityAssistance() => _mobilityAssistance != null;

  // "primary_allow_text" field.
  bool? _primaryAllowText;
  bool get primaryAllowText => _primaryAllowText ?? false;
  bool hasPrimaryAllowText() => _primaryAllowText != null;

  // "primary_phone" field.
  String? _primaryPhone;
  String get primaryPhone => _primaryPhone ?? '';
  bool hasPrimaryPhone() => _primaryPhone != null;

  // "relationship_to_client" field.
  String? _relationshipToClient;

  /// Emergency contact's relationship to client
  String get relationshipToClient => _relationshipToClient ?? '';
  bool hasRelationshipToClient() => _relationshipToClient != null;

  // "service_animal" field.
  bool? _serviceAnimal;
  bool get serviceAnimal => _serviceAnimal ?? false;
  bool hasServiceAnimal() => _serviceAnimal != null;

  // "street_address" field.
  String? _streetAddress;
  String get streetAddress => _streetAddress ?? '';
  bool hasStreetAddress() => _streetAddress != null;

  // "type_of_residence" field.
  String? _typeOfResidence;
  String get typeOfResidence => _typeOfResidence ?? '';
  bool hasTypeOfResidence() => _typeOfResidence != null;

  // "secondary_phone" field.
  String? _secondaryPhone;
  String get secondaryPhone => _secondaryPhone ?? '';
  bool hasSecondaryPhone() => _secondaryPhone != null;

  // "temp_date" field.
  String? _tempDate;
  String get tempDate => _tempDate ?? '';
  bool hasTempDate() => _tempDate != null;

  // "secondary_iscell" field.
  bool? _secondaryIscell;
  bool get secondaryIscell => _secondaryIscell ?? false;
  bool hasSecondaryIscell() => _secondaryIscell != null;

  // "primary_iscell" field.
  bool? _primaryIscell;
  bool get primaryIscell => _primaryIscell ?? false;
  bool hasPrimaryIscell() => _primaryIscell != null;

  // "oxygen" field.
  bool? _oxygen;
  bool get oxygen => _oxygen ?? false;
  bool hasOxygen() => _oxygen != null;

  // "client_id" field.
  String? _clientId;
  String get clientId => _clientId ?? '';
  bool hasClientId() => _clientId != null;

  // "service_animal_breed" field.
  String? _serviceAnimalBreed;
  String get serviceAnimalBreed => _serviceAnimalBreed ?? '';
  bool hasServiceAnimalBreed() => _serviceAnimalBreed != null;

  // "service_animal_size" field.
  String? _serviceAnimalSize;
  String get serviceAnimalSize => _serviceAnimalSize ?? '';
  bool hasServiceAnimalSize() => _serviceAnimalSize != null;

  // "service_animal_notes" field.
  String? _serviceAnimalNotes;
  String get serviceAnimalNotes => _serviceAnimalNotes ?? '';
  bool hasServiceAnimalNotes() => _serviceAnimalNotes != null;

  // "gender" field.
  String? _gender;
  String get gender => _gender ?? '';
  bool hasGender() => _gender != null;

  // "allergies" field.
  String? _allergies;
  String get allergies => _allergies ?? '';
  bool hasAllergies() => _allergies != null;

  // "month_and_year_of_birth" field.
  String? _monthAndYearOfBirth;
  String get monthAndYearOfBirth => _monthAndYearOfBirth ?? '';
  bool hasMonthAndYearOfBirth() => _monthAndYearOfBirth != null;

  // "other_limitations" field.
  String? _otherLimitations;
  String get otherLimitations => _otherLimitations ?? '';
  bool hasOtherLimitations() => _otherLimitations != null;

  // "secondary_allow_text" field.
  bool? _secondaryAllowText;
  bool get secondaryAllowText => _secondaryAllowText ?? false;
  bool hasSecondaryAllowText() => _secondaryAllowText != null;

  // "internal_comments" field.
  String? _internalComments;
  String get internalComments => _internalComments ?? '';
  bool hasInternalComments() => _internalComments != null;

  // "external_comments" field.
  String? _externalComments;
  String get externalComments => _externalComments ?? '';
  bool hasExternalComments() => _externalComments != null;

  // "preferred_contact" field.
  String? _preferredContact;
  String get preferredContact => _preferredContact ?? '';
  bool hasPreferredContact() => _preferredContact != null;

  // "pick_up_instructions" field.
  String? _pickUpInstructions;
  String get pickUpInstructions => _pickUpInstructions ?? '';
  bool hasPickUpInstructions() => _pickUpInstructions != null;

  // "organization" field.
  String? _organization;
  String get organization => _organization ?? '';
  bool hasOrganization() => _organization != null;

  // "zip" field.
  String? _zip;
  String get zip => _zip ?? '';
  bool hasZip() => _zip != null;

  void _initializeFields() {
    _city = snapshotData['city'] as String?;
    _firstName = snapshotData['first_name'] as String?;
    _lastName = snapshotData['last_name'] as String?;
    _state = snapshotData['state'] as String?;
    _address2 = snapshotData['address2'] as String?;
    _carHeightNeeded = snapshotData['car_height_needed'] as String?;
    _clientStatus = snapshotData['client_status'] as String?;
    _comments = snapshotData['comments'] as String?;
    _dateEnrolled = snapshotData['date_enrolled'] as String?;
    _emailAddress = snapshotData['email_address'] as String?;
    _emergencyContactName = snapshotData['emergency_contact_name'] as String?;
    _emergencyContactPhone = snapshotData['emergency_contact_phone'] as String?;
    _howDidTheyHearAboutUs =
        snapshotData['how_did_they_hear_about_us'] as String?;
    _liveAlone = snapshotData['live_alone'] as bool?;
    _mobilityAssistance = snapshotData['mobility_assistance'] as String?;
    _primaryAllowText = snapshotData['primary_allow_text'] as bool?;
    _primaryPhone = snapshotData['primary_phone'] as String?;
    _relationshipToClient = snapshotData['relationship_to_client'] as String?;
    _serviceAnimal = snapshotData['service_animal'] as bool?;
    _streetAddress = snapshotData['street_address'] as String?;
    _typeOfResidence = snapshotData['type_of_residence'] as String?;
    _secondaryPhone = snapshotData['secondary_phone'] as String?;
    _tempDate = snapshotData['temp_date'] as String?;
    _secondaryIscell = snapshotData['secondary_iscell'] as bool?;
    _primaryIscell = snapshotData['primary_iscell'] as bool?;
    _oxygen = snapshotData['oxygen'] as bool?;
    _clientId = snapshotData['client_id'] as String?;
    _serviceAnimalBreed = snapshotData['service_animal_breed'] as String?;
    _serviceAnimalSize = snapshotData['service_animal_size'] as String?;
    _serviceAnimalNotes = snapshotData['service_animal_notes'] as String?;
    _gender = snapshotData['gender'] as String?;
    _allergies = snapshotData['allergies'] as String?;
    _monthAndYearOfBirth = snapshotData['month_and_year_of_birth'] as String?;
    _otherLimitations = snapshotData['other_limitations'] as String?;
    _secondaryAllowText = snapshotData['secondary_allow_text'] as bool?;
    _internalComments = snapshotData['internal_comments'] as String?;
    _externalComments = snapshotData['external_comments'] as String?;
    _preferredContact = snapshotData['preferred_contact'] as String?;
    _pickUpInstructions = snapshotData['pick_up_instructions'] as String?;
    _organization = snapshotData['organization'] as String?;
    _zip = snapshotData['zip'] as String?;
  }

  static CollectionReference get collection =>
      FirebaseFirestore.instance.collection('clients');

  static Stream<ClientsRecord> getDocument(DocumentReference ref) =>
      ref.snapshots().map((s) => ClientsRecord.fromSnapshot(s));

  static Future<ClientsRecord> getDocumentOnce(DocumentReference ref) =>
      ref.get().then((s) => ClientsRecord.fromSnapshot(s));

  static ClientsRecord fromSnapshot(DocumentSnapshot snapshot) =>
      ClientsRecord._(
        snapshot.reference,
        mapFromFirestore(snapshot.data() as Map<String, dynamic>),
      );

  static ClientsRecord getDocumentFromData(
    Map<String, dynamic> data,
    DocumentReference reference,
  ) =>
      ClientsRecord._(reference, mapFromFirestore(data));

  @override
  String toString() =>
      'ClientsRecord(reference: ${reference.path}, data: $snapshotData)';

  @override
  int get hashCode => reference.path.hashCode;

  @override
  bool operator ==(other) =>
      other is ClientsRecord &&
      reference.path.hashCode == other.reference.path.hashCode;
}

Map<String, dynamic> createClientsRecordData({
  String? city,
  String? firstName,
  String? lastName,
  String? state,
  String? address2,
  String? carHeightNeeded,
  String? clientStatus,
  String? comments,
  String? dateEnrolled,
  String? emailAddress,
  String? emergencyContactName,
  String? emergencyContactPhone,
  String? howDidTheyHearAboutUs,
  bool? liveAlone,
  String? mobilityAssistance,
  bool? primaryAllowText,
  String? primaryPhone,
  String? relationshipToClient,
  bool? serviceAnimal,
  String? streetAddress,
  String? typeOfResidence,
  String? secondaryPhone,
  String? tempDate,
  bool? secondaryIscell,
  bool? primaryIscell,
  bool? oxygen,
  String? clientId,
  String? serviceAnimalBreed,
  String? serviceAnimalSize,
  String? serviceAnimalNotes,
  String? gender,
  String? allergies,
  String? monthAndYearOfBirth,
  String? otherLimitations,
  bool? secondaryAllowText,
  String? internalComments,
  String? externalComments,
  String? preferredContact,
  String? pickUpInstructions,
  String? organization,
  String? zip,
}) {
  final firestoreData = mapToFirestore(
    <String, dynamic>{
      'city': city,
      'first_name': firstName,
      'last_name': lastName,
      'state': state,
      'address2': address2,
      'car_height_needed': carHeightNeeded,
      'client_status': clientStatus,
      'comments': comments,
      'date_enrolled': dateEnrolled,
      'email_address': emailAddress,
      'emergency_contact_name': emergencyContactName,
      'emergency_contact_phone': emergencyContactPhone,
      'how_did_they_hear_about_us': howDidTheyHearAboutUs,
      'live_alone': liveAlone,
      'mobility_assistance': mobilityAssistance,
      'primary_allow_text': primaryAllowText,
      'primary_phone': primaryPhone,
      'relationship_to_client': relationshipToClient,
      'service_animal': serviceAnimal,
      'street_address': streetAddress,
      'type_of_residence': typeOfResidence,
      'secondary_phone': secondaryPhone,
      'temp_date': tempDate,
      'secondary_iscell': secondaryIscell,
      'primary_iscell': primaryIscell,
      'oxygen': oxygen,
      'client_id': clientId,
      'service_animal_breed': serviceAnimalBreed,
      'service_animal_size': serviceAnimalSize,
      'service_animal_notes': serviceAnimalNotes,
      'gender': gender,
      'allergies': allergies,
      'month_and_year_of_birth': monthAndYearOfBirth,
      'other_limitations': otherLimitations,
      'secondary_allow_text': secondaryAllowText,
      'internal_comments': internalComments,
      'external_comments': externalComments,
      'preferred_contact': preferredContact,
      'pick_up_instructions': pickUpInstructions,
      'organization': organization,
      'zip': zip,
    }.withoutNulls,
  );

  return firestoreData;
}

class ClientsRecordDocumentEquality implements Equality<ClientsRecord> {
  const ClientsRecordDocumentEquality();

  @override
  bool equals(ClientsRecord? e1, ClientsRecord? e2) {
    return e1?.city == e2?.city &&
        e1?.firstName == e2?.firstName &&
        e1?.lastName == e2?.lastName &&
        e1?.state == e2?.state &&
        e1?.address2 == e2?.address2 &&
        e1?.carHeightNeeded == e2?.carHeightNeeded &&
        e1?.clientStatus == e2?.clientStatus &&
        e1?.comments == e2?.comments &&
        e1?.dateEnrolled == e2?.dateEnrolled &&
        e1?.emailAddress == e2?.emailAddress &&
        e1?.emergencyContactName == e2?.emergencyContactName &&
        e1?.emergencyContactPhone == e2?.emergencyContactPhone &&
        e1?.howDidTheyHearAboutUs == e2?.howDidTheyHearAboutUs &&
        e1?.liveAlone == e2?.liveAlone &&
        e1?.mobilityAssistance == e2?.mobilityAssistance &&
        e1?.primaryAllowText == e2?.primaryAllowText &&
        e1?.primaryPhone == e2?.primaryPhone &&
        e1?.relationshipToClient == e2?.relationshipToClient &&
        e1?.serviceAnimal == e2?.serviceAnimal &&
        e1?.streetAddress == e2?.streetAddress &&
        e1?.typeOfResidence == e2?.typeOfResidence &&
        e1?.secondaryPhone == e2?.secondaryPhone &&
        e1?.tempDate == e2?.tempDate &&
        e1?.secondaryIscell == e2?.secondaryIscell &&
        e1?.primaryIscell == e2?.primaryIscell &&
        e1?.oxygen == e2?.oxygen &&
        e1?.clientId == e2?.clientId &&
        e1?.serviceAnimalBreed == e2?.serviceAnimalBreed &&
        e1?.serviceAnimalSize == e2?.serviceAnimalSize &&
        e1?.serviceAnimalNotes == e2?.serviceAnimalNotes &&
        e1?.gender == e2?.gender &&
        e1?.allergies == e2?.allergies &&
        e1?.monthAndYearOfBirth == e2?.monthAndYearOfBirth &&
        e1?.otherLimitations == e2?.otherLimitations &&
        e1?.secondaryAllowText == e2?.secondaryAllowText &&
        e1?.internalComments == e2?.internalComments &&
        e1?.externalComments == e2?.externalComments &&
        e1?.preferredContact == e2?.preferredContact &&
        e1?.pickUpInstructions == e2?.pickUpInstructions &&
        e1?.organization == e2?.organization &&
        e1?.zip == e2?.zip;
  }

  @override
  int hash(ClientsRecord? e) => const ListEquality().hash([
        e?.city,
        e?.firstName,
        e?.lastName,
        e?.state,
        e?.address2,
        e?.carHeightNeeded,
        e?.clientStatus,
        e?.comments,
        e?.dateEnrolled,
        e?.emailAddress,
        e?.emergencyContactName,
        e?.emergencyContactPhone,
        e?.howDidTheyHearAboutUs,
        e?.liveAlone,
        e?.mobilityAssistance,
        e?.primaryAllowText,
        e?.primaryPhone,
        e?.relationshipToClient,
        e?.serviceAnimal,
        e?.streetAddress,
        e?.typeOfResidence,
        e?.secondaryPhone,
        e?.tempDate,
        e?.secondaryIscell,
        e?.primaryIscell,
        e?.oxygen,
        e?.clientId,
        e?.serviceAnimalBreed,
        e?.serviceAnimalSize,
        e?.serviceAnimalNotes,
        e?.gender,
        e?.allergies,
        e?.monthAndYearOfBirth,
        e?.otherLimitations,
        e?.secondaryAllowText,
        e?.internalComments,
        e?.externalComments,
        e?.preferredContact,
        e?.pickUpInstructions,
        e?.organization,
        e?.zip
      ]);

  @override
  bool isValidKey(Object? o) => o is ClientsRecord;
}
