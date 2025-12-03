import 'dart:async';

import 'package:collection/collection.dart';

import '/backend/schema/util/firestore_util.dart';
import '/backend/schema/util/schema_util.dart';

import 'index.dart';
import '/flutter_flow/flutter_flow_util.dart';

class RolesRecord extends FirestoreRecord {
  RolesRecord._(
    DocumentReference reference,
    Map<String, dynamic> data,
  ) : super(reference, data) {
    _initializeFields();
  }

  // "parent_role" field.
  String? _parentRole;
  String get parentRole => _parentRole ?? '';
  bool hasParentRole() => _parentRole != null;

  // "title" field.
  String? _title;
  String get title => _title ?? '';
  bool hasTitle() => _title != null;

  // "org_id" field.
  String? _orgId;
  String get orgId => _orgId ?? '';
  bool hasOrgId() => _orgId != null;

  // "permission_set" field.
  List<DocumentReference>? _permissionSet;
  List<DocumentReference> get permissionSet => _permissionSet ?? const [];
  bool hasPermissionSet() => _permissionSet != null;

  void _initializeFields() {
    _parentRole = snapshotData['parent_role'] as String?;
    _title = snapshotData['title'] as String?;
    _orgId = snapshotData['org_id'] as String?;
    _permissionSet = getDataList(snapshotData['permission_set']);
  }

  static CollectionReference get collection =>
      FirebaseFirestore.instance.collection('roles');

  static Stream<RolesRecord> getDocument(DocumentReference ref) =>
      ref.snapshots().map((s) => RolesRecord.fromSnapshot(s));

  static Future<RolesRecord> getDocumentOnce(DocumentReference ref) =>
      ref.get().then((s) => RolesRecord.fromSnapshot(s));

  static RolesRecord fromSnapshot(DocumentSnapshot snapshot) => RolesRecord._(
        snapshot.reference,
        mapFromFirestore(snapshot.data() as Map<String, dynamic>),
      );

  static RolesRecord getDocumentFromData(
    Map<String, dynamic> data,
    DocumentReference reference,
  ) =>
      RolesRecord._(reference, mapFromFirestore(data));

  @override
  String toString() =>
      'RolesRecord(reference: ${reference.path}, data: $snapshotData)';

  @override
  int get hashCode => reference.path.hashCode;

  @override
  bool operator ==(other) =>
      other is RolesRecord &&
      reference.path.hashCode == other.reference.path.hashCode;
}

Map<String, dynamic> createRolesRecordData({
  String? parentRole,
  String? title,
  String? orgId,
}) {
  final firestoreData = mapToFirestore(
    <String, dynamic>{
      'parent_role': parentRole,
      'title': title,
      'org_id': orgId,
    }.withoutNulls,
  );

  return firestoreData;
}

class RolesRecordDocumentEquality implements Equality<RolesRecord> {
  const RolesRecordDocumentEquality();

  @override
  bool equals(RolesRecord? e1, RolesRecord? e2) {
    const listEquality = ListEquality();
    return e1?.parentRole == e2?.parentRole &&
        e1?.title == e2?.title &&
        e1?.orgId == e2?.orgId &&
        listEquality.equals(e1?.permissionSet, e2?.permissionSet);
  }

  @override
  int hash(RolesRecord? e) => const ListEquality()
      .hash([e?.parentRole, e?.title, e?.orgId, e?.permissionSet]);

  @override
  bool isValidKey(Object? o) => o is RolesRecord;
}
