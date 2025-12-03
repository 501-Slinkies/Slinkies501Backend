import 'dart:async';

import 'package:collection/collection.dart';

import '/backend/schema/util/firestore_util.dart';
import '/backend/schema/util/schema_util.dart';

import 'index.dart';
import '/flutter_flow/flutter_flow_util.dart';

class PermissionsRecord extends FirestoreRecord {
  PermissionsRecord._(
    DocumentReference reference,
    Map<String, dynamic> data,
  ) : super(reference, data) {
    _initializeFields();
  }

  // "create_address" field.
  bool? _createAddress;
  bool get createAddress => _createAddress ?? false;
  bool hasCreateAddress() => _createAddress != null;

  // "create_call_logs" field.
  bool? _createCallLogs;
  bool get createCallLogs => _createCallLogs ?? false;
  bool hasCreateCallLogs() => _createCallLogs != null;

  // "create_clients" field.
  bool? _createClients;
  bool get createClients => _createClients ?? false;
  bool hasCreateClients() => _createClients != null;

  // "create_org" field.
  bool? _createOrg;
  bool get createOrg => _createOrg ?? false;
  bool hasCreateOrg() => _createOrg != null;

  // "create_rides" field.
  bool? _createRides;
  bool get createRides => _createRides ?? false;
  bool hasCreateRides() => _createRides != null;

  // "create_volunteers" field.
  bool? _createVolunteers;
  bool get createVolunteers => _createVolunteers ?? false;
  bool hasCreateVolunteers() => _createVolunteers != null;

  // "create_roles" field.
  bool? _createRoles;
  bool get createRoles => _createRoles ?? false;
  bool hasCreateRoles() => _createRoles != null;

  // "delete_address" field.
  bool? _deleteAddress;
  bool get deleteAddress => _deleteAddress ?? false;
  bool hasDeleteAddress() => _deleteAddress != null;

  // "delete_call_logs" field.
  bool? _deleteCallLogs;
  bool get deleteCallLogs => _deleteCallLogs ?? false;
  bool hasDeleteCallLogs() => _deleteCallLogs != null;

  // "delete_clients" field.
  bool? _deleteClients;
  bool get deleteClients => _deleteClients ?? false;
  bool hasDeleteClients() => _deleteClients != null;

  // "delete_org" field.
  bool? _deleteOrg;
  bool get deleteOrg => _deleteOrg ?? false;
  bool hasDeleteOrg() => _deleteOrg != null;

  // "delete_rides" field.
  bool? _deleteRides;
  bool get deleteRides => _deleteRides ?? false;
  bool hasDeleteRides() => _deleteRides != null;

  // "delete_roles" field.
  bool? _deleteRoles;
  bool get deleteRoles => _deleteRoles ?? false;
  bool hasDeleteRoles() => _deleteRoles != null;

  // "delete_volunteers" field.
  bool? _deleteVolunteers;
  bool get deleteVolunteers => _deleteVolunteers ?? false;
  bool hasDeleteVolunteers() => _deleteVolunteers != null;

  // "read_clients" field.
  bool? _readClients;
  bool get readClients => _readClients ?? false;
  bool hasReadClients() => _readClients != null;

  // "read_addresses" field.
  bool? _readAddresses;
  bool get readAddresses => _readAddresses ?? false;
  bool hasReadAddresses() => _readAddresses != null;

  // "read_call_log" field.
  bool? _readCallLog;
  bool get readCallLog => _readCallLog ?? false;
  bool hasReadCallLog() => _readCallLog != null;

  // "read_logs" field.
  bool? _readLogs;
  bool get readLogs => _readLogs ?? false;
  bool hasReadLogs() => _readLogs != null;

  // "read_rides" field.
  bool? _readRides;
  bool get readRides => _readRides ?? false;
  bool hasReadRides() => _readRides != null;

  // "read_roles" field.
  bool? _readRoles;
  bool get readRoles => _readRoles ?? false;
  bool hasReadRoles() => _readRoles != null;

  // "read_volunteers" field.
  bool? _readVolunteers;
  bool get readVolunteers => _readVolunteers ?? false;
  bool hasReadVolunteers() => _readVolunteers != null;

  // "update_call_log" field.
  bool? _updateCallLog;
  bool get updateCallLog => _updateCallLog ?? false;
  bool hasUpdateCallLog() => _updateCallLog != null;

  // "update_addresses" field.
  bool? _updateAddresses;
  bool get updateAddresses => _updateAddresses ?? false;
  bool hasUpdateAddresses() => _updateAddresses != null;

  // "update_clients" field.
  bool? _updateClients;
  bool get updateClients => _updateClients ?? false;
  bool hasUpdateClients() => _updateClients != null;

  // "update_rides" field.
  bool? _updateRides;
  bool get updateRides => _updateRides ?? false;
  bool hasUpdateRides() => _updateRides != null;

  // "update_permissions" field.
  bool? _updatePermissions;
  bool get updatePermissions => _updatePermissions ?? false;
  bool hasUpdatePermissions() => _updatePermissions != null;

  // "update_volunteers" field.
  bool? _updateVolunteers;
  bool get updateVolunteers => _updateVolunteers ?? false;
  bool hasUpdateVolunteers() => _updateVolunteers != null;

  // "role_name" field.
  String? _roleName;
  String get roleName => _roleName ?? '';
  bool hasRoleName() => _roleName != null;

  // "organization" field.
  String? _organization;
  String get organization => _organization ?? '';
  bool hasOrganization() => _organization != null;

  void _initializeFields() {
    _createAddress = snapshotData['create_address'] as bool?;
    _createCallLogs = snapshotData['create_call_logs'] as bool?;
    _createClients = snapshotData['create_clients'] as bool?;
    _createOrg = snapshotData['create_org'] as bool?;
    _createRides = snapshotData['create_rides'] as bool?;
    _createVolunteers = snapshotData['create_volunteers'] as bool?;
    _createRoles = snapshotData['create_roles'] as bool?;
    _deleteAddress = snapshotData['delete_address'] as bool?;
    _deleteCallLogs = snapshotData['delete_call_logs'] as bool?;
    _deleteClients = snapshotData['delete_clients'] as bool?;
    _deleteOrg = snapshotData['delete_org'] as bool?;
    _deleteRides = snapshotData['delete_rides'] as bool?;
    _deleteRoles = snapshotData['delete_roles'] as bool?;
    _deleteVolunteers = snapshotData['delete_volunteers'] as bool?;
    _readClients = snapshotData['read_clients'] as bool?;
    _readAddresses = snapshotData['read_addresses'] as bool?;
    _readCallLog = snapshotData['read_call_log'] as bool?;
    _readLogs = snapshotData['read_logs'] as bool?;
    _readRides = snapshotData['read_rides'] as bool?;
    _readRoles = snapshotData['read_roles'] as bool?;
    _readVolunteers = snapshotData['read_volunteers'] as bool?;
    _updateCallLog = snapshotData['update_call_log'] as bool?;
    _updateAddresses = snapshotData['update_addresses'] as bool?;
    _updateClients = snapshotData['update_clients'] as bool?;
    _updateRides = snapshotData['update_rides'] as bool?;
    _updatePermissions = snapshotData['update_permissions'] as bool?;
    _updateVolunteers = snapshotData['update_volunteers'] as bool?;
    _roleName = snapshotData['role_name'] as String?;
    _organization = snapshotData['organization'] as String?;
  }

  static CollectionReference get collection =>
      FirebaseFirestore.instance.collection('Permissions');

  static Stream<PermissionsRecord> getDocument(DocumentReference ref) =>
      ref.snapshots().map((s) => PermissionsRecord.fromSnapshot(s));

  static Future<PermissionsRecord> getDocumentOnce(DocumentReference ref) =>
      ref.get().then((s) => PermissionsRecord.fromSnapshot(s));

  static PermissionsRecord fromSnapshot(DocumentSnapshot snapshot) =>
      PermissionsRecord._(
        snapshot.reference,
        mapFromFirestore(snapshot.data() as Map<String, dynamic>),
      );

  static PermissionsRecord getDocumentFromData(
    Map<String, dynamic> data,
    DocumentReference reference,
  ) =>
      PermissionsRecord._(reference, mapFromFirestore(data));

  @override
  String toString() =>
      'PermissionsRecord(reference: ${reference.path}, data: $snapshotData)';

  @override
  int get hashCode => reference.path.hashCode;

  @override
  bool operator ==(other) =>
      other is PermissionsRecord &&
      reference.path.hashCode == other.reference.path.hashCode;
}

Map<String, dynamic> createPermissionsRecordData({
  bool? createAddress,
  bool? createCallLogs,
  bool? createClients,
  bool? createOrg,
  bool? createRides,
  bool? createVolunteers,
  bool? createRoles,
  bool? deleteAddress,
  bool? deleteCallLogs,
  bool? deleteClients,
  bool? deleteOrg,
  bool? deleteRides,
  bool? deleteRoles,
  bool? deleteVolunteers,
  bool? readClients,
  bool? readAddresses,
  bool? readCallLog,
  bool? readLogs,
  bool? readRides,
  bool? readRoles,
  bool? readVolunteers,
  bool? updateCallLog,
  bool? updateAddresses,
  bool? updateClients,
  bool? updateRides,
  bool? updatePermissions,
  bool? updateVolunteers,
  String? roleName,
  String? organization,
}) {
  final firestoreData = mapToFirestore(
    <String, dynamic>{
      'create_address': createAddress,
      'create_call_logs': createCallLogs,
      'create_clients': createClients,
      'create_org': createOrg,
      'create_rides': createRides,
      'create_volunteers': createVolunteers,
      'create_roles': createRoles,
      'delete_address': deleteAddress,
      'delete_call_logs': deleteCallLogs,
      'delete_clients': deleteClients,
      'delete_org': deleteOrg,
      'delete_rides': deleteRides,
      'delete_roles': deleteRoles,
      'delete_volunteers': deleteVolunteers,
      'read_clients': readClients,
      'read_addresses': readAddresses,
      'read_call_log': readCallLog,
      'read_logs': readLogs,
      'read_rides': readRides,
      'read_roles': readRoles,
      'read_volunteers': readVolunteers,
      'update_call_log': updateCallLog,
      'update_addresses': updateAddresses,
      'update_clients': updateClients,
      'update_rides': updateRides,
      'update_permissions': updatePermissions,
      'update_volunteers': updateVolunteers,
      'role_name': roleName,
      'organization': organization,
    }.withoutNulls,
  );

  return firestoreData;
}

class PermissionsRecordDocumentEquality implements Equality<PermissionsRecord> {
  const PermissionsRecordDocumentEquality();

  @override
  bool equals(PermissionsRecord? e1, PermissionsRecord? e2) {
    return e1?.createAddress == e2?.createAddress &&
        e1?.createCallLogs == e2?.createCallLogs &&
        e1?.createClients == e2?.createClients &&
        e1?.createOrg == e2?.createOrg &&
        e1?.createRides == e2?.createRides &&
        e1?.createVolunteers == e2?.createVolunteers &&
        e1?.createRoles == e2?.createRoles &&
        e1?.deleteAddress == e2?.deleteAddress &&
        e1?.deleteCallLogs == e2?.deleteCallLogs &&
        e1?.deleteClients == e2?.deleteClients &&
        e1?.deleteOrg == e2?.deleteOrg &&
        e1?.deleteRides == e2?.deleteRides &&
        e1?.deleteRoles == e2?.deleteRoles &&
        e1?.deleteVolunteers == e2?.deleteVolunteers &&
        e1?.readClients == e2?.readClients &&
        e1?.readAddresses == e2?.readAddresses &&
        e1?.readCallLog == e2?.readCallLog &&
        e1?.readLogs == e2?.readLogs &&
        e1?.readRides == e2?.readRides &&
        e1?.readRoles == e2?.readRoles &&
        e1?.readVolunteers == e2?.readVolunteers &&
        e1?.updateCallLog == e2?.updateCallLog &&
        e1?.updateAddresses == e2?.updateAddresses &&
        e1?.updateClients == e2?.updateClients &&
        e1?.updateRides == e2?.updateRides &&
        e1?.updatePermissions == e2?.updatePermissions &&
        e1?.updateVolunteers == e2?.updateVolunteers &&
        e1?.roleName == e2?.roleName &&
        e1?.organization == e2?.organization;
  }

  @override
  int hash(PermissionsRecord? e) => const ListEquality().hash([
        e?.createAddress,
        e?.createCallLogs,
        e?.createClients,
        e?.createOrg,
        e?.createRides,
        e?.createVolunteers,
        e?.createRoles,
        e?.deleteAddress,
        e?.deleteCallLogs,
        e?.deleteClients,
        e?.deleteOrg,
        e?.deleteRides,
        e?.deleteRoles,
        e?.deleteVolunteers,
        e?.readClients,
        e?.readAddresses,
        e?.readCallLog,
        e?.readLogs,
        e?.readRides,
        e?.readRoles,
        e?.readVolunteers,
        e?.updateCallLog,
        e?.updateAddresses,
        e?.updateClients,
        e?.updateRides,
        e?.updatePermissions,
        e?.updateVolunteers,
        e?.roleName,
        e?.organization
      ]);

  @override
  bool isValidKey(Object? o) => o is PermissionsRecord;
}
