import 'dart:async';

import 'package:collection/collection.dart';

import '/backend/schema/util/firestore_util.dart';
import '/backend/schema/util/schema_util.dart';

import 'index.dart';
import '/flutter_flow/flutter_flow_util.dart';

class MileageLogsRecord extends FirestoreRecord {
  MileageLogsRecord._(
    DocumentReference reference,
    Map<String, dynamic> data,
  ) : super(reference, data) {
    _initializeFields();
  }

  // "UID" field.
  String? _uid;
  String get uid => _uid ?? '';
  bool hasUid() => _uid != null;

  // "Hours" field.
  double? _hours;
  double get hours => _hours ?? 0.0;
  bool hasHours() => _hours != null;

  // "Mileage" field.
  double? _mileage;
  double get mileage => _mileage ?? 0.0;
  bool hasMileage() => _mileage != null;

  // "volunteer_type" field.
  String? _volunteerType;
  String get volunteerType => _volunteerType ?? '';
  bool hasVolunteerType() => _volunteerType != null;

  // "volunteer_name" field.
  String? _volunteerName;
  String get volunteerName => _volunteerName ?? '';
  bool hasVolunteerName() => _volunteerName != null;

  void _initializeFields() {
    _uid = snapshotData['UID'] as String?;
    _hours = castToType<double>(snapshotData['Hours']);
    _mileage = castToType<double>(snapshotData['Mileage']);
    _volunteerType = snapshotData['volunteer_type'] as String?;
    _volunteerName = snapshotData['volunteer_name'] as String?;
  }

  static CollectionReference get collection =>
      FirebaseFirestore.instance.collection('mileage_logs');

  static Stream<MileageLogsRecord> getDocument(DocumentReference ref) =>
      ref.snapshots().map((s) => MileageLogsRecord.fromSnapshot(s));

  static Future<MileageLogsRecord> getDocumentOnce(DocumentReference ref) =>
      ref.get().then((s) => MileageLogsRecord.fromSnapshot(s));

  static MileageLogsRecord fromSnapshot(DocumentSnapshot snapshot) =>
      MileageLogsRecord._(
        snapshot.reference,
        mapFromFirestore(snapshot.data() as Map<String, dynamic>),
      );

  static MileageLogsRecord getDocumentFromData(
    Map<String, dynamic> data,
    DocumentReference reference,
  ) =>
      MileageLogsRecord._(reference, mapFromFirestore(data));

  @override
  String toString() =>
      'MileageLogsRecord(reference: ${reference.path}, data: $snapshotData)';

  @override
  int get hashCode => reference.path.hashCode;

  @override
  bool operator ==(other) =>
      other is MileageLogsRecord &&
      reference.path.hashCode == other.reference.path.hashCode;
}

Map<String, dynamic> createMileageLogsRecordData({
  String? uid,
  double? hours,
  double? mileage,
  String? volunteerType,
  String? volunteerName,
}) {
  final firestoreData = mapToFirestore(
    <String, dynamic>{
      'UID': uid,
      'Hours': hours,
      'Mileage': mileage,
      'volunteer_type': volunteerType,
      'volunteer_name': volunteerName,
    }.withoutNulls,
  );

  return firestoreData;
}

class MileageLogsRecordDocumentEquality implements Equality<MileageLogsRecord> {
  const MileageLogsRecordDocumentEquality();

  @override
  bool equals(MileageLogsRecord? e1, MileageLogsRecord? e2) {
    return e1?.uid == e2?.uid &&
        e1?.hours == e2?.hours &&
        e1?.mileage == e2?.mileage &&
        e1?.volunteerType == e2?.volunteerType &&
        e1?.volunteerName == e2?.volunteerName;
  }

  @override
  int hash(MileageLogsRecord? e) => const ListEquality()
      .hash([e?.uid, e?.hours, e?.mileage, e?.volunteerType, e?.volunteerName]);

  @override
  bool isValidKey(Object? o) => o is MileageLogsRecord;
}
