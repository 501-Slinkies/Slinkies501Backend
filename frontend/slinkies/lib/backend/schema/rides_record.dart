import 'dart:async';

import 'package:collection/collection.dart';

import '/backend/schema/util/firestore_util.dart';
import '/backend/schema/util/schema_util.dart';

import 'index.dart';
import '/flutter_flow/flutter_flow_util.dart';

class RidesRecord extends FirestoreRecord {
  RidesRecord._(
    DocumentReference reference,
    Map<String, dynamic> data,
  ) : super(reference, data) {
    _initializeFields();
  }

  // "date" field.
  DateTime? _date;
  DateTime? get date => _date;
  bool hasDate() => _date != null;

  // "createdAt" field.
  DateTime? _createdAt;
  DateTime? get createdAt => _createdAt;
  bool hasCreatedAt() => _createdAt != null;

  // "updatedAt" field.
  DateTime? _updatedAt;
  DateTime? get updatedAt => _updatedAt;
  bool hasUpdatedAt() => _updatedAt != null;

  // "status" field.
  String? _status;
  String get status => _status ?? '';
  bool hasStatus() => _status != null;

  // "additionalClient1_Name" field.
  String? _additionalClient1Name;
  String get additionalClient1Name => _additionalClient1Name ?? '';
  bool hasAdditionalClient1Name() => _additionalClient1Name != null;

  // "UID" field.
  String? _uid;
  String get uid => _uid ?? '';
  bool hasUid() => _uid != null;

  // "driverUID" field.
  String? _driverUID;
  String get driverUID => _driverUID ?? '';
  bool hasDriverUID() => _driverUID != null;

  // "clientUID" field.
  String? _clientUID;
  String get clientUID => _clientUID ?? '';
  bool hasClientUID() => _clientUID != null;

  // "dispatcherUID" field.
  String? _dispatcherUID;
  String get dispatcherUID => _dispatcherUID ?? '';
  bool hasDispatcherUID() => _dispatcherUID != null;

  // "destinationUID" field.
  String? _destinationUID;
  String get destinationUID => _destinationUID ?? '';
  bool hasDestinationUID() => _destinationUID != null;

  // "additionalClient1_Rel" field.
  String? _additionalClient1Rel;
  String get additionalClient1Rel => _additionalClient1Rel ?? '';
  bool hasAdditionalClient1Rel() => _additionalClient1Rel != null;

  // "appointmentTime" field.
  DateTime? _appointmentTime;
  DateTime? get appointmentTime => _appointmentTime;
  bool hasAppointmentTime() => _appointmentTime != null;

  // "pickupTime" field.
  DateTime? _pickupTime;
  DateTime? get pickupTime => _pickupTime;
  bool hasPickupTime() => _pickupTime != null;

  // "estimatedDuration" field.
  int? _estimatedDuration;
  int get estimatedDuration => _estimatedDuration ?? 0;
  bool hasEstimatedDuration() => _estimatedDuration != null;

  // "purpose" field.
  String? _purpose;
  String get purpose => _purpose ?? '';
  bool hasPurpose() => _purpose != null;

  // "tripType" field.
  String? _tripType;
  String get tripType => _tripType ?? '';
  bool hasTripType() => _tripType != null;

  // "wheelchair" field.
  bool? _wheelchair;
  bool get wheelchair => _wheelchair ?? false;
  bool hasWheelchair() => _wheelchair != null;

  // "wheelchairType" field.
  String? _wheelchairType;
  String get wheelchairType => _wheelchairType ?? '';
  bool hasWheelchairType() => _wheelchairType != null;

  // "milesDriven" field.
  double? _milesDriven;
  double get milesDriven => _milesDriven ?? 0.0;
  bool hasMilesDriven() => _milesDriven != null;

  // "volunteerHours" field.
  double? _volunteerHours;
  double get volunteerHours => _volunteerHours ?? 0.0;
  bool hasVolunteerHours() => _volunteerHours != null;

  // "donationRecieved" field.
  String? _donationRecieved;
  String get donationRecieved => _donationRecieved ?? '';
  bool hasDonationRecieved() => _donationRecieved != null;

  // "donationAmount" field.
  double? _donationAmount;
  double get donationAmount => _donationAmount ?? 0.0;
  bool hasDonationAmount() => _donationAmount != null;

  // "confirmation1_Date" field.
  DateTime? _confirmation1Date;
  DateTime? get confirmation1Date => _confirmation1Date;
  bool hasConfirmation1Date() => _confirmation1Date != null;

  // "confirmation1_By" field.
  String? _confirmation1By;
  String get confirmation1By => _confirmation1By ?? '';
  bool hasConfirmation1By() => _confirmation1By != null;

  // "confirmation2_Date" field.
  DateTime? _confirmation2Date;
  DateTime? get confirmation2Date => _confirmation2Date;
  bool hasConfirmation2Date() => _confirmation2Date != null;

  // "confirmation2_By" field.
  String? _confirmation2By;
  String get confirmation2By => _confirmation2By ?? '';
  bool hasConfirmation2By() => _confirmation2By != null;

  // "internalComment" field.
  String? _internalComment;
  String get internalComment => _internalComment ?? '';
  bool hasInternalComment() => _internalComment != null;

  // "externalComment" field.
  String? _externalComment;
  String get externalComment => _externalComment ?? '';
  bool hasExternalComment() => _externalComment != null;

  // "startLocation" field.
  String? _startLocation;
  String get startLocation => _startLocation ?? '';
  bool hasStartLocation() => _startLocation != null;

  // "endLocation" field.
  String? _endLocation;
  String get endLocation => _endLocation ?? '';
  bool hasEndLocation() => _endLocation != null;

  void _initializeFields() {
    _date = snapshotData['date'] as DateTime?;
    _createdAt = snapshotData['createdAt'] as DateTime?;
    _updatedAt = snapshotData['updatedAt'] as DateTime?;
    _status = snapshotData['status'] as String?;
    _additionalClient1Name = snapshotData['additionalClient1_Name'] as String?;
    _uid = snapshotData['UID'] as String?;
    _driverUID = snapshotData['driverUID'] as String?;
    _clientUID = snapshotData['clientUID'] as String?;
    _dispatcherUID = snapshotData['dispatcherUID'] as String?;
    _destinationUID = snapshotData['destinationUID'] as String?;
    _additionalClient1Rel = snapshotData['additionalClient1_Rel'] as String?;
    _appointmentTime = snapshotData['appointmentTime'] as DateTime?;
    _pickupTime = snapshotData['pickupTime'] as DateTime?;
    _estimatedDuration = castToType<int>(snapshotData['estimatedDuration']);
    _purpose = snapshotData['purpose'] as String?;
    _tripType = snapshotData['tripType'] as String?;
    _wheelchair = snapshotData['wheelchair'] as bool?;
    _wheelchairType = snapshotData['wheelchairType'] as String?;
    _milesDriven = castToType<double>(snapshotData['milesDriven']);
    _volunteerHours = castToType<double>(snapshotData['volunteerHours']);
    _donationRecieved = snapshotData['donationRecieved'] as String?;
    _donationAmount = castToType<double>(snapshotData['donationAmount']);
    _confirmation1Date = snapshotData['confirmation1_Date'] as DateTime?;
    _confirmation1By = snapshotData['confirmation1_By'] as String?;
    _confirmation2Date = snapshotData['confirmation2_Date'] as DateTime?;
    _confirmation2By = snapshotData['confirmation2_By'] as String?;
    _internalComment = snapshotData['internalComment'] as String?;
    _externalComment = snapshotData['externalComment'] as String?;
    _startLocation = snapshotData['startLocation'] as String?;
    _endLocation = snapshotData['endLocation'] as String?;
  }

  static CollectionReference get collection =>
      FirebaseFirestore.instance.collection('rides');

  static Stream<RidesRecord> getDocument(DocumentReference ref) =>
      ref.snapshots().map((s) => RidesRecord.fromSnapshot(s));

  static Future<RidesRecord> getDocumentOnce(DocumentReference ref) =>
      ref.get().then((s) => RidesRecord.fromSnapshot(s));

  static RidesRecord fromSnapshot(DocumentSnapshot snapshot) => RidesRecord._(
        snapshot.reference,
        mapFromFirestore(snapshot.data() as Map<String, dynamic>),
      );

  static RidesRecord getDocumentFromData(
    Map<String, dynamic> data,
    DocumentReference reference,
  ) =>
      RidesRecord._(reference, mapFromFirestore(data));

  @override
  String toString() =>
      'RidesRecord(reference: ${reference.path}, data: $snapshotData)';

  @override
  int get hashCode => reference.path.hashCode;

  @override
  bool operator ==(other) =>
      other is RidesRecord &&
      reference.path.hashCode == other.reference.path.hashCode;
}

Map<String, dynamic> createRidesRecordData({
  DateTime? date,
  DateTime? createdAt,
  DateTime? updatedAt,
  String? status,
  String? additionalClient1Name,
  String? uid,
  String? driverUID,
  String? clientUID,
  String? dispatcherUID,
  String? destinationUID,
  String? additionalClient1Rel,
  DateTime? appointmentTime,
  DateTime? pickupTime,
  int? estimatedDuration,
  String? purpose,
  String? tripType,
  bool? wheelchair,
  String? wheelchairType,
  double? milesDriven,
  double? volunteerHours,
  String? donationRecieved,
  double? donationAmount,
  DateTime? confirmation1Date,
  String? confirmation1By,
  DateTime? confirmation2Date,
  String? confirmation2By,
  String? internalComment,
  String? externalComment,
  String? startLocation,
  String? endLocation,
}) {
  final firestoreData = mapToFirestore(
    <String, dynamic>{
      'date': date,
      'createdAt': createdAt,
      'updatedAt': updatedAt,
      'status': status,
      'additionalClient1_Name': additionalClient1Name,
      'UID': uid,
      'driverUID': driverUID,
      'clientUID': clientUID,
      'dispatcherUID': dispatcherUID,
      'destinationUID': destinationUID,
      'additionalClient1_Rel': additionalClient1Rel,
      'appointmentTime': appointmentTime,
      'pickupTime': pickupTime,
      'estimatedDuration': estimatedDuration,
      'purpose': purpose,
      'tripType': tripType,
      'wheelchair': wheelchair,
      'wheelchairType': wheelchairType,
      'milesDriven': milesDriven,
      'volunteerHours': volunteerHours,
      'donationRecieved': donationRecieved,
      'donationAmount': donationAmount,
      'confirmation1_Date': confirmation1Date,
      'confirmation1_By': confirmation1By,
      'confirmation2_Date': confirmation2Date,
      'confirmation2_By': confirmation2By,
      'internalComment': internalComment,
      'externalComment': externalComment,
      'startLocation': startLocation,
      'endLocation': endLocation,
    }.withoutNulls,
  );

  return firestoreData;
}

class RidesRecordDocumentEquality implements Equality<RidesRecord> {
  const RidesRecordDocumentEquality();

  @override
  bool equals(RidesRecord? e1, RidesRecord? e2) {
    return e1?.date == e2?.date &&
        e1?.createdAt == e2?.createdAt &&
        e1?.updatedAt == e2?.updatedAt &&
        e1?.status == e2?.status &&
        e1?.additionalClient1Name == e2?.additionalClient1Name &&
        e1?.uid == e2?.uid &&
        e1?.driverUID == e2?.driverUID &&
        e1?.clientUID == e2?.clientUID &&
        e1?.dispatcherUID == e2?.dispatcherUID &&
        e1?.destinationUID == e2?.destinationUID &&
        e1?.additionalClient1Rel == e2?.additionalClient1Rel &&
        e1?.appointmentTime == e2?.appointmentTime &&
        e1?.pickupTime == e2?.pickupTime &&
        e1?.estimatedDuration == e2?.estimatedDuration &&
        e1?.purpose == e2?.purpose &&
        e1?.tripType == e2?.tripType &&
        e1?.wheelchair == e2?.wheelchair &&
        e1?.wheelchairType == e2?.wheelchairType &&
        e1?.milesDriven == e2?.milesDriven &&
        e1?.volunteerHours == e2?.volunteerHours &&
        e1?.donationRecieved == e2?.donationRecieved &&
        e1?.donationAmount == e2?.donationAmount &&
        e1?.confirmation1Date == e2?.confirmation1Date &&
        e1?.confirmation1By == e2?.confirmation1By &&
        e1?.confirmation2Date == e2?.confirmation2Date &&
        e1?.confirmation2By == e2?.confirmation2By &&
        e1?.internalComment == e2?.internalComment &&
        e1?.externalComment == e2?.externalComment &&
        e1?.startLocation == e2?.startLocation &&
        e1?.endLocation == e2?.endLocation;
  }

  @override
  int hash(RidesRecord? e) => const ListEquality().hash([
        e?.date,
        e?.createdAt,
        e?.updatedAt,
        e?.status,
        e?.additionalClient1Name,
        e?.uid,
        e?.driverUID,
        e?.clientUID,
        e?.dispatcherUID,
        e?.destinationUID,
        e?.additionalClient1Rel,
        e?.appointmentTime,
        e?.pickupTime,
        e?.estimatedDuration,
        e?.purpose,
        e?.tripType,
        e?.wheelchair,
        e?.wheelchairType,
        e?.milesDriven,
        e?.volunteerHours,
        e?.donationRecieved,
        e?.donationAmount,
        e?.confirmation1Date,
        e?.confirmation1By,
        e?.confirmation2Date,
        e?.confirmation2By,
        e?.internalComment,
        e?.externalComment,
        e?.startLocation,
        e?.endLocation
      ]);

  @override
  bool isValidKey(Object? o) => o is RidesRecord;
}
