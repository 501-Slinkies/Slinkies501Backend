import 'dart:async';

import 'package:collection/collection.dart';

import '/backend/schema/util/firestore_util.dart';
import '/backend/schema/util/schema_util.dart';

import 'index.dart';
import '/flutter_flow/flutter_flow_util.dart';

class OrganizationsRecord extends FirestoreRecord {
  OrganizationsRecord._(
    DocumentReference reference,
    Map<String, dynamic> data,
  ) : super(reference, data) {
    _initializeFields();
  }

  // "name" field.
  String? _name;
  String get name => _name ?? '';
  bool hasName() => _name != null;

  // "org_id" field.
  String? _orgId;
  String get orgId => _orgId ?? '';
  bool hasOrgId() => _orgId != null;

  // "address" field.
  String? _address;
  String get address => _address ?? '';
  bool hasAddress() => _address != null;

  // "email" field.
  String? _email;
  String get email => _email ?? '';
  bool hasEmail() => _email != null;

  // "short_name" field.
  String? _shortName;
  String get shortName => _shortName ?? '';
  bool hasShortName() => _shortName != null;

  // "phone_number" field.
  String? _phoneNumber;
  String get phoneNumber => _phoneNumber ?? '';
  bool hasPhoneNumber() => _phoneNumber != null;

  // "website" field.
  String? _website;
  String get website => _website ?? '';
  bool hasWebsite() => _website != null;

  // "creation_date" field.
  DateTime? _creationDate;
  DateTime? get creationDate => _creationDate;
  bool hasCreationDate() => _creationDate != null;

  // "address2" field.
  String? _address2;
  String get address2 => _address2 ?? '';
  bool hasAddress2() => _address2 != null;

  // "city" field.
  String? _city;
  String get city => _city ?? '';
  bool hasCity() => _city != null;

  // "state" field.
  String? _state;
  String get state => _state ?? '';
  bool hasState() => _state != null;

  // "zip" field.
  String? _zip;
  String get zip => _zip ?? '';
  bool hasZip() => _zip != null;

  // "pc_name" field.
  String? _pcName;
  String get pcName => _pcName ?? '';
  bool hasPcName() => _pcName != null;

  // "pc_phone_number" field.
  String? _pcPhoneNumber;
  String get pcPhoneNumber => _pcPhoneNumber ?? '';
  bool hasPcPhoneNumber() => _pcPhoneNumber != null;

  // "pc_address" field.
  String? _pcAddress;
  String get pcAddress => _pcAddress ?? '';
  bool hasPcAddress() => _pcAddress != null;

  // "pc_email" field.
  String? _pcEmail;
  String get pcEmail => _pcEmail ?? '';
  bool hasPcEmail() => _pcEmail != null;

  // "pc_address2" field.
  String? _pcAddress2;
  String get pcAddress2 => _pcAddress2 ?? '';
  bool hasPcAddress2() => _pcAddress2 != null;

  // "pc_city" field.
  String? _pcCity;
  String get pcCity => _pcCity ?? '';
  bool hasPcCity() => _pcCity != null;

  // "pc_zip" field.
  String? _pcZip;
  String get pcZip => _pcZip ?? '';
  bool hasPcZip() => _pcZip != null;

  // "sc_name" field.
  String? _scName;
  String get scName => _scName ?? '';
  bool hasScName() => _scName != null;

  // "sc_address" field.
  String? _scAddress;
  String get scAddress => _scAddress ?? '';
  bool hasScAddress() => _scAddress != null;

  // "sc_email" field.
  String? _scEmail;
  String get scEmail => _scEmail ?? '';
  bool hasScEmail() => _scEmail != null;

  // "sc_address2" field.
  String? _scAddress2;
  String get scAddress2 => _scAddress2 ?? '';
  bool hasScAddress2() => _scAddress2 != null;

  // "pc_state" field.
  String? _pcState;
  String get pcState => _pcState ?? '';
  bool hasPcState() => _pcState != null;

  // "sc_state" field.
  String? _scState;
  String get scState => _scState ?? '';
  bool hasScState() => _scState != null;

  // "sc_zip" field.
  String? _scZip;
  String get scZip => _scZip ?? '';
  bool hasScZip() => _scZip != null;

  // "sc_phone_number" field.
  String? _scPhoneNumber;
  String get scPhoneNumber => _scPhoneNumber ?? '';
  bool hasScPhoneNumber() => _scPhoneNumber != null;

  // "sys_admin_phone_number" field.
  String? _sysAdminPhoneNumber;
  String get sysAdminPhoneNumber => _sysAdminPhoneNumber ?? '';
  bool hasSysAdminPhoneNumber() => _sysAdminPhoneNumber != null;

  // "sys_admin_user_id" field.
  String? _sysAdminUserId;
  String get sysAdminUserId => _sysAdminUserId ?? '';
  bool hasSysAdminUserId() => _sysAdminUserId != null;

  // "sys_admin_security_level" field.
  String? _sysAdminSecurityLevel;
  String get sysAdminSecurityLevel => _sysAdminSecurityLevel ?? '';
  bool hasSysAdminSecurityLevel() => _sysAdminSecurityLevel != null;

  // "days_of_operation" field.
  List<String>? _daysOfOperation;
  List<String> get daysOfOperation => _daysOfOperation ?? const [];
  bool hasDaysOfOperation() => _daysOfOperation != null;

  // "type_of_volunteering" field.
  List<String>? _typeOfVolunteering;
  List<String> get typeOfVolunteering => _typeOfVolunteering ?? const [];
  bool hasTypeOfVolunteering() => _typeOfVolunteering != null;

  // "hour_open" field.
  DateTime? _hourOpen;
  DateTime? get hourOpen => _hourOpen;
  bool hasHourOpen() => _hourOpen != null;

  // "hour_end" field.
  DateTime? _hourEnd;
  DateTime? get hourEnd => _hourEnd;
  bool hasHourEnd() => _hourEnd != null;

  // "type_of_mobility" field.
  List<String>? _typeOfMobility;
  List<String> get typeOfMobility => _typeOfMobility ?? const [];
  bool hasTypeOfMobility() => _typeOfMobility != null;

  // "licence_number" field.
  String? _licenceNumber;
  String get licenceNumber => _licenceNumber ?? '';
  bool hasLicenceNumber() => _licenceNumber != null;

  // "minimum_age_of_client" field.
  String? _minimumAgeOfClient;
  String get minimumAgeOfClient => _minimumAgeOfClient ?? '';
  bool hasMinimumAgeOfClient() => _minimumAgeOfClient != null;

  // "days_before_ride" field.
  String? _daysBeforeRide;
  String get daysBeforeRide => _daysBeforeRide ?? '';
  bool hasDaysBeforeRide() => _daysBeforeRide != null;

  // "image" field.
  String? _image;
  String get image => _image ?? '';
  bool hasImage() => _image != null;

  void _initializeFields() {
    _name = snapshotData['name'] as String?;
    _orgId = snapshotData['org_id'] as String?;
    _address = snapshotData['address'] as String?;
    _email = snapshotData['email'] as String?;
    _shortName = snapshotData['short_name'] as String?;
    _phoneNumber = snapshotData['phone_number'] as String?;
    _website = snapshotData['website'] as String?;
    _creationDate = snapshotData['creation_date'] as DateTime?;
    _address2 = snapshotData['address2'] as String?;
    _city = snapshotData['city'] as String?;
    _state = snapshotData['state'] as String?;
    _zip = snapshotData['zip'] as String?;
    _pcName = snapshotData['pc_name'] as String?;
    _pcPhoneNumber = snapshotData['pc_phone_number'] as String?;
    _pcAddress = snapshotData['pc_address'] as String?;
    _pcEmail = snapshotData['pc_email'] as String?;
    _pcAddress2 = snapshotData['pc_address2'] as String?;
    _pcCity = snapshotData['pc_city'] as String?;
    _pcZip = snapshotData['pc_zip'] as String?;
    _scName = snapshotData['sc_name'] as String?;
    _scAddress = snapshotData['sc_address'] as String?;
    _scEmail = snapshotData['sc_email'] as String?;
    _scAddress2 = snapshotData['sc_address2'] as String?;
    _pcState = snapshotData['pc_state'] as String?;
    _scState = snapshotData['sc_state'] as String?;
    _scZip = snapshotData['sc_zip'] as String?;
    _scPhoneNumber = snapshotData['sc_phone_number'] as String?;
    _sysAdminPhoneNumber = snapshotData['sys_admin_phone_number'] as String?;
    _sysAdminUserId = snapshotData['sys_admin_user_id'] as String?;
    _sysAdminSecurityLevel =
        snapshotData['sys_admin_security_level'] as String?;
    _daysOfOperation = getDataList(snapshotData['days_of_operation']);
    _typeOfVolunteering = getDataList(snapshotData['type_of_volunteering']);
    _hourOpen = snapshotData['hour_open'] as DateTime?;
    _hourEnd = snapshotData['hour_end'] as DateTime?;
    _typeOfMobility = getDataList(snapshotData['type_of_mobility']);
    _licenceNumber = snapshotData['licence_number'] as String?;
    _minimumAgeOfClient = snapshotData['minimum_age_of_client'] as String?;
    _daysBeforeRide = snapshotData['days_before_ride'] as String?;
    _image = snapshotData['image'] as String?;
  }

  static CollectionReference get collection =>
      FirebaseFirestore.instance.collection('organizations');

  static Stream<OrganizationsRecord> getDocument(DocumentReference ref) =>
      ref.snapshots().map((s) => OrganizationsRecord.fromSnapshot(s));

  static Future<OrganizationsRecord> getDocumentOnce(DocumentReference ref) =>
      ref.get().then((s) => OrganizationsRecord.fromSnapshot(s));

  static OrganizationsRecord fromSnapshot(DocumentSnapshot snapshot) =>
      OrganizationsRecord._(
        snapshot.reference,
        mapFromFirestore(snapshot.data() as Map<String, dynamic>),
      );

  static OrganizationsRecord getDocumentFromData(
    Map<String, dynamic> data,
    DocumentReference reference,
  ) =>
      OrganizationsRecord._(reference, mapFromFirestore(data));

  @override
  String toString() =>
      'OrganizationsRecord(reference: ${reference.path}, data: $snapshotData)';

  @override
  int get hashCode => reference.path.hashCode;

  @override
  bool operator ==(other) =>
      other is OrganizationsRecord &&
      reference.path.hashCode == other.reference.path.hashCode;
}

Map<String, dynamic> createOrganizationsRecordData({
  String? name,
  String? orgId,
  String? address,
  String? email,
  String? shortName,
  String? phoneNumber,
  String? website,
  DateTime? creationDate,
  String? address2,
  String? city,
  String? state,
  String? zip,
  String? pcName,
  String? pcPhoneNumber,
  String? pcAddress,
  String? pcEmail,
  String? pcAddress2,
  String? pcCity,
  String? pcZip,
  String? scName,
  String? scAddress,
  String? scEmail,
  String? scAddress2,
  String? pcState,
  String? scState,
  String? scZip,
  String? scPhoneNumber,
  String? sysAdminPhoneNumber,
  String? sysAdminUserId,
  String? sysAdminSecurityLevel,
  DateTime? hourOpen,
  DateTime? hourEnd,
  String? licenceNumber,
  String? minimumAgeOfClient,
  String? daysBeforeRide,
  String? image,
}) {
  final firestoreData = mapToFirestore(
    <String, dynamic>{
      'name': name,
      'org_id': orgId,
      'address': address,
      'email': email,
      'short_name': shortName,
      'phone_number': phoneNumber,
      'website': website,
      'creation_date': creationDate,
      'address2': address2,
      'city': city,
      'state': state,
      'zip': zip,
      'pc_name': pcName,
      'pc_phone_number': pcPhoneNumber,
      'pc_address': pcAddress,
      'pc_email': pcEmail,
      'pc_address2': pcAddress2,
      'pc_city': pcCity,
      'pc_zip': pcZip,
      'sc_name': scName,
      'sc_address': scAddress,
      'sc_email': scEmail,
      'sc_address2': scAddress2,
      'pc_state': pcState,
      'sc_state': scState,
      'sc_zip': scZip,
      'sc_phone_number': scPhoneNumber,
      'sys_admin_phone_number': sysAdminPhoneNumber,
      'sys_admin_user_id': sysAdminUserId,
      'sys_admin_security_level': sysAdminSecurityLevel,
      'hour_open': hourOpen,
      'hour_end': hourEnd,
      'licence_number': licenceNumber,
      'minimum_age_of_client': minimumAgeOfClient,
      'days_before_ride': daysBeforeRide,
      'image': image,
    }.withoutNulls,
  );

  return firestoreData;
}

class OrganizationsRecordDocumentEquality
    implements Equality<OrganizationsRecord> {
  const OrganizationsRecordDocumentEquality();

  @override
  bool equals(OrganizationsRecord? e1, OrganizationsRecord? e2) {
    const listEquality = ListEquality();
    return e1?.name == e2?.name &&
        e1?.orgId == e2?.orgId &&
        e1?.address == e2?.address &&
        e1?.email == e2?.email &&
        e1?.shortName == e2?.shortName &&
        e1?.phoneNumber == e2?.phoneNumber &&
        e1?.website == e2?.website &&
        e1?.creationDate == e2?.creationDate &&
        e1?.address2 == e2?.address2 &&
        e1?.city == e2?.city &&
        e1?.state == e2?.state &&
        e1?.zip == e2?.zip &&
        e1?.pcName == e2?.pcName &&
        e1?.pcPhoneNumber == e2?.pcPhoneNumber &&
        e1?.pcAddress == e2?.pcAddress &&
        e1?.pcEmail == e2?.pcEmail &&
        e1?.pcAddress2 == e2?.pcAddress2 &&
        e1?.pcCity == e2?.pcCity &&
        e1?.pcZip == e2?.pcZip &&
        e1?.scName == e2?.scName &&
        e1?.scAddress == e2?.scAddress &&
        e1?.scEmail == e2?.scEmail &&
        e1?.scAddress2 == e2?.scAddress2 &&
        e1?.pcState == e2?.pcState &&
        e1?.scState == e2?.scState &&
        e1?.scZip == e2?.scZip &&
        e1?.scPhoneNumber == e2?.scPhoneNumber &&
        e1?.sysAdminPhoneNumber == e2?.sysAdminPhoneNumber &&
        e1?.sysAdminUserId == e2?.sysAdminUserId &&
        e1?.sysAdminSecurityLevel == e2?.sysAdminSecurityLevel &&
        listEquality.equals(e1?.daysOfOperation, e2?.daysOfOperation) &&
        listEquality.equals(e1?.typeOfVolunteering, e2?.typeOfVolunteering) &&
        e1?.hourOpen == e2?.hourOpen &&
        e1?.hourEnd == e2?.hourEnd &&
        listEquality.equals(e1?.typeOfMobility, e2?.typeOfMobility) &&
        e1?.licenceNumber == e2?.licenceNumber &&
        e1?.minimumAgeOfClient == e2?.minimumAgeOfClient &&
        e1?.daysBeforeRide == e2?.daysBeforeRide &&
        e1?.image == e2?.image;
  }

  @override
  int hash(OrganizationsRecord? e) => const ListEquality().hash([
        e?.name,
        e?.orgId,
        e?.address,
        e?.email,
        e?.shortName,
        e?.phoneNumber,
        e?.website,
        e?.creationDate,
        e?.address2,
        e?.city,
        e?.state,
        e?.zip,
        e?.pcName,
        e?.pcPhoneNumber,
        e?.pcAddress,
        e?.pcEmail,
        e?.pcAddress2,
        e?.pcCity,
        e?.pcZip,
        e?.scName,
        e?.scAddress,
        e?.scEmail,
        e?.scAddress2,
        e?.pcState,
        e?.scState,
        e?.scZip,
        e?.scPhoneNumber,
        e?.sysAdminPhoneNumber,
        e?.sysAdminUserId,
        e?.sysAdminSecurityLevel,
        e?.daysOfOperation,
        e?.typeOfVolunteering,
        e?.hourOpen,
        e?.hourEnd,
        e?.typeOfMobility,
        e?.licenceNumber,
        e?.minimumAgeOfClient,
        e?.daysBeforeRide,
        e?.image
      ]);

  @override
  bool isValidKey(Object? o) => o is OrganizationsRecord;
}
