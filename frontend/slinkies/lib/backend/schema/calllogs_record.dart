import 'dart:async';

import 'package:collection/collection.dart';

import '/backend/schema/util/firestore_util.dart';
import '/backend/schema/util/schema_util.dart';

import 'index.dart';
import '/flutter_flow/flutter_flow_util.dart';

class CalllogsRecord extends FirestoreRecord {
  CalllogsRecord._(
    DocumentReference reference,
    Map<String, dynamic> data,
  ) : super(reference, data) {
    _initializeFields();
  }

  // "first_name" field.
  String? _firstName;
  String get firstName => _firstName ?? '';
  bool hasFirstName() => _firstName != null;

  // "message" field.
  String? _message;
  String get message => _message ?? '';
  bool hasMessage() => _message != null;

  // "date_of_call" field.
  String? _dateOfCall;
  String get dateOfCall => _dateOfCall ?? '';
  bool hasDateOfCall() => _dateOfCall != null;

  // "call_type" field.
  String? _callType;
  String get callType => _callType ?? '';
  bool hasCallType() => _callType != null;

  // "entered_by" field.
  String? _enteredBy;
  String get enteredBy => _enteredBy ?? '';
  bool hasEnteredBy() => _enteredBy != null;

  // "forwarded_to_name_and_date" field.
  String? _forwardedToNameAndDate;
  String get forwardedToNameAndDate => _forwardedToNameAndDate ?? '';
  bool hasForwardedToNameAndDate() => _forwardedToNameAndDate != null;

  // "last_name" field.
  String? _lastName;
  String get lastName => _lastName ?? '';
  bool hasLastName() => _lastName != null;

  // "phone_number" field.
  String? _phoneNumber;
  String get phoneNumber => _phoneNumber ?? '';
  bool hasPhoneNumber() => _phoneNumber != null;

  // "isRide" field.
  bool? _isRide;
  bool get isRide => _isRide ?? false;
  bool hasIsRide() => _isRide != null;

  // "ride_reference" field.
  String? _rideReference;
  String get rideReference => _rideReference ?? '';
  bool hasRideReference() => _rideReference != null;

  void _initializeFields() {
    _firstName = snapshotData['first_name'] as String?;
    _message = snapshotData['message'] as String?;
    _dateOfCall = snapshotData['date_of_call'] as String?;
    _callType = snapshotData['call_type'] as String?;
    _enteredBy = snapshotData['entered_by'] as String?;
    _forwardedToNameAndDate =
        snapshotData['forwarded_to_name_and_date'] as String?;
    _lastName = snapshotData['last_name'] as String?;
    _phoneNumber = snapshotData['phone_number'] as String?;
    _isRide = snapshotData['isRide'] as bool?;
    _rideReference = snapshotData['ride_reference'] as String?;
  }

  static CollectionReference get collection =>
      FirebaseFirestore.instance.collection('calllogs');

  static Stream<CalllogsRecord> getDocument(DocumentReference ref) =>
      ref.snapshots().map((s) => CalllogsRecord.fromSnapshot(s));

  static Future<CalllogsRecord> getDocumentOnce(DocumentReference ref) =>
      ref.get().then((s) => CalllogsRecord.fromSnapshot(s));

  static CalllogsRecord fromSnapshot(DocumentSnapshot snapshot) =>
      CalllogsRecord._(
        snapshot.reference,
        mapFromFirestore(snapshot.data() as Map<String, dynamic>),
      );

  static CalllogsRecord getDocumentFromData(
    Map<String, dynamic> data,
    DocumentReference reference,
  ) =>
      CalllogsRecord._(reference, mapFromFirestore(data));

  @override
  String toString() =>
      'CalllogsRecord(reference: ${reference.path}, data: $snapshotData)';

  @override
  int get hashCode => reference.path.hashCode;

  @override
  bool operator ==(other) =>
      other is CalllogsRecord &&
      reference.path.hashCode == other.reference.path.hashCode;
}

Map<String, dynamic> createCalllogsRecordData({
  String? firstName,
  String? message,
  String? dateOfCall,
  String? callType,
  String? enteredBy,
  String? forwardedToNameAndDate,
  String? lastName,
  String? phoneNumber,
  bool? isRide,
  String? rideReference,
}) {
  final firestoreData = mapToFirestore(
    <String, dynamic>{
      'first_name': firstName,
      'message': message,
      'date_of_call': dateOfCall,
      'call_type': callType,
      'entered_by': enteredBy,
      'forwarded_to_name_and_date': forwardedToNameAndDate,
      'last_name': lastName,
      'phone_number': phoneNumber,
      'isRide': isRide,
      'ride_reference': rideReference,
    }.withoutNulls,
  );

  return firestoreData;
}

class CalllogsRecordDocumentEquality implements Equality<CalllogsRecord> {
  const CalllogsRecordDocumentEquality();

  @override
  bool equals(CalllogsRecord? e1, CalllogsRecord? e2) {
    return e1?.firstName == e2?.firstName &&
        e1?.message == e2?.message &&
        e1?.dateOfCall == e2?.dateOfCall &&
        e1?.callType == e2?.callType &&
        e1?.enteredBy == e2?.enteredBy &&
        e1?.forwardedToNameAndDate == e2?.forwardedToNameAndDate &&
        e1?.lastName == e2?.lastName &&
        e1?.phoneNumber == e2?.phoneNumber &&
        e1?.isRide == e2?.isRide &&
        e1?.rideReference == e2?.rideReference;
  }

  @override
  int hash(CalllogsRecord? e) => const ListEquality().hash([
        e?.firstName,
        e?.message,
        e?.dateOfCall,
        e?.callType,
        e?.enteredBy,
        e?.forwardedToNameAndDate,
        e?.lastName,
        e?.phoneNumber,
        e?.isRide,
        e?.rideReference
      ]);

  @override
  bool isValidKey(Object? o) => o is CalllogsRecord;
}
