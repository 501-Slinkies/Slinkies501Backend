import 'dart:async';

import 'package:collection/collection.dart';

import '/backend/schema/util/firestore_util.dart';
import '/backend/schema/util/schema_util.dart';

import 'index.dart';
import '/flutter_flow/flutter_flow_util.dart';

class AuditLogRecord extends FirestoreRecord {
  AuditLogRecord._(
    DocumentReference reference,
    Map<String, dynamic> data,
  ) : super(reference, data) {
    _initializeFields();
  }

  // "timestamp" field.
  DateTime? _timestamp;
  DateTime? get timestamp => _timestamp;
  bool hasTimestamp() => _timestamp != null;

  // "actorID" field.
  String? _actorID;
  String get actorID => _actorID ?? '';
  bool hasActorID() => _actorID != null;

  // "action" field.
  String? _action;
  String get action => _action ?? '';
  bool hasAction() => _action != null;

  // "resourcePath" field.
  String? _resourcePath;
  String get resourcePath => _resourcePath ?? '';
  bool hasResourcePath() => _resourcePath != null;

  // "changeDetails" field.
  String? _changeDetails;
  String get changeDetails => _changeDetails ?? '';
  bool hasChangeDetails() => _changeDetails != null;

  void _initializeFields() {
    _timestamp = snapshotData['timestamp'] as DateTime?;
    _actorID = snapshotData['actorID'] as String?;
    _action = snapshotData['action'] as String?;
    _resourcePath = snapshotData['resourcePath'] as String?;
    _changeDetails = snapshotData['changeDetails'] as String?;
  }

  static CollectionReference get collection =>
      FirebaseFirestore.instance.collection('audit_log');

  static Stream<AuditLogRecord> getDocument(DocumentReference ref) =>
      ref.snapshots().map((s) => AuditLogRecord.fromSnapshot(s));

  static Future<AuditLogRecord> getDocumentOnce(DocumentReference ref) =>
      ref.get().then((s) => AuditLogRecord.fromSnapshot(s));

  static AuditLogRecord fromSnapshot(DocumentSnapshot snapshot) =>
      AuditLogRecord._(
        snapshot.reference,
        mapFromFirestore(snapshot.data() as Map<String, dynamic>),
      );

  static AuditLogRecord getDocumentFromData(
    Map<String, dynamic> data,
    DocumentReference reference,
  ) =>
      AuditLogRecord._(reference, mapFromFirestore(data));

  @override
  String toString() =>
      'AuditLogRecord(reference: ${reference.path}, data: $snapshotData)';

  @override
  int get hashCode => reference.path.hashCode;

  @override
  bool operator ==(other) =>
      other is AuditLogRecord &&
      reference.path.hashCode == other.reference.path.hashCode;
}

Map<String, dynamic> createAuditLogRecordData({
  DateTime? timestamp,
  String? actorID,
  String? action,
  String? resourcePath,
  String? changeDetails,
}) {
  final firestoreData = mapToFirestore(
    <String, dynamic>{
      'timestamp': timestamp,
      'actorID': actorID,
      'action': action,
      'resourcePath': resourcePath,
      'changeDetails': changeDetails,
    }.withoutNulls,
  );

  return firestoreData;
}

class AuditLogRecordDocumentEquality implements Equality<AuditLogRecord> {
  const AuditLogRecordDocumentEquality();

  @override
  bool equals(AuditLogRecord? e1, AuditLogRecord? e2) {
    return e1?.timestamp == e2?.timestamp &&
        e1?.actorID == e2?.actorID &&
        e1?.action == e2?.action &&
        e1?.resourcePath == e2?.resourcePath &&
        e1?.changeDetails == e2?.changeDetails;
  }

  @override
  int hash(AuditLogRecord? e) => const ListEquality().hash(
      [e?.timestamp, e?.actorID, e?.action, e?.resourcePath, e?.changeDetails]);

  @override
  bool isValidKey(Object? o) => o is AuditLogRecord;
}
