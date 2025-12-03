import 'dart:async';

import 'package:collection/collection.dart';

import '/backend/schema/util/firestore_util.dart';
import '/backend/schema/util/schema_util.dart';

import 'index.dart';
import '/flutter_flow/flutter_flow_util.dart';

class VolunteersRecord extends FirestoreRecord {
  VolunteersRecord._(
    DocumentReference reference,
    Map<String, dynamic> data,
  ) : super(reference, data) {
    _initializeFields();
  }

  // "city" field.
  String? _city;
  String get city => _city ?? '';
  bool hasCity() => _city != null;

  // "color" field.
  String? _color;
  String get color => _color ?? '';
  bool hasColor() => _color != null;

  // "contact_type_preference" field.
  String? _contactTypePreference;
  String get contactTypePreference => _contactTypePreference ?? '';
  bool hasContactTypePreference() => _contactTypePreference != null;

  // "emergency_contact_name" field.
  String? _emergencyContactName;
  String get emergencyContactName => _emergencyContactName ?? '';
  bool hasEmergencyContactName() => _emergencyContactName != null;

  // "first_name" field.
  String? _firstName;
  String get firstName => _firstName ?? '';
  bool hasFirstName() => _firstName != null;

  // "last_name" field.
  String? _lastName;
  String get lastName => _lastName ?? '';
  bool hasLastName() => _lastName != null;

  // "max_rides_week" field.
  int? _maxRidesWeek;
  int get maxRidesWeek => _maxRidesWeek ?? 0;
  bool hasMaxRidesWeek() => _maxRidesWeek != null;

  // "password" field.
  String? _password;
  String get password => _password ?? '';
  bool hasPassword() => _password != null;

  // "seat_height_from_ground" field.
  int? _seatHeightFromGround;
  int get seatHeightFromGround => _seatHeightFromGround ?? 0;
  bool hasSeatHeightFromGround() => _seatHeightFromGround != null;

  // "state" field.
  String? _state;
  String get state => _state ?? '';
  bool hasState() => _state != null;

  // "street_address" field.
  String? _streetAddress;
  String get streetAddress => _streetAddress ?? '';
  bool hasStreetAddress() => _streetAddress != null;

  // "type_of_vehicle" field.
  String? _typeOfVehicle;
  String get typeOfVehicle => _typeOfVehicle ?? '';
  bool hasTypeOfVehicle() => _typeOfVehicle != null;

  // "volunteering_status" field.
  String? _volunteeringStatus;
  String get volunteeringStatus => _volunteeringStatus ?? '';
  bool hasVolunteeringStatus() => _volunteeringStatus != null;

  // "primary_phone" field.
  String? _primaryPhone;
  String get primaryPhone => _primaryPhone ?? '';
  bool hasPrimaryPhone() => _primaryPhone != null;

  // "birth_month_year" field.
  String? _birthMonthYear;
  String get birthMonthYear => _birthMonthYear ?? '';
  bool hasBirthMonthYear() => _birthMonthYear != null;

  // "primary_is_cell" field.
  bool? _primaryIsCell;
  bool get primaryIsCell => _primaryIsCell ?? false;
  bool hasPrimaryIsCell() => _primaryIsCell != null;

  // "primary_text" field.
  bool? _primaryText;
  bool get primaryText => _primaryText ?? false;
  bool hasPrimaryText() => _primaryText != null;

  // "secondary_phone" field.
  String? _secondaryPhone;
  String get secondaryPhone => _secondaryPhone ?? '';
  bool hasSecondaryPhone() => _secondaryPhone != null;

  // "secondary_is_cell" field.
  bool? _secondaryIsCell;
  bool get secondaryIsCell => _secondaryIsCell ?? false;
  bool hasSecondaryIsCell() => _secondaryIsCell != null;

  // "secondary_text" field.
  bool? _secondaryText;
  bool get secondaryText => _secondaryText ?? false;
  bool hasSecondaryText() => _secondaryText != null;

  // "emergency_contact_phone" field.
  String? _emergencyContactPhone;
  String get emergencyContactPhone => _emergencyContactPhone ?? '';
  bool hasEmergencyContactPhone() => _emergencyContactPhone != null;

  // "emergency_contact_relationship" field.
  String? _emergencyContactRelationship;
  String get emergencyContactRelationship =>
      _emergencyContactRelationship ?? '';
  bool hasEmergencyContactRelationship() =>
      _emergencyContactRelationship != null;

  // "client_preference_for_drivers" field.
  List<String>? _clientPreferenceForDrivers;
  List<String> get clientPreferenceForDrivers =>
      _clientPreferenceForDrivers ?? const [];
  bool hasClientPreferenceForDrivers() => _clientPreferenceForDrivers != null;

  // "town_preference" field.
  String? _townPreference;
  String get townPreference => _townPreference ?? '';
  bool hasTownPreference() => _townPreference != null;

  // "destination_limitations" field.
  String? _destinationLimitations;
  String get destinationLimitations => _destinationLimitations ?? '';
  bool hasDestinationLimitations() => _destinationLimitations != null;

  // "allergens_in_car" field.
  String? _allergensInCar;
  String get allergensInCar => _allergensInCar ?? '';
  bool hasAllergensInCar() => _allergensInCar != null;

  // "how_heard_about_us" field.
  String? _howHeardAboutUs;
  String get howHeardAboutUs => _howHeardAboutUs ?? '';
  bool hasHowHeardAboutUs() => _howHeardAboutUs != null;

  // "comments" field.
  String? _comments;
  String get comments => _comments ?? '';
  bool hasComments() => _comments != null;

  // "volunteer_id" field.
  String? _volunteerId;
  String get volunteerId => _volunteerId ?? '';
  bool hasVolunteerId() => _volunteerId != null;

  // "address2" field.
  String? _address2;
  String get address2 => _address2 ?? '';
  bool hasAddress2() => _address2 != null;

  // "mileage_reimbursement" field.
  bool? _mileageReimbursement;
  bool get mileageReimbursement => _mileageReimbursement ?? false;
  bool hasMileageReimbursement() => _mileageReimbursement != null;

  // "organization" field.
  String? _organization;
  String get organization => _organization ?? '';
  bool hasOrganization() => _organization != null;

  // "email" field.
  String? _email;
  String get email => _email ?? '';
  bool hasEmail() => _email != null;

  // "display_name" field.
  String? _displayName;
  String get displayName => _displayName ?? '';
  bool hasDisplayName() => _displayName != null;

  // "photo_url" field.
  String? _photoUrl;
  String get photoUrl => _photoUrl ?? '';
  bool hasPhotoUrl() => _photoUrl != null;

  // "uid" field.
  String? _uid;
  String get uid => _uid ?? '';
  bool hasUid() => _uid != null;

  // "created_time" field.
  DateTime? _createdTime;
  DateTime? get createdTime => _createdTime;
  bool hasCreatedTime() => _createdTime != null;

  // "phone_number" field.
  String? _phoneNumber;
  String get phoneNumber => _phoneNumber ?? '';
  bool hasPhoneNumber() => _phoneNumber != null;

  // "when_oriented_position" field.
  String? _whenOrientedPosition;
  String get whenOrientedPosition => _whenOrientedPosition ?? '';
  bool hasWhenOrientedPosition() => _whenOrientedPosition != null;

  // "when_trained_by_lifespan" field.
  String? _whenTrainedByLifespan;
  String get whenTrainedByLifespan => _whenTrainedByLifespan ?? '';
  bool hasWhenTrainedByLifespan() => _whenTrainedByLifespan != null;

  // "date_began_volunteering" field.
  String? _dateBeganVolunteering;
  String get dateBeganVolunteering => _dateBeganVolunteering ?? '';
  bool hasDateBeganVolunteering() => _dateBeganVolunteering != null;

  // "role" field.
  List<String>? _role;
  List<String> get role => _role ?? const [];
  bool hasRole() => _role != null;

  // "driver_availability_by_day_and_time" field.
  String? _driverAvailabilityByDayAndTime;
  String get driverAvailabilityByDayAndTime =>
      _driverAvailabilityByDayAndTime ?? '';
  bool hasDriverAvailabilityByDayAndTime() =>
      _driverAvailabilityByDayAndTime != null;

  // "oxygen" field.
  bool? _oxygen;
  bool get oxygen => _oxygen ?? false;
  bool hasOxygen() => _oxygen != null;

  // "mobility_accommodation" field.
  String? _mobilityAccommodation;
  String get mobilityAccommodation => _mobilityAccommodation ?? '';
  bool hasMobilityAccommodation() => _mobilityAccommodation != null;

  // "accepts_service_animals" field.
  bool? _acceptsServiceAnimals;
  bool get acceptsServiceAnimals => _acceptsServiceAnimals ?? false;
  bool hasAcceptsServiceAnimals() => _acceptsServiceAnimals != null;

  // "zip" field.
  String? _zip;
  String get zip => _zip ?? '';
  bool hasZip() => _zip != null;

  void _initializeFields() {
    _city = snapshotData['city'] as String?;
    _color = snapshotData['color'] as String?;
    _contactTypePreference = snapshotData['contact_type_preference'] as String?;
    _emergencyContactName = snapshotData['emergency_contact_name'] as String?;
    _firstName = snapshotData['first_name'] as String?;
    _lastName = snapshotData['last_name'] as String?;
    _maxRidesWeek = castToType<int>(snapshotData['max_rides_week']);
    _password = snapshotData['password'] as String?;
    _seatHeightFromGround =
        castToType<int>(snapshotData['seat_height_from_ground']);
    _state = snapshotData['state'] as String?;
    _streetAddress = snapshotData['street_address'] as String?;
    _typeOfVehicle = snapshotData['type_of_vehicle'] as String?;
    _volunteeringStatus = snapshotData['volunteering_status'] as String?;
    _primaryPhone = snapshotData['primary_phone'] as String?;
    _birthMonthYear = snapshotData['birth_month_year'] as String?;
    _primaryIsCell = snapshotData['primary_is_cell'] as bool?;
    _primaryText = snapshotData['primary_text'] as bool?;
    _secondaryPhone = snapshotData['secondary_phone'] as String?;
    _secondaryIsCell = snapshotData['secondary_is_cell'] as bool?;
    _secondaryText = snapshotData['secondary_text'] as bool?;
    _emergencyContactPhone = snapshotData['emergency_contact_phone'] as String?;
    _emergencyContactRelationship =
        snapshotData['emergency_contact_relationship'] as String?;
    _clientPreferenceForDrivers =
        getDataList(snapshotData['client_preference_for_drivers']);
    _townPreference = snapshotData['town_preference'] as String?;
    _destinationLimitations =
        snapshotData['destination_limitations'] as String?;
    _allergensInCar = snapshotData['allergens_in_car'] as String?;
    _howHeardAboutUs = snapshotData['how_heard_about_us'] as String?;
    _comments = snapshotData['comments'] as String?;
    _volunteerId = snapshotData['volunteer_id'] as String?;
    _address2 = snapshotData['address2'] as String?;
    _mileageReimbursement = snapshotData['mileage_reimbursement'] as bool?;
    _organization = snapshotData['organization'] as String?;
    _email = snapshotData['email'] as String?;
    _displayName = snapshotData['display_name'] as String?;
    _photoUrl = snapshotData['photo_url'] as String?;
    _uid = snapshotData['uid'] as String?;
    _createdTime = snapshotData['created_time'] as DateTime?;
    _phoneNumber = snapshotData['phone_number'] as String?;
    _whenOrientedPosition = snapshotData['when_oriented_position'] as String?;
    _whenTrainedByLifespan =
        snapshotData['when_trained_by_lifespan'] as String?;
    _dateBeganVolunteering = snapshotData['date_began_volunteering'] as String?;
    _role = getDataList(snapshotData['role']);
    _driverAvailabilityByDayAndTime =
        snapshotData['driver_availability_by_day_and_time'] as String?;
    _oxygen = snapshotData['oxygen'] as bool?;
    _mobilityAccommodation = snapshotData['mobility_accommodation'] as String?;
    _acceptsServiceAnimals = snapshotData['accepts_service_animals'] as bool?;
    _zip = snapshotData['zip'] as String?;
  }

  static CollectionReference get collection =>
      FirebaseFirestore.instance.collection('volunteers');

  static Stream<VolunteersRecord> getDocument(DocumentReference ref) =>
      ref.snapshots().map((s) => VolunteersRecord.fromSnapshot(s));

  static Future<VolunteersRecord> getDocumentOnce(DocumentReference ref) =>
      ref.get().then((s) => VolunteersRecord.fromSnapshot(s));

  static VolunteersRecord fromSnapshot(DocumentSnapshot snapshot) =>
      VolunteersRecord._(
        snapshot.reference,
        mapFromFirestore(snapshot.data() as Map<String, dynamic>),
      );

  static VolunteersRecord getDocumentFromData(
    Map<String, dynamic> data,
    DocumentReference reference,
  ) =>
      VolunteersRecord._(reference, mapFromFirestore(data));

  @override
  String toString() =>
      'VolunteersRecord(reference: ${reference.path}, data: $snapshotData)';

  @override
  int get hashCode => reference.path.hashCode;

  @override
  bool operator ==(other) =>
      other is VolunteersRecord &&
      reference.path.hashCode == other.reference.path.hashCode;
}

Map<String, dynamic> createVolunteersRecordData({
  String? city,
  String? color,
  String? contactTypePreference,
  String? emergencyContactName,
  String? firstName,
  String? lastName,
  int? maxRidesWeek,
  String? password,
  int? seatHeightFromGround,
  String? state,
  String? streetAddress,
  String? typeOfVehicle,
  String? volunteeringStatus,
  String? primaryPhone,
  String? birthMonthYear,
  bool? primaryIsCell,
  bool? primaryText,
  String? secondaryPhone,
  bool? secondaryIsCell,
  bool? secondaryText,
  String? emergencyContactPhone,
  String? emergencyContactRelationship,
  String? townPreference,
  String? destinationLimitations,
  String? allergensInCar,
  String? howHeardAboutUs,
  String? comments,
  String? volunteerId,
  String? address2,
  bool? mileageReimbursement,
  String? organization,
  String? email,
  String? displayName,
  String? photoUrl,
  String? uid,
  DateTime? createdTime,
  String? phoneNumber,
  String? whenOrientedPosition,
  String? whenTrainedByLifespan,
  String? dateBeganVolunteering,
  String? driverAvailabilityByDayAndTime,
  bool? oxygen,
  String? mobilityAccommodation,
  bool? acceptsServiceAnimals,
  String? zip,
}) {
  final firestoreData = mapToFirestore(
    <String, dynamic>{
      'city': city,
      'color': color,
      'contact_type_preference': contactTypePreference,
      'emergency_contact_name': emergencyContactName,
      'first_name': firstName,
      'last_name': lastName,
      'max_rides_week': maxRidesWeek,
      'password': password,
      'seat_height_from_ground': seatHeightFromGround,
      'state': state,
      'street_address': streetAddress,
      'type_of_vehicle': typeOfVehicle,
      'volunteering_status': volunteeringStatus,
      'primary_phone': primaryPhone,
      'birth_month_year': birthMonthYear,
      'primary_is_cell': primaryIsCell,
      'primary_text': primaryText,
      'secondary_phone': secondaryPhone,
      'secondary_is_cell': secondaryIsCell,
      'secondary_text': secondaryText,
      'emergency_contact_phone': emergencyContactPhone,
      'emergency_contact_relationship': emergencyContactRelationship,
      'town_preference': townPreference,
      'destination_limitations': destinationLimitations,
      'allergens_in_car': allergensInCar,
      'how_heard_about_us': howHeardAboutUs,
      'comments': comments,
      'volunteer_id': volunteerId,
      'address2': address2,
      'mileage_reimbursement': mileageReimbursement,
      'organization': organization,
      'email': email,
      'display_name': displayName,
      'photo_url': photoUrl,
      'uid': uid,
      'created_time': createdTime,
      'phone_number': phoneNumber,
      'when_oriented_position': whenOrientedPosition,
      'when_trained_by_lifespan': whenTrainedByLifespan,
      'date_began_volunteering': dateBeganVolunteering,
      'driver_availability_by_day_and_time': driverAvailabilityByDayAndTime,
      'oxygen': oxygen,
      'mobility_accommodation': mobilityAccommodation,
      'accepts_service_animals': acceptsServiceAnimals,
      'zip': zip,
    }.withoutNulls,
  );

  return firestoreData;
}

class VolunteersRecordDocumentEquality implements Equality<VolunteersRecord> {
  const VolunteersRecordDocumentEquality();

  @override
  bool equals(VolunteersRecord? e1, VolunteersRecord? e2) {
    const listEquality = ListEquality();
    return e1?.city == e2?.city &&
        e1?.color == e2?.color &&
        e1?.contactTypePreference == e2?.contactTypePreference &&
        e1?.emergencyContactName == e2?.emergencyContactName &&
        e1?.firstName == e2?.firstName &&
        e1?.lastName == e2?.lastName &&
        e1?.maxRidesWeek == e2?.maxRidesWeek &&
        e1?.password == e2?.password &&
        e1?.seatHeightFromGround == e2?.seatHeightFromGround &&
        e1?.state == e2?.state &&
        e1?.streetAddress == e2?.streetAddress &&
        e1?.typeOfVehicle == e2?.typeOfVehicle &&
        e1?.volunteeringStatus == e2?.volunteeringStatus &&
        e1?.primaryPhone == e2?.primaryPhone &&
        e1?.birthMonthYear == e2?.birthMonthYear &&
        e1?.primaryIsCell == e2?.primaryIsCell &&
        e1?.primaryText == e2?.primaryText &&
        e1?.secondaryPhone == e2?.secondaryPhone &&
        e1?.secondaryIsCell == e2?.secondaryIsCell &&
        e1?.secondaryText == e2?.secondaryText &&
        e1?.emergencyContactPhone == e2?.emergencyContactPhone &&
        e1?.emergencyContactRelationship == e2?.emergencyContactRelationship &&
        listEquality.equals(
            e1?.clientPreferenceForDrivers, e2?.clientPreferenceForDrivers) &&
        e1?.townPreference == e2?.townPreference &&
        e1?.destinationLimitations == e2?.destinationLimitations &&
        e1?.allergensInCar == e2?.allergensInCar &&
        e1?.howHeardAboutUs == e2?.howHeardAboutUs &&
        e1?.comments == e2?.comments &&
        e1?.volunteerId == e2?.volunteerId &&
        e1?.address2 == e2?.address2 &&
        e1?.mileageReimbursement == e2?.mileageReimbursement &&
        e1?.organization == e2?.organization &&
        e1?.email == e2?.email &&
        e1?.displayName == e2?.displayName &&
        e1?.photoUrl == e2?.photoUrl &&
        e1?.uid == e2?.uid &&
        e1?.createdTime == e2?.createdTime &&
        e1?.phoneNumber == e2?.phoneNumber &&
        e1?.whenOrientedPosition == e2?.whenOrientedPosition &&
        e1?.whenTrainedByLifespan == e2?.whenTrainedByLifespan &&
        e1?.dateBeganVolunteering == e2?.dateBeganVolunteering &&
        listEquality.equals(e1?.role, e2?.role) &&
        e1?.driverAvailabilityByDayAndTime ==
            e2?.driverAvailabilityByDayAndTime &&
        e1?.oxygen == e2?.oxygen &&
        e1?.mobilityAccommodation == e2?.mobilityAccommodation &&
        e1?.acceptsServiceAnimals == e2?.acceptsServiceAnimals &&
        e1?.zip == e2?.zip;
  }

  @override
  int hash(VolunteersRecord? e) => const ListEquality().hash([
        e?.city,
        e?.color,
        e?.contactTypePreference,
        e?.emergencyContactName,
        e?.firstName,
        e?.lastName,
        e?.maxRidesWeek,
        e?.password,
        e?.seatHeightFromGround,
        e?.state,
        e?.streetAddress,
        e?.typeOfVehicle,
        e?.volunteeringStatus,
        e?.primaryPhone,
        e?.birthMonthYear,
        e?.primaryIsCell,
        e?.primaryText,
        e?.secondaryPhone,
        e?.secondaryIsCell,
        e?.secondaryText,
        e?.emergencyContactPhone,
        e?.emergencyContactRelationship,
        e?.clientPreferenceForDrivers,
        e?.townPreference,
        e?.destinationLimitations,
        e?.allergensInCar,
        e?.howHeardAboutUs,
        e?.comments,
        e?.volunteerId,
        e?.address2,
        e?.mileageReimbursement,
        e?.organization,
        e?.email,
        e?.displayName,
        e?.photoUrl,
        e?.uid,
        e?.createdTime,
        e?.phoneNumber,
        e?.whenOrientedPosition,
        e?.whenTrainedByLifespan,
        e?.dateBeganVolunteering,
        e?.role,
        e?.driverAvailabilityByDayAndTime,
        e?.oxygen,
        e?.mobilityAccommodation,
        e?.acceptsServiceAnimals,
        e?.zip
      ]);

  @override
  bool isValidKey(Object? o) => o is VolunteersRecord;
}
