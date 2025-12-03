import 'dart:async';

import 'package:collection/collection.dart';

import '/backend/schema/util/firestore_util.dart';
import '/backend/schema/util/schema_util.dart';

import 'index.dart';
import '/flutter_flow/flutter_flow_util.dart';

class DestinationRecord extends FirestoreRecord {
  DestinationRecord._(
    DocumentReference reference,
    Map<String, dynamic> data,
  ) : super(reference, data) {
    _initializeFields();
  }

  // "entered_by" field.
  String? _enteredBy;
  String get enteredBy => _enteredBy ?? '';
  bool hasEnteredBy() => _enteredBy != null;

  // "town" field.
  String? _town;
  String get town => _town ?? '';
  bool hasTown() => _town != null;

  // "destination_id" field.
  String? _destinationId;
  String get destinationId => _destinationId ?? '';
  bool hasDestinationId() => _destinationId != null;

  // "city" field.
  String? _city;
  String get city => _city ?? '';
  bool hasCity() => _city != null;

  // "address2" field.
  String? _address2;
  String get address2 => _address2 ?? '';
  bool hasAddress2() => _address2 != null;

  // "state" field.
  String? _state;
  String get state => _state ?? '';
  bool hasState() => _state != null;

  // "zip" field.
  String? _zip;
  String get zip => _zip ?? '';
  bool hasZip() => _zip != null;

  // "street_address" field.
  String? _streetAddress;
  String get streetAddress => _streetAddress ?? '';
  bool hasStreetAddress() => _streetAddress != null;

  // "nickname" field.
  String? _nickname;
  String get nickname => _nickname ?? '';
  bool hasNickname() => _nickname != null;

  void _initializeFields() {
    _enteredBy = snapshotData['entered_by'] as String?;
    _town = snapshotData['town'] as String?;
    _destinationId = snapshotData['destination_id'] as String?;
    _city = snapshotData['city'] as String?;
    _address2 = snapshotData['address2'] as String?;
    _state = snapshotData['state'] as String?;
    _zip = snapshotData['zip'] as String?;
    _streetAddress = snapshotData['street_address'] as String?;
    _nickname = snapshotData['nickname'] as String?;
  }

  static CollectionReference get collection =>
      FirebaseFirestore.instance.collection('destination');

  static Stream<DestinationRecord> getDocument(DocumentReference ref) =>
      ref.snapshots().map((s) => DestinationRecord.fromSnapshot(s));

  static Future<DestinationRecord> getDocumentOnce(DocumentReference ref) =>
      ref.get().then((s) => DestinationRecord.fromSnapshot(s));

  static DestinationRecord fromSnapshot(DocumentSnapshot snapshot) =>
      DestinationRecord._(
        snapshot.reference,
        mapFromFirestore(snapshot.data() as Map<String, dynamic>),
      );

  static DestinationRecord getDocumentFromData(
    Map<String, dynamic> data,
    DocumentReference reference,
  ) =>
      DestinationRecord._(reference, mapFromFirestore(data));

  @override
  String toString() =>
      'DestinationRecord(reference: ${reference.path}, data: $snapshotData)';

  @override
  int get hashCode => reference.path.hashCode;

  @override
  bool operator ==(other) =>
      other is DestinationRecord &&
      reference.path.hashCode == other.reference.path.hashCode;
}

Map<String, dynamic> createDestinationRecordData({
  String? enteredBy,
  String? town,
  String? destinationId,
  String? city,
  String? address2,
  String? state,
  String? zip,
  String? streetAddress,
  String? nickname,
}) {
  final firestoreData = mapToFirestore(
    <String, dynamic>{
      'entered_by': enteredBy,
      'town': town,
      'destination_id': destinationId,
      'city': city,
      'address2': address2,
      'state': state,
      'zip': zip,
      'street_address': streetAddress,
      'nickname': nickname,
    }.withoutNulls,
  );

  return firestoreData;
}

class DestinationRecordDocumentEquality implements Equality<DestinationRecord> {
  const DestinationRecordDocumentEquality();

  @override
  bool equals(DestinationRecord? e1, DestinationRecord? e2) {
    return e1?.enteredBy == e2?.enteredBy &&
        e1?.town == e2?.town &&
        e1?.destinationId == e2?.destinationId &&
        e1?.city == e2?.city &&
        e1?.address2 == e2?.address2 &&
        e1?.state == e2?.state &&
        e1?.zip == e2?.zip &&
        e1?.streetAddress == e2?.streetAddress &&
        e1?.nickname == e2?.nickname;
  }

  @override
  int hash(DestinationRecord? e) => const ListEquality().hash([
        e?.enteredBy,
        e?.town,
        e?.destinationId,
        e?.city,
        e?.address2,
        e?.state,
        e?.zip,
        e?.streetAddress,
        e?.nickname
      ]);

  @override
  bool isValidKey(Object? o) => o is DestinationRecord;
}
